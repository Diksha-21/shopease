import mongoose from "mongoose";
import encrypt from "mongoose-encryption";
import { getEncryptionKey, getSigningKey } from "../utils/keyManager.js";

function validateKey(key, expectedLength, keyName) {
  const buf = Buffer.from(key, "base64");
  if (buf.length !== expectedLength) {
    throw new Error(
      `[BankAccount Model] ${keyName} must be a base64 string that decodes to ${expectedLength} bytes. Got ${buf.length} bytes.`
    );
  }
  return key;
}

const encKey = validateKey(getEncryptionKey(), 32, "Encryption Key");
const sigKey = validateKey(getSigningKey(), 64, "Signing Key");

const BankAccountSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true }, // encrypted
    bankName: { type: String, required: true },
    bankCode: { type: String, required: true },
    branchName: { type: String },
    ifscCode: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BankAccountSchema.index({ userId: 1, isDefault: 1 });

BankAccountSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ["accountNumber"], // Only encrypt accountNumber
});

function maskAccount(num) {
  if (!num) return "";
  const s = String(num);
  if (s.length <= 4) return "****";
  return s.slice(0, 2) + "****" + s.slice(-2);
}

BankAccountSchema.methods.toMaskedObject = function () {
  const obj = this.toObject();
  if (obj.accountNumber) obj.accountNumber = maskAccount(obj.accountNumber);
  return obj;
};

export default mongoose.model("BankAccount", BankAccountSchema);