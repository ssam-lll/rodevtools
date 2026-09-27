"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { universeService } from "@/services/universeService";
import type { XRayGameDetails } from "@/types/universe";
import {
  XRaySearchBar,
  XRayOverviewHeader,
  XRayMetricsGrid,
  XRayChartsSection,
  XRayTopGamesTable,
  AddToCollectionModal,
  Toast,
} from "./components";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { useUserSession } from "./hooks/useUserSession";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return React.useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function XRayDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const universeId = searchParams.get("universeId");

  const mounted = useIsMounted();
  const [activeGame, setActiveGame] = useState<XRayGameDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const user = useUserSession();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] = useState(false);

  useEffect(() => {
    if (!universeId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setErrorMsg("");

    universeService
      .resolveUniverse(universeId, controller.signal)
      .then((data) => {
        setActiveGame(data);
        setLoading(false);
        if (data?.universeId) {
          if (String(universeId) !== String(data.universeId)) {
            router.replace(`/xray?universeId=${data.universeId}`);
          }
          addToHistory({ id: data.universeId, name: data.name });
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Error loading xray details:", err);
          setErrorMsg(err.message || "Failed to load game analytics.");
          setLoading(false);
          setActiveGame(null);
        }
      });

    return () => {
      controller.abort();
    };
  }, [universeId, router, addToHistory]);

  const currentGame = universeId ? activeGame : null;

  const triggerSearch = (id: string | number) => {
    router.push(`/xray?universeId=${encodeURIComponent(String(id))}`);
  };

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/xray?universeId=${activeGame?.universeId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => setToastMessage("X-Ray link copied to clipboard!"))
      .catch(() => setToastMessage("X-Ray link copied to clipboard!"));
  }, [activeGame]);

  const handleAddToCollection = useCallback(() => {
    if (!activeGame) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setAddToCollectionModalOpen(true);
  }, [activeGame, user]);

  return (
    <main className="relative flex-1 bg-background text-foreground p-6 md:p-8">
      <div className="container-max z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-outline-variant/30 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Game X-Ray</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Look up any Roblox game to view player history, visit trends, and estimated revenue.
            </p>
          </div>
          <XRaySearchBar onSearch={triggerSearch} onToastMessage={setToastMessage} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm text-on-surface-variant">Loading game data...</span>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="max-w-[500px] mx-auto py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Game Not Found</h2>
            <p className="text-sm text-on-surface-variant mt-2 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push("/xray")}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-sm font-semibold transition-all cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : currentGame ? (
          <div className="space-y-6 animate-fade-in">
            <XRayOverviewHeader
              game={currentGame}
              gameRank={0}
              onBack={() => router.push("/xray")}
              onAddToCollection={handleAddToCollection}
              onShare={handleShare}
            />
            <XRayMetricsGrid game={currentGame} />
            <XRayChartsSection dailyMetrics={currentGame.dailyMetrics} mounted={mounted} />
          </div>
        ) : (
          <XRayTopGamesTable
            history={history}
            onClearHistory={clearHistory}
            onSelectGame={triggerSearch}
          />
        )}
      </div>

      <AddToCollectionModal
        isOpen={addToCollectionModalOpen}
        onClose={() => setAddToCollectionModalOpen(false)}
        activeGame={currentGame}
        user={user}
        onToast={setToastMessage}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </main>
  );
}

export default function XrayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-background text-foreground h-screen">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-sm text-on-surface-variant">Loading game details...</span>
          </div>
        </div>
      }
    >
      <XRayDashboard />
    </Suspense>
  );
}
