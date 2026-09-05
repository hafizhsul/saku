"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const firebase = require("./firebase");

test("firebase nonaktif tanpa FIREBASE_PROJECT_ID", () => {
  assert.equal(firebase.isFirebaseEnabled(), false);
  assert.equal(firebase.getDb(), null);
});

test("verifyFirebaseToken mengembalikan null saat tak terkonfigurasi", async () => {
  assert.equal(await firebase.verifyFirebaseToken("token-palsu"), null);
  assert.equal(await firebase.verifyFirebaseToken(""), null);
  assert.equal(await firebase.verifyFirebaseToken(null), null);
});

test("mirrorProfile no-op saat tak terkonfigurasi", async () => {
  await firebase.mirrorProfile({ id: "x", email: "x@y.z", name: "X", tokenVersion: 0 });
  await firebase.mirrorProfile(null);
});

test("getProfile mengembalikan null saat tak terkonfigurasi", async () => {
  assert.equal(await firebase.getProfile("uid-apa-pun"), null);
});
