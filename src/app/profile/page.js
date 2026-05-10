"use client";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Package, Heart, MapPin, LogOut, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./page.module.css";

const TABS = [
  { id: "orders",    label: "My Orders",  icon: <Package size={16} /> },
  { id: "wishlist",  label: "Wishlist",   icon: <Heart size={16} /> },
  { id: "addresses", label: "Addresses",  icon: <MapPin size={16} /> },
  { id: "profile",   label: "Profile",    icon: <User size={16} /> },
];

const STATUS_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];
const STATUS_COLORS = {
  pending:   { color: "#f59e0b", bg: "#fffbeb", label: "Pending" },
  confirmed: { color: "#3b82f6", bg: "#eff6ff", label: "Confirmed" },
  packed:    { color: "#8b5cf6", bg: "#f5f3ff", label: "Packed" },
  shipped:   { color: "#06b6d4", bg: "#ecfeff", label: "Shipped" },
  delivered: { color: "#10b981", bg: "#f0fdf4", label: "Delivered ✓" },
  cancelled: { color: "#ef4444", bg: "#fef2f2", label: "Cancelled" },
};

function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const status = order.orderStatus || "pending";
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const stepIdx = STATUS_STEPS.indexOf(status);

  return (
    <div style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
      {/* Header */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{order.orderId || order.firestoreId?.slice(0, 10)}</p>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {order.products?.length || 0} items · ₹{order.total}
            {order.createdAt ? " · " + new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: cfg.bg, color: cfg.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {cfg.label}
          </span>
          {open ? <ChevronUp size={16} color="#888"/> : <ChevronDown size={16} color="#888"/>}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid #f0e6ec", padding: "16px 18px" }}>

          {/* Progress bar (skip for cancelled) */}
          {status !== "cancelled" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", margin: "0 auto 4px",
                      background: i <= stepIdx ? "#e8527f" : "#f0e6ec",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: i <= stepIdx ? "white" : "#bbb",
                    }}>
                      {i < stepIdx ? "✓" : i === stepIdx ? "●" : i + 1}
                    </div>
                    <p style={{ fontSize: 9, color: i <= stepIdx ? "#e8527f" : "#bbb", fontWeight: i === stepIdx ? 700 : 500, textTransform: "capitalize" }}>{s}</p>
                  </div>
                ))}
              </div>
              {/* Connecting line */}
              <div style={{ height: 3, background: "#f0e6ec", borderRadius: 4, marginTop: 2, position: "relative" }}>
                <div style={{ height: "100%", width: `${Math.max(0, (stepIdx / (STATUS_STEPS.length - 1)) * 100)}%`, background: "linear-gradient(90deg, #e8527f, #f9a8c9)", borderRadius: 4, transition: "width 0.5s ease" }}/>
              </div>
            </div>
          )}

          {/* Products */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>Items</p>
            {order.products?.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #fdf0f5", fontSize: 14 }}>
                <span>{p.emoji || "💍"} {p.title} <span style={{ color: "#aaa" }}>×{p.quantity}</span></span>
                <span style={{ fontWeight: 700 }}>₹{(p.offerPrice || p.price) * p.quantity}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontWeight: 800, fontSize: 15 }}>
              <span>Total</span><span style={{ color: "#e8527f" }}>₹{order.total}</span>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div style={{ background: "#fdf8fa", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>📍 Delivery Address</p>
              <p style={{ color: "#555" }}>{order.shippingAddress.name} · {order.shippingAddress.phone}</p>
              <p style={{ color: "#555" }}>{order.shippingAddress.address}, {order.shippingAddress.city} — {order.shippingAddress.pincode}</p>
            </div>
          )}

          {/* Payment method */}
          <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
            Payment: <strong style={{ textTransform: "capitalize" }}>{order.paymentMethod?.replace("_", " ") || "—"}</strong>
            {" · "}
            <span style={{ color: order.paymentStatus === "verified" ? "#10b981" : "#f59e0b", fontWeight: 700, textTransform: "capitalize" }}>
              {order.paymentStatus?.replace("_", " ") || "pending"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileContent() {
  const { user, userProfile, logout } = useAuth();
  const { wishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "orders";

  // My Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Wishlist from Firestore products (real)
  const [wishlistProducts, setWishlistProducts] = useState([]);

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });
  const [addressSaving, setAddressSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || "");
      setProfilePhone(userProfile.phone || "");
      setAddresses(userProfile.addresses || []);
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === "orders" && user) loadOrders();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "wishlist" && wishlist.length > 0) loadWishlistProducts();
  }, [activeTab, wishlist]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      // Simple single-field query — no composite index needed
      const snap = await getDocs(
        query(collection(db, "orders"), where("userEmail", "==", user.email))
      );
      const fetched = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      // Sort client-side newest first
      fetched.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setOrders(fetched);
    } catch (e) {
      console.error("loadOrders error:", e);
    }
    setOrdersLoading(false);
  };

  const loadWishlistProducts = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDocs(collection(db, "products"));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWishlistProducts(all.filter(p => wishlist.includes(p.id)));
    } catch {}
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "users", user.uid), {
        name: profileName,
        phone: profilePhone
      });
      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update profile");
    }
    setProfileSaving(false);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!user) return;
    setAddressSaving(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const updatedAddresses = [...addresses, { ...newAddress, id: Date.now().toString() }];
      await updateDoc(doc(db, "users", user.uid), {
        addresses: updatedAddresses
      });
      setAddresses(updatedAddresses);
      setNewAddress({ name: "", phone: "", address: "", city: "", pincode: "" });
      setShowAddressForm(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save address");
    }
    setAddressSaving(false);
  };

  const deleteAddress = async (id) => {
    if (!user) return;
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const updatedAddresses = addresses.filter(a => a.id !== id);
      await updateDoc(doc(db, "users", user.uid), {
        addresses: updatedAddresses
      });
      setAddresses(updatedAddresses);
    } catch (e) {
      console.error(e);
      alert("Failed to delete address");
    }
  };

  if (!user) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className={styles.requireLogin}>
          <span style={{ fontSize: 64 }}>🌸</span>
          <h2>Please Login</h2>
          <p>Sign in to view your profile and orders</p>
          <Link href="/login" className="btn-primary" id="profile-login-btn">Login / Register</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🌸 Welcome back, {userProfile?.name || user.email?.split("@")[0]}!</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarLarge}>{(userProfile?.name || user.email || "U")[0].toUpperCase()}</div>
          <div>
            <h1 className={styles.profileName}>{userProfile?.name || "My Account"}</h1>
            <p className={styles.profileEmail}>{user.email || user.phoneNumber}</p>
            {userProfile?.role === "admin" && <span className="badge badge-purple" style={{ marginTop: 4 }}>Admin</span>}
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(); router.push("/"); }} id="profile-logout-btn">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <Link key={t.id} href={`/profile?tab=${t.id}`} className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ""}`} id={`profile-tab-${t.id}`}>
              {t.icon} {t.label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* ── My Orders ── */}
          {activeTab === "orders" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>Your Orders ({orders.length})</p>
                <button onClick={loadOrders} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #f0e6ec", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#888" }}>
                  <RefreshCw size={13}/> Refresh
                </button>
              </div>
              {ordersLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #f0e6ec", borderTopColor: "#e8527f", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <span style={{ fontSize: 60 }}>📦</span>
                  <h3>No orders yet</h3>
                  <p>Your orders will appear here after you shop</p>
                  <Link href="/products" className="btn-primary" id="orders-shop-btn">Start Shopping</Link>
                </div>
              ) : (
                orders.map(o => <OrderCard key={o.firestoreId} order={o}/>)
              )}
            </div>
          )}

          {/* ── Wishlist ── */}
          {activeTab === "wishlist" && (
            wishlistProducts.length > 0 ? (
              <div className="product-grid">{wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : (
              <div className={styles.emptyState}>
                <span style={{ fontSize: 60 }}>❤️</span>
                <h3>Your wishlist is empty</h3>
                <p>Heart products to save them here</p>
                <Link href="/products" className="btn-primary" id="wishlist-shop-btn">Explore Products</Link>
              </div>
            )
          )}

          {/* ── Addresses ── */}
          {activeTab === "addresses" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontWeight: 700, fontSize: 16 }}>Saved Addresses</p>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn-primary" style={{ padding: "6px 12px", fontSize: 13 }}>
                  + Add New
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={saveAddress} className="card" style={{ padding: 20, marginBottom: 20 }}>
                  <h4 style={{ marginBottom: 14 }}>Add New Address</h4>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input required value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} placeholder="Recipient Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} placeholder="Phone Number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Address</label>
                    <textarea required value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} placeholder="House No, Street, Landmark" rows="3" style={{ width: "100%", padding: "10px 14px", border: "1px solid #f0e6ec", borderRadius: 8 }}></textarea>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">City</label>
                      <input required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} placeholder="City" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Pincode</label>
                      <input required value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} placeholder="Pincode" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button type="button" onClick={() => setShowAddressForm(false)} style={{ flex: 1, padding: "10px", background: "none", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                    <button type="submit" disabled={addressSaving} className="btn-primary" style={{ flex: 1 }}>{addressSaving ? "Saving..." : "Save Address"}</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <div className={styles.emptyState}>
                  <span style={{ fontSize: 60 }}>📍</span>
                  <h3>No saved addresses</h3>
                  <p>Your delivery addresses will be saved here</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {addresses.map(addr => (
                    <div key={addr.id} style={{ background: "white", border: "1px solid #f0e6ec", borderRadius: 12, padding: "16px", position: "relative" }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{addr.name}</p>
                      <p style={{ color: "#555", fontSize: 14, marginBottom: 2 }}>{addr.phone}</p>
                      <p style={{ color: "#555", fontSize: 14 }}>{addr.address}, {addr.city} — {addr.pincode}</p>
                      <button onClick={() => deleteAddress(addr.id)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <div className="card" style={{ padding: 24, maxWidth: 480 }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 20 }}>Account Details</h3>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name" id="profile-name-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input defaultValue={user.email || ""} disabled style={{ background: "var(--light-pink)" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 XXXXX XXXXX" id="profile-phone-input" />
              </div>
              <button onClick={saveProfile} disabled={profileSaving} className="btn-primary" id="save-profile-btn">
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {userProfile?.role === "admin" && (
        <div className="container" style={{ marginTop: 20, marginBottom: 20 }}>
          <Link href="/admin" className="btn-gold" id="admin-panel-btn" style={{ display: "inline-flex" }}>Go to Admin Panel →</Link>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#e8527f", fontWeight: 600 }}>🌸 Loading...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
