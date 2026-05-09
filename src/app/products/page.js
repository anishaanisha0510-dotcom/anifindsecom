"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";
import styles from "./page.module.css";

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Latest", value: "latest" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("category") || "all";
  const filterParam = searchParams.get("filter") || "";

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [activeCategory, setActiveCategory] = useState(catParam);
  const [sort, setSort] = useState(filterParam === "new" ? "latest" : "popularity");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingProds(true);
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const prodSnap = await getDocs(collection(db, "products"));
        setAllProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const catSnap = await getDocs(collection(db, "categories"));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoadingProds(false);
    };
    load();
  }, []);

  // Update active category if URL param changes
  useEffect(() => { setActiveCategory(catParam); }, [catParam]);

  const filtered = (() => {
    let list = [...allProducts];
    if (activeCategory !== "all") {
      list = list.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    list = list.filter(p => (p.offerPrice || p.price || 0) <= maxPrice);
    if (sort === "price_asc") list.sort((a, b) => (a.offerPrice || a.price) - (b.offerPrice || b.price));
    if (sort === "price_desc") list.sort((a, b) => (b.offerPrice || b.price) - (a.offerPrice || a.price));
    if (sort === "latest") list = list.filter(p => p.isNew).concat(list.filter(p => !p.isNew));
    return list;
  })();

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🚚 Free Shipping above ₹999 &nbsp;•&nbsp; ✨ New Arrivals Live</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className="section-title">Shop All</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              {loadingProds ? "Loading..." : `${filtered.length} products found`}
            </p>
          </div>
          <div className={styles.controls}>
            <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)} id="sort-select">
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className={styles.filterBtn} onClick={() => setFilterOpen(true)} id="filter-open-btn">
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Category chips from Firestore */}
        <div className={styles.chips}>
          <button className={`chip ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")} id="cat-chip-all">All</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`chip ${activeCategory === c.name?.toLowerCase() ? "active" : ""}`}
              onClick={() => setActiveCategory(c.name?.toLowerCase())}
              id={`cat-chip-${c.id}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loadingProds ? (
          <div className="product-grid" style={{ marginTop: 24 }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #f0e6ec" }}>
                <div style={{ height: 200, background: "linear-gradient(90deg,#f8f0f4 25%,#fce8f0 50%,#f8f0f4 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite" }}/>
                <div style={{ padding: 16 }}>
                  <div style={{ height: 12, background: "#f8f0f4", borderRadius: 6, marginBottom: 8, width: "60%" }}/>
                  <div style={{ height: 16, background: "#f8f0f4", borderRadius: 6, width: "80%" }}/>
                </div>
                <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="product-grid" style={{ marginTop: 24 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <span style={{ fontSize: 64 }}>🔍</span>
            <p>No products found. Try a different filter.</p>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {filterOpen && (
        <div className={styles.filterOverlay} onClick={() => setFilterOpen(false)}>
          <div className={styles.filterDrawer} onClick={e => e.stopPropagation()}>
            <div className={styles.filterHeader}>
              <h3>Filters</h3>
              <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.filterBody}>
              <div className={styles.filterGroup}>
                <label className="form-label">Max Price: ₹{maxPrice}</label>
                <input type="range" min={99} max={5000} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className={styles.range} id="price-range"/>
                <div className={styles.rangeLabels}><span>₹99</span><span>₹5000</span></div>
              </div>
            </div>
            <div className={styles.filterFooter}>
              <button className="btn-outline" onClick={() => { setMaxPrice(5000); setActiveCategory("all"); }}>Reset</button>
              <button className="btn-primary" onClick={() => setFilterOpen(false)}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#e8527f", fontWeight: 600 }}>🌸 Loading...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
