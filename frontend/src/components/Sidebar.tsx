"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import AccountSettingsModal from "./AccountSettingsModal";
import Logo from "@/components/Logo";
import type { UserSession } from "@/types/auth";
import {
  TrendingUp,
  Activity,
  DollarSign,
  GitCompare,
  Home as HomeIcon,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  ExternalLink,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
  };

  const gamesNav = [
    {
      name: "Rising Stars",
      href: "/rising",
      icon: TrendingUp,
      description: "Trending games",
    },
    {
      name: "Game X-Ray",
      href: "/xray",
      icon: Activity,
      description: "Stats & metrics",
    },
    {
      name: "Game Comparer",
      href: "/compare",
      icon: GitCompare,
      description: "Side-by-side comparison",
    },
  ];

  const moreNav = [
    {
      name: "Calculator",
      href: "/devex",
      icon: DollarSign,
      description: "DevEx & tax calculator",
    },
  ];

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 w-full flex items-center justify-between px-4 py-3 liquid-glass border-b">
        <Link href="/" className="select-none">
          <Logo size="sm" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface-variant hover:text-foreground cursor-pointer transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-30
          w-64 h-screen shrink-0
          liquid-glass border-r
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <Link href="/" className="select-none block">
              <Logo size="md" />
            </Link>
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          <div>
            <Link
              href="/"
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/"
                  ? "bg-surface-container-highest text-foreground border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-on-surface-variant hover:text-foreground hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {pathname === "/" && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-foreground" />
              )}
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  pathname === "/"
                    ? "bg-foreground text-background"
                    : "bg-surface-container text-on-surface-variant group-hover:text-foreground group-hover:bg-surface-container-high"
                }`}
              >
                <HomeIcon className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <span className="block leading-none font-semibold">Command Center</span>
              </div>
            </Link>
          </div>

          <div>
            <span className="px-3 text-[11px] font-semibold tracking-wider text-on-surface-muted uppercase block mb-1.5 font-mono">
              Analytics
            </span>
            <nav className="space-y-1">
              {gamesNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-surface-container-highest text-foreground border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                        : "text-on-surface-variant hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-foreground" />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-surface-container text-on-surface-variant group-hover:text-foreground group-hover:bg-surface-container-high"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="truncate">
                        <span className="block leading-none font-semibold">{item.name}</span>
                        <span className="text-[11px] text-on-surface-muted font-normal leading-tight block mt-0.5 truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="px-3 text-[11px] font-semibold tracking-wider text-on-surface-muted uppercase block mb-1.5 font-mono">
              Finance
            </span>
            <nav className="space-y-1">
              {moreNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-surface-container-highest text-foreground border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                        : "text-on-surface-variant hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-foreground" />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-surface-container text-on-surface-variant group-hover:text-foreground group-hover:bg-surface-container-high"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="truncate">
                        <span className="block leading-none font-semibold">{item.name}</span>
                        <span className="text-[11px] text-on-surface-muted font-normal leading-tight block mt-0.5 truncate">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.06] bg-surface-container-low/50 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-surface-container/80 border border-white/[0.06] flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-on-surface-muted font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              DevEx Rate
            </span>
            <span className="font-mono font-semibold text-foreground tabular-nums">$0.0035 / R$</span>
          </div>

          {user ? (
            <div className="p-2.5 rounded-xl bg-surface-container border border-white/[0.08] flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-foreground font-bold text-xs uppercase border border-outline-variant shrink-0">
                  {user.username?.[0] || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate" title={user.username}>
                    {user.username}
                  </div>
                  <div className="text-xs text-on-surface-variant font-mono truncate">
                    {user.role || "Developer"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  aria-label="Account settings"
                  className="text-on-surface-variant hover:text-foreground hover:bg-surface-container-high p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Account settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-white/[0.08] text-foreground text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}

          <div className="flex items-center justify-between px-1 text-xs text-on-surface-muted">
            <span className="font-mono">v2.4</span>
            <a
              href="https://github.com/ssam-lll/rodevtools"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </aside>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AccountSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        user={user}
      />
    </>
  );
}
