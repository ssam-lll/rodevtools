"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import Logo from "@/components/Logo";
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  GitCompare, 
  LayoutDashboard,
  LogIn,
  LogOut,
  User
} from "lucide-react";

interface UserSession {
  username: string;
  email?: string;
  role: string;
  token: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  const handleSignOut = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Rising Stars", href: "/rising", icon: TrendingUp },
    { name: "Game X-Ray", href: "/xray", icon: Activity },
    { name: "Comparer", href: "/compare", icon: GitCompare },
    { name: "DevEx Calculator", href: "/devex", icon: DollarSign },
  ];

  // Find current active item
  const activeItem = navItems.find((item) => item.href === pathname) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
        <div className="container-max h-16 flex items-center justify-between gap-md">
          
          {/* Left Column: Brand Logo */}
          <div className="flex items-center justify-start">
            <Link href="/" className="group select-none">
              <Logo size="md" />
            </Link>
          </div>

          {/* Center Column: Clean Horizontal Navigation Links */}
          <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-body-sm font-medium transition-all ${
                    isActive
                      ? "bg-surface-container-high text-primary border border-outline-variant/40 shadow-sm"
                      : "text-on-surface-variant hover:text-foreground hover:bg-surface-container/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Column: User Session / Sign In */}
          <div className="flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-2 bg-surface-container-high/60 border border-outline-variant/40 rounded-lg p-1.5 pr-2.5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/30">
                  {user.username?.[0] || <User className="w-3 h-3" />}
                </div>
                <div className="flex flex-col max-w-[90px] md:max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-[10px] text-on-surface-variant font-medium leading-none mb-0.5">Account</span>
                  <span className="text-xs font-semibold text-foreground leading-none overflow-hidden text-ellipsis" title={user.username}>
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded-md transition-all duration-200 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-body-sm font-semibold transition-all duration-200 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
