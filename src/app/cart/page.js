"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { COUPONS } from "@/lib/data";
import { Trash2, Plus, Minus, Tag, ShoppingBag, Lock } from "lucide-react";
import styles from "./page.module.css";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");

  // 🔒 Redirect to login if not authenticated
  const handleCheckout = (e) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/checkout");
    }
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) {
      const c = COUPONS[code];
      if (cartTotal < c.minCart) {
        setCouponMsg(`❌ Minimum cart value ₹${c.minCart} required`);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code, ...c });
        setCouponMsg(`✅ Coupon applied! ${c.label}`);
      }
    } else {
      setCouponMsg("❌ Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const shipping = cartTotal >= 999 ? 0 : 99;
  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((cartTotal * appliedCoupon.value) / 100)
      : appliedCoupon.value
    : 0;
  const finalTotal = cartTotal + shipping - discount;

  if (cart.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="announcement-bar">🚚 Free Shipping above ₹999</div>
        <Navbar />
        <div className={`container ${styles.empty}`}>
          <span style={{ fontSize: 80 }}>🛍</span>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet!</p>
          <Link href="/products" className="btn-primary" id="empty-cart-shop-btn">Start Shopping</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🚚 Free Shipping above ₹999</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <h1 className="section-title" style={{ marginBottom: 24 }}>My Cart ({cartCount} items)</h1>
        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            {cart.map((item) => (
              <div key={item.key} className={`card ${styles.cartItem}`}>
                <div className={styles.itemImg}><span style={{ fontSize: 40 }}>💍</span></div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemCat}>{item.category}</p>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  {item.variant && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {[item.variant.color && `Color: ${item.variant.color}`, item.variant.size && `Size: ${item.variant.size}`].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  <div className={styles.itemBottom}>
                    <div className={styles.qtyRow}>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.key, item.quantity - 1)} id={`qty-minus-${item.key}`}><Minus size={12} /></button>
                      <span>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQuantity(item.key, item.quantity + 1)} id={`qty-plus-${item.key}`}><Plus size={12} /></button>
                    </div>
                    <span className={styles.itemPrice}>₹{(item.offerPrice || item.price) * item.quantity}</span>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.key)} id={`remove-${item.key}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <div className="card" style={{ padding: 20 }}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              {/* Coupon */}
              <div className={styles.couponRow}>
                <Tag size={14} color="var(--pink)" />
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  id="coupon-input"
                  style={{ border: "none", padding: "0", fontSize: 13, flex: 1 }}
                />
                <button className="btn-outline" onClick={applyCoupon} style={{ padding: "8px 14px", fontSize: 12 }} id="coupon-apply-btn">Apply</button>
              </div>
              {couponMsg && <p style={{ fontSize: 12, margin: "4px 0 12px", color: appliedCoupon ? "green" : "#e8527f" }}>{couponMsg}</p>}
              <div className={styles.couponHints}>
                <span>Try: ANI10, FREESHIP, WHOLESALE20</span>
              </div>

              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}><span>Subtotal</span><span>₹{cartTotal}</span></div>
                <div className={styles.priceRow}><span>Shipping</span><span className={shipping === 0 ? styles.free : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
                {discount > 0 && <div className={styles.priceRow}><span>Discount</span><span className={styles.discount}>-₹{discount}</span></div>}
                <div className={`${styles.priceRow} ${styles.total}`}><span>Total</span><span>₹{finalTotal}</span></div>
              </div>

              {/* Checkout button — requires login */}
              <Link
                href="/checkout"
                onClick={handleCheckout}
                className="btn-primary"
                id="checkout-btn"
                style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, width: "100%", marginTop: 16 }}
              >
                {!user && <Lock size={14} />}
                {user ? "Proceed to Checkout" : "Login to Checkout"}
              </Link>
              <Link href="/products" style={{ display: "block", textAlign: "center", fontSize: 13, color: "var(--pink)", marginTop: 12 }} id="continue-shopping-btn">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky checkout on mobile */}
      <div className="sticky-bottom">
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Total</p>
          <p style={{ fontSize: 18, fontWeight: 700 }}>₹{finalTotal}</p>
        </div>
        <Link
          href="/checkout"
          onClick={handleCheckout}
          className="btn-primary"
          id="sticky-checkout-btn"
          style={{ justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
        >
          {!user && <Lock size={13} />}
          Checkout
        </Link>
      </div>
      <Footer />
    </div>
  );
}
