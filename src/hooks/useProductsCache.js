"use client";

import { useState, useEffect } from "react";

export function useProductsCache() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { collection, getDocs, doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        // 1. Check server metadata for last update timestamp
        const cacheRef = doc(db, "settings", "cache");
        const cacheSnap = await getDoc(cacheRef);
        
        let serverLastUpdated = 0;
        if (cacheSnap.exists() && cacheSnap.data().productsLastUpdated) {
          serverLastUpdated = cacheSnap.data().productsLastUpdated;
        }

        // 2. Check local storage
        const localData = localStorage.getItem("ani-finds-products");
        const localTimestamp = localStorage.getItem("ani-finds-products-updated");

        // 3. Compare timestamps
        if (localData && localTimestamp && Number(localTimestamp) >= serverLastUpdated && serverLastUpdated !== 0) {
          // Local cache is up-to-date
          setProducts(JSON.parse(localData));
          setLoading(false);
          return;
        } else if (localData && serverLastUpdated === 0) {
          // Local cache exists, but server has no timestamp yet. Use local for speed, 
          // but we might want to still init the server. Let's just use local for now.
          setProducts(JSON.parse(localData));
          setLoading(false);
          // Don't return, let it fetch once to ensure sync and setup timestamp.
        }

        // 4. Cache is stale or missing, fetch from Firestore
        const prodSnap = await getDocs(collection(db, "products"));
        const fetchedProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 5. Save to local storage
        localStorage.setItem("ani-finds-products", JSON.stringify(fetchedProducts));
        const newTime = Date.now();
        localStorage.setItem("ani-finds-products-updated", newTime.toString());

        // Initialize server timestamp if it didn't exist
        if (!cacheSnap.exists() || serverLastUpdated === 0) {
           await setDoc(cacheRef, { productsLastUpdated: newTime }, { merge: true });
        }

        setProducts(fetchedProducts);
      } catch (e) {
        console.error("Error fetching products:", e);
        // Fallback to local storage if available even if offline
        const localData = localStorage.getItem("ani-finds-products");
        if (localData) {
          setProducts(JSON.parse(localData));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
}
