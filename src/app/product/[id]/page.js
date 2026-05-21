"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import { MOCK_PRODUCTS, WHATSAPP_NUMBER } from "@/lib/data";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Heart, ShoppingBag, Zap, MessageCircle, Star, Truck, RotateCcw, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

const TABS = ["Description", "Materials", "Shipping", "Return Policy", "Reviews"];

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeMsg, setPincodeMsg] = useState("");
  const [activeTab, setActiveTab] = useState("Description");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        } else {
          // fallback to mock for backward compatibility
          const mock = MOCK_PRODUCTS.find((p) => p.id === id);
          if (mock) setProduct(mock);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const availableColors = Array.isArray(product?.colors) ? product.colors : [];
    const availableSizes = Array.isArray(product?.sizes) ? product.sizes : [];

    setSelectedColor(availableColors[0]?.name || availableColors[0]?.hex || availableColors[0] || "");
    setSelectedSize(availableSizes[0] || "");
  }, [product]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <h2>Loading...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container" style={{ paddingTop: 40, textAlign: "center" }}>
          <h2>Product not found</h2>
          <Link href="/products" className="btn-primary" style={{ display: "inline-flex", marginTop: 20 }}>Continue Shopping</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const discount = Math.round(((product.price - product.offerPrice) / product.price) * 100) || 0;
  const related = MOCK_PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const availableColors = Array.isArray(product.colors) ? product.colors : [];
  const availableSizes = Array.isArray(product.sizes) ? product.sizes : [];

  const images = product.images?.length > 0 
    ? product.images 
    : (product.imageBase64 || product.imageUrl) 
      ? [product.imageBase64 || product.imageUrl] 
      : null;

  const handleAddToCart = () => {
    const variant = {};

    if (availableColors.length > 0 && selectedColor) {
      variant.color = selectedColor;
    }

    if (availableSizes.length > 0 && selectedSize) {
      variant.size = selectedSize;
    }

    addToCart(product, qty, Object.keys(variant).length > 0 ? variant : null);
    toast.success("Added to cart! 🛍", { className: "toast-pink" });
  };

  const handleBuyNow = () => {
    const variant = {};

    if (availableColors.length > 0 && selectedColor) {
      variant.color = selectedColor;
    }

    if (availableSizes.length > 0 && selectedSize) {
      variant.size = selectedSize;
    }

    addToCart(product, qty, Object.keys(variant).length > 0 ? variant : null);
    window.location.href = "/checkout";
  };

  const handleWhatsApp = () => {
    const variantParts = [];
    if (selectedColor) variantParts.push(`Color: ${selectedColor}`);
    if (selectedSize) variantParts.push(`Size: ${selectedSize}`);
    const variantText = variantParts.length > 0 ? ` (${variantParts.join(", ")})` : "";
    const msg = encodeURIComponent(`Hi! I want to order: ${product.title}${variantText} (Qty: ${qty}) — ₹${product.offerPrice * qty}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const checkPincode = () => {
    if (pincode.length === 6) {
      setPincodeMsg("✅ Delivery available in 3-5 business days!");
    } else {
      setPincodeMsg("❌ Please enter a valid 6-digit pincode.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on Ani Finds!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!", { className: "toast-pink" });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🚚 Free Shipping above ₹999 &nbsp;•&nbsp; PAN India Delivery</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/products">Shop</Link> / <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImg} style={{ overflow: "hidden" }}>
              {images ? (
                <img src={images[activeImageIdx] || images[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <span style={{ fontSize: 120 }}>{product.emoji || "💍"}</span>
              )}
            </div>
            {images && images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    className={`${styles.thumb} ${activeImageIdx === i ? styles.thumbActive : ''}`} 
                    onClick={() => setActiveImageIdx(i)}
                    style={{ overflow: "hidden", border: activeImageIdx === i ? "2px solid #e8527f" : "2px solid transparent", cursor: "pointer" }}
                  >
                    <img src={img} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className={styles.category}>{product.category}</span>
                {product.isNew && <span className="badge badge-purple" style={{ marginLeft: 8 }}>NEW</span>}
              </div>
              <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <Share2 size={16} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Share</span>
              </button>
            </div>
            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.ratingRow}>
              <div className="stars">{"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}</div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{product.reviews} reviews</span>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.offerPrice}>₹{product.offerPrice}</span>
              <span className={styles.originalPrice}>₹{product.price}</span>
              <span className="badge">{discount}% OFF</span>
            </div>

            {product.stock <= 5 && (
              <p className={styles.stockWarn}>🔥 Only {product.stock} left in stock — order soon!</p>
            )}

            {(availableColors.length > 0 || availableSizes.length > 0) && (
              <div className={styles.variants}>
                {availableColors.length > 0 && (
                  <div className={styles.variantGroup}>
                    <span className="form-label" style={{ marginBottom: 0 }}>Color</span>
                    <div className={styles.variantRow}>
                      {availableColors.map((color, index) => {
                        const colorName = typeof color === "string" ? color : color.name || color.hex || `Color ${index + 1}`;
                        const colorHex = typeof color === "string" ? "#e8527f" : color.hex || "#e8527f";
                        const isSelected = selectedColor === colorName || selectedColor === colorHex;

                        return (
                          <button
                            key={`${colorHex}-${index}`}
                            type="button"
                            className={styles.colorChip}
                            onClick={() => setSelectedColor(colorName)}
                            aria-label={`Select ${colorName}`}
                            aria-pressed={isSelected}
                            style={{
                              borderColor: isSelected ? "#e8527f" : "var(--border)",
                              boxShadow: isSelected ? "0 0 0 3px #fce8f0" : "none",
                            }}
                          >
                            <span className={styles.colorSwatch} style={{ background: colorHex }} />
                            <span>{colorName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div className={styles.variantGroup}>
                    <span className="form-label" style={{ marginBottom: 0 }}>Size</span>
                    <div className={styles.variantRow}>
                      {availableSizes.map((size) => {
                        const isSelected = selectedSize === size;

                        return (
                          <button
                            key={size}
                            type="button"
                            className={styles.sizeChip}
                            onClick={() => setSelectedSize(size)}
                            aria-pressed={isSelected}
                            style={{
                              borderColor: isSelected ? "#e8527f" : "var(--border)",
                              background: isSelected ? "#fff0f5" : "white",
                              color: isSelected ? "#e8527f" : "var(--text-dark)",
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className={styles.qtyRow}>
              <span className="form-label" style={{ marginBottom: 0 }}>Quantity</span>
              <div className={styles.qtyControls}>
                <button className={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))} id="qty-minus">-</button>
                <span className={styles.qtyNum}>{qty}</span>
                <button className={styles.qtyBtn} onClick={() => setQty(qty + 1)} id="qty-plus">+</button>
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.btnGroup}>
              <button className="btn-primary" onClick={handleAddToCart} id="add-to-cart-btn" style={{ flex: 1, justifyContent: "center" }}>
                <ShoppingBag size={16} /> Add to Cart
              </button>
              <button
                className={styles.wishlistBtn}
                onClick={() => toggleWishlist(product.id)}
                id="wishlist-detail-btn"
              >
                <Heart size={18} fill={wishlisted ? "#e8527f" : "none"} color={wishlisted ? "#e8527f" : "var(--text-dark)"} />
              </button>
            </div>

            <button className="btn-gold" onClick={handleBuyNow} id="buy-now-btn" style={{ width: "100%", justifyContent: "center" }}>
              <Zap size={16} /> Buy Now
            </button>

            <button className="whatsapp-btn" onClick={handleWhatsApp} id="whatsapp-order-btn" style={{ width: "100%", justifyContent: "center" }}>
              <MessageCircle size={16} /> WhatsApp Order
            </button>

            {/* Pincode checker */}
            <div className={styles.pincode}>
              <Truck size={15} color="var(--pink)" />
              <span className={styles.pincodeLabel}>Check Delivery</span>
              <div className={styles.pincodeInput}>
                <input
                  type="number"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  id="pincode-input"
                  style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
                />
                <button className="btn-outline" onClick={checkPincode} style={{ padding: "8px 14px", fontSize: 13 }} id="pincode-check-btn">Check</button>
              </div>
              {pincodeMsg && <p className={styles.pincodeMsg}>{pincodeMsg}</p>}
            </div>

            {/* Trust */}
            <div className={styles.trustRow}>
              <div className={styles.trustChip}><RotateCcw size={13} /> No returns</div>
              <div className={styles.trustChip}><Truck size={13} /> Fast delivery</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t)}
              id={`tab-${t.toLowerCase()}`}
            >{t}</button>
          ))}
        </div>
        <div className={styles.tabContent}>
          {activeTab === "Description" && <p>Beautiful handcrafted {product.title}. Perfect for everyday wear or gifting. Suitable for all occasions. Lightweight and comfortable to wear all day.</p>}
          {activeTab === "Materials" && <p>Made with high-quality alloy metal, hypoallergenic. Nickel-free and lead-free. Safe for sensitive skin.</p>}
          {activeTab === "Shipping" && <p>🚚 Standard Delivery: 3-5 business days. Express delivery available. Free shipping on orders above ₹999. PAN India delivery.</p>}
          {activeTab === "Return Policy" && <p>No return for that product.</p>}
          {activeTab === "Reviews" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: "var(--text-dark)" }}>{product.rating}</span>
                <div>
                  <div className="stars" style={{ fontSize: 18 }}>{"★".repeat(Math.round(product.rating))}</div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Based on {product.reviews} reviews</span>
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Customer reviews will appear here after purchase.</p>
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="section">
            <h2 className="section-title">You May Also Like ✨</h2>
            <p className="section-subtitle">More from {product.category}</p>
            <div className="product-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="sticky-bottom">
        <button className="btn-outline" onClick={handleAddToCart} style={{ flex: 1, justifyContent: "center" }} id="sticky-add-cart">Add to Cart</button>
        <button className="btn-primary" onClick={handleBuyNow} style={{ flex: 1, justifyContent: "center" }} id="sticky-buy-now">Buy Now</button>
      </div>

      <Footer />
    </div>
  );
}
