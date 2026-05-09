"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: "Jewelry", href: "/products?category=jewelry" },
    { label: "Claws", href: "/products?category=claws" },
    { label: "Combos", href: "/products?category=combos" },
  ];

  return (
    <>
      <header className={styles.header}>
        {/* Top row */}
        <div className={styles.inner}>
          {/* Left: hamburger (mobile only) */}
          <button
            className={styles.iconBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            id="nav-menu-btn"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          {/* Center: logo */}
          <Link href="/" className={styles.logo} id="nav-logo">
            <span className={styles.logoText}>Ani Finds</span>
            <span className={styles.logoSub}>fashion & jewellery</span>
          </Link>

          {/* Right icons */}
          <div className={styles.rightIcons}>
            <button className={styles.iconBtn} onClick={() => setSearchOpen(!searchOpen)} id="nav-search-btn" aria-label="Search">
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" className={styles.iconBtn} id="nav-wishlist-btn" aria-label="Wishlist">
              <Heart size={19} strokeWidth={1.5} />
              {wishlist.length > 0 && <span className={styles.badge}>{wishlist.length}</span>}
            </Link>
            <Link href="/cart" className={styles.iconBtn} id="nav-cart-btn" aria-label="Cart">
              <ShoppingBag size={19} strokeWidth={1.5} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </Link>
            <Link href={user ? "/profile" : "/login"} className={styles.iconBtn} id="nav-profile-btn" aria-label="Account">
              <User size={19} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Desktop nav links */}
        <nav className={styles.desktopNav}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.navLink}>{l.label}</Link>
          ))}
        </nav>

        {/* Search bar */}
        {searchOpen && (
          <div className={styles.searchBar}>
            <div className={styles.searchInner}>
              <Search size={15} color="#999" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search for jewellery, claws, scrunchies..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                id="nav-search-input"
              />
              <button onClick={() => setSearchOpen(false)} className={styles.searchClose}><X size={15} /></button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.logo}>Ani Finds</span>
              <button onClick={() => setMenuOpen(false)} className={styles.iconBtn}><X size={20} strokeWidth={1.5} /></button>
            </div>
            <nav className={styles.drawerNav}>
              {navLinks.map((l) => (
                <Link key={l.href} href={l.href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <div className={styles.drawerDivider} />
              {user ? (
                <>
                  <Link href="/profile" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>My Account</Link>
                  <Link href="/profile?tab=orders" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>My Orders</Link>
                  <button className={styles.drawerLogout} onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
                </>
              ) : (
                <Link href="/login" className={styles.drawerLoginBtn} onClick={() => setMenuOpen(false)} id="drawer-login-btn">
                  Login / Register
                </Link>
              )}
            </nav>
            <div className={styles.drawerFooter}>
              <p>Follow us</p>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.igLink}>@ani.finds</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
