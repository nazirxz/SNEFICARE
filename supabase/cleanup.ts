/**
 * SNEfi Care — Cleanup Script
 *
 * Menghapus SEMUA data pasien + sesi + kuesioner + auth user terkait,
 * sisakan 1 perawat (ns.kartini) supaya Anda masih bisa login dan
 * register pasien baru untuk testing integrasi end-to-end.
 *
 * Master konten program (program_sessions, relaxation_tracks, dll)
 * TIDAK dihapus.
 *
 * Cara pakai: npm run cleanup
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEEP_NURSE_EMAIL = "ns.kartini@sneficare.internal";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Env SUPABASE_URL atau SERVICE_ROLE_KEY tidak ditemukan di .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllAuthUsers() {
  const all: { id: string; email: string }[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) all.push({ id: u.id, email: u.email ?? "" });
    if (data.users.length < 1000) break;
    page += 1;
  }
  return all;
}

async function main() {
  console.log("\n🧹  SNEfi Care — mulai cleanup data user...\n");

  // 1. Hapus tabel user-data (urut dari yang paling bergantung)
  console.log("── Hapus reflection_answers, session_records, questionnaire_submissions");
  await supabase.from("reflection_answers").delete().gte("created_at", "1900-01-01");
  await supabase.from("session_records").delete().gte("created_at", "1900-01-01");
  await supabase.from("questionnaire_submissions").delete().gte("submitted_at", "1900-01-01");

  // 2. Hapus semua patients
  console.log("── Hapus patients");
  const { error: patientsErr } = await supabase.from("patients").delete().gte("created_at", "1900-01-01");
  if (patientsErr) console.warn("  ⚠️  patients:", patientsErr.message);

  // 3. Hapus semua nurses kecuali yang mau disisakan
  console.log(`── Hapus nurses kecuali ${KEEP_NURSE_EMAIL}`);
  const allUsers = await listAllAuthUsers();
  const keepNurse = allUsers.find(
    (u) => u.email.toLowerCase() === KEEP_NURSE_EMAIL.toLowerCase()
  );
  if (keepNurse) {
    await supabase.from("nurses").delete().neq("id", keepNurse.id);
  } else {
    await supabase.from("nurses").delete().gte("created_at", "1900-01-01");
  }

  // 4. Hapus profiles yang bukan nurse yang disisakan
  console.log("── Hapus profiles (kecuali perawat yang disisakan)");
  if (keepNurse) {
    await supabase.from("profiles").delete().neq("id", keepNurse.id);
  } else {
    await supabase.from("profiles").delete().gte("created_at", "1900-01-01");
  }

  // 5. Hapus auth user yang bukan nurse yang disisakan
  console.log("── Hapus auth users sneficare (kecuali perawat yang disisakan)");
  const sneficareUsers = allUsers.filter((u) =>
    u.email.toLowerCase().endsWith("@sneficare.internal")
  );
  let deleted = 0;
  for (const u of sneficareUsers) {
    if (keepNurse && u.id === keepNurse.id) continue;
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.warn(`  ⚠️  gagal hapus ${u.email}: ${error.message}`);
    else deleted += 1;
  }
  console.log(`  ✅  ${deleted} auth user dihapus`);

  // 6. Summary
  const { count: nurseCount } = await supabase
    .from("nurses")
    .select("*", { count: "exact", head: true });
  const { count: patientCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true });

  console.log("\n────────────────────────────────────────────────────────");
  console.log(`🎉  Cleanup selesai!`);
  console.log(`   Perawat tersisa: ${nurseCount ?? 0}`);
  console.log(`   Pasien tersisa:  ${patientCount ?? 0}`);
  if (keepNurse) {
    console.log(`\n   Login perawat untuk mulai testing:`);
    console.log(`   ${KEEP_NURSE_EMAIL}  /  kartini123\n`);
  } else {
    console.log(`\n   ⚠️  Semua perawat terhapus. Jalankan 'npm run seed' untuk bikin ulang.\n`);
  }
}

main().catch((err) => {
  console.error("\n❌  Cleanup gagal:", err.message);
  process.exit(1);
});
