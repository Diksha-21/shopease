// utils/keyManager.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

const keysFile = path.join(process.cwd(), "config", "enc-keys.json");

function generateKeys() {
  return {
    encryptionKey: crypto.randomBytes(32).toString("base64"), // 32 bytes → base64
    signingKey: crypto.randomBytes(64).toString("base64"),    // 64 bytes → base64
  };
}

function isValidBase64Key(key, expectedBytes) {
  try {
    const buf = Buffer.from(key, "base64");
    return buf.length === expectedBytes;
  } catch {
    return false;
  }
}

function ensureKeys() {
  let regenerate = false;
  let keys = null;

  if (!fs.existsSync(keysFile)) {
    regenerate = true;
  } else {
    try {
      keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
      if (
        !isValidBase64Key(keys.encryptionKey, 32) ||
        !isValidBase64Key(keys.signingKey, 64)
      ) {
        console.warn("[keyManager] Invalid key size detected — regenerating keys...");
        regenerate = true;
      }
    } catch {
      console.warn("[keyManager] Corrupted keys file — regenerating keys...");
      regenerate = true;
    }
  }

  if (regenerate) {
    keys = generateKeys();
    fs.mkdirSync(path.dirname(keysFile), { recursive: true });
    fs.writeFileSync(keysFile, JSON.stringify(keys, null, 2));
    console.log("[keyManager] New encryption keys generated");
  }

  return keys || JSON.parse(fs.readFileSync(keysFile, "utf8"));
}

export function getEncryptionKey() {
  return ensureKeys().encryptionKey;
}

export function getSigningKey() {
  return ensureKeys().signingKey;
}
