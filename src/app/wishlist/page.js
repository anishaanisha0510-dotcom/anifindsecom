"use client";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { MOCK_PRODUCTS } from "@/lib/data";
import Link from "next/link";
import { Heart } from "lucide-react";
import styles from "./page.module.css";

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const products = MOCK_PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="page-wrapper">
      <div className="announcement-bar">🌸 Your Wishlist</div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <h1 className="section-title">My Wishlist <Heart size={24} color="var(--pink)" style={{ display: "inline" }} /></h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>{products.length} saved items</p>
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <span style={{ fontSize: 80 }}>❤️</span>
            <h2>Your wishlist is empty</h2>
            <p>Heart any product to save it here!</p>
            <Link href="/products" className="btn-primary" id="wishlist-page-shop-btn">Explore Products</Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
