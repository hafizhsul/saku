"use strict";

const { after, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Temp users file + secret BEFORE require so the module loads isolated state.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "saku-auth-test-"));
const usersFile = path.join(tmpDir, "users.json");
fs.writeFileSync(usersFile, "[]");
process.env.USERS_FILE = usersFile;
process.env.AUTH_SECRET = "test-secret-jangan-pakai-di-produksi";

const { server, signToken, users, saveUsers, applyCors, rateBuckets } = require("./auth-server.js");

let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  users.length = 0;
  saveUsers(users);
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function request(method, route, { token, cookie, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

function setCookieValue(res) {
  // Node ≥20.7: getSetCookie() mengembalikan array (satu per header Set-Cookie).
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie()[0] : res.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : null;
}

async function register({ email = "test@example.com", password = "password123", name = "Test User" } = {}) {
  return request("POST", "/register", { body: { email, password, name } });
}

test("module refuses to start without AUTH_SECRET in production", () => {
  // Jalankan di child process terpisah agar tidak mengganggu instance modul
  // (dan server) yang dipakai test lain di proses ini.
  const env = { ...process.env, NODE_ENV: "production" };
  delete env.AUTH_SECRET;
  assert.throws(
    () =>
      execFileSync(process.execPath, ["-e", "require('./auth-server.js')"], {
        cwd: __dirname,
        env,
        stdio: "pipe",
      }),
    /AUTH_SECRET wajib diisi di produksi/,
  );
});

test("register returns 201 with token and public user", async () => {
  const res = await register();

  assert.equal(res.status, 201);
  assert.ok(typeof res.body.token === "string" && res.body.token.length > 0);
  assert.ok(res.body.user.id);
  assert.equal(res.body.user.email, "test@example.com");
  assert.equal(res.body.user.name, "Test User");
  assert.ok(!("salt" in res.body.user));
  assert.ok(!("hash" in res.body.user));
});

test("register duplicate email returns 409", async () => {
  await register();
  const res = await register();

  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { error: "Email sudah terdaftar." });
});

test("register invalid email returns 400", async () => {
  const res = await register({ email: "bukan-email" });

  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Format email tidak valid." });
});

test("register short password returns 400", async () => {
  const res = await register({ password: "pendek" });

  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Kata sandi minimal 8 karakter." });
});

test("login returns 200 with token and public user", async () => {
  await register();
  const res = await request("POST", "/login", {
    body: { email: "test@example.com", password: "password123" },
  });

  assert.equal(res.status, 200);
  assert.ok(typeof res.body.token === "string" && res.body.token.length > 0);
  assert.equal(res.body.user.email, "test@example.com");
  assert.ok(!("salt" in res.body.user));
});

test("login wrong password returns 401", async () => {
  await register();
  const res = await request("POST", "/login", {
    body: { email: "test@example.com", password: "password-salah" },
  });

  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "Email atau kata sandi salah." });
});

test("GET /me with valid token returns 200 and user", async () => {
  const registered = await register();
  const res = await request("GET", "/me", { token: registered.body.token });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.user, {
    id: registered.body.user.id,
    email: "test@example.com",
    name: "Test User",
  });
});

test("GET /me without token returns 401", async () => {
  const res = await request("GET", "/me");

  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "Sesi berakhir. Silakan masuk kembali." });
});

test("GET /me with expired token returns 401", async () => {
  const registered = await register();
  const expired = signToken({
    sub: registered.body.user.id,
    email: registered.body.user.email,
    iat: Date.now() - 10_000,
    exp: Date.now() - 5_000,
  });

  const res = await request("GET", "/me", { token: expired });
  assert.equal(res.status, 401);
});

test("GET /me with tampered token returns 401", async () => {
  const registered = await register();
  const token = registered.body.token;
  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

  const res = await request("GET", "/me", { token: tampered });
  assert.equal(res.status, 401);
});

test("logout revokes the token (all sessions) and re-login works", async () => {
  const registered = await register();
  const token = registered.body.token;
  assert.equal((await request("GET", "/me", { token })).status, 200);

  const out = await request("POST", "/logout", { token });
  assert.equal(out.status, 204);
  assert.equal((await request("GET", "/me", { token })).status, 401);

  const relogin = await request("POST", "/login", {
    body: { email: "test@example.com", password: "password123" },
  });
  assert.equal(relogin.status, 200);
  assert.equal((await request("GET", "/me", { token: relogin.body.token })).status, 200);
});

test("register sets httpOnly cookie; /me and logout work with cookie auth", async () => {
  const res = await register();
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie()[0] : res.headers.get("set-cookie");
  assert.match(setCookie ?? "", /saku_token=/);
  assert.match(setCookie ?? "", /HttpOnly/);
  assert.match(setCookie ?? "", /SameSite=Strict/);

  const cookie = setCookieValue(res);
  assert.ok(cookie !== null);
  assert.equal((await request("GET", "/me", { cookie })).status, 200);

  await request("POST", "/logout", { cookie });
  assert.equal((await request("GET", "/me", { cookie })).status, 401);
});

test("CORS: ALLOWED_ORIGINS membatasi origin dan mengizinkan credentials", () => {
  const allowed = ["http://a.example"];
  const ok = {};
  applyCors({ setHeader: (k, v) => { ok[k] = v; } }, { headers: { origin: "http://a.example" } }, allowed);
  assert.equal(ok["Access-Control-Allow-Origin"], "http://a.example");
  assert.equal(ok["Access-Control-Allow-Credentials"], "true");

  const denied = {};
  applyCors({ setHeader: (k, v) => { denied[k] = v; } }, { headers: { origin: "http://evil.example" } }, allowed);
  assert.equal(denied["Access-Control-Allow-Origin"], undefined);
});

test("POST /logout returns 204", async () => {
  const res = await request("POST", "/logout");

  assert.equal(res.status, 204);
  assert.equal(res.body, null);
});

test("OPTIONS preflight returns 204 with CORS headers", async () => {
  const res = await request("OPTIONS", "/register");

  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.match(res.headers.get("access-control-allow-methods") ?? "", /GET|POST|OPTIONS/);
  assert.match(res.headers.get("access-control-allow-headers") ?? "", /Content-Type|Authorization/);
});

test("rate limits /login setelah RATE_LIMIT_MAX percobaan per IP", async () => {
  rateBuckets.clear();
  let got429 = false;
  for (let i = 0; i < 30 && !got429; i++) {
    const res = await request("POST", "/login", {
      body: { email: "x@example.com", password: "password-salah" },
    });
    got429 = res.status === 429;
  }
  assert.ok(got429, "seharusnya ada respons 429 setelah batas percobaan");
});
