import Link from "next/link";
import Image from "next/image";
import { Camera, Share2, Play, Mail, Phone, MapPin } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <Image src="/assets/logo/logo.png" alt="Ani Finds Logo" width={100} height={30} style={{ objectFit: "contain", display: "block" }} />
          </Link>
          <p className={styles.tagline}>fashion & jewellery</p>
          <p className={styles.desc}>Affordable, cute fashion accessories and jewellery for young women across India.</p>
          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" id="footer-instagram" aria-label="Instagram" className={styles.socialIcon}><Camera size={17} strokeWidth={1.5} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" id="footer-facebook" aria-label="Facebook" className={styles.socialIcon}><Share2 size={17} strokeWidth={1.5} /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" id="footer-youtube" aria-label="YouTube" className={styles.socialIcon}><Play size={17} strokeWidth={1.5} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <nav className={styles.links}>
            <Link href="/" className={styles.link}>Home</Link>
            <Link href="/products" className={styles.link}>Shop All</Link>
            <Link href="/products?category=jewelry" className={styles.link}>Jewellery</Link>
            <Link href="/products?category=claws" className={styles.link}>Claws</Link>
            <Link href="/wholesale" className={styles.link}>Wholesale</Link>
          </nav>
        </div>

        {/* Help */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Help</h4>
          <nav className={styles.links}>
            <Link href="/cart" className={styles.link}>Cart</Link>
            <Link href="/profile?tab=orders" className={styles.link}>Track Order</Link>
            <Link href="/profile" className={styles.link}>My Account</Link>
            <Link href="#" className={styles.link}>Returns Policy</Link>
            <Link href="#" className={styles.link}>Size Guide</Link>
          </nav>
        </div>

        {/* Contact */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contact</h4>
          <div className={styles.contacts}>
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className={styles.contactItem}>
              <Phone size={14} strokeWidth={1.5} /> WhatsApp Us
            </a>
            <a href="mailto:hello@anifinds.in" className={styles.contactItem}>
              <Mail size={14} strokeWidth={1.5} /> hello@anifinds.in
            </a>
            <div className={styles.contactItem} style={{ cursor: "default" }}>
              <MapPin size={14} strokeWidth={1.5} /> India
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomRow}>
            <p>© 2024 Ani Finds. All rights reserved.</p>
            <div className={styles.bottomLinks}>
              <Link href="#" className={styles.bottomLink}>Privacy</Link>
              <Link href="#" className={styles.bottomLink}>Terms</Link>
              <Link href="#" className={styles.bottomLink}>Shipping</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
