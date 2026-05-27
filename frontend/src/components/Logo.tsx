import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  // Styles based on size
  const sizes = {
    sm: {
      icon: "w-7 h-7 rounded-[7px] text-sm",
      text: "text-body-md gap-2",
      rSize: "text-[14px]",
    },
    md: {
      icon: "w-8.5 h-8.5 rounded-[9px] text-base",
      text: "text-lg gap-2.5",
      rSize: "text-[16px]",
    },
    lg: {
      icon: "w-16 h-16 rounded-[16px] text-3xl shadow-[0_0_30px_rgba(0,175,244,0.3)]",
      text: "text-4xl md:text-5xl gap-4 flex-col sm:flex-row text-center sm:text-left",
      rSize: "text-[32px]",
    },
  };

  const current = sizes[size];
  const Tag = size === "lg" ? "h1" : "span";

  return (
    <div className={`flex items-center justify-center font-sans ${current.text} ${className}`}>
      {/* Icon Container */}
      <div 
        className={`
          ${current.icon}
          bg-gradient-to-br from-primary-container to-inverse-primary
          border border-white/10
          flex items-center justify-center 
          select-none 
          shadow-[0_0_12px_rgba(0,175,244,0.2)] 
          group-hover:scale-105 
          group-hover:shadow-[0_0_18px_rgba(0,175,244,0.4)] 
          transition-all duration-300
        `}
      >
        <span className={`text-white font-black leading-none ${current.rSize} select-none`}>
          R
        </span>
      </div>
      
      {/* Brand Text */}
      <Tag className="font-extrabold tracking-tight transition-opacity group-hover:opacity-90">
        <span className="text-on-surface">Ro</span>
        <span className="text-primary-container">DevTools</span>
      </Tag>
    </div>
  );
}
