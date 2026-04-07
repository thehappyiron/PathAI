"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, isMockFirebase } from "@/lib/firebase";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { mockLogin } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError("");
      if (isMockFirebase) {
        setTimeout(() => {
          mockLogin();
          onClose();
          setLoading(false);
        }, 800);
        return;
      }
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      if (!isMockFirebase) setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (isMockFirebase) {
        setTimeout(() => {
          mockLogin();
          onClose();
          setLoading(false);
        }, 800);
        return;
      }

      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message?.replace("Firebase: ", "") || "Authentication failed.");
    } finally {
      if (!isMockFirebase) setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-4">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/30 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-surface-card rounded-[24px] p-8 shadow-2xl border border-border"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-ink-faint hover:text-ink transition-colors cursor-target"
          >
            <X size={20} />
          </button>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-ink mb-2">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="font-body text-ink-muted">
              {isRegistering
                ? "Join PathAI to sync your personal learning history."
                : "Log in to track your personalized exam preparation."}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-accent-crimson/10 border border-accent-crimson/20 rounded-xl text-accent-crimson text-sm font-semibold">
                {error}
              </div>
            )}

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-faint group-focus-within:text-accent-gold transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cursor-target w-full pl-11 pr-4 py-3 bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all disabled:opacity-50 font-body placeholder:text-ink-faint"
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-faint group-focus-within:text-accent-gold transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cursor-target w-full pl-11 pr-4 py-3 bg-surface-raised border border-border rounded-xl focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all disabled:opacity-50 font-body placeholder:text-ink-faint"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-target w-full py-3.5 bg-ink text-surface-card rounded-xl font-bold font-body hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-surface-card/30 border-t-surface-card rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} /> {isRegistering ? "Sign Up" : "Log In"}
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-xs font-semibold text-ink-faint uppercase font-body">Or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="cursor-target w-full py-3.5 bg-surface-raised border border-border text-ink rounded-xl font-semibold font-body hover:bg-border/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink/20 transition-all disabled:opacity-70 flex justify-center items-center gap-3"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="mt-6 text-center text-sm text-ink-muted font-body">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-accent-gold font-bold hover:underline cursor-target"
            >
              {isRegistering ? "Log In" : "Sign Up"}
            </button>
          </p>

        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
