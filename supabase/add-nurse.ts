/**
 * SNEfi Care — Tambah 1 perawat ke Supabase (tanpa re-seed seluruh data)
 *
 * Cara pakai:
 *   npx tsx supabase/add-nurse.ts
 *
 * Perlu env: SUPABASE_SERVICE_ROLE_KEY
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jqwrjdjcxolevesytorq.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === "your_service_role_key_here") {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY belum di-set di .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NURSE = {
  username: "ns.siti",
  password: "siti386",
  name: "Ns. Siti Nurdiyanah, S.Kep",
  nip: "199003122015032001",
  department: "Onkologi",
};

async function findAuthUserByEmail(email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function main() {
  const email = `${NURSE.username}@sneficare.app`;
  console.log(`→ Menambahkan perawat: ${NURSE.name} (${email})`);

  let user = await findAuthUserByEmail(email);
  let reused = false;
  if (user) {
    reused = true;
    console.log("  ℹ️  Auth user sudah ada, reuse.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: NURSE.password,
      email_confirm: true,
      user_metadata: { role: "perawat", name: NURSE.name },
    });
    if (error) throw new Error(`createUser: ${error.message}`);
    user = data.user;
    console.log("  ✅  Auth user dibuat.");
  }

  if (!user) throw new Error("User tidak tersedia.");

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role: "perawat", name: NURSE.name }, { onConflict: "id" });
  if (profileErr) throw new Error(`upsert profiles: ${profileErr.message}`);

  const { error: nurseErr } = await supabase
    .from("nurses")
    .upsert({ id: user.id, nip: NURSE.nip, department: NURSE.department }, { onConflict: "id" });
  if (nurseErr) throw new Error(`upsert nurses: ${nurseErr.message}`);

  console.log(`\n✅  Selesai${reused ? " (reuse auth)" : ""}.`);
  console.log(`\n   Login perawat:`);
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${NURSE.password}\n`);
}

main().catch((err) => {
  console.error("❌ ", err);
  process.exit(1);
});
