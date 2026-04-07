"use client";

import React, { useState } from "react";
import { User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LoginModal from "./LoginModal";
import { auth, signOut, isMockFirebase } from "@/lib/firebase";

export default function AuthButton() {
  const { user, loading, mockLogout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = async () => {
    if (isMockFirebase) {
      mockLogout();
      return;
    }
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="w-[100px] h-[36px] bg-border rounded-pill animate-pulse"></div>
    );
  }

  return (
    <>
      {!user ? (
        <button
          onClick={() => setModalOpen(true)}
          className="cursor-target inline-flex items-center justify-center bg-ink text-surface-card font-body font-semibold rounded-pill hover:bg-ink/80 transition-all duration-300 pointer"
          style={{ fontSize: "14px", padding: "8px 20px" }}
        >
          Login
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-raised border border-border rounded-pill shadow-sm">
            <div className="w-6 h-6 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold-dark overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <span className="font-body text-xs font-semibold text-ink max-w-[100px] truncate">
              {user.displayName || user.email?.split("@")[0] || "User"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="cursor-target text-ink-faint hover:text-accent-crimson transition-colors p-1"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}

      {/* Render Modal outside of normal flow */}
      <LoginModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
