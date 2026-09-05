"use strict";

// Integrasi Firebase (Auth + Firestore) — OPSIONAL.
//
// Firebase aktif hanya bila env FIREBASE_PROJECT_ID diset. Tanpa itu semua
// fungsi di bawah menjadi no-op yang aman sehingga dev lokal (users.json),
// suite test, dan E2E tetap jalan tanpa kredensial maupun paket tambahan.
//
// Kredensial (salah satu):
//   FIREBASE_SERVICE_ACCOUNT_JSON — isi JSON service account (satu baris).
//   GOOGLE_APPLICATION_CREDENTIALS — path file service account.
//   FIRESTORE_EMULATOR_HOST       — emulator (tanpa kredensial asli).
//
// Koleksi Firestore: `users` (doc id = user id).
// Dokumen profil: { email, name, tokenVersion, passwordMigrated, updatedAt }.
// passwordMigrated selalu false untuk hasil migrasi karena hash scrypt lokal
// TIDAK bisa diimpor ke Firebase Auth — user wajib daftar ulang / reset.

const USERS_COLLECTION = "users";

// null = belum diinisialisasi, false = tidak tersedia, objek = modul admin.
let adminCache = null;

function isFirebaseEnabled() {
  return Boolean(process.env.FIREBASE_PROJECT_ID);
}

function loadAdmin() {
  if (adminCache !== null) return adminCache || null;
  let admin = null;
  try {
    // Lazy require: paket firebase-admin tidak wajib terinstal untuk
    // menjalankan server dalam mode legacy (file).
    admin = require("firebase-admin");
    if (admin.apps.length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      if (!projectId) {
        adminCache = false;
        return null;
      }
      const options = { projectId };
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        options.credential = admin.credential.cert(JSON.parse(serviceAccountJson));
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST) {
        // Emulator atau ADC: applicationDefault() cukup.
        options.credential = admin.credential.applicationDefault();
      } else {
        // projectId ada tapi tanpa kredensial → anggap belum dikonfigurasi.
        adminCache = false;
        return null;
      }
      admin.initializeApp(options);
    }
    adminCache = admin;
    return admin;
  } catch {
    adminCache = false;
    return null;
  }
}

function getDb() {
  const admin = loadAdmin();
  if (!admin) return null;
  try {
    return admin.firestore();
  } catch {
    return null;
  }
}

// Verifikasi Firebase ID token (dari client). Gagal/ tak terkonfigurasi → null.
async function verifyFirebaseToken(idToken) {
  if (typeof idToken !== "string" || !idToken) return null;
  const admin = loadAdmin();
  if (!admin) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded || typeof decoded.uid !== "string") return null;
    return { uid: decoded.uid, email: typeof decoded.email === "string" ? decoded.email : null };
  } catch {
    return null;
  }
}

// Simpan/cerminkan profil user ke Firestore. Best-effort: kegagalan tidak
// boleh menggagalkan request auth (offline / emulator mati).
async function mirrorProfile(user) {
  if (!isFirebaseEnabled() || !user || typeof user.id !== "string") return;
  const db = getDb();
  if (!db) return;
  try {
    await db
      .collection(USERS_COLLECTION)
      .doc(user.id)
      .set(
        {
          email: user.email,
          name: user.name,
          tokenVersion: user.tokenVersion ?? 0,
          passwordMigrated: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
  } catch {
    // Best-effort: abaikan.
  }
}

async function getProfile(uid) {
  const db = getDb();
  if (!db || typeof uid !== "string" || !uid) return null;
  try {
    const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (!data || typeof data.email !== "string") return null;
    return {
      id: uid,
      email: data.email,
      name: typeof data.name === "string" && data.name ? data.name : data.email.split("@")[0],
      tokenVersion: typeof data.tokenVersion === "number" ? data.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}

module.exports = { USERS_COLLECTION, isFirebaseEnabled, verifyFirebaseToken, getDb, mirrorProfile, getProfile };
