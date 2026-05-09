"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Heart, ShoppingBag, Star } from "lucide-react";
import styles from "./ProductCard.module.css";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const discount = Math.round(((product.price - product.offerPrice) / product.price) * 100);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    setAdding(true);
    addToCart(product, 1);
    toast.success("Added to cart!", { className: "toast-pink" });
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
    toast(wishlisted ? "Removed from wishlist" : "Saved to wishlist ❤️", { className: "toast-pink" });
  };

  return (
    <Link href={`/product/${product.id}`} className={styles.card} id={`product-card-${product.id}`}>
      {/* Heart-shaped image frame */}
      <div className={styles.imageWrap}>
        <div className={styles.heartFrame}>
          {product.images?.length > 0 || product.imageBase64 || product.imageUrl ? (
            <img 
              src={product.images?.[0] || product.imageBase64 || product.imageUrl} 
              alt={product.title} 
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div className={styles.imgInner}>
              <span className={styles.emoji}>{product.emoji || "💍"}</span>
            </div>
          )}
        </div>

        {/* Badges */}
        {discount > 0 && (
          <span className={styles.discountBadge}>{discount}% OFF</span>
        )}
        {product.isNew && (
          <span className={styles.newBadge}>NEW</span>
        )}

        {/* Wishlist */}
        <button
          className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ""}`}
          onClick={handleWishlist}
          id={`wishlist-btn-${product.id}`}
          aria-label="Wishlist"
        >
          <Heart size={14} fill={wishlisted ? "#e8527f" : "none"} strokeWidth={1.5} />
        </button>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.category}>{product.category}</p>
        <h3 className={styles.title}>{product.title}</h3>
        <div className={styles.ratingRow}>
          <Star size={11} fill="#FFB800" color="#FFB800" />
          <span className={styles.ratingVal}>{product.rating}</span>
          <span className={styles.reviewCount}>({product.reviews})</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.offerPrice}>₹{product.offerPrice}</span>
          {product.price !== product.offerPrice && (
            <span className={styles.originalPrice}>₹{product.price}</span>
          )}
        </div>
        <button
          className={`${styles.addBtn} ${adding ? styles.adding : ""}`}
          onClick={handleAddToCart}
          id={`add-cart-${product.id}`}
        >
          {adding ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}
