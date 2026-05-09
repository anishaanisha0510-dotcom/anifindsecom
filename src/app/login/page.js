"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Globe, Phone, Mail, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

// ── Inner component that safely uses useSearchParams ──
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const { googleLogin, emailLogin, emailRegister, setupRecaptcha, phoneLogin } = useAuth();
  const [tab, setTab] = useState("email");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await googleLogin();
      toast.success("Welcome! 🌸");
      router.push(redirectTo);
    } catch (e) {
      const msg = e.message || "Google login failed";
      if (msg.includes("not configured")) {
        toast.error("Login service not set up yet. Continue as guest!");
      } else {
        toast.error(msg.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
      }
    }
    setLoading(false);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await emailRegister(form.email, form.password);
        toast.success("Account created! 🎉");
      } else {
        await emailLogin(form.email, form.password);
        toast.success("Welcome back! 🌸");
      }
      router.push(redirectTo);
    } catch (e) {
      toast.error(e.message.replace("Firebase: ", "").replace(/\(.*\)/, ""));
    }
    setLoading(false);
  };

  const sendOtp = async () => {
    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) { toast.error("Enter valid 10-digit phone"); return; }
    setLoading(true);
    try {
      const appVerifier = await setupRecaptcha("recaptcha-container");
      const result = await phoneLogin(`+91${form.phone}`, appVerifier);
      setConfirmResult(result);
      setOtpSent(true);
      toast.success("OTP sent! 📱");
    } catch (e) {
      toast.error("Failed to send OTP. Please try email login.");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await confirmResult.confirm(form.otp);
      toast.success("Verified! 🌸");
      router.push(redirectTo);
    } catch (e) {
      toast.error("Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>🌸 Ani Finds</div>
        <h1 className={styles.title}>{isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p className={styles.sub}>{isRegister ? "Join the Ani Finds family 💛" : "Sign in to continue shopping"}</p>

        {/* Google */}
        <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading} id="google-login-btn">
          <Globe size={18} /> Continue with Google
        </button>

        <div className="divider"><span>or</span></div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${tab === "email" ? styles.tabActive : ""}`} onClick={() => setTab("email")} id="tab-email"><Mail size={14} /> Email</button>
          <button className={`${styles.tabBtn} ${tab === "phone" ? styles.tabActive : ""}`} onClick={() => setTab("phone")} id="tab-phone"><Phone size={14} /> Phone</button>
        </div>

        {tab === "email" && (
          <form onSubmit={handleEmail}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} id="input-name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required id="input-email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className={styles.passwordWrap}>
                <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={handleChange} required id="input-password" />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading} id="email-submit-btn">
              {loading ? "Please wait..." : (isRegister ? "Create Account" : "Login")}
            </button>
          </form>
        )}

        {tab === "phone" && (
          <div>
            <div id="recaptcha-container" />
            {!otpSent ? (
              <>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                    <span style={{ padding: "12px 12px", background: "var(--light-pink)", fontSize: 13, fontWeight: 600, borderRight: "1.5px solid var(--border)" }}>+91</span>
                    <input name="phone" type="number" placeholder="10-digit number" value={form.phone} onChange={handleChange} style={{ border: "none", borderRadius: 0 }} id="input-phone" />
                  </div>
                </div>
                <button className="btn-primary" onClick={sendOtp} disabled={loading} style={{ width: "100%", justifyContent: "center" }} id="send-otp-btn">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input name="otp" type="number" placeholder="6-digit OTP" value={form.otp} onChange={handleChange} id="input-otp" />
                </div>
                <button className="btn-primary" onClick={verifyOtp} disabled={loading} style={{ width: "100%", justifyContent: "center" }} id="verify-otp-btn">
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
                <button className={styles.resendBtn} onClick={() => setOtpSent(false)} id="resend-otp-btn">Resend OTP</button>
              </>
            )}
          </div>
        )}

        <p className={styles.switchText}>
          {isRegister ? "Already have an account?" : "New here?"}
          <button className={styles.switchBtn} onClick={() => setIsRegister(!isRegister)} id="auth-switch-btn">
            {isRegister ? "Login" : "Create Account"}
          </button>
        </p>
        <Link href="/" className={styles.guestBtn} id="guest-continue-btn">Continue as Guest →</Link>
      </div>
    </div>
  );
}

// ── Page export wraps LoginForm in Suspense (required by Next.js for useSearchParams) ──
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌸</div>
          <p style={{ color: "#e8527f", fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
