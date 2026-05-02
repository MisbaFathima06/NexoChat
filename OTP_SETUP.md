# OTP Verification Setup Guide

This document explains how to configure OTP (One-Time Password) verification for user registration.

## Overview

The application now requires OTP verification for all new user registrations. Users must verify their email or phone number using a 6-digit OTP code before they can complete registration.

**Note:** Existing users (registered before this update) are grandfathered in and don't need to verify OTP.

## How It Works

1. User enters their details (name, email/phone, password)
2. System sends OTP to their email or phone number
3. User enters the OTP code
4. System verifies OTP and creates the account

## Environment Variables Setup

### For Email OTP (Using Gmail)

Add these to your `backend/.env` file:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM="Chat App <noreply@chatapp.com>"
```

**How to get Gmail App Password:**
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use that 16-character password in `EMAIL_APP_PASSWORD`

### For Email OTP (Using Custom SMTP)

```env
# Email Configuration (Custom SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM="Chat App <noreply@chatapp.com>"
```

### For SMS OTP (Using Twilio)

Add these to your `backend/.env` file:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**How to get Twilio credentials:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Get a phone number from Twilio (free trial available)
4. Add these credentials to your `.env` file

### Development Mode (No Email/SMS Setup Required)

If you don't configure email or SMS services, the system will:
- **Email:** Log OTP to console (in development mode)
- **SMS:** Log OTP to console (in development mode)
- **OTP is returned in API response** (only in development mode)

This allows you to test the OTP flow without setting up email/SMS services.

## Complete .env Example

```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# Security Keys
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-change-in-production

# Email Configuration (Choose one method)
# Option 1: Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM="Chat App <noreply@chatapp.com>"

# Option 2: Custom SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-password
# EMAIL_FROM="Chat App <noreply@chatapp.com>"

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Testing OTP in Development

1. **Without Email/SMS Setup:**
   - OTP will be logged to console
   - OTP will be returned in API response
   - You can copy the OTP from console or toast notification

2. **With Email/SMS Setup:**
   - OTP will be sent to the email/phone
   - Check your inbox or SMS messages
   - Enter the 6-digit code

## Phone Number Format

Phone numbers must be in E.164 format:
- ✅ `+1234567890` (with country code)
- ✅ `+919876543210` (India)
- ❌ `1234567890` (missing +)
- ❌ `(123) 456-7890` (wrong format)

The system will automatically format phone numbers if you forget the `+`.

## OTP Expiry

- OTP expires in **10 minutes**
- Maximum **5 failed attempts** before OTP is invalidated
- You can resend OTP after 60 seconds

## Production Considerations

1. **Remove OTP from API Response:**
   - The code automatically hides OTP in production mode
   - Only returns OTP in `NODE_ENV=development`

2. **Use Redis for OTP Storage:**
   - Current implementation uses in-memory storage
   - For production, consider upgrading to Redis
   - Update `backend/src/lib/otpStorage.js` to use Redis

3. **Email Service:**
   - Consider using dedicated email services:
     - SendGrid
     - AWS SES
     - Mailgun
     - Postmark

4. **SMS Service:**
   - Twilio is production-ready
   - Consider rate limiting for SMS to prevent abuse

## Troubleshooting

### OTP Not Received (Email)
- Check spam folder
- Verify email credentials in `.env`
- Check console for errors
- In development, check console for OTP

### OTP Not Received (SMS)
- Verify Twilio credentials
- Check phone number format (must include country code)
- Verify Twilio account has credits
- In development, check console for OTP

### "OTP not found or expired"
- OTP expires after 10 minutes
- Request a new OTP
- Make sure you're using the correct email/phone

### "Too many failed attempts"
- You've entered wrong OTP 5 times
- Request a new OTP

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" } OR { "phoneNumber": "+1234567890" }
Response: { "message": "OTP sent successfully", "otp": "123456" (dev only) }
```

### Sign Up (with OTP)
```
POST /api/auth/signup
Body: {
  "fullName": "John Doe",
  "email": "user@example.com", // OR "phoneNumber": "+1234567890"
  "password": "password123",
  "otp": "123456"
}
Response: { user object }
```

## Security Notes

- OTPs are stored temporarily (10 minutes)
- Failed attempts are tracked (max 5)
- OTPs are deleted after successful verification
- In production, OTPs are never returned in API responses
- Phone numbers are validated before sending SMS

