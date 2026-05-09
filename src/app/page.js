"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import { ArrowRight, Package, RotateCcw, Headphones, Truck, Star } from "lucide-react";
import styles from "./page.module.css";

const BANNERS = [
  { id: 1, headline: "Fashion Finds\nUnder ₹299", sub: "New arrivals every week — free shipping above ₹999", cta: "Shop Now", href: "/products", img: "💍" },
  { id: 2, headline: "Claws &\nScrunchies", sub: "Cute hair accessories for every mood", cta: "Explore", href: "/products?category=claws", img: "🎀" },
  { id: 3, headline: "Wholesale\nOrders Open", sub: "Minimum order ₹2000 · Best prices guaranteed", cta: "Order Now", href: "/wholesale", img: "🎁" },
];

const TRUST_ITEMS = [
  { icon: <Truck size={20} strokeWidth={1.5} />, title: "Free Shipping", sub: "Orders above ₹999" },
  { icon: <RotateCcw size={20} strokeWidth={1.5} />, title: "Easy Returns", sub: "7-day policy" },
  { icon: <Headphones size={20} strokeWidth={1.5} />, title: "WhatsApp Support", sub: "Chat anytime" },
  { icon: <Package size={20} strokeWidth={1.5} />, title: "Cute Packaging", sub: "Gift-ready packing" },
];

// Static reviews (customer testimonials — edit text as needed)
const REVIEWS = [
  { id: 1, name: "Priya S.", avatar: "🌸", rating: 5, date: "Apr 2025", text: "Absolutely love the packaging and quality! The claw clips are so sturdy and cute. Will definitely order again 💕" },
  { id: 2, name: "Meera R.", avatar: "✨", rating: 5, date: "Mar 2025", text: "Got the pearl earrings and they look so premium. Fast delivery and super cute box. Highly recommend!" },
  { id: 3, name: "Ananya K.", avatar: "🎀", rating: 5, date: "Apr 2025", text: "The scrunchie set is gorgeous. Such great value for money. My friends kept asking where I got them from 😍" },
];

function ProductSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #f0e6ec" }}>
      <div style={{ height: 200, background: "linear-gradient(90deg,#f8f0f4 25%,#fce8f0 50%,#f8f0f4 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite" }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 12, background: "#f8f0f4", borderRadius: 6, marginBottom: 8, width: "60%" }} />
        <div style={{ height: 16, background: "#f8f0f4", borderRadius: 6, marginBottom: 12, width: "80%" }} />
        <div style={{ height: 20, background: "#f8f0f4", borderRadius: 6, width: "40%" }} />
      </div>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}

/* Extract YouTube video ID from any YouTube URL */
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.pathname.includes("/shorts/")) return u.pathname.split("/shorts/")[1].split("?")[0];
    if (u.pathname.includes("/embed/")) return u.pathname.split("/embed/")[1].split("?")[0];
  } catch {}
  return "";
}

export default function HomePage() {
  const [bannerIdx, setBannerIdx] = useState(0);

  // Firestore data
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroMedia, setHeroMedia] = useState(null); // {mediaType, imageBase64, imageUrl, youtubeUrl, headline, subtext, ctaLabel, ctaHref}

  useEffect(() => {
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);

  // Load products + categories + hero from Firestore
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { collection, getDocs, doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        // Load hero settings
        const heroSnap = await getDoc(doc(db, "settings", "hero"));
        if (heroSnap.exists()) setHeroMedia(heroSnap.data());

        // Load products
        const prodSnap = await getDocs(collection(db, "products"));
        const products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTrending(products.filter(p => p.isBestSeller).slice(0, 8));
        setNewArrivals(products.filter(p => p.isNew).slice(0, 8));

        // Load categories
        const catSnap = await getDocs(collection(db, "categories"));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Homepage load error:", e);
      }
      setLoading(false);
    };
    load();
  }, []);



  // Pre-compute YouTube embed URL (avoids inline IIFE in JSX)
  const ytId = heroMedia?.youtubeUrl ? getYouTubeId(heroMedia.youtubeUrl) : "";
  const ytEmbedSrc = ytId
    ? `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${ytId}`
    : "";

  return (
    <div className="page-wrapper">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        Free Shipping above ₹999 &nbsp;·&nbsp; New Arrivals Every Week &nbsp;·&nbsp; Wholesale Orders Open &nbsp;·&nbsp; PAN India Delivery
      </div>

      <Navbar />

      {/* ── Hero Banner ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroPre}>New Collection</div>
          <h1 className={styles.heroHeadline}>
            {(heroMedia?.headline || BANNERS[bannerIdx].headline).split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </h1>
          <p className={styles.heroSub}>{heroMedia?.subtext || BANNERS[bannerIdx].sub}</p>
          <Link href={heroMedia?.ctaHref || BANNERS[bannerIdx].href} className={styles.heroBtn} id="hero-cta">
            {heroMedia?.ctaLabel || BANNERS[bannerIdx].cta} <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
        <div className={styles.heroVisual}>
          {/* Admin-set hero media */}
          {heroMedia?.mediaType === "youtube" && heroMedia.youtubeUrl ? (
            <div style={{ width: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(232,82,127,0.18)" }}>
              <iframe
                src={ytEmbedSrc}
                width="100%" height="300" frameBorder="0"
                allow="autoplay; encrypted-media" allowFullScreen
                style={{ display: "block" }}
              />
            </div>
          ) : (heroMedia?.mediaType === "image_url" && heroMedia.imageUrl) || (heroMedia?.mediaType === "image_upload" && heroMedia.imageBase64) ? (
            <div className={styles.heroHeartFrame} style={{ padding: 0, overflow: "hidden" }}>
              <img
                src={heroMedia.mediaType === "image_upload" ? heroMedia.imageBase64 : heroMedia.imageUrl}
                alt="Hero Banner"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
              />
            </div>
          ) : (
            /* Default emoji if no admin media set */
            <div className={styles.heroHeartFrame}>
              <span className={styles.heroEmoji}>{BANNERS[bannerIdx].img}</span>
            </div>
          )}
        </div>
        {/* Dots — only show if no custom hero set */}
        {!heroMedia?.mediaType && (
          <div className={styles.dots}>
            {BANNERS.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === bannerIdx ? styles.dotActive : ""}`}
                onClick={() => setBannerIdx(i)}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Category Circles — from Firestore ── */}
      {categories.length > 0 && (
        <div className="container">
          <div className={styles.circleRow}>
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.name?.toLowerCase()}`} className={styles.circleItem} id={`cat-circle-${cat.id}`}>
                <div className={styles.circle}>
                  {cat.imageBase64 ? (
                    <img src={cat.imageBase64} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    <span className={styles.circleEmoji}>{cat.emoji || "🛍️"}</span>
                  )}
                </div>
                <span className={styles.circleLabel}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Categories Grid ── */}
      {categories.length > 0 && (
        <section className="section container">
          <h2 className={`section-title ${styles.sectionTitleLeft}`}>Categories</h2>
          <div className={styles.catGrid}>
            {categories.slice(0, 4).map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.name?.toLowerCase()}`} className={styles.catCard} id={`cat-card-${cat.id}`}>
                <div className={styles.catCardImg}>
                  {cat.imageBase64 ? (
                    <img src={cat.imageBase64} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 52 }}>{cat.emoji || "🛍️"}</span>
                  )}
                </div>
                <div className={styles.catCardLabel}>
                  <span>{cat.name}</span>
                  <ArrowRight size={16} strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending Products (Best Sellers) ── */}
      <section className="section container">
        <div className={styles.sectionRow}>
          <div>
            <h2 className="section-title">Trending Now</h2>
            <p className="section-subtitle">Most-loved picks this week</p>
          </div>
          <Link href="/products" className={styles.viewAll} id="view-all-trending">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="product-grid">
          {loading
            ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : trending.length > 0
              ? trending.map((p) => <ProductCard key={p.id} product={p} />)
              : <p style={{ color: "#aaa", fontSize: 14, padding: "20px 0" }}>Products coming soon — check back!</p>
          }
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            {TRUST_ITEMS.map((t) => (
              <div key={t.title} className={styles.trustItem}>
                <div className={styles.trustIcon}>{t.icon}</div>
                <div>
                  <p className={styles.trustTitle}>{t.title}</p>
                  <p className={styles.trustSub}>{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="section container">
        <div className={styles.sectionRow}>
          <div>
            <h2 className="section-title">New Arrivals</h2>
            <p className="section-subtitle">Fresh drops, just for you</p>
          </div>
          <Link href="/products?filter=new" className={styles.viewAll} id="view-all-new">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="product-grid">
          {loading
            ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : newArrivals.length > 0
              ? newArrivals.map((p) => <ProductCard key={p.id} product={p} />)
              : <p style={{ color: "#aaa", fontSize: 14, padding: "20px 0" }}>New arrivals coming soon — stay tuned!</p>
          }
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="section container">
        <h2 className="section-title" style={{ marginBottom: 24 }}>Happy Customers</h2>
        <div className={styles.reviewGrid}>
          {REVIEWS.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewAvatar}>{r.avatar}</div>
                <div>
                  <p className={styles.reviewName}>{r.name}</p>
                  <div className={styles.reviewStars}>
                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={11} fill="#FFB800" color="#FFB800" />)}
                  </div>
                </div>
                <span className={styles.reviewDate}>{r.date}</span>
              </div>
              <p className={styles.reviewText}>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Instagram CTA ── */}
      <section className={styles.igSection}>
        <div className="container">
          <div className={styles.igCard}>
            <p className={styles.igPre}>Follow us</p>
            <h2 className={styles.igTitle}>@ani.finds</h2>
            <p className={styles.igSub}>Tag us for a chance to be featured on our page</p>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.igBtn} id="instagram-follow-btn">
              Follow on Instagram <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
