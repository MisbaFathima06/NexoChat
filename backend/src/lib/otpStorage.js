// OTP Storage Service
// In-memory storage for development, can be upgraded to Redis for production

class OTPStorage {
  constructor() {
    this.storage = new Map(); // key: email/phone, value: { otp, expiresAt, attempts }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Clean up every minute
  }

  // Store OTP for email or phone
  set(identifier, otp, expiresInMinutes = 10) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    this.storage.set(identifier, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });
  }

  // Get OTP for email or phone
  get(identifier) {
    return this.storage.get(identifier);
  }

  // Verify OTP
  verify(identifier, otp) {
    const stored = this.storage.get(identifier);
    
    if (!stored) {
      return { valid: false, message: "OTP not found or expired" };
    }

    if (new Date() > stored.expiresAt) {
      this.storage.delete(identifier);
      return { valid: false, message: "OTP has expired" };
    }

    if (stored.attempts >= 5) {
      this.storage.delete(identifier);
      return { valid: false, message: "Too many failed attempts. Please request a new OTP" };
    }

    if (stored.otp !== otp) {
      stored.attempts += 1;
      return { valid: false, message: "Invalid OTP" };
    }

    // OTP is valid, remove it
    this.storage.delete(identifier);
    return { valid: true, message: "OTP verified successfully" };
  }

  // Delete OTP (after successful verification or manual cleanup)
  delete(identifier) {
    this.storage.delete(identifier);
  }

  // Clean up expired OTPs
  cleanup() {
    const now = new Date();
    for (const [identifier, data] of this.storage.entries()) {
      if (now > data.expiresAt) {
        this.storage.delete(identifier);
      }
    }
  }

  // Clear all (useful for testing)
  clear() {
    this.storage.clear();
  }

  // Get storage size (for monitoring)
  size() {
    return this.storage.size;
  }
}

// Singleton instance
const otpStorage = new OTPStorage();

export default otpStorage;

