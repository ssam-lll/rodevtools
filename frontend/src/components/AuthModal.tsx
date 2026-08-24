"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, User, Lock, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (text && text.trim().length > 0 ? text : null) ||
          `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      if (isSignUp) {
        setMessage("Registration successful! You can now sign in.");
        setIsSignUp(false);
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("user", JSON.stringify({
          username: data?.email || email,
          email: data?.email || email,
          role: data?.role || "USER",
          token: data?.token,
        }));
        window.dispatchEvent(new Event("auth-change"));
        onClose();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999 
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(16, 19, 26, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'opacity 0.3s ease',
          cursor: 'pointer'
        }}
      />

      {/* Modal Container */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low p-8 shadow-2xl z-10 transition-all duration-300 transform scale-100"
        style={{
          width: 'calc(100% - 2rem)',
          maxWidth: '448px', // Equivalent to max-w-md
          boxSizing: 'border-box'
        }}
      >

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-foreground hover:bg-surface-container-high p-1.5 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-container to-inverse-primary border border-white/10 flex items-center justify-center shadow-[0_0_12px_rgba(0,175,244,0.2)] mb-3 select-none">
            <span className="text-white font-black text-[18px] leading-none font-sans">R</span>
          </div>
          <h2 className="text-headline-md font-bold text-foreground">
            {isSignUp ? "Create an Account" : "Sign In"}
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {isSignUp ? "Register to save your progress" : "Access your analytics tools"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-on-surface-variant mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline/60 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <Input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-on-surface-variant mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline/60 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <div className="text-error bg-error-container/20 border border-error-container/30 px-3 py-2 rounded-md text-xs">
              {error}
            </div>
          )}

          {message && (
            <div className="text-secondary-container bg-on-secondary-container/20 border border-on-secondary-container/30 px-3 py-2 rounded-md text-xs">
              {message}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 mt-2 h-10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-body-sm text-on-surface-variant">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button 
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); setEmail(""); setPassword(""); }}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button 
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); setEmail(""); setPassword(""); }}
                className="text-primary hover:underline font-medium"
              >
                Sign up for free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
