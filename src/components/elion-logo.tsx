"use client";

interface ElionLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "wordmark" | "symbol" | "full";
  className?: string;
}

export function ElionLogo({ size = "md", variant = "full", className = "" }: ElionLogoProps) {
  const sizes = {
    sm: { symbol: 24, text: "text-xs", gap: "gap-1.5" },
    md: { symbol: 28, text: "text-sm", gap: "gap-2" },
    lg: { symbol: 36, text: "text-lg", gap: "gap-2.5" },
  };

  const s = sizes[size];

  const symbol = (
    <svg
      width={s.symbol}
      height={s.symbol}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="elionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E56CC" />
          <stop offset="50%" stopColor="#4F7CFF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      {/* Top bar */}
      <polygon points="6,5 26,5 24,11 4,11" fill="url(#elionGrad)" />
      {/* Middle bar */}
      <polygon points="6,14 22,14 20,20 4,20" fill="url(#elionGrad)" opacity="0.85" />
      {/* Bottom bar */}
      <polygon points="6,23 26,23 24,29 4,29" fill="url(#elionGrad)" />
    </svg>
  );

  if (variant === "symbol") return <div className={className}>{symbol}</div>;

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {symbol}
      {variant === "full" && (
        <span
          className={`font-bold text-[var(--color-text-primary)] tracking-wider ${s.text}`}
          style={{ fontFamily: "Space Grotesk, Geist, sans-serif" }}
        >
          ELION
        </span>
      )}
    </div>
  );
}
