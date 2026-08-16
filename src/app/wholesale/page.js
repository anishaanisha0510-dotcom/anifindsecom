"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { MessageCircle, Package, Truck, CheckCircle, ArrowRight, Gift, ShieldCheck } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/data";

const TIERS = [
  { min: "₹2,000", max: "₹4,999", discount: "10%", coupon: "WHOLESALE10", highlight: false },
  { min: "₹5,000", max: "₹9,999", discount: "15%", coupon: "WHOLESALE15", highlight: true },
  { min: "₹10,000", max: "+", discount: "20%", coupon: "WHOLESALE20", highlight: false },
];

const BENEFITS = [
  { icon: Package, title: "Bulk Pricing", desc: "Special rates for orders above ₹2,000" },
  { icon: Truck, title: "Free Shipping", desc: "All wholesale orders ship free, PAN India" },
  { icon: Gift, title: "Custom Packaging", desc: "Branded packaging available on request" },
  { icon: ShieldCheck, title: "Quality Assured", desc: "Every item quality-checked before dispatch" },
];

const STEPS = [
  { step: "01", title: "Browse Products", desc: "Explore our full catalogue and pick what you love" },
  { step: "02", title: "WhatsApp Us", desc: "Send your list or place via WhatsApp for faster help" },
  { step: "03", title: "Apply Coupon", desc: "Use the wholesale coupon code at checkout" },
  { step: "04", title: "Fast Delivery", desc: "We ship PAN India within 3–5 business days" },
];

const FAQS = [
  { q: "What is the minimum order for wholesale?", a: "Minimum cart value is ₹2,000 to avail wholesale pricing." },
  { q: "How do I place a wholesale order?", a: "You can place via WhatsApp for personalized assistance, or shop directly and apply the coupon code at checkout." },
  { q: "Is there a catalog available?", a: "Yes! WhatsApp us and we will send the full catalog with current pricing." },
  { q: "Do you ship outside India?", a: "Currently we only ship within India (PAN India delivery)." },
];

export default function WholesalePage() {
  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hi! I am interested in placing a wholesale order. Please share the catalog and pricing details.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🎁 Wholesale Orders Open · Minimum ₹2,000 · Best Prices Guaranteed</div>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #fff0f5 0%, #fce8f0 50%, #fff5fb 100%)",
        padding: "60px 0 50px",
        textAlign: "center",
      }}>
        <div className="container">
          <span style={{
            display: "inline-block", background: "#e8527f", color: "white",
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase", padding: "6px 16px", borderRadius: 20,
            marginBottom: 18,
          }}>Wholesale Program</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Grow Your Business with<br />
            <span style={{ color: "#e8527f" }}>Ani Finds</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Stock your store with our trendy fashion accessories and jewellery.
            Affordable prices, beautiful products, fast delivery.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={handleWhatsApp} style={{ gap: 8 }} id="wholesale-whatsapp-hero">
              <MessageCircle size={17} /> WhatsApp Us Now
            </button>
            <Link href="/products" className="btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 8 }} id="wholesale-shop-btn">
              Browse Products <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 56, paddingBottom: 60 }}>

        {/* Benefits */}
        <section style={{ marginBottom: 60 }}>
          <h2 className="section-title" style={{ textAlign: "center" }}>Why Wholesale with Us?</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20, marginTop: 32,
          }}>
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} style={{
                  background: "white", border: "1.5px solid #f0e6ec",
                  borderRadius: 16, padding: "28px 22px", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(232,82,127,0.06)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff0f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#e8527f" }}>
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{b.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pricing Tiers */}
        <section style={{ marginBottom: 60 }}>
          <h2 className="section-title" style={{ textAlign: "center" }}>Wholesale Pricing Tiers</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 32, fontSize: 14 }}>
            The bigger your order, the better the discount. Apply coupon at checkout.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {TIERS.map((tier, i) => (
              <div key={i} style={{
                background: tier.highlight ? "linear-gradient(135deg, #e8527f, #d63d6a)" : "white",
                color: tier.highlight ? "white" : "var(--text-dark)",
                border: tier.highlight ? "none" : "1.5px solid #f0e6ec",
                borderRadius: 20, padding: "32px 24px", textAlign: "center",
                boxShadow: tier.highlight ? "0 8px 32px rgba(232,82,127,0.3)" : "0 2px 12px rgba(232,82,127,0.06)",
                position: "relative", overflow: "hidden",
              }}>
                {tier.highlight && (
                  <span style={{
                    position: "absolute", top: 14, right: 14,
                    background: "#FFD700", color: "#333", fontSize: 10,
                    fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                  }}>BEST VALUE</span>
                )}
                <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginBottom: 8 }}>
                  Order {tier.min} – {tier.max}
                </p>
                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, marginBottom: 10 }}>
                  {tier.discount}
                </div>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>Discount on entire order</p>
                <div style={{
                  background: tier.highlight ? "rgba(255,255,255,0.2)" : "#fff0f5",
                  borderRadius: 10, padding: "8px 14px", display: "inline-block",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tier.highlight ? "white" : "#e8527f" }}>
                    Coupon: {tier.coupon}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to Order */}
        <section style={{ marginBottom: 60 }}>
          <h2 className="section-title" style={{ textAlign: "center" }}>How to Order</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, marginTop: 32 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #e8527f, #c93b62)",
                  color: "white", fontSize: 16, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{s.step}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 60 }}>
          <h2 className="section-title" style={{ textAlign: "center" }}>FAQs</h2>
          <div style={{ maxWidth: 680, margin: "32px auto 0", display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "white", border: "1.5px solid #f0e6ec",
                borderRadius: 14, padding: "18px 22px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle size={17} color="#e8527f" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{faq.q}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{
          background: "linear-gradient(135deg, #e8527f, #c93b62)",
          borderRadius: 24, padding: "44px 32px", textAlign: "center",
          color: "white",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>
            Ready to Place a Wholesale Order?
          </h2>
          <p style={{ opacity: 0.85, fontSize: 15, marginBottom: 28, maxWidth: 440, margin: "0 auto 28px" }}>
            WhatsApp us for the catalog, custom quotes, and personalized service.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleWhatsApp}
              id="wholesale-whatsapp-cta"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#25D366", color: "white",
                border: "none", borderRadius: 12,
                padding: "14px 28px", fontSize: 15, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <MessageCircle size={18} /> WhatsApp Order Now
            </button>
            <Link href="/products" id="wholesale-shop-cta" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.15)", color: "white",
              border: "2px solid rgba(255,255,255,0.4)", borderRadius: 12,
              padding: "14px 24px", fontSize: 15, fontWeight: 700,
              textDecoration: "none",
            }}>
              Shop Now <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
