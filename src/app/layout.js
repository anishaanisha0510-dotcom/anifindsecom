import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Ani Finds — Affordable Jewellery & Fashion",
  description: "Shop budget-friendly fashion accessories, jewellery, scrunchies and more. PAN India shipping. Wholesale orders welcome.",
  keywords: "jewellery, fashion accessories, scrunchies, earrings, bracelets, budget fashion, Gen Z fashion India",
  openGraph: {
    title: "Ani Finds — Affordable Jewellery & Fashion Finds 💛",
    description: "Cute, trendy, affordable. Shop earrings, bracelets, scrunchies & more.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <Toaster position="bottom-center" toastOptions={{ duration: 2500 }} />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
