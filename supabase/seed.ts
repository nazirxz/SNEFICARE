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
import { patients, nurses, sessions as programSessions } from "../src/data/mockData";
import { SMSES_BC_QUESTIONS } from "../src/data/smssesBcQuestions";
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
    "program_sessions",
    "program_reflection_questions",
    "questionnaire_questions",
    "relaxation_tracks",
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

async function seedProgramContent() {
  const sessionRows = programSessions.map((s) => ({
    day: s.day,
    title: s.title,
    theme: s.theme,
    color_from: s.colorFrom,
    color_to: s.colorTo,
    edukasi_title: s.edukasi.title,
    edukasi_content: s.edukasi.content,
    edukasi_key_points: s.edukasi.keyPoints,
    musik_title: s.musik.title,
    musik_description: s.musik.description,
    musik_duration: s.musik.duration,
    musik_type: s.musik.musicType,
    afirmasi_title: s.afirmasi.title,
    afirmasi_main_text: s.afirmasi.mainText,
    afirmasi_support_text: s.afirmasi.supportText,
    afirmasi_instructions: s.afirmasi.instructions,
    afirmasi_positive_phrases: s.afirmasi.positivePhrases ?? null,
    refleksi_title: s.refleksi.title,
  }));

  const { error: programErr } = await supabase
    .from("program_sessions")
    .upsert(sessionRows, { onConflict: "day" });
  if (programErr) throw new Error(`Seed program_sessions gagal: ${programErr.message}`);

  const reflectionRows = programSessions.flatMap((s) =>
    s.refleksi.questions.map((q, idx) => ({
      day: s.day,
      question_id: q.id,
      label: q.label,
      placeholder: q.placeholder,
      sort_order: idx + 1,
    }))
  );
  if (reflectionRows.length > 0) {
    const { error: reflectionErr } = await supabase
      .from("program_reflection_questions")
      .upsert(reflectionRows, { onConflict: "day,question_id" });
    if (reflectionErr) {
      throw new Error(`Seed program_reflection_questions gagal: ${reflectionErr.message}`);
    }
  }

  const questionnaireRows = SMSES_BC_QUESTIONS.map((prompt, idx) => ({
    item_no: idx + 1,
    prompt,
    is_active: true,
  }));
  const { error: questionnaireErr } = await supabase
    .from("questionnaire_questions")
    .upsert(questionnaireRows, { onConflict: "item_no" });
  if (questionnaireErr) {
    throw new Error(`Seed questionnaire_questions gagal: ${questionnaireErr.message}`);
  }
}

// `youtube_video_id` = 11 karakter ID video YouTube (bagian `v=` di URL).
// 30 track di bawah disediakan user — ganti jika ada video yang di-takedown.
const RELAXATION_TRACKS_SEED = [
  // ── Ombak (4) ─────────────────────────────────────────────────
  { title: "Ombak Pantai Tenang", description: "Deburan ombak ritmis untuk menenangkan pikiran.",
    category: "ombak", youtube_video_id: "C69XIufCObU", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Ombak Pantai Tropis", description: "Suara pantai tropis yang menenangkan.",
    category: "ombak", youtube_video_id: "YrV8_kWz7BQ", duration_sec: 3600, license: "YouTube", sort_order: 2 },
  { title: "Ombak Lembut", description: "Ombak pelan untuk fokus pada pernapasan.",
    category: "ombak", youtube_video_id: "g1SuG5PHpfM", duration_sec: 3600, license: "YouTube", sort_order: 3 },
  { title: "Ombak Senja", description: "Gelombang laut menjelang malam.",
    category: "ombak", youtube_video_id: "M6S-I1FqGGw", duration_sec: 3600, license: "YouTube", sort_order: 4 },

  // ── Hujan (4) ─────────────────────────────────────────────────
  { title: "Hujan Lembut", description: "Suara hujan pelan untuk tidur atau meditasi.",
    category: "hujan", youtube_video_id: "_T7EnG50BMI", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Hujan Pelan", description: "Hujan gerimis yang menenangkan.",
    category: "hujan", youtube_video_id: "oYusohhIiZw", duration_sec: 3600, license: "YouTube", sort_order: 2 },
  { title: "Hujan Malam", description: "Suara hujan di malam hari.",
    category: "hujan", youtube_video_id: "o8GrqUSdzi0", duration_sec: 3600, license: "YouTube", sort_order: 3 },
  { title: "Hujan Hangat", description: "Hujan yang hangat dan lembut.",
    category: "hujan", youtube_video_id: "h40WQf3rU8k", duration_sec: 3600, license: "YouTube", sort_order: 4 },

  // ── Hutan (3) ─────────────────────────────────────────────────
  { title: "Hutan Pagi", description: "Suasana hutan di pagi hari.",
    category: "hutan", youtube_video_id: "OdIJ2x3nxzQ", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Hutan Sejuk", description: "Angin sepoi dan dedaunan di hutan.",
    category: "hutan", youtube_video_id: "IvjMgVS6kng", duration_sec: 3600, license: "YouTube", sort_order: 2 },
  { title: "Hutan Tenang", description: "Keheningan hutan yang damai.",
    category: "hutan", youtube_video_id: "6lEwV7hk1hk", duration_sec: 3600, license: "YouTube", sort_order: 3 },

  // ── Sungai / Air mengalir (8) ─────────────────────────────────
  { title: "Sungai Jernih", description: "Aliran sungai jernih yang menenangkan.",
    category: "sungai", youtube_video_id: "HAzZH6wccew", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Aliran Air Pelan", description: "Gemericik air mengalir perlahan.",
    category: "sungai", youtube_video_id: "77ZozI0rw7w", duration_sec: 3600, license: "YouTube", sort_order: 2 },
  { title: "Aliran Air Lembut", description: "Suara air sebagai background meditasi.",
    category: "sungai", youtube_video_id: "IbQiZE6KuWc", duration_sec: 3600, license: "YouTube", sort_order: 3 },
  { title: "Sungai Pegunungan", description: "Suara sungai di pegunungan yang sejuk.",
    category: "sungai", youtube_video_id: "V1RPi2MYptM", duration_sec: 3600, license: "YouTube", sort_order: 4 },
  { title: "Air Mengalir", description: "Aliran air yang konsisten untuk relaksasi.",
    category: "sungai", youtube_video_id: "UTex0juGbqY", duration_sec: 3600, license: "YouTube", sort_order: 5 },
  { title: "Sungai Deras Lembut", description: "Aliran air sungai yang jernih.",
    category: "sungai", youtube_video_id: "FUhf3SrF3JQ", duration_sec: 3600, license: "YouTube", sort_order: 6 },
  { title: "Aliran Air Sejuk", description: "Suara air mengalir yang lembut.",
    category: "sungai", youtube_video_id: "c2NmyoXBXmE", duration_sec: 3600, license: "YouTube", sort_order: 7 },
  { title: "Sungai Mengalir", description: "Aliran sungai yang tenang dan konsisten.",
    category: "sungai", youtube_video_id: "1GjWHz3JBF0", duration_sec: 3600, license: "YouTube", sort_order: 8 },

  // ── Air Terjun (2) ────────────────────────────────────────────
  { title: "Air Terjun Tenang", description: "Gemuruh air terjun untuk fokus dan tenang.",
    category: "air-terjun", youtube_video_id: "D8aEHMItxqY", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Air Terjun Segar", description: "Suara air terjun yang menyegarkan.",
    category: "air-terjun", youtube_video_id: "1LdS8b5ur7M", duration_sec: 3600, license: "YouTube", sort_order: 2 },

  // ── Burung (2) ────────────────────────────────────────────────
  { title: "Kicau Burung Pagi", description: "Kicauan burung di pagi hari.",
    category: "burung", youtube_video_id: "zwenk-MvUWc", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Burung di Alam", description: "Suara burung di alam bebas.",
    category: "burung", youtube_video_id: "L6SnMEmqngM", duration_sec: 3600, license: "YouTube", sort_order: 2 },

  // ── Angin (2) ─────────────────────────────────────────────────
  { title: "Angin Sepoi", description: "Tiupan angin lembut yang menenangkan.",
    category: "angin", youtube_video_id: "kmhBZLd76L0", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Angin Malam", description: "Suara angin di malam hari.",
    category: "angin", youtube_video_id: "vDU1Gom7yJA", duration_sec: 3600, license: "YouTube", sort_order: 2 },

  // ── Musik (1) ─────────────────────────────────────────────────
  { title: "Piano + Sungai", description: "Piano lembut berpadu dengan suara sungai.",
    category: "musik", youtube_video_id: "lE6RYpe9IT0", duration_sec: 3600, license: "YouTube", sort_order: 1 },

  // ── Campuran (4) ──────────────────────────────────────────────
  { title: "Air + Hutan", description: "Kombinasi suara air dan hutan untuk relaksasi mendalam.",
    category: "campuran", youtube_video_id: "1wn-OSiNVjE", duration_sec: 3600, license: "YouTube", sort_order: 1 },
  { title: "Air + Burung", description: "Suara air dengan kicau burung alami.",
    category: "campuran", youtube_video_id: "XXIRWAEVs8o", duration_sec: 3600, license: "YouTube", sort_order: 2 },
  { title: "Hutan + Air Mengalir", description: "Hutan dengan aliran air yang tenang.",
    category: "campuran", youtube_video_id: "SfppNClE3po", duration_sec: 3600, license: "YouTube", sort_order: 3 },
  { title: "Hujan + Burung", description: "Hujan lembut dengan suara burung.",
    category: "campuran", youtube_video_id: "QQ6x9Aqd4jE", duration_sec: 3600, license: "YouTube", sort_order: 4 },
];

async function seedRelaxationTracks() {
  let inserted = 0;
  let skipped = 0;
  for (const track of RELAXATION_TRACKS_SEED) {
    const { data: existing } = await supabase
      .from("relaxation_tracks")
      .select("id")
      .eq("title", track.title)
      .maybeSingle();
    if (existing) { skipped += 1; continue; }
    const { error } = await supabase.from("relaxation_tracks").insert(track);
    if (error) {
      warn(`Relaxation track "${track.title}": ${error.message}`);
    } else {
      inserted += 1;
    }
  }
  return { inserted, skipped };
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
async function seed() {
  log("\n🌱  SNEfi Care — mulai seed data ke Supabase...\n");
  warningCount = 0;
  await assertRequiredTablesExist();

  // ── 1. Seed Master Konten Program ────────────────────────────
  log("── Master Konten Program ───────────────────────────────────");
  await seedProgramContent();
  log(`  ✅  ${programSessions.length} sesi program + ${SMSES_BC_QUESTIONS.length} item kuesioner`);

  const trackResult = await seedRelaxationTracks();
  log(`  ✅  Relaxation tracks: ${trackResult.inserted} ditambah, ${trackResult.skipped} sudah ada`);

  // ── 2. Seed Perawat ──────────────────────────────────────────
  log("── Perawat ──────────────────────────────────────────────");
  const nurseIdMap: Record<string, string> = {}; // mockId → supabase UUID

  for (const nurse of nurses) {
    const email = `${nurse.username}@sneficare.app`;
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

  // ── 3. Seed Pasien ────────────────────────────────────────────
  log("\n── Pasien ───────────────────────────────────────────────");

  for (const patient of patients) {
    const email = `${patient.username}@sneficare.app`;
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

      // ── 4. Seed Session Records ──────────────────────────────
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

          // ── 5. Seed Reflection Answers ───────────────────────
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

      // ── 6. Seed Kuesioner demo.post ───────────────────────────
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
  log(`   Perawat  →  ns.kartini@sneficare.app  /  kartini123`);
  log(`   Pasien   →  demo.pasien@sneficare.app  /  demo123\n`);
}

seed().catch((err) => {
  console.error("\n❌  Seed gagal:", err.message);
  process.exit(1);
});
