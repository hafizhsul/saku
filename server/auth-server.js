"use strict";

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT ?? 4000;
const TOKEN_SECRET = process.env.AUTH_SECRET ?? "dev-secret-ganti-di-produksi";

// Fail-fast: di produksi secret wajib eksplisit — default dev ini ada di repo
// publik, siapa pun yang tahu bisa memalsukan semua token.
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET wajib diisi di produksi");
}

const USERS_FILE = process.env.USERS_FILE ?? path.join(__dirname, "users.json");
const MAX_BODY = 1024 * 1024; // 1MB
const TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const COOKIE_NAME = "saku_token";
// Secure hanya saat produksi: di localhost http browser tetap menerima cookie.
const COOKIE_SECURE = process.env.NODE_ENV === "production" ? "; Secure" : "";

// Anti brute-force/spam per-IP untuk /register & /login.
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 20);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  // Tulis ke file temp lalu rename (atomic di filesystem yang sama) agar
  // crash di tengah penulisan tidak merusak file akun.
  const tmp = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2));
  fs.renameSync(tmp, USERS_FILE);
}

// Fixed-window rate limit sederhana per-IP; bucket kadaluwarsa dibersihkan
// berkala agar Map tidak membengkak.
const rateBuckets = new Map(); // ip -> { count, resetAt }

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function b64urlDecode(str) {
  try {
    const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
    return Buffer.from(padded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function hashPassword(password, saltHex) {
  return crypto
    .scryptSync(password, saltHex, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })
    .toString("hex");
}

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;

  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const headerJson = b64urlDecode(header);
  const bodyJson = b64urlDecode(body);
  if (!headerJson || !bodyJson) return null;

  try {
    const h = JSON.parse(headerJson);
    const p = JSON.parse(bodyJson);
    if (h.alg !== "HS256" || h.typ !== "JWT") return null;
    if (typeof p.exp !== "number" || p.exp <= Date.now()) return null;
    if (typeof p.sub !== "string" || !p.sub) return null;
    return p;
  } catch {
    return null;
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function applyCors(res, req, allowedOrigins) {
  const origin = req.headers.origin;

  // Tanpa Origin (curl/native): wildcard. Dengan Origin: echo bila diizinkan —
  // `*` + credentials ditolak browser, jadi saat ALLOWED_ORIGINS kosong (dev)
  // origin di-echo agar mode cookie web bisa jalan tanpa konfigurasi.
  let allowOrigin = "*";
  if (allowedOrigins.length > 0) {
    if (!origin || !allowedOrigins.includes(origin)) return;
    allowOrigin = origin;
  } else if (origin) {
    allowOrigin = origin;
  }
  if (allowOrigin !== "*") res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
}

function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(TOKEN_TTL / 1000)}${COOKIE_SECURE}`,
  );
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function cookieToken(req) {
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === COOKIE_NAME) return rest.join("=");
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("BAD_JSON"));
      }
    });
    req.on("error", () => reject(new Error("BAD_JSON")));
  });
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name };
}

function requireAuth(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match ? match[1] : cookieToken(req);
  if (!token) return null;
  return verifyToken(token);
}

// Verifikasi payload + pastikan user masih ada dan tokenVersion cocok.
// tokenVersion naik saat logout → semua token lama (semua perangkat) dicabut.
function userFromPayload(payload) {
  if (!payload) return null;
  const user = users.find((u) => u.id === payload.sub);
  if (!user || (user.tokenVersion ?? 0) !== payload.ver) return null;
  return user;
}

const users = loadUsers();

const server = http.createServer(async (req, res) => {
  applyCors(res, req, ALLOWED_ORIGINS);

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = `${req.method} ${url.pathname}`;

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (route === "POST /register") {
      if (isRateLimited(req.socket.remoteAddress)) {
        return sendJson(res, 429, { error: "Terlalu banyak percobaan. Coba lagi nanti." });
      }
      const body = await readBody(req);

      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";

      if (!EMAIL_RE.test(email)) {
        return sendJson(res, 400, { error: "Format email tidak valid." });
      }
      if (password.length < 8) {
        return sendJson(res, 400, { error: "Kata sandi minimal 8 karakter." });
      }
      if (!name || name.length > 60) {
        return sendJson(res, 400, { error: "Nama wajib diisi dan maksimal 60 karakter." });
      }
      if (users.some((u) => u.email === email)) {
        return sendJson(res, 409, { error: "Email sudah terdaftar." });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hash = hashPassword(password, salt);
      const user = { id: crypto.randomUUID(), email, name, salt, hash, tokenVersion: 0 };
      users.push(user);
      saveUsers(users);

      const token = signToken({
        sub: user.id,
        email: user.email,
        ver: user.tokenVersion,
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL,
      });
      setAuthCookie(res, token);
      return sendJson(res, 201, { token, user: publicUser(user) });
    }

    if (route === "POST /login") {
      if (isRateLimited(req.socket.remoteAddress)) {
        return sendJson(res, 429, { error: "Terlalu banyak percobaan. Coba lagi nanti." });
      }
      const body = await readBody(req);

      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      const user = users.find((u) => u.email === email);

      const dummySalt = crypto.randomBytes(16).toString("hex");
      const dummyHash = hashPassword("dummy-password-placeholder", dummySalt);
      const realHash = user ? user.hash : dummyHash;

      const a = Buffer.from(realHash, "hex");
      const b = Buffer.from(hashPassword(password, user ? user.salt : dummySalt), "hex");
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

      if (!user || !ok) {
        return sendJson(res, 401, { error: "Email atau kata sandi salah." });
      }

      const token = signToken({
        sub: user.id,
        email: user.email,
        ver: user.tokenVersion,
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL,
      });
      setAuthCookie(res, token);
      return sendJson(res, 200, { token, user: publicUser(user) });
    }

    if (route === "GET /me") {
      const user = userFromPayload(requireAuth(req));
      if (!user) {
        return sendJson(res, 401, { error: "Sesi berakhir. Silakan masuk kembali." });
      }
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (route === "PATCH /me") {
      const payload = requireAuth(req);
      const user = userFromPayload(payload);
      if (!user) {
        return sendJson(res, 401, { error: "Sesi berakhir. Silakan masuk kembali." });
      }

      const body = await readBody(req);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 60) {
        return sendJson(res, 400, { error: "Nama wajib diisi dan maksimal 60 karakter." });
      }

      user.name = name;
      saveUsers(users);
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (route === "POST /logout") {
      // Selalu 204 + hapus cookie (web). Bila token valid, naikkan
      // tokenVersion → semua token user (semua perangkat) dicabut.
      clearAuthCookie(res);
      const user = userFromPayload(requireAuth(req));
      if (user) {
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
        saveUsers(users);
      }
      res.writeHead(204);
      res.end();
      return;
    }

    return sendJson(res, 404, { error: "Rute tidak ditemukan." });
  } catch (err) {
    if (err.message === "TOO_LARGE") {
      return sendJson(res, 413, { error: "Ukuran permintaan terlalu besar." });
    }
    if (err.message === "BAD_JSON") {
      return sendJson(res, 400, { error: "Format permintaan tidak valid." });
    }
    return sendJson(res, 500, { error: "Terjadi kesalahan pada server." });
  }
});

// ponytail: listen only when run directly so tests can require the module
// and start the server on a random port without binding a fixed one.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Auth server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = { server, signToken, verifyToken, users, loadUsers, saveUsers, publicUser, applyCors, rateBuckets };
