"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar/Navbar";
import { CheckCircle, Package, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/data";
import styles from "./page.module.css";

function OrderSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id") || "ORD" + Date.now();
  const [confetti, setConfetti] = useState(true);

  useEffect(() => { const t = setTimeout(() => setConfetti(false), 4000); return () => clearTimeout(t); }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      {confetti && (
        <div className={styles.confetti}>
          {["🎉","🌸","✨","💛","🎀","💍","⭐","🎊"].map((e, i) => (
            <span key={i} className={styles.confettiPiece} style={{ left: `${10 + i * 11}%`, animationDelay: `${i * 0.2}s` }}>{e}</span>
          ))}
        </div>
      )}
      <div className={`container ${styles.center}`}>
        <div className={styles.successCard}>
          <div className={styles.checkIcon}><CheckCircle size={56} color="white" /></div>
          <h1 className={styles.title}>Order Placed! 🎉</h1>
          <p className={styles.sub}>Thank you for shopping with Ani Finds 🌸</p>
          <div className={styles.orderInfo}>
            <div className={styles.infoRow}><Package size={16} color="var(--pink)" /><span>Order ID:</span><strong>{orderId}</strong></div>
            <div className={styles.infoRow}><span>Estimated Delivery:</span><strong>3-5 business days</strong></div>
          </div>

          <div className={styles.actions} style={{ marginTop: 24 }}>
            <Link href="/" className="btn-primary" id="success-continue-btn">Continue Shopping</Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I just placed order ${orderId}. Need help?`)}`}
              target="_blank" rel="noreferrer"
              className="whatsapp-btn" id="success-whatsapp-btn"
            >
              <MessageCircle size={16} /> Track on WhatsApp
            </a>
          </div>
          <Link href="/profile?tab=orders" style={{ fontSize: 14, color: "var(--pink)", marginTop: 8 }} id="success-my-orders-btn">View My Orders →</Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#e8527f", fontWeight: 600 }}>🌸 Loading...</p>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
