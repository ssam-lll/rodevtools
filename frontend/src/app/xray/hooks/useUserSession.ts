"use client";

import { useState, useEffect } from "react";
import type { UserSession } from "@/types/auth";

export function useUserSession() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const handleAuthChange = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    handleAuthChange();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  return user;
}
