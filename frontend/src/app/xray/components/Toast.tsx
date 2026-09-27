"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container">
      <div className="toast toast-success flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
