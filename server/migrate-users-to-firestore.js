"use strict";

// Skrip migrasi satu arah: users.json (auth server lama) → Firestore.
//
//   node server/migrate-users-to-firestore.js [path-ke-users.json]
//
// Env yang dibutuhkan: FIREBASE_PROJECT_ID + salah satu
// FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS.
// Untuk emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080.
//
// PENTING: hash scrypt lokal TIDAK bisa diimpor ke Firebase Auth.
// Setiap dokumen ditulis dengan passwordMigrated:false — user hasil migrasi
// wajib daftar ulang atau reset kata sandi lewat Firebase Auth. Field
// salt/hash TIDAK PERNAH ditulis ke Firestore.

const fs = require("node:fs");
const path = require("node:path");

const firebase = require("./firebase");

async function main() {
  if (!firebase.isFirebaseEnabled()) {
    console.error("FIREBASE_PROJECT_ID belum diset. Batal.");
    process.exitCode = 2;
    return;
  }
  const db = firebase.getDb();
  if (!db) {
    console.error("Firebase Admin tidak bisa diinisialisasi (cek kredensial / paket firebase-admin). Batal.");
    process.exitCode = 2;
    return;
  }

  const filePath = process.argv[2] ?? path.join(__dirname, "users.json");
  let records;
  try {
    records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    console.error(`Gagal membaca ${filePath}. Batal.`);
    process.exitCode = 2;
    return;
  }
  if (!Array.isArray(records)) {
    console.error(`Format ${filePath} tidak valid (bukan array). Batal.`);
    process.exitCode = 2;
    return;
  }

  let migrated = 0;
  let skipped = 0;
  for (const record of records) {
    if (!record || typeof record.id !== "string" || typeof record.email !== "string") {
      skipped += 1;
      continue;
    }
    await db
      .collection(firebase.USERS_COLLECTION)
      .doc(record.id)
      .set(
        {
          email: record.email,
          name: typeof record.name === "string" && record.name ? record.name : record.email.split("@")[0],
          tokenVersion: typeof record.tokenVersion === "number" ? record.tokenVersion : 0,
          passwordMigrated: false,
          migratedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    migrated += 1;
  }

  console.log(`Migrasi selesai: ${migrated} user → Firestore, ${skipped} dilewati.`);
  console.log("Catatan: hash kata sandi TIDAK dimigrasi — user wajib reset/daftar ulang via Firebase Auth.");
}

main().catch((err) => {
  console.error(`Migrasi gagal: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
