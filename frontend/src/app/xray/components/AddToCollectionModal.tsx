"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FolderOpen, X, Plus } from "lucide-react";
import { radarService } from "@/services/radarService";
import type { XRayGameDetails } from "@/types/universe";
import type { Collection } from "@/types/radar";

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: XRayGameDetails | null;
  user: any | null;
  onToast: (msg: string) => void;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  activeGame,
  user,
  onToast,
}: AddToCollectionModalProps) {
  const [newColName, setNewColName] = useState("");
  const [userCollections, setUserCollections] = useState<Collection[]>([]);

  const loadCollections = useCallback(() => {
    const userKey = user && user.email ? user.email : "guest";
    const storageKey = `collections_${userKey}`;
    try {
      const collectionsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setUserCollections(Object.values(collectionsObj));
    } catch {
      setUserCollections([]);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen, loadCollections]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const performAddToCollection = useCallback(
    (collectionName: string) => {
      if (!activeGame) return;
      const userKey = user && user.email ? user.email : "guest";
      const storageKey = `collections_${userKey}`;

      try {
        const collections = JSON.parse(localStorage.getItem(storageKey) || "{}");

        if (!collections[collectionName]) {
          collections[collectionName] = { name: collectionName, games: [], updatedAt: Date.now() };
        }

        const targetCol = collections[collectionName];
        const gameIdStr = String(activeGame.universeId);
        const gameIds = Array.isArray(targetCol.games) ? targetCol.games.map(String) : [];

        if (!gameIds.includes(gameIdStr)) {
          if (gameIds.length >= 3) {
            onToast(`Collection "${collectionName}" is full (max 3 games)`);
            return;
          }
          targetCol.games = [...gameIds, gameIdStr];
          targetCol.updatedAt = Date.now();
          localStorage.setItem(storageKey, JSON.stringify(collections));
          setUserCollections(Object.values(collections));
          if (user && user.token) {
            radarService
              .addToRadar(Number(activeGame.universeId), user.token)
              .catch((err) => console.error("Error syncing to backend radar:", err));
          }

          onToast(`Added "${activeGame.name}" to "${collectionName}"`);
          onClose();
        } else {
          onToast(`"${activeGame.name}" is already in "${collectionName}"`);
        }
      } catch (e) {
        console.error(e);
        onToast("Failed to add to collection");
      }
    },
    [activeGame, user, onToast, onClose]
  );

  const handleCreateAndAddCollection = useCallback(() => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    performAddToCollection(trimmed);
    setNewColName("");
  }, [newColName, performAddToCollection]);

  if (!isOpen || !activeGame) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity cursor-pointer"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-collection-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-low p-8 shadow-2xl z-10 transition-all duration-300 transform scale-100 animate-fade-in"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-foreground hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center shadow-lg mb-3">
            <FolderOpen className="text-foreground w-5 h-5" />
          </div>
          <h2 id="add-collection-title" className="text-headline-md font-bold text-foreground">
            Add to Collection
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Select a collection to add <span className="text-primary font-semibold">{activeGame.name}</span>
          </p>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto mb-6 pr-1">
          {userCollections.length > 0 ? (
            userCollections.map((col) => {
              const alreadyContains =
                Array.isArray(col.games) &&
                col.games.map(String).includes(String(activeGame.universeId));
              return (
                <button
                  key={col.name}
                  onClick={() => !alreadyContains && performAddToCollection(col.name)}
                  disabled={alreadyContains}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-semibold transition-all ${
                    alreadyContains
                      ? "bg-surface-container/20 border-outline-variant/30 text-on-surface-muted cursor-not-allowed"
                      : "bg-surface-container hover:bg-surface-container-high border-outline-variant/50 text-foreground cursor-pointer"
                  }`}
                >
                  <span className="truncate">{col.name}</span>
                  <span className="text-[11px] font-mono font-medium text-on-surface-variant">
                    {alreadyContains ? "Already added" : `${col.games.length}/3 games`}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-4 text-xs text-on-surface-variant bg-surface-container/30 border border-outline-variant/20 rounded-lg">
              No collections yet. Create one below!
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/30 pt-4 space-y-3">
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Create New Collection
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Collection name..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndAddCollection()}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs transition-all placeholder:text-on-surface-muted"
            />
            <button
              onClick={handleCreateAndAddCollection}
              disabled={!newColName.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all disabled:opacity-40 disabled:hover:bg-primary flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
