"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      <nav className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="container-max h-16 flex items-center justify-between gap-md">
          
          {/* Left Column: Brand Logo */}
          <div className="flex items-center min-w-[140px] md:min-w-[200px] justify-start">
            <Link href="/" className="group select-none">
              <Logo size="md" />
            </Link>
          </div>

          {/* Center Column: Active Page Title & Nav Items */}
          <div className="flex-1 flex items-center justify-center gap-md">
            {/* Active Page Name ("donde vamos") */}
            <div className="hidden lg:flex items-center gap-sm bg-primary-container/10 border border-primary-container/20 text-primary-container px-3 py-1 rounded-lg text-body-sm font-semibold tracking-wide uppercase font-mono shadow-[0_0_10px_rgba(0,175,244,0.05)]">
              <ActiveIcon className="w-3.5 h-3.5 animate-pulse" />
              <span>{activeItem.name}</span>
            </div>

            <div className="hidden lg:block h-4 w-px bg-outline-variant/30" />

            {/* Navigation Links */}
            <div className="flex items-center gap-xs sm:gap-sm bg-surface-container-low/40 border border-outline-variant/20 p-1 rounded-xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    className={`flex items-center justify-center gap-sm p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-body-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary-container/15 text-primary border border-primary-container/30 shadow-[0_0_12px_rgba(0,175,244,0.15)]"
                        : "text-on-surface-variant hover:text-foreground hover:bg-surface-container-high/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span className="hidden md:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column: Login / User Controls */}
          <div className="flex items-center min-w-[140px] md:min-w-[200px] justify-end">
            {user ? (
              <div className="flex items-center gap-xs bg-surface-container/40 border border-outline-variant/30 rounded-lg p-1 pr-2.5 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/30">
                  {user.email?.[0] || <User className="w-3 h-3" />}
                </div>
                <div className="flex flex-col max-w-[80px] md:max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-[9px] text-on-surface-variant font-medium leading-none mb-0.5">Logged in</span>
                  <span className="text-xs font-semibold text-foreground leading-none overflow-hidden text-ellipsis" title={user.email}>
                    {user.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1 rounded-md transition-all duration-200 cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-xs px-sm py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/25 text-primary text-xs sm:text-body-sm font-semibold transition-all duration-200 shadow-[0_0_10px_rgba(0,175,244,0.1)] hover:shadow-[0_0_15px_rgba(0,175,244,0.25)] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </nav>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
