"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getFirebase } from "@/lib/firebase";

const AuthContext = createContext(null);

/** Popup sign-in is blocked in installed PWAs and some browsers; fall back to redirect. */
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

export function AuthProvider({ children }) {
  // status: "loading" | "ready" | "unconfigured"
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      const firebase = await getFirebase();
      if (cancelled) return;
      if (!firebase) {
        setStatus("unconfigured");
        return;
      }

      const { getRedirectResult, onAuthStateChanged } = await import("firebase/auth");
      // Completes a redirect sign-in started in a previous page load.
      getRedirectResult(firebase.auth).catch(() => {});

      unsubscribe = onAuthStateChanged(firebase.auth, (nextUser) => {
        if (cancelled) return;
        setUser(nextUser);
        setStatus("ready");
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    const firebase = await getFirebase();
    if (!firebase) {
      setError("Firebase is not configured.");
      return;
    }
    const { signInWithPopup, signInWithRedirect } = await import("firebase/auth");
    try {
      await signInWithPopup(firebase.auth, firebase.provider);
    } catch (err) {
      if (POPUP_FALLBACK_CODES.has(err?.code)) {
        await signInWithRedirect(firebase.auth, firebase.provider);
        return;
      }
      setError(err?.message ?? "Sign in failed.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const firebase = await getFirebase();
    if (!firebase) return;
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    await firebaseSignOut(firebase.auth);
  }, []);

  const value = useMemo(
    () => ({ status, user, uid: user?.uid ?? null, error, signIn, signOut }),
    [status, user, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
