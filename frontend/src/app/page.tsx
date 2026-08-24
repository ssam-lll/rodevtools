import Link from "next/link";
import { TrendingUp, Activity, DollarSign, GitCompare, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function Home() {
  const tools = [
    {
      title: "Rising Stars",
      description: "Discover fast-growing Roblox games and track 24-hour player gain.",
      href: "/rising",
      icon: TrendingUp,
    },
    {
      title: "Game X-Ray",
      description: "Detailed stats for any game: player history, daily visits, playtime, and estimated revenue.",
      href: "/xray",
      icon: Activity,
    },
    {
      title: "Game Comparer",
      description: "Compare stats between up to 3 games side by side with custom collections.",
      href: "/compare",
      icon: GitCompare,
    },
    {
      title: "Calculator",
      description: "Calculate DevEx payouts, payment method fees, and Robux transfer taxes.",
      href: "/devex",
      icon: DollarSign,
    },
  ];

  return (
    <main className="flex-1 bg-background text-foreground flex flex-col justify-center p-6 md:p-12">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center py-8">
        
        {/* Simple & Clean Hero */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="mb-4">
            <Logo size="lg" />
          </div>

          <p className="text-sm md:text-base text-on-surface-variant max-w-xl leading-relaxed">
            Real-time analytics, player growth trends, game comparisons, and DevEx calculations for Roblox developers.
          </p>
        </div>

        {/* 4 Core Tool Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Link
                key={idx}
                href={tool.href}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-surface-container border border-outline-variant hover:border-zinc-500 hover:bg-surface-container-high transition-all duration-200 shadow-sm"
              >
                <div>
                  <div className="mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-high border border-outline-variant text-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-foreground mb-2 group-hover:text-white transition-colors">
                    {tool.title}
                  </h2>

                  <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-foreground pt-3 border-t border-outline-variant mt-auto transition-colors">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </main>
  );
}
