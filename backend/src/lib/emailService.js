// Email Service using Nodemailer
import nodemailer from "nodemailer";

// Create transporter based on environment variables
const createTransporter = () => {
  // For development, use Gmail or other SMTP service
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // Custom SMTP configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Default: Return null if no email config (will log OTP instead)
  return null;
};

// Send OTP via Email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    // If no email config, just log the OTP (development mode)
    if (!transporter) {
      console.log(`[EMAIL] OTP for ${email}: ${otp}`);
      console.log("⚠️  Email service not configured. Set EMAIL_SERVICE or SMTP_* variables in .env");
      return { success: true, message: "OTP logged (Email service not configured)" };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Chat App" <noreply@chatapp.com>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p>Hello,</p>
          <p>Your OTP verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
      text: `Your OTP verification code is: ${otp}. This code will expire in 10 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development, log success
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Email sent successfully to", email);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("⚠️  Email service not configured");
      return false;
    }
    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration error:", error.message);
    return false;
  }
};

