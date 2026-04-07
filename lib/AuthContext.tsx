"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged, User, isMockFirebase } from "./firebase";

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

  return (
    <AuthContext.Provider value={{ user, loading, mockLogin, mockLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
