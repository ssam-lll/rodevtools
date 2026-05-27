"use client";

import { useState, useEffect } from "react";

interface GameThumbnailProps {
  universeId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// In-memory cache to avoid duplicate fetches across renders
const thumbnailCache: Record<string, string> = {};

export default function GameThumbnail({ universeId, size = "md", className = "" }: GameThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(thumbnailCache[universeId] || null);
  const [loading, setLoading] = useState(!thumbnailCache[universeId]);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 aspect-square rounded-[4px]",
    md: "w-10 h-10 aspect-square rounded-[5px]",
    lg: "w-14 h-14 aspect-square rounded-[6px]",
  };

  const sizeMetrics = {
    sm: { width: 32, height: 32, radius: 4 },
    md: { width: 40, height: 40, radius: 5 },
    lg: { width: 56, height: 56, radius: 6 },
  };

  const activeMetrics = sizeMetrics[size];

  useEffect(() => {
    if (thumbnailCache[universeId]) {
      setImageUrl(thumbnailCache[universeId]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/thumbnails?universeIds=${universeId}&size=150x150`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const thumb = data?.data?.[0];
        if (thumb?.imageUrl) {
          thumbnailCache[universeId] = thumb.imageUrl;
          setImageUrl(thumb.imageUrl);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [universeId]);

  if (loading) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-surface-container-high animate-pulse flex-shrink-0 ${className}`} 
        style={{
          width: `${activeMetrics.width}px`,
          height: `${activeMetrics.height}px`,
          borderRadius: `${activeMetrics.radius}px`,
        }}
      />
    );
  }

  if (error || !imageUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-surface-container-high flex items-center justify-center flex-shrink-0 border border-outline-variant/40 ${className}`}
        style={{
          width: `${activeMetrics.width}px`,
          height: `${activeMetrics.height}px`,
          borderRadius: `${activeMetrics.radius}px`,
        }}
      >
        <svg className="w-4 h-4 text-on-surface-variant/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Game icon"
      className={`${sizeClasses[size]} object-cover flex-shrink-0 border border-outline-variant/30 hover:scale-110 transition-transform duration-200 ${className}`}
      style={{
        width: `${activeMetrics.width}px`,
        height: `${activeMetrics.height}px`,
        borderRadius: `${activeMetrics.radius}px`,
      }}
      loading="lazy"
    />
  );
}
