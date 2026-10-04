const crypto = require("crypto");

function ownerVaultConfigured(key = process.env.OWNER_VAULT_KEY || "") {
  return String(key).length >= 32;
}

function ownerVaultKey(key = process.env.OWNER_VAULT_KEY || "") {
  if (!ownerVaultConfigured(key)) throw new Error("OWNER_VAULT_KEY is not configured");
  return crypto.createHash("sha256").update(String(key), "utf8").digest();
}

function encryptOwnerVaultPayload({ value, note = "" }, key = process.env.OWNER_VAULT_KEY || "") {
  if (typeof value !== "string" || !value) throw new Error("Vault value is required");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ownerVaultKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ value, note }), "utf8"), cipher.final()]);
  return JSON.stringify({
    version: 1,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  });
}

function decryptOwnerVaultPayload(serialized, key = process.env.OWNER_VAULT_KEY || "") {
  const envelope = JSON.parse(String(serialized || ""));
  if (envelope.version !== 1 || envelope.algorithm !== "aes-256-gcm") throw new Error("Unsupported vault envelope");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ownerVaultKey(key), Buffer.from(envelope.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64url")), decipher.final()]).toString("utf8");
  const payload = JSON.parse(plaintext);
  if (!payload || typeof payload.value !== "string") throw new Error("Invalid vault payload");
  return { value: payload.value, note: typeof payload.note === "string" ? payload.note : "" };
}

module.exports = { ownerVaultConfigured, encryptOwnerVaultPayload, decryptOwnerVaultPayload };
