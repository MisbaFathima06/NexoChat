import { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { signup, sendOTP } from "../store/slices/authSlice";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, Shield, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter details and send OTP, 2: Verify OTP
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // Countdown timer for resend OTP
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) return;

    setIsSendingOTP(true);
    try {
      const data = { email: formData.email };
      
      const response = await dispatch(sendOTP(data)).unwrap();
      setOtpSent(true);
      setStep(2);
      startCountdown();
      toast.success(response.message || "OTP sent successfully");
      
      // In development, show OTP in console
      if (response.otp) {
        console.log("Development OTP:", response.otp);
        toast.success(`OTP: ${response.otp} (Development mode)`, { duration: 10000 });
      }
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsSendingOTP(true);
    try {
      const data = { email: formData.email };
      
      const response = await dispatch(sendOTP(data)).unwrap();
      startCountdown();
      toast.success(response.message || "OTP resent successfully");
      
      // In development, show OTP in console
      if (response.otp) {
        console.log("Development OTP:", response.otp);
        toast.success(`OTP: ${response.otp} (Development mode)`, { duration: 10000 });
      }
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      await handleSendOTP();
      return;
    }

    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const data = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        otp: formData.otp,
      };
      
      await dispatch(signup(data)).unwrap();
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData({ ...formData, otp: value });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {step === 1 ? (
                  <MessageSquare className="size-6 text-primary" />
                ) : (
                  <Shield className="size-6 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {step === 1 ? "Create Account" : "Verify OTP"}
              </h1>
              <p className="text-base-content/60">
                {step === 1 
                  ? "Get started with your free account" 
                  : "Enter the OTP sent to your email"}
              </p>
            </div>
          </div>

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost btn-sm w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to details
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      disabled={isSendingOTP}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="email"
                      className="input input-bordered w-full pl-10"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isSendingOTP}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input input-bordered w-full pl-10"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isSendingOTP}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSendingOTP}
                    >
                      {showPassword ? (
                        <EyeOff className="size-5 text-base-content/40" />
                      ) : (
                        <Eye className="size-5 text-base-content/40" />
                      )}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full" 
                  disabled={isSendingOTP || isLoading}
                >
                  {isSendingOTP ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Enter OTP</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      value={formData.otp}
                      onChange={handleOTPChange}
                      maxLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Check your email for the 6-digit code
                    </span>
                  </label>
                </div>

                <div className="text-center">
                  <p className="text-sm text-base-content/60 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isSendingOTP}
                    className="btn btn-link btn-sm"
                  >
                    {countdown > 0 
                      ? `Resend OTP in ${countdown}s` 
                      : isSendingOTP 
                        ? "Sending..." 
                        : "Resend OTP"}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full" 
                  disabled={isLoading || formData.otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>
              </>
            )}
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};

export default SignUpPage;
