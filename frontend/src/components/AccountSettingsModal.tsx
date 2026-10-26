"use client";

import { useState, useEffect } from "react";
import { X, Lock, Trash2, Loader2, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { authService } from "@/services/authService";
import type { UserSession } from "@/types/auth";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
}

export default function AccountSettingsModal({
  isOpen,
  onClose,
  user,
}: AccountSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"security" | "danger">("security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
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

  if (!isOpen || !user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.token) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authService.changePassword(
        { currentPassword, newPassword },
        user.token
      );
      setMessage(res.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to update password.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.token || !deletePassword) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.deleteAccount({ password: deletePassword }, user.token);
      if (user.email) {
        localStorage.removeItem(`collections_${user.email}`);
      }
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth-change"));
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete account.";
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
        aria-labelledby="account-settings-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low p-6 md:p-8 shadow-2xl z-10 transition-all duration-300"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account settings"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-foreground hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 id="account-settings-title" className="text-lg font-bold text-foreground">
              Account Settings
            </h2>
            <p className="text-xs text-on-surface-variant font-mono truncate max-w-[260px]">
              {user.email || user.username}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-surface-container/80 border border-white/[0.06] p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("security");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-surface-container-highest text-foreground border border-white/[0.1] shadow-sm"
                : "text-on-surface-variant hover:text-foreground"
            }`}
          >
            Security
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("danger");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "danger"
                ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm"
                : "text-on-surface-variant hover:text-red-400"
            }`}
          >
            Delete Account
          </button>
        </div>

        {activeTab === "security" ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-muted pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                New Password (minimum 8 characters)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-muted pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="text-error bg-error-container/20 border border-error-container/30 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            {message && (
              <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs">
                {message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !currentPassword || newPassword.length < 8}
                className="h-10 px-4 text-xs flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 leading-relaxed">
              Deleting your account permanently removes your profile and all tracked games in your radar. This action cannot be undone.
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Confirm Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-muted pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  required
                  placeholder="Enter password to confirm"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <div className="text-error bg-error-container/20 border border-error-container/30 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 px-4 text-xs"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={loading || !deletePassword}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account Permanently</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
