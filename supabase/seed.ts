/**
 * SNEfi Care — Supabase Seed Script
 *
 * Cara pakai:
 * 1. Dapatkan service role key dari Supabase Dashboard → Settings → API
 * 2. Tambahkan ke .env:  SUPABASE_SERVICE_ROLE_KEY=your_key_here
 * 3. Jalankan:  npx tsx supabase/seed.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { patients, nurses } from "../src/data/mockData";
import {
  getDemoPostTestPreSeed,
  DEMO_POST_TEST_PATIENT_ID,
} from "../src/data/researchQuestionnaire";

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const SUPABASE_URL = "https://jqwrjdjcxolevesytorq.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isPlaceholderKey =
  !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === "your_service_role_key_here";

if (isPlaceholderKey) {
  console.error(
    "\n❌  SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment.\n" +
    "   Dapatkan dari: Supabase Dashboard → Settings → API → service_role\n" +
    "   Tambahkan ke .env:  SUPABASE_SERVICE_ROLE_KEY=your_key\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function log(msg: string) { console.log(msg); }
let warningCount = 0;
function warn(msg: string) {
  warningCount += 1;
  console.warn("  ⚠️ ", msg);
}

async function assertRequiredTablesExist() {
  const requiredTables = [
    "profiles",
    "nurses",
    "patients",
    "session_records",
    "reflection_answers",
    "questionnaire_submissions",
  ];
  const missing: string[] = [];

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error?.message?.includes("Could not find the table")) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Tabel belum tersedia di Supabase: ${missing.join(", ")}. ` +
      "Jalankan dulu supabase/schema.sql di Supabase SQL Editor, lalu ulangi seed."
    );
  }
}

async function findAuthUserByEmail(email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Auth listUsers failed (${email}): ${error.message}`);

    const found = data.users.find(
      (user) => (user.email ?? "").toLowerCase() === email.toLowerCase()
    );
    if (found) return found;

    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function getOrCreateAuthUser(
  email: string,
  password: string,
  meta: Record<string, string>
) {
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    return { user: existing, reused: true };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) throw new Error(`Auth createUser failed (${email}): ${error.message}`);
  if (!data.user) throw new Error(`Auth createUser returned empty user (${email})`);
  return { user: data.user, reused: false };
}

async function ensureProfile(userId: string, role: "pasien" | "perawat", name: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role,
        name,
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new Error(`Upsert profile failed (${name}): ${error.message}`);
  }
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
async function seed() {
  log("\n🌱  SNEfi Care — mulai seed data ke Supabase...\n");
  warningCount = 0;
  await assertRequiredTablesExist();

  // ── 1. Seed Perawat ──────────────────────────────────────────
  log("── Perawat ──────────────────────────────────────────────");
  const nurseIdMap: Record<string, string> = {}; // mockId → supabase UUID

  for (const nurse of nurses) {
    const email = `${nurse.username}@sneficare.internal`;
    try {
      const { user, reused } = await getOrCreateAuthUser(email, nurse.password, {
        role: "perawat",
        name: nurse.name,
      });
      await ensureProfile(user.id, "perawat", nurse.name);

      const { error: nurseErr } = await supabase
        .from("nurses")
        .upsert(
          {
            id: user.id,
            nip: nurse.nip,
            department: nurse.department,
          },
          { onConflict: "id" }
        );
      if (nurseErr) throw new Error(`Upsert nurse failed (${nurse.name}): ${nurseErr.message}`);

      nurseIdMap[nurse.id] = user.id;
      log(`  ✅  ${nurse.name}  (${email})${reused ? " [existing auth]" : ""}`);
    } catch (err: any) {
      warn(`Lewati ${nurse.name}: ${err.message}`);
    }
  }

  const firstNurseSupabaseId = Object.values(nurseIdMap)[0];

  // ── 2. Seed Pasien ────────────────────────────────────────────
  log("\n── Pasien ───────────────────────────────────────────────");

  for (const patient of patients) {
    const email = `${patient.username}@sneficare.internal`;
    const isDemoPost = patient.id === DEMO_POST_TEST_PATIENT_ID;

    try {
      const { user, reused } = await getOrCreateAuthUser(email, patient.password, {
        role: "pasien",
        name: patient.name,
      });
      await ensureProfile(user.id, "pasien", patient.name);

      const { error: patientErr } = await supabase
        .from("patients")
        .upsert(
          {
            id: user.id,
            username_display: patient.username,
            age: patient.age,
            diagnosis: patient.diagnosis,
            chemo_cycle: patient.chemoCycle,
            phone: patient.phone,
            start_date: patient.startDate,
            current_day: patient.currentDay,
            nurse_id: firstNurseSupabaseId ?? null,
          },
          { onConflict: "id" }
        );
      if (patientErr) {
        throw new Error(`Upsert patient failed (${patient.name}): ${patientErr.message}`);
      }

      log(`  ✅  ${patient.name}  (${email})${reused ? " [existing auth]" : ""}`);

      // ── 3. Seed Session Records ──────────────────────────────
      if (patient.sessions.length > 0) {
        for (const session of patient.sessions) {
          const approvalStatus =
            session.approvalStatus ??
            (session.status === "selesai" ? "disetujui" : undefined);

          const { data: sessionRow, error: sessionErr } = await supabase
            .from("session_records")
            .upsert(
              {
                patient_id: user.id,
                day: session.day,
                status: session.status,
                approval_status: approvalStatus ?? null,
                approval_note: session.approvalNote ?? null,
                approved_by: approvalStatus === "disetujui" ? firstNurseSupabaseId : null,
                approved_at:
                  approvalStatus === "disetujui"
                    ? session.approvedAt ?? session.completedAt
                    : null,
                completed_at: session.completedAt ?? null,
                duration_minutes: session.durationMinutes ?? null,
                mood: session.mood ?? null,
                affirmation_note: session.afirmasiNote ?? null,
                modules_completed: session.modulesCompleted ?? null,
              },
              { onConflict: "patient_id,day" }
            )
            .select()
            .single();

          if (sessionErr) {
            warn(`Sesi hari ${session.day} untuk ${patient.name}: ${sessionErr.message}`);
            continue;
          }

          // ── 4. Seed Reflection Answers ───────────────────────
          if (session.refleksiAnswers && sessionRow) {
            const answers = Object.entries(session.refleksiAnswers)
              .filter(([, text]) => text.trim() !== "")
              .map(([questionId, answerText]) => ({
                session_id: sessionRow.id,
                question_id: questionId,
                answer_text: answerText,
              }));

            if (answers.length > 0) {
              const { error: answerErr } = await supabase
                .from("reflection_answers")
                .upsert(answers, { onConflict: "session_id,question_id" });
              if (answerErr) warn(`Refleksi sesi ${session.day}: ${answerErr.message}`);
            }
          }
        }
        log(`     📋  ${patient.sessions.length} sesi + refleksi selesai di-seed`);
      }

      // ── 5. Seed Kuesioner demo.post ───────────────────────────
      if (isDemoPost) {
        const preSeed = getDemoPostTestPreSeed();
        const { error: qErr } = await supabase
          .from("questionnaire_submissions")
          .upsert(
            {
              patient_id: user.id,
              phase: "pre",
              demo_respondent_note: preSeed.demographics.respondentNumberNote,
              demo_initials: preSeed.demographics.initials,
              demo_age: preSeed.demographics.age,
              demo_sex: preSeed.demographics.sex,
              demo_education: preSeed.demographics.education,
              demo_occupation: preSeed.demographics.occupation,
              demo_religion: preSeed.demographics.religion,
              demo_ethnicity: preSeed.demographics.ethnicity,
              scores: preSeed.scores,
              submitted_at: preSeed.submittedAt,
            },
            { onConflict: "patient_id,phase" }
          );
        if (qErr) warn(`Kuesioner pre demo.post: ${qErr.message}`);
        else log(`     📝  Kuesioner pre-test demo.post di-seed`);
      }
    } catch (err: any) {
      warn(`Lewati ${patient.name}: ${err.message}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────
  log("\n────────────────────────────────────────────────────────");
  if (warningCount > 0) {
    log(`⚠️  Seed selesai dengan ${warningCount} warning.`);
    process.exitCode = 1;
  } else {
    log(`🎉  Seed selesai!`);
  }
  log(`\n   ${nurses.length} perawat, ${patients.length} pasien, beserta sesi & kuesioner`);
  log(`\n   Login demo akun:`);
  log(`   Perawat  →  ns.kartini@sneficare.internal  /  kartini123`);
  log(`   Pasien   →  demo.pasien@sneficare.internal  /  demo123\n`);
}

seed().catch((err) => {
  console.error("\n❌  Seed gagal:", err.message);
  process.exit(1);
});
