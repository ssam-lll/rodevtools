import Link from "next/link";
import { TrendingUp, Activity, DollarSign, GitCompare, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function Home() {
  const tools = [
    {
      title: "Rising Stars",
      description: "Medium-sized Roblox games with rapid growth and scaling potential.",
      href: "/rising",
      icon: TrendingUp,
      color: "from-emerald-500/20 to-teal-500/10",
      borderColor: "group-hover:border-emerald-500/50",
      iconColor: "text-emerald-400",
    },
    {
      title: "Game X-Ray",
      description: "Deep technical analysis of individual games: retention, monetization, and history.",
      href: "/xray",
      icon: Activity,
      color: "from-blue-500/20 to-indigo-500/10",
      borderColor: "group-hover:border-blue-500/50",
      iconColor: "text-blue-400",
    },
    {
      title: "Game Comparer",
      description: "Compare key metrics of up to 3 games side-by-side highlighting winning metrics.",
      href: "/compare",
      icon: GitCompare,
      color: "from-purple-500/20 to-pink-500/10",
      borderColor: "group-hover:border-purple-500/50",
      iconColor: "text-purple-400",
    },
    {
      title: "DevEx Calculator",
      description: "Calculate Robux to USD conversions based on the official Roblox exchange rate.",
      href: "/devex",
      icon: DollarSign,
      color: "from-amber-500/20 to-orange-500/10",
      borderColor: "group-hover:border-amber-500/50",
      iconColor: "text-amber-400",
    },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      
      {/* 1. Background with Radial Glow Effect */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="container-max py-xl z-10 flex-grow flex flex-col justify-center">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-xl">
          

          {/* Main Title / Brand Logo */}
          <div className="group mb-md">
            <Logo size="lg" />
          </div>
          
          {/* Subtitle */}
          <p className="text-body-md text-on-surface-variant max-w-[600px]">
            High-performance technical analytics dashboard for Roblox developers. Make data-driven decisions on finance and growth.
          </p>
        </div>

        {/* 2. Grid of Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link 
                key={idx} 
                href={tool.href}
                className="group relative flex flex-col justify-between p-lg rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant hover:border-outline transition-all duration-300 transform hover:-translate-y-1 shadow-lg overflow-hidden"
              >
                {/* Internal gradient hover background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

                <div>
                  {/* Tool Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-surface-container-high border border-outline-variant mb-md ${tool.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Tool Title */}
                  <h3 className="text-headline-sm text-foreground mb-xs group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>

                  {/* Tool Description */}
                  <p className="text-body-sm text-on-surface-variant mb-lg leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Call to Action with Animated Arrow */}
                <div className="flex items-center gap-xs text-body-sm font-semibold text-primary mt-auto">
                  <span>Open tool</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Minimal Footer */}
      <footer className="w-full border-t border-outline-variant/30 py-md mt-xl z-10 bg-surface-container-lowest/80 backdrop-blur-sm">
        <div className="container-max flex justify-center items-center">
          <a
            href="https://github.com/ssam-lll/rodevtools"
            target="_blank"
            rel="noopener noreferrer"
            className="p-sm rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all duration-300"
            title="View on GitHub"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
