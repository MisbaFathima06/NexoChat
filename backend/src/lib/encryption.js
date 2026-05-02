import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.ENCRYPTION_KEY || "your-secret-encryption-key-change-in-production";

export const encryptMessage = (message) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return message; // Return original if encryption fails
  }
};

export const decryptMessage = (encryptedMessage) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedMessage; // Return original if decryption fails
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedMessage; // Return original if decryption fails
  }
};

