"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Truck, CheckCircle, AlertCircle, ShoppingBag, Lock, Upload, Copy, ImageIcon, MapPin } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import styles from "./page.module.css";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [shippingSettings, setShippingSettings] = useState({ freeShippingThreshold: 999, rates: {} });
  const [shippingLoading, setShippingLoading] = useState(true);

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "settings", "shipping"));
        if (snap.exists()) {
          setShippingSettings({ freeShippingThreshold: 999, rates: {}, ...snap.data() });
        }
      } catch (err) {
        console.error("Failed to load shipping settings", err);
      }
      setShippingLoading(false);
    };
    fetchShipping();
  }, []);

  // 🔒 Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  useEffect(() => {
    if (userProfile?.addresses && userProfile.addresses.length > 0) {
      setSelectedAddressIndex(0);
    } else {
      setSelectedAddressIndex(-1);
    }
  }, [userProfile]);

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

  const isNewAddress = selectedAddressIndex === -1 || !userProfile?.addresses?.length;
  const activeState = isNewAddress ? form.state : userProfile.addresses[selectedAddressIndex]?.state || "Tamil Nadu";
  
  const getShippingCost = () => {
    if (cartTotal >= shippingSettings.freeShippingThreshold) return 0;
    if (shippingSettings.rates[activeState] !== undefined && shippingSettings.rates[activeState] !== "") {
      return Number(shippingSettings.rates[activeState]);
    }
    return 99; // Default fallback
  };

  const shipping = getShippingCost();
  const total = cartTotal + shipping;

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    const activeAddress = isNewAddress ? form : userProfile.addresses[selectedAddressIndex];

    if (isNewAddress) {
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
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      shippingAddress: activeAddress,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Create Razorpay order on server
      const res = await fetch("/api/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, receipt: orderId })
      });
      const data = await res.json();
      
      if (!data.id) {
        throw new Error(data.error || "Failed to create Razorpay order");
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use the NEXT_PUBLIC variable
        amount: data.amount,
        currency: data.currency,
        name: "Ani Finds",
        description: `Order ${orderId}`,
        order_id: data.id,
        handler: async function (response) {
          try {
            orderData.razorpay_payment_id = response.razorpay_payment_id;
            orderData.razorpay_order_id = response.razorpay_order_id;
            orderData.razorpay_signature = response.razorpay_signature;
            
            // 3. Save to Firebase on successful payment
            const { addDoc, collection, doc, updateDoc, arrayUnion } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const ref = await addDoc(collection(db, "orders"), orderData);

            // Save new address if applicable
            if (isNewAddress && user) {
              try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                  addresses: arrayUnion(form)
                });
              } catch (e) {
                console.error("Failed to save address", e);
              }
            }

            clearCart();
            router.push(`/order-success?id=${ref.id}`);
          } catch (err) {
            // fallback
            try {
              const existingOrders = JSON.parse(localStorage.getItem("ani-finds-orders") || "[]");
              existingOrders.unshift(orderData);
              localStorage.setItem("ani-finds-orders", JSON.stringify(existingOrders));
            } catch (_) {}
            clearCart();
            router.push(`/order-success?id=${orderId}`);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#e8527f" // matches var(--pink)
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        console.error(response.error);
        setError("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp1.open();

    } catch (err) {
      console.error(err);
      setError("Failed to initiate checkout. Please check your connection.");
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
              
              {userProfile?.addresses?.length > 0 && (
                <div className={styles.savedAddresses}>
                  {userProfile.addresses.map((addr, idx) => (
                    <div 
                      key={idx}
                      className={`${styles.addressCard} ${selectedAddressIndex === idx ? styles.addressCardActive : ""}`}
                      onClick={() => setSelectedAddressIndex(idx)}
                    >
                      <div className={styles.addressCardRadio}>
                        <div className={styles.radioOuter}>
                          {selectedAddressIndex === idx && <div className={styles.radioInner} />}
                        </div>
                      </div>
                      <div className={styles.addressCardContent}>
                        <strong>{addr.name}</strong>
                        <p>{addr.address}, {addr.city}</p>
                        <p>{addr.state} - {addr.pincode}</p>
                        <p style={{ marginTop: 2 }}>Phone: {addr.phone}</p>
                      </div>
                    </div>
                  ))}

                  <div 
                    className={`${styles.addressCard} ${selectedAddressIndex === -1 ? styles.addressCardActive : ""}`}
                    onClick={() => setSelectedAddressIndex(-1)}
                  >
                    <div className={styles.addressCardRadio}>
                      <div className={styles.radioOuter}>
                        {selectedAddressIndex === -1 && <div className={styles.radioInner} />}
                      </div>
                    </div>
                    <div className={styles.addressCardContent} style={{ justifyContent: "center" }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={16}/> Add New Address
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {(selectedAddressIndex === -1 || !userProfile?.addresses?.length) && (
                <div className={styles.formGrid} style={{ marginTop: userProfile?.addresses?.length ? 16 : 0 }}>
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
              )}
            </div>

            {/* Payment Options Hidden - Handled strictly by Razorpay */}
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
