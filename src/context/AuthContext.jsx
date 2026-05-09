"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({});

// Safely import Firebase only when needed
async function getFirebaseAuth() {
  try {
    const { auth } = await import("@/lib/firebase");
    if (!auth) return null;
    return auth;
  } catch {
    return null;
  }
}

async function getFirebaseDb() {
  try {
    const { db } = await import("@/lib/firebase");
    if (!db) return null;
    return db;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    (async () => {
      try {
        const auth = await getFirebaseAuth();
        if (!auth) {
          // Firebase not configured — check localStorage for guest session
          const guestUser = localStorage.getItem("ani-finds-guest");
          if (guestUser) setUser(JSON.parse(guestUser));
          setLoading(false);
          return;
        }

        const { onAuthStateChanged } = await import("firebase/auth");
        const { doc, setDoc, getDoc } = await import("firebase/firestore");
        const db = await getFirebaseDb();

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser && db) {
            try {
              const docRef = doc(db, "users", firebaseUser.uid);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                setUserProfile(snap.data());
              } else {
                const profile = {
                  name: firebaseUser.displayName || "",
                  email: firebaseUser.email || "",
                  phone: firebaseUser.phoneNumber || "",
                  role: "customer",
                  wishlist: [],
                  addresses: [],
                  createdAt: new Date().toISOString(),
                };
                await setDoc(docRef, profile);
                setUserProfile(profile);
              }
            } catch {
              // Firestore error — continue without profile
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    })();

    return () => unsubscribe();
  }, []);

  const googleLogin = async () => {
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const emailLogin = async (email, password) => {
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const emailRegister = async (email, password) => {
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const setupRecaptcha = async (elementId) => {
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const { RecaptchaVerifier } = await import("firebase/auth");
    return new RecaptchaVerifier(auth, elementId, { size: "invisible" });
  };

  const phoneLogin = async (phoneNumber, appVerifier) => {
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const { signInWithPhoneNumber } = await import("firebase/auth");
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const logout = async () => {
    const auth = await getFirebaseAuth();
    if (auth) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        googleLogin,
        emailLogin,
        emailRegister,
        phoneLogin,
        setupRecaptcha,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
