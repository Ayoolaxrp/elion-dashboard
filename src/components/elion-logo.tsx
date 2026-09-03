"use client";

import Image from "next/image";

interface ElionLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "wordmark" | "symbol" | "full";
  className?: string;
}

export function ElionLogo({ size = "md", variant = "full", className = "" }: ElionLogoProps) {
  const sizes = {
    sm: { height: 20, text: "text-xs", gap: "gap-1.5" },
    md: { height: 28, text: "text-sm", gap: "gap-2" },
    lg: { height: 36, text: "text-lg", gap: "gap-2.5" },
  };

  const s = sizes[size];

  if (variant === "symbol") {
    return (
      <div className={className}>
        <Image
          src="/brand/elion-e-icon.svg"
          alt="ELION"
          width={s.height}
          height={s.height}
          priority
        />
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex items-center ${s.gap} ${className}`}>
        <Image
          src="/brand/elion-full-logo.svg"
          alt="ELION - Business Automation Systems"
          width={140}
          height={s.height}
          priority
          style={{ height: s.height, width: "auto" }}
        />
      </div>
    );
  }

  // wordmark variant - E icon + text
  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <Image
        src="/brand/elion-e-icon.svg"
        alt=""
        width={s.height}
        height={s.height}
        priority
      />
      <span
        className={`font-bold text-[var(--color-text-primary)] tracking-wider ${s.text}`}
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        ELION
      </span>
    </div>
  );
}