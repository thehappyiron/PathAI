"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, onAuthStateChanged, User, isMockFirebase } from "./firebase";
import { trackTimeSpent, getCloudActivity } from "./firebase_service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mockLogin: () => void;
  mockLogout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  mockLogin: () => {}, 
  mockLogout: () => {} 
});

/** How often to check inactivity (5 minutes = 300_000 ms) */
const INACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000;
const MIN_DAILY_MINUTES = 5;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback testing functions if user lacks Firebase keys
  const mockLogin = () => {
    setUser({ email: "guest@pathai.io", uid: "mock-uid-123", displayName: "PathAI Guest" } as User);
  };
  
  const mockLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    if (isMockFirebase) {
      // Give a tiny simulated delay for mock loading
      setTimeout(() => setLoading(false), 800);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Track time spent periodically
  useEffect(() => {
    if (!user || isMockFirebase) return;
    
    // Log activity every 60 seconds of active session
    const interval = setInterval(() => {
      trackTimeSpent(user.uid, 1);
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  // ──────────────────────────────────────────────
  // Inactivity reminder — check every 5 minutes
  // ──────────────────────────────────────────────
  const checkAndSendReminder = useCallback(async (currentUser: User) => {
    if (!currentUser.email) return;

    const reminderKey = `pathai_reminder_sent_${currentUser.uid}`;
    const today = new Date().toISOString().split("T")[0];

    // Only send one reminder per day
    if (typeof window !== "undefined") {
      const lastSent = localStorage.getItem(reminderKey);
      if (lastSent === today) return;
    }

    // Check how many minutes the user has been active today
    let todayMinutes = 0;
    
    // Try local storage first (fast path)
    if (typeof window !== "undefined") {
      const localStr = localStorage.getItem(`pathai_activity_${currentUser.uid}`) || "[]";
      const localActivity = JSON.parse(localStr);
      const todayEntry = localActivity.find((a: any) => a.date === today);
      if (todayEntry) todayMinutes = todayEntry.totalMinutes || 0;
    }

    // Also try cloud (authoritative source)
    try {
      const cloudActivity = await getCloudActivity(currentUser.uid, 1);
      const todayCloud = cloudActivity.find(a => a.date === today);
      if (todayCloud && todayCloud.totalMinutes > todayMinutes) {
        todayMinutes = todayCloud.totalMinutes;
      }
    } catch { /* ignore — local fallback is fine */ }

    // If user has been on the site for >= 5 min today, no reminder needed
    if (todayMinutes >= MIN_DAILY_MINUTES) return;

    // Send the reminder email via our API route
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0],
          totalMinutes: todayMinutes,
        }),
      });

      if (res.ok) {
        console.log("📧 Inactivity reminder email sent successfully.");
        // Mark as sent for today so we don't spam
        if (typeof window !== "undefined") {
          localStorage.setItem(reminderKey, today);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("Reminder email failed:", errData);
      }
    } catch (err) {
      console.error("Failed to call send-reminder API:", err);
    }
  }, []);

  useEffect(() => {
    if (!user || isMockFirebase || !user.email) return;

    // First check after 5 minutes of being on the site
    const timeout = setTimeout(() => {
      checkAndSendReminder(user);
    }, INACTIVITY_CHECK_INTERVAL);

    // Then check every 5 minutes afterwards (in case they idle)
    const interval = setInterval(() => {
      checkAndSendReminder(user);
    }, INACTIVITY_CHECK_INTERVAL);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, checkAndSendReminder]);

  return (
    <AuthContext.Provider value={{ user, loading, mockLogin, mockLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
