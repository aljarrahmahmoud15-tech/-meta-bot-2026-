const test = require("node:test");
const assert = require("node:assert/strict");
const { ownerVaultConfigured, encryptOwnerVaultPayload, decryptOwnerVaultPayload } = require("./owner_vault");

const TEST_KEY = "unit-test-owner-vault-key-32-characters";

test("owner vault requires a sufficiently strong configured key", () => {
  assert.equal(ownerVaultConfigured("short"), false);
  assert.equal(ownerVaultConfigured(TEST_KEY), true);
});

test("owner vault encrypts and decrypts without plaintext storage", () => {
  const encrypted = encryptOwnerVaultPayload({ value: "sample-secret", note: "private" }, TEST_KEY);
  assert.equal(encrypted.includes("sample-secret"), false);
  assert.deepEqual(decryptOwnerVaultPayload(encrypted, TEST_KEY), { value: "sample-secret", note: "private" });
});

test("owner vault rejects tampering and a wrong key", () => {
  const encrypted = JSON.parse(encryptOwnerVaultPayload({ value: "sample-secret" }, TEST_KEY));
  encrypted.ciphertext = `${encrypted.ciphertext.slice(0, -2)}xx`;
  assert.throws(() => decryptOwnerVaultPayload(JSON.stringify(encrypted), TEST_KEY));
  const clean = encryptOwnerVaultPayload({ value: "sample-secret" }, TEST_KEY);
  assert.throws(() => decryptOwnerVaultPayload(clean, "another-owner-vault-key-32-characters"));
});
