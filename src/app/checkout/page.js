"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Truck, CheckCircle, AlertCircle, ShoppingBag, Lock, Upload, Copy, ImageIcon } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", emoji: "💵", desc: "Pay when your order arrives" },
  { id: "upi", label: "UPI / Google Pay", emoji: "📱", desc: "Instant payment via UPI" },
  { id: "razorpay", label: "Card / Netbanking", emoji: "💳", desc: "All cards accepted" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const fileRef = useRef(null);

  // Load payment info from Firestore (set via Admin → Settings)
  const DEFAULT_PAYMENT_INFO = { upi: "", name: "Ani Finds", bank: "", account: "", ifsc: "", whatsapp: "" };
  const [paymentInfo, setPaymentInfo] = useState(DEFAULT_PAYMENT_INFO);
  const [enabledMethods, setEnabledMethods] = useState({ cod: true, upi: true, card: true });

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "settings", "payment"));
        if (snap.exists()) {
          const data = snap.data();
          setPaymentInfo({ ...DEFAULT_PAYMENT_INFO, ...data });
          if (data.methods) {
            setEnabledMethods(data.methods);
            // Auto-select first enabled method
            const first = ["cod","upi","card"].find(k => data.methods[k]);
            if (first) setPaymentMethod(first);
          }
        }
      } catch (_) { /* use defaults */ }
    };
    loadPaymentInfo();
  }, []);

  // 🔒 Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.displayName || "",
    phone: "",
    email: user?.email || "",
    address: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "Tamil Nadu",
  });

  const shipping = cartTotal >= 999 ? 0 : 99;
  const total = cartTotal + shipping;

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    // Validate required fields
    const validations = [
      { field: "name", msg: "Please enter your full name" },
      { field: "phone", msg: "Please enter your phone number" },
      { field: "address", msg: "Please enter your delivery address" },
      { field: "pincode", msg: "Please enter your pincode" },
      { field: "city", msg: "Please enter your city" },
    ];
    for (const v of validations) {
      if (!form[v.field]?.trim()) {
        setError(v.msg);
        document.getElementById(`checkout-${v.field}`)?.focus();
        return;
      }
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (cart.length === 0) {
      setError("Your cart is empty. Please add items before ordering.");
      return;
    }

    setLoading(true);
    setError("");

    const orderId = "ANI" + Date.now();
    const orderData = {
      orderId,
      userId: user?.uid || "guest",
      userEmail: user?.email || "",
      products: cart.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.offerPrice || i.price,
        offerPrice: i.offerPrice || i.price,
        quantity: i.quantity,
        variant: i.variant || null,
        emoji: i.emoji || "💍",
      })),
      total,
      paymentMethod,
      // COD = pending payment, manual UPI/card = awaiting admin verification
      paymentStatus: paymentMethod === "cod" ? "cod_pending" : "pending_verification",
      orderStatus: paymentMethod === "cod" ? "confirmed" : "awaiting_payment",
      paymentScreenshot: screenshot?.dataUrl || null,
      paymentScreenshotName: screenshot?.name || null,
      shippingAddress: form,
      createdAt: new Date().toISOString(),
    };

    try {
      // Try saving to Firebase Firestore
      const { addDoc, collection } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const ref = await addDoc(collection(db, "orders"), orderData);
      clearCart();
      router.push(`/order-success?id=${ref.id}`);
    } catch (err) {
      // Firebase not configured or offline — save to localStorage and still proceed
      try {
        const existingOrders = JSON.parse(localStorage.getItem("ani-finds-orders") || "[]");
        existingOrders.unshift(orderData);
        localStorage.setItem("ani-finds-orders", JSON.stringify(existingOrders));
      } catch (_) {}
      clearCart();
      router.push(`/order-success?id=${orderId}`);
    } finally {
      setLoading(false);
    }
  };


  // ⏳ Show spinner while checking auth
  if (authLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
          <div className={styles.authSpinner} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Checking login...</p>
        </div>
      </div>
    );
  }

  // 🔒 Not logged in — show login prompt (redirect also happening via useEffect)
  if (!user) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, padding: "40px 20px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "var(--pink-pale)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Lock size={32} color="var(--pink)" />
          </div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 24 }}>Login Required</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 300 }}>
            Please sign in to place your order. Your cart items are saved!
          </p>
          <Link href="/login?redirect=/checkout" className="btn-primary" id="checkout-login-btn">
            Sign In to Continue
          </Link>
          <Link href="/products" style={{ fontSize: 13, color: "var(--text-muted)" }}>← Continue Shopping</Link>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0 && !loading) {
    return (
      <div className="page-wrapper">
        <div className="announcement-bar">🔒 Secure Checkout — Your data is safe</div>
        <Navbar />
        <div className="container" style={{ padding: "60px 16px", textAlign: "center" }}>
          <ShoppingBag size={56} color="#ddd" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "Playfair Display, serif", marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Add some items before checking out</p>
          <Link href="/products" className="btn-primary" id="checkout-empty-shop-btn">Shop Now</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🔒 Secure Checkout — Your data is safe with us</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="section-title" style={{ marginBottom: 8 }}>Checkout</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 28 }}>{cart.length} item{cart.length !== 1 ? "s" : ""} in your cart</p>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.layout}>
          {/* Left: Form */}
          <div>
            {/* Shipping */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Truck size={18} strokeWidth={1.5} />
                <h3>Shipping Address</h3>
              </div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-name">Full Name *</label>
                  <input id="checkout-name" name="name" type="text" placeholder="Your full name" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-phone">Phone Number *</label>
                  <input id="checkout-phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
                </div>
                <div className={`form-group ${styles.fullWidth}`}>
                  <label className="form-label" htmlFor="checkout-email">Email (optional)</label>
                  <input id="checkout-email" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
                </div>
                <div className={`form-group ${styles.fullWidth}`}>
                  <label className="form-label" htmlFor="checkout-address">Full Address *</label>
                  <input id="checkout-address" name="address" type="text" placeholder="House no, Street, Area, Colony" value={form.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-landmark">Landmark</label>
                  <input id="checkout-landmark" name="landmark" type="text" placeholder="Near temple, school..." value={form.landmark} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-pincode">Pincode *</label>
                  <input id="checkout-pincode" name="pincode" type="number" placeholder="6-digit pincode" value={form.pincode} onChange={handleChange} maxLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-city">City *</label>
                  <input id="checkout-city" name="city" type="text" placeholder="Your city" value={form.city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="checkout-state">State *</label>
                  <select id="checkout-state" name="state" value={form.state} onChange={handleChange}>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={styles.card} style={{ marginTop: 16 }}>
              <div className={styles.cardHeader}>
                <CreditCard size={18} strokeWidth={1.5} />
                <h3>Payment Method</h3>
              </div>
              <div className={styles.paymentOptions}>
                {PAYMENT_METHODS.filter(m => enabledMethods[m.id] !== false).length === 0 ? (
                  <p style={{color:"#e8527f",fontSize:13,padding:12}}>⚠️ No payment methods are currently enabled. Please contact the store.</p>
                ) : PAYMENT_METHODS.filter(m => enabledMethods[m.id] !== false).map((m) => (
                  <label
                    key={m.id}
                    className={`${styles.paymentOption} ${paymentMethod === m.id ? styles.paymentActive : ""}`}
                    htmlFor={`pay-${m.id}`}
                  >
                    <input type="radio" id={`pay-${m.id}`} name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} hidden />
                    <span className={styles.payEmoji}>{m.emoji}</span>
                    <div className={styles.payInfo}>
                      <span className={styles.payLabel}>{m.label}</span>
                      <span className={styles.payDesc}>{m.desc}</span>
                    </div>
                    {paymentMethod === m.id && <CheckCircle size={18} className={styles.payCheck} />}
                  </label>
                ))}
              </div>
              {/* Manual Payment Details */}
              {paymentMethod !== "cod" && (
                <div className={styles.manualPayBox}>
                  <div className={styles.manualPayHeader}>
                    <span>📋 Manual Payment Instructions</span>
                    <span className={styles.manualBadge}>Verify after payment</span>
                  </div>

                  {/* UPI Details */}
                  {paymentMethod === "upi" && (
                    <div className={styles.payDetails}>
                      <p className={styles.payDetailLabel}>Pay to UPI ID:</p>
                      <div className={styles.copyRow}>
                        <span className={styles.payDetailVal}>{paymentInfo.upi || "(UPI ID not set — contact admin)"}</span>
                        {paymentInfo.upi && (
                          <button type="button" className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(paymentInfo.upi)} title="Copy UPI ID">
                            <Copy size={13} /> Copy
                          </button>
                        )}
                      </div>
                      <p className={styles.payDetailSub}>Account Name: <strong>{paymentInfo.name || "Ani Finds"}</strong></p>
                    </div>
                  )}

                  {/* Bank Transfer Details */}
                  {paymentMethod === "razorpay" && (
                    <div className={styles.payDetails}>
                      <p className={styles.payDetailLabel}>Bank Transfer Details:</p>
                      {paymentInfo.account ? (
                        <div className={styles.bankGrid}>
                          <span>Bank</span><strong>{paymentInfo.bank}</strong>
                          <span>Account No.</span>
                          <div className={styles.copyRow}>
                            <strong>{paymentInfo.account}</strong>
                            <button type="button" className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(paymentInfo.account)}><Copy size={12}/></button>
                          </div>
                          <span>IFSC</span>
                          <div className={styles.copyRow}>
                            <strong>{paymentInfo.ifsc}</strong>
                            <button type="button" className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(paymentInfo.ifsc)}><Copy size={12}/></button>
                          </div>
                          <span>Name</span><strong>{paymentInfo.name}</strong>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "#999" }}>Bank details not configured. Contact the store via WhatsApp.</p>
                      )}
                    </div>
                  )}

                  {/* Screenshot Upload */}
                  <div className={styles.uploadSection}>
                    <p className={styles.uploadLabel}>Upload Payment Screenshot <span style={{color:"var(--pink)"}}>*</span></p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setScreenshot({ name: file.name, dataUrl: ev.target.result });
                        reader.readAsDataURL(file);
                      }}
                    />
                    {screenshot ? (
                      <div className={styles.uploadPreview}>
                        <ImageIcon size={16} color="var(--pink)" />
                        <span>{screenshot.name}</span>
                        <button type="button" className={styles.uploadChangeBtn} onClick={() => { setScreenshot(null); fileRef.current.value=""; }}>Remove</button>
                      </div>
                    ) : (
                      <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current.click()}>
                        <Upload size={15} /> Choose Screenshot
                      </button>
                    )}
                  </div>

                  <p className={styles.manualNote}>
                    ⚡ Your order will be confirmed after our team verifies the payment (usually within 30 mins).
                    {paymentInfo.whatsapp && (
                      <> Need help? <a href={`https://wa.me/${paymentInfo.whatsapp}`} target="_blank" rel="noreferrer" style={{color:"var(--pink)",fontWeight:600}}>WhatsApp us</a></>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className={styles.card} style={{ position: "sticky", top: 90 }}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              <div className={styles.itemList}>
                {cart.map((item) => (
                  <div key={item.key} className={styles.orderItem}>
                    <div className={styles.orderItemImg}>
                      <span>{item.emoji || "💍"}</span>
                    </div>
                    <div className={styles.orderItemInfo}>
                      <p className={styles.orderItemTitle}>{item.title}</p>
                      {item.variant && <p className={styles.orderItemVariant}>{item.variant.color} {item.variant.size}</p>}
                      <p className={styles.orderItemQty}>Qty: {item.quantity}</p>
                    </div>
                    <span className={styles.orderItemPrice}>₹{(item.offerPrice || item.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className={styles.orderTotals}>
                <div className={styles.orderRow}>
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className={styles.orderRow}>
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#4caf50" : "inherit", fontWeight: shipping === 0 ? 600 : 400 }}>
                    {shipping === 0 ? "FREE 🎉" : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className={styles.shippingNote}>Add ₹{999 - cartTotal} more for free shipping</p>
                )}
                <div className={styles.grandTotalRow}>
                  <span>Total Amount</span>
                  <span className={styles.grandTotalVal}>₹{total}</span>
                </div>
              </div>

              <button
                className={styles.placeOrderBtn}
                onClick={handlePlaceOrder}
                disabled={loading}
                id="place-order-btn"
              >
                {loading ? (
                  <span className={styles.loadingSpinner}>Placing your order...</span>
                ) : (
                  <>Place Order — ₹{total}</>
                )}
              </button>
              <p className={styles.secureNote}>🔒 100% Secure & Encrypted Checkout</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
