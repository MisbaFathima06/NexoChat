export const generateOTP = () => {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOTPExpiry = (minutes = 10) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

export const isOTPValid = (otp, userOTP, expiry) => {
  if (!userOTP || !expiry) return false;
  if (otp !== userOTP) return false;
  if (new Date() > new Date(expiry)) return false;
  return true;
};

