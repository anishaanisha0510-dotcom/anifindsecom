"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart2, Package, ShoppingBag, Users, Tag, TrendingUp,
  Plus, Edit2, Trash2, Lock, CreditCard, CheckCircle, XCircle,
  Clock, Eye, RefreshCw, AlertTriangle, X, Settings, Save, Phone, Landmark, QrCode, Layers, Image, PlayCircle, Link2,
} from "lucide-react";
import styles from "./page.module.css";
import CategoryManager from "./CategoryManager";
import ProductManager from "./ProductManager";
import HeroBannerManager from "./HeroBannerManager";

const ORDER_STATUSES = ["All", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  Pending: "#f59e0b", Confirmed: "#3b82f6", Packed: "#8b5cf6",
  Shipped: "#06b6d4", Delivered: "#10b981", Cancelled: "#ef4444",
};
const PAY_STATUS_CONFIG = {
  pending_verification: { label: "Needs Verification", color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={13} /> },
  verified:             { label: "Verified ✓",         color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={13} /> },
  rejected:             { label: "Rejected",            color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={13} /> },
  cod_pending:          { label: "COD",                 color: "#6b7280", bg: "#f9fafb", icon: <Package size={13} /> },
  paid:                 { label: "Paid",                color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={13} /> },
  payment_link_sent:    { label: "Link Sent",           color: "#3b82f6", bg: "#eff6ff", icon: <Link2 size={13} /> },
};

export default function AdminPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [nav, setNav] = useState("dashboard");
  const [orderFilter, setOrderFilter] = useState("All");

  // Dashboard stats
  const [stats, setStats] = useState({ sales: 0, orders: 0, products: 0, customers: 0, loading: true });

  // Orders tab
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Coupons tab
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // Customers tab
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Payments tab state
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payFilter, setPayFilter] = useState("pending_verification");
  const [viewScreenshot, setViewScreenshot] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Settings tab state
  const DEFAULT_PAYMENT_INFO = {
    upi: "", name: "Ani Finds", bank: "", account: "", ifsc: "", whatsapp: "",
    methods: { cod: true, upi: true, razorpay: false },
  };
  const [settings, setSettings] = useState(DEFAULT_PAYMENT_INFO);
  const handleMethodToggle = (method) => setSettings(prev => ({
    ...prev,
    methods: { ...prev.methods, [method]: !prev.methods?.[method] },
  }));
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.replace("/login?redirect=/admin");
      else if (userProfile && userProfile.role !== "admin") router.replace("/");
    }
  }, [user, userProfile, authLoading, router]);

  /* ── Load payments from Firestore ── */
  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
      setPayments(docs);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setPayments([]);
    }
    setPaymentsLoading(false);
  }, []);

  useEffect(() => {
    if (nav === "payments") loadPayments();
    if (nav === "settings") loadSettings();
    if (nav === "orders") loadOrders();
    if (nav === "coupons") loadCoupons();
    if (nav === "customers") loadCustomers();
  }, [nav, loadPayments]);

  // Load dashboard stats from Firestore
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { collection, getDocs, query } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const [ordSnap, prodSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "products")),
        ]);
        const orders = ordSnap.docs.map(d => d.data());
        const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const uniqueEmails = new Set(orders.map(o => o.userEmail).filter(Boolean));
        setStats({ sales: totalSales, orders: orders.length, products: prodSnap.size, customers: uniqueEmails.size, loading: false });
      } catch { setStats(s => ({ ...s, loading: false })); }
    };
    loadStats();
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      setAllOrders(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setOrdersLoading(false);
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDocs(collection(db, "coupons"));
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setCouponsLoading(false);
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      const orders = snap.docs.map(d => d.data());
      const map = {};
      orders.forEach(o => {
        const email = o.userEmail;
        if (!email) return;
        if (!map[email]) map[email] = { email, name: o.shippingAddress?.name || "—", phone: o.shippingAddress?.phone || "—", orders: 0, total: 0 };
        map[email].orders++;
        map[email].total += Number(o.total) || 0;
      });
      setCustomers(Object.values(map));
    } catch (e) { console.error(e); }
    setCustomersLoading(false);
  };

  /* ── Update order status from Orders tab ── */
  const updateOrderStatus = async (firestoreId, newStatus) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "orders", firestoreId), { orderStatus: newStatus });
      // Update local state instantly without full reload
      setAllOrders(prev => prev.map(o => o.firestoreId === firestoreId ? { ...o, orderStatus: newStatus } : o));
    } catch (e) { alert("Failed to update status: " + e.message); }
  };

  /* ── Load payment settings from Firestore ── */
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const snap = await getDoc(doc(db, "settings", "payment"));
      if (snap.exists()) setSettings({ ...DEFAULT_PAYMENT_INFO, ...snap.data() });
    } catch (err) { console.error("Settings load failed:", err); }
    setSettingsLoading(false);
  };

  /* ── Save payment settings to Firestore ── */
  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(doc(db, "settings", "payment"), { ...settings, updatedAt: new Date().toISOString() });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) { alert("Save failed: " + err.message); }
    setSettingsSaving(false);
  };

  const handleSettingsChange = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  /* ── Approve / Reject payment ── */
  const updatePaymentStatus = async (firestoreId, newPayStatus, newOrderStatus) => {
    setActionLoading(firestoreId);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "orders", firestoreId), {
        paymentStatus: newPayStatus,
        orderStatus: newOrderStatus,
        verifiedAt: new Date().toISOString(),
        verifiedBy: user?.email || "admin",
      });
      // Refresh list
      setPayments((prev) =>
        prev.map((p) =>
          p.firestoreId === firestoreId
            ? { ...p, paymentStatus: newPayStatus, orderStatus: newOrderStatus }
            : p
        )
      );
    } catch (err) {
      alert("Failed to update: " + err.message);
    }
    setActionLoading(null);
  };

  /* ── Filtered payments ── */
  const filteredPayments =
    payFilter === "all"
      ? payments
      : payments.filter((p) => p.paymentStatus === payFilter);

  const pendingCount = payments.filter((p) => p.paymentStatus === "pending_verification").length;

  /* ── Loading & guard screens ── */
  if (authLoading || !userProfile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #ebebeb", borderTopColor: "#e8527f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#999", fontSize: 14 }}>Checking admin access...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }
  if (userProfile.role !== "admin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, textAlign: "center", padding: 24 }}>
        <div style={{ width: 72, height: 72, background: "#fff0f4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Lock size={32} color="#e8527f" />
        </div>
        <h2 style={{ fontFamily: "Playfair Display, serif" }}>Access Denied</h2>
        <p style={{ color: "#999", maxWidth: 300 }}>You don't have admin access.</p>
        <Link href="/" style={{ background: "#1a1a1a", color: "white", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>Go Back Home</Link>
      </div>
    );
  }



  return (
    <div className={styles.adminLayout}>
      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div className={styles.modal} onClick={() => setViewScreenshot(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Payment Screenshot — {viewScreenshot.orderId}</span>
              <button onClick={() => setViewScreenshot(null)} className={styles.modalClose}><X size={18} /></button>
            </div>
            <img src={viewScreenshot.url} alt="Payment proof" className={styles.modalImg} />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🌸 Admin Panel</div>
        {[
          { id: "dashboard",  label: "Dashboard",   icon: <BarChart2 size={18} /> },
          { id: "payments",   label: "Payments",     icon: <CreditCard size={18} />, badge: pendingCount || null },
          { id: "categories", label: "Categories",   icon: <Layers size={18} /> },
          { id: "products",   label: "Products",     icon: <Package size={18} /> },
          { id: "orders",     label: "Orders",       icon: <ShoppingBag size={18} /> },
          { id: "customers",  label: "Customers",    icon: <Users size={18} /> },
          { id: "coupons",    label: "Coupons",      icon: <Tag size={18} /> },
          { id: "hero",       label: "Hero Banner",  icon: <Image size={18} /> },
          { id: "settings",   label: "Settings",     icon: <Settings size={18} /> },
        ].map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${nav === item.id ? styles.navActive : ""}`}
            onClick={() => setNav(item.id)}
            id={`admin-nav-${item.id}`}
          >
            {item.icon} {item.label}
            {item.badge > 0 && <span className={styles.navBadge}>{item.badge}</span>}
          </button>
        ))}
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink} id="admin-back-home">← Back to Store</Link>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>

        {/* ── Dashboard ── */}
        {nav === "dashboard" && (
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <div className={styles.statsGrid}>
              {[
                { label: "Total Sales", value: stats.loading ? "—" : `₹${stats.sales.toLocaleString("en-IN")}`, icon: <TrendingUp size={20}/>, color: "#F7A8C4" },
                { label: "Total Orders", value: stats.loading ? "—" : stats.orders, icon: <ShoppingBag size={20}/>, color: "#C8A2FF" },
                { label: "Products", value: stats.loading ? "—" : stats.products, icon: <Package size={20}/>, color: "#D4A017" },
                { label: "Customers", value: stats.loading ? "—" : stats.customers, icon: <Users size={20}/>, color: "#4caf50" },
              ].map((s) => (
                <div key={s.label} className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: s.color + "25", color: s.color }}>{s.icon}</div>
                  <div>
                    <p className={styles.statLabel}>{s.label}</p>
                    <p className={styles.statValue}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.quickSection}>
              <div className="card" style={{ padding: 20 }}>
                <h3 className={styles.cardTitle}>Recent Orders</h3>
                {payments.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>No orders yet.</p>
                ) : payments.slice(0, 4).map((o) => (
                  <div key={o.firestoreId} className={styles.recentOrder}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{o.orderId || o.firestoreId?.slice(0,8)}</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{o.shippingAddress?.name || "—"} • {o.products?.length || 0} items</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 700 }}>₹{o.total}</p>
                      <span className={styles.statusPill} style={{ background: (STATUS_COLORS[o.orderStatus] || "#aaa") + "20", color: STATUS_COLORS[o.orderStatus] || "#aaa" }}>{o.orderStatus || "pending"}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 className={styles.cardTitle}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn-primary" onClick={() => setNav("payments")} id="admin-quick-payments" style={{ justifyContent: "center" }}>
                    <CreditCard size={15} /> Verify Payments {pendingCount > 0 && `(${pendingCount})`}
                  </button>
                  <button className="btn-outline" onClick={() => { setNav("orders"); loadOrders(); }} id="admin-quick-orders" style={{ justifyContent: "center" }}>View All Orders</button>
                  <button className="btn-outline" onClick={() => setNav("products")} id="admin-quick-products" style={{ justifyContent: "center" }}>Manage Products</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payments Verification ── */}
        {nav === "payments" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Payment Verification</h1>
              <button className={styles.refreshBtn} onClick={loadPayments} id="payments-refresh-btn">
                <RefreshCw size={15} className={paymentsLoading ? styles.spinning : ""} /> Refresh
              </button>
            </div>

            {/* Filter tabs */}
            <div className={styles.filterChips} style={{ marginBottom: 20 }}>
              {[
                { key: "pending_verification", label: "Needs Verification" },
                { key: "verified",             label: "Verified" },
                { key: "rejected",             label: "Rejected" },
                { key: "cod_pending",          label: "COD Orders" },
                { key: "all",                  label: "All" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`chip ${payFilter === key ? "active" : ""}`}
                  onClick={() => setPayFilter(key)}
                  id={`pay-filter-${key}`}
                >
                  {label}
                  {key === "pending_verification" && pendingCount > 0 && (
                    <span className={styles.chipBadge}>{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {paymentsLoading ? (
              <div className={styles.paymentsLoading}>
                <div className={styles.spinner} />
                <p>Loading orders from Firestore...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className={styles.emptyAdmin}>
                <CreditCard size={48} color="var(--pink)" />
                <p>{payFilter === "pending_verification" ? "No payments waiting for verification 🎉" : "No orders in this category."}</p>
              </div>
            ) : (
              <div className={styles.paymentCards}>
                {filteredPayments.map((order) => {
                  const cfg = PAY_STATUS_CONFIG[order.paymentStatus] || PAY_STATUS_CONFIG["cod_pending"];
                  const isPending = order.paymentStatus === "pending_verification";
                  const isActioning = actionLoading === order.firestoreId;

                  return (
                    <div key={order.firestoreId} className={styles.paymentCard}>
                      {/* Header */}
                      <div className={styles.payCardHeader}>
                        <div>
                          <p className={styles.payOrderId}>{order.orderId || order.firestoreId}</p>
                          <p className={styles.payCustomer}>{order.shippingAddress?.name || "—"} · {order.shippingAddress?.phone || ""}</p>
                        </div>
                        <span className={styles.payStatusPill} style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      {/* Details */}
                      <div className={styles.payCardBody}>
                        <div className={styles.payDetail}>
                          <span>Amount</span>
                          <strong>₹{order.total}</strong>
                        </div>
                        <div className={styles.payDetail}>
                          <span>Method</span>
                          <strong style={{ textTransform: "capitalize" }}>{order.paymentMethod?.replace("_", " ")}</strong>
                        </div>
                        <div className={styles.payDetail}>
                          <span>Order Status</span>
                          <strong>{order.orderStatus}</strong>
                        </div>
                        <div className={styles.payDetail}>
                          <span>Date</span>
                          <strong>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</strong>
                        </div>
                      </div>

                      {/* Items */}
                      {order.products?.length > 0 && (
                        <div className={styles.payCardItems}>
                          {order.products.map((p, i) => (
                            <span key={i} className={styles.payItem}>{p.emoji || "💍"} {p.title} ×{p.quantity}</span>
                          ))}
                        </div>
                      )}

                      {/* Screenshot */}
                      {order.paymentScreenshot && (
                        <button
                          className={styles.viewScreenshotBtn}
                          onClick={() => setViewScreenshot({ url: order.paymentScreenshot, orderId: order.orderId || order.firestoreId })}
                          id={`view-screenshot-${order.firestoreId}`}
                        >
                          <Eye size={14} /> View Payment Screenshot
                        </button>
                      )}
                      {isPending && !order.paymentScreenshot && (
                        <div className={styles.noScreenshot}>
                          <AlertTriangle size={13} /> No screenshot uploaded by customer
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className={styles.payActions}>
                          <button
                            className={styles.approveBtn}
                            disabled={isActioning}
                            onClick={() => updatePaymentStatus(order.firestoreId, "verified", "confirmed")}
                            id={`approve-${order.firestoreId}`}
                          >
                            {isActioning ? <div className={styles.spinnerSm} /> : <CheckCircle size={15} />}
                            Approve Payment
                          </button>
                          <button
                            className={styles.rejectBtn}
                            disabled={isActioning}
                            onClick={() => updatePaymentStatus(order.firestoreId, "rejected", "cancelled")}
                            id={`reject-${order.firestoreId}`}
                          >
                            {isActioning ? <div className={styles.spinnerSm} /> : <XCircle size={15} />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Categories ── */}
        {nav === "categories" && <CategoryManager />}

        {/* ── Products ── */}
        {nav === "products" && <ProductManager />}

        {/* ── Orders ── */}
        {nav === "orders" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Orders</h1>
              <button className={styles.refreshBtn} onClick={loadOrders}><RefreshCw size={14}/> Refresh</button>
            </div>
            <div className={styles.filterChips} style={{ marginBottom: 16 }}>
              {ORDER_STATUSES.map((s) => (
                <button key={s} className={`chip ${orderFilter === s ? "active" : ""}`} onClick={() => setOrderFilter(s)} id={`order-filter-${s}`} style={{textTransform:"capitalize"}}>{s}</button>
              ))}
            </div>
            {ordersLoading ? (
              <div className={styles.paymentsLoading}><div className={styles.spinner}/><p>Loading orders...</p></div>
            ) : allOrders.length === 0 ? (
              <div className={styles.emptyAdmin}><ShoppingBag size={48} color="var(--pink)"/><p>No orders yet.</p></div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <table className={styles.table}>
                  <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {(orderFilter === "All" ? allOrders : allOrders.filter(o => o.orderStatus === orderFilter)).map((o) => (
                      <tr key={o.firestoreId}>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{o.orderId || o.firestoreId?.slice(0,10)}</td>
                        <td><div><p style={{fontWeight:600,fontSize:13}}>{o.shippingAddress?.name || "—"}</p><p style={{fontSize:11,color:"var(--text-muted)"}}>{o.shippingAddress?.phone}</p></div></td>
                        <td>{o.products?.length || 0} items</td>
                        <td style={{ fontWeight: 700 }}>₹{o.total}</td>
                        <td><span className={o.paymentStatus === "verified" || o.paymentStatus === "paid" ? styles.paidBadge : styles.codBadge} style={{textTransform:"capitalize"}}>{o.paymentMethod || "—"}</span></td>
                        <td>
                          <select
                            className={styles.statusSelect}
                            value={o.orderStatus || "pending"}
                            onChange={e => updateOrderStatus(o.firestoreId, e.target.value)}
                            style={{ background: (STATUS_COLORS[o.orderStatus]||"#888") + "18", color: STATUS_COLORS[o.orderStatus]||"#888" }}
                            id={`status-select-${o.firestoreId}`}
                          >
                            {["pending","confirmed","packed","shipped","delivered","cancelled"].map(s => (
                              <option key={s} value={s} style={{background:"white",color:"#1a1a2e",textTransform:"capitalize"}}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{fontSize:12,color:"var(--text-muted)"}}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Customers ── */}
        {nav === "customers" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Customers</h1>
              <button className={styles.refreshBtn} onClick={loadCustomers}><RefreshCw size={14}/> Refresh</button>
            </div>
            {customersLoading ? (
              <div className={styles.paymentsLoading}><div className={styles.spinner}/><p>Loading customers...</p></div>
            ) : customers.length === 0 ? (
              <div className={styles.emptyAdmin}><Users size={48} color="var(--pink)"/><p>No customers yet. Customers appear once orders are placed.</p></div>
            ) : (
              <div className="card" style={{overflow:"hidden"}}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th></tr></thead>
                  <tbody>
                    {customers.map((c,i) => (
                      <tr key={i}>
                        <td style={{fontWeight:600}}>{c.name}</td>
                        <td style={{fontSize:13,color:"var(--text-muted)"}}>{c.email}</td>
                        <td>{c.phone}</td>
                        <td><span className={styles.categoryPill}>{c.orders} orders</span></td>
                        <td style={{fontWeight:700}}>₹{c.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Coupons ── */}
        {nav === "coupons" && (
          <div>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Coupons</h1>
              <button className={styles.refreshBtn} onClick={loadCoupons}><RefreshCw size={14}/> Refresh</button>
            </div>
            {couponsLoading ? (
              <div className={styles.paymentsLoading}><div className={styles.spinner}/><p>Loading coupons...</p></div>
            ) : coupons.length === 0 ? (
              <div className={styles.emptyAdmin}><Tag size={48} color="var(--pink)"/><p>No coupons yet. Add coupons to the <strong>coupons</strong> collection in Firestore.</p></div>
            ) : (
              <div className={styles.couponGrid}>
                {coupons.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <span className="badge badge-purple" style={{ fontSize: 14 }}>{c.code}</span>
                      <span className={c.active ? styles.stockOk : styles.stockLow}>{c.active ? "Active" : "Inactive"}</span>
                    </div>
                    <p style={{ marginTop: 12, fontWeight: 600 }}>{c.type === "percent" ? `${c.value}% off` : c.type === "shipping" ? "Free Shipping" : `₹${c.value} off`}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.minOrder ? `Min ₹${c.minOrder}` : "No minimum"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings ── */}
        {nav === "settings" && (
          <div>
            <h1 className={styles.pageTitle}>Payment Settings</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, marginTop: -16 }}>
              These details are shown to customers at checkout. Update them here anytime — no code needed.
            </p>

            {settingsLoading ? (
              <div className={styles.paymentsLoading}><div className={styles.spinner} /><p>Loading settings...</p></div>
            ) : (
              <div className={styles.settingsGrid}>

                {/* UPI Section */}
                <div className={`card ${styles.settingsCard}`}>
                  <div className={styles.settingsCardHead}>
                    <QrCode size={20} color="var(--pink)" />
                    <h3>UPI Payment</h3>
                  </div>
                  <p className={styles.settingsHint}>Customers will see this UPI ID and can copy it to pay via any UPI app.</p>
                  <div className={styles.settingsField}>
                    <label>UPI ID <span className={styles.required}>*</span></label>
                    <input
                      id="settings-upi"
                      type="text"
                      placeholder="yourname@upi"
                      value={settings.upi}
                      onChange={(e) => handleSettingsChange("upi", e.target.value)}
                      className={styles.settingsInput}
                    />
                    <span className={styles.settingsExample}>Example: anishop@okicici, 9876543210@paytm</span>
                  </div>
                  <div className={styles.settingsField}>
                    <label>Account Name <span className={styles.required}>*</span></label>
                    <input
                      id="settings-name"
                      type="text"
                      placeholder="Ani Finds"
                      value={settings.name}
                      onChange={(e) => handleSettingsChange("name", e.target.value)}
                      className={styles.settingsInput}
                    />
                  </div>
                </div>

                {/* Bank Transfer Section */}


                {/* WhatsApp Section */}
                <div className={`card ${styles.settingsCard}`}>
                  <div className={styles.settingsCardHead}>
                    <Phone size={20} color="var(--pink)" />
                    <h3>WhatsApp Support</h3>
                  </div>
                  <p className={styles.settingsHint}>Customers can reach you for payment help. Include country code, no spaces or +.</p>
                  <div className={styles.settingsField}>
                    <label>WhatsApp Number</label>
                    <input
                      id="settings-whatsapp"
                      type="text"
                      placeholder="919876543210"
                      value={settings.whatsapp}
                      onChange={(e) => handleSettingsChange("whatsapp", e.target.value.replace(/\D/g, ""))}
                      className={styles.settingsInput}
                    />
                    <span className={styles.settingsExample}>Format: 91 followed by 10-digit number (e.g. 919876543210)</span>
                  </div>
                </div>

                {/* Live Preview */}
                <div className={`card ${styles.settingsCard}`}>
                  <div className={styles.settingsCardHead}>
                    <Eye size={20} color="var(--pink)" />
                    <h3>Live Preview</h3>
                  </div>
                  <p className={styles.settingsHint}>This is what customers see at checkout when they select UPI.</p>
                  <div className={styles.previewBox}>
                    <p className={styles.previewLabel}>PAY TO UPI ID</p>
                    <div className={styles.previewVal}>{settings.upi || <span style={{color:"#ccc"}}>yourname@upi</span>}</div>
                    <p className={styles.previewSub}>Account Name: <strong>{settings.name || "Ani Finds"}</strong></p>
                    {settings.whatsapp && (
                      <p className={styles.previewWhatsapp}>💬 WhatsApp: +{settings.whatsapp}</p>
                    )}
                  </div>
                </div>

                {/* Payment Methods Toggle */}
                <div className={`card ${styles.settingsCard}`} style={{gridColumn:"1 / -1"}}>
                  <div className={styles.settingsCardHead}>
                    <CreditCard size={20} color="var(--pink)" />
                    <h3>Payment Methods — Enable / Disable</h3>
                  </div>
                  <p className={styles.settingsHint}>Toggle which payment methods customers can choose at checkout.</p>
                  <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
                    {[
                      { key:"cod",  label:"Cash on Delivery",     emoji:"💵", desc:"Customer pays when order arrives" },
                      { key:"upi",  label:"UPI / Google Pay",      emoji:"📱", desc:"Instant UPI payment — requires UPI ID above" },
                      { key:"razorpay", label:"Razorpay Payment Link", emoji:"🔗", desc:"Send Razorpay link to customer after order" },
                    ].map(m => (
                      <div key={m.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:settings.methods?.[m.key] ? "#fff8fb" : "#fafafa",border:`1.5px solid ${settings.methods?.[m.key] ? "#f9a8c9" : "#eee"}`,borderRadius:12,transition:"all 0.2s"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:24}}>{m.emoji}</span>
                          <div>
                            <p style={{fontWeight:700,fontSize:14,color:"#1a1a2e"}}>{m.label}</p>
                            <p style={{fontSize:12,color:"#aaa"}}>{m.desc}</p>
                          </div>
                        </div>
                        {/* Toggle switch */}
                        <button
                          onClick={() => handleMethodToggle(m.key)}
                          id={`toggle-method-${m.key}`}
                          style={{
                            width:52,height:28,borderRadius:28,border:"none",cursor:"pointer",
                            background: settings.methods?.[m.key] ? "#e8527f" : "#e0e0e0",
                            position:"relative",transition:"background 0.25s",flexShrink:0,
                          }}
                        >
                          <span style={{
                            position:"absolute",top:3,left: settings.methods?.[m.key] ? 27 : 3,
                            width:22,height:22,borderRadius:"50%",background:"white",
                            boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.25s",display:"block",
                          }}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Save Button */}
            {!settingsLoading && (
              <div className={styles.settingsSaveRow}>
                {settingsSaved && (
                  <div className={styles.savedAlert}>
                    <CheckCircle size={16} /> Settings saved! Checkout will now show your updated payment details.
                  </div>
                )}
                <button
                  className={styles.saveBtn}
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  id="settings-save-btn"
                >
                  {settingsSaving ? <><div className={styles.spinnerSm} /> Saving...</> : <><Save size={16} /> Save Payment Settings</>}
                </button>
              </div>
            )}
          </div>
        )}
        {nav === "hero" && <HeroBannerManager />}

      </main>
    </div>
  );
}
