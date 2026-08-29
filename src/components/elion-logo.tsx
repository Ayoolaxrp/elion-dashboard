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
      <rect width="32" height="32" rx="6" fill="#18181b" />
      <path
        d="M8 8h4v12H8V8zm0 12h8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 12h4v8h-4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );

  if (variant === "symbol") return <div className={className}>{symbol}</div>;

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {symbol}
      {variant === "full" && (
        <span className={`font-bold text-zinc-900 tracking-tight ${s.text}`}>ELION</span>
      )}
    </div>
  );
}
