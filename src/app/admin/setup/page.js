"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// ⚠️ SECRET SETUP ROUTE — Only use this ONCE to make yourself admin
// After using it, you should delete or disable this file for security!
// Visit: http://localhost:3000/admin/setup

export default function AdminSetupPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  const makeAdmin = async () => {
    if (!user) {
      setMessage("❌ You must be logged in first!");
      return;
    }
    setStatus("loading");
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(
        doc(db, "users", user.uid),
        { role: "admin" },
        { merge: true }
      );
      setStatus("done");
      setMessage(`✅ Admin access granted to ${user.email || user.phoneNumber || "your account"}!`);
    } catch (err) {
      setStatus("error");
      setMessage("❌ Failed: " + err.message + ". Check Firestore rules.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "#999" }}>Checking login...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#fdf0f4",
      padding: 24,
      fontFamily: "Inter, sans-serif",
      gap: 20,
    }}>
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: "40px 32px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, marginBottom: 8 }}>Admin Setup</h1>
        <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
          This will grant admin access to your currently logged-in account.
          <br /><strong>Use only once, then delete this page.</strong>
        </p>

        {!user ? (
          <div>
            <p style={{ color: "#e8527f", marginBottom: 16 }}>⚠️ You are not logged in.</p>
            <Link
              href="/login?redirect=/admin/setup"
              style={{ background: "#1a1a1a", color: "white", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 600, display: "inline-block" }}
            >
              Login First
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
              <p style={{ margin: 0, color: "#666" }}>Logged in as:</p>
              <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1a1a1a" }}>
                {user.email || user.phoneNumber || user.uid}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#e8527f" }}>
                Current role: <strong>{userProfile?.role || "customer"}</strong>
              </p>
            </div>

            {message && (
              <p style={{ fontSize: 14, marginBottom: 16, fontWeight: 600, color: status === "done" ? "#4caf50" : "#e53935" }}>
                {message}
              </p>
            )}

            {status !== "done" ? (
              <button
                onClick={makeAdmin}
                disabled={status === "loading"}
                style={{
                  background: status === "loading" ? "#ccc" : "#1a1a1a",
                  color: "white",
                  border: "none",
                  padding: "14px 32px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  width: "100%",
                }}
              >
                {status === "loading" ? "Setting up..." : "🔑 Make Me Admin"}
              </button>
            ) : (
              <Link
                href="/admin"
                style={{
                  background: "#e8527f",
                  color: "white",
                  padding: "14px 32px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "block",
                  fontSize: 15,
                }}
              >
                → Go to Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: "#bbb", textAlign: "center" }}>
        ⚠️ Delete <code>src/app/admin/setup/page.js</code> after use for security.
      </p>
    </div>
  );
}
