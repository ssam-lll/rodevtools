"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, User, Lock, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { authService } from "@/services/authService";

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await authService.register({ email, password });
        setMessage("Registration successful! You can now sign in.");
        setIsSignUp(false);
        setEmail("");
        setPassword("");
      } else {
        const data = await authService.login({ email, password });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity cursor-pointer"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low p-8 shadow-2xl z-10 transition-all duration-300 transform scale-100"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-foreground hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="mb-3 select-none">
            <Logo size="sm" />
          </div>
          <h2 id="auth-modal-title" className="text-headline-md font-bold text-foreground">
            {isSignUp ? "Create an Account" : "Sign In"}
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {isSignUp ? "Register to save your progress" : "Access your analytics tools"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-on-surface-variant mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-muted pointer-events-none">
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
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-muted pointer-events-none">
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
            <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md text-xs">
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

        <div className="mt-6 text-center text-body-sm text-on-surface-variant">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); setEmail(""); setPassword(""); }}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); setEmail(""); setPassword(""); }}
                className="text-primary hover:underline font-medium cursor-pointer"
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
