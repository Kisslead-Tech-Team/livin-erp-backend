const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// get current date time in format YYYY-MM-DD HH:MM:SS
const getCurrentDateTime = () => {
  return new Date().toLocaleString("en-CA", { hour12: false, timeZone: "Asia/Kolkata" }).replace(",", " ");
};

// ----------------------------------------------------------------------------------------

// Encryption helpers (AES-256-CBC with fixed IV for deterministic encryption)
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(process.env.DATA_ENCRYPTION_KEY || "DEFAULT_ENCRYPTION_KEY"))
  .digest(); // 32 bytes
const IV = Buffer.alloc(16, 0);

// encrypt the value
const encryptField = (plainText) => {
  if (plainText === null || plainText === undefined) return plainText;
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(String(plainText), "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

// decrypt the value
const decryptField = (cipherText) => {
  if (cipherText === null || cipherText === undefined) return cipherText;
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(String(cipherText), "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// ----------------------------------------------------------------------------------------

// verify jwt token
const verifyJWT = (token) => {
  try {
    // Decode the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Update iat and exp
    payload.iat = Math.floor(Date.now() / 1000);
    payload.exp = Math.floor(Date.now() / 1000) + 300; // 5 Mins

    // Re-encode the token
    const newToken = jwt.sign(payload, process.env.JWT_SECRET);

    return {
      valid: true,
      new_token: newToken,
      data: payload,
    };
  } catch (error) {
    return { valid: false, message: error.message };
  }
};

// -------------------------------------------------------------------------------------------

module.exports = { getCurrentDateTime, verifyJWT, encryptField, decryptField };
