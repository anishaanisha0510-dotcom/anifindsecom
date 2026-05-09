"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const WishlistContext = createContext({});

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) setWishlist(snap.data().wishlist || []);
      });
    } else {
      const stored = localStorage.getItem("ani-finds-wishlist");
      if (stored) setWishlist(JSON.parse(stored));
    }
  }, [user]);

  const isWishlisted = (id) => wishlist.includes(id);

  const toggleWishlist = async (id) => {
    const updated = isWishlisted(id)
      ? wishlist.filter((w) => w !== id)
      : [...wishlist, id];
    setWishlist(updated);
    if (user) {
      const ref = doc(db, "users", user.uid);
      if (isWishlisted(id)) {
        await updateDoc(ref, { wishlist: arrayRemove(id) });
      } else {
        await updateDoc(ref, { wishlist: arrayUnion(id) });
      }
    } else {
      localStorage.setItem("ani-finds-wishlist", JSON.stringify(updated));
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
