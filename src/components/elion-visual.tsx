"use client";

interface ElionVisualProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ElionVisual({ size = "md", className = "" }: ElionVisualProps) {
  const s = { sm: 80, md: 120, lg: 160 }[size];
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="58" stroke="var(--color-border)" strokeWidth="1" fill="none" />

      {/* Scattered nodes (complexity) */}
      <circle cx="20" cy="30" r="3" fill="var(--color-text-muted)" opacity="0.3" />
      <circle cx="35" cy="15" r="2" fill="var(--color-text-muted)" opacity="0.2" />
      <circle cx="15" cy="55" r="2.5" fill="var(--color-text-muted)" opacity="0.25" />
      <circle cx="40" cy="80" r="2" fill="var(--color-text-muted)" opacity="0.2" />
      <circle cx="100" cy="25" r="2" fill="var(--color-text-muted)" opacity="0.2" />
      <circle cx="95" cy="45" r="3" fill="var(--color-text-muted)" opacity="0.3" />
      <circle cx="105" cy="70" r="2" fill="var(--color-text-muted)" opacity="0.2" />
      <circle cx="85" cy="90" r="2.5" fill="var(--color-text-muted)" opacity="0.25" />

      {/* Paths converging to center (structure) */}
      <path d="M20 30 Q40 45 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M35 15 Q47 37 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M15 55 Q37 57 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M40 80 Q50 70 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M100 25 Q80 42 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M95 45 Q77 52 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M105 70 Q82 65 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M85 90 Q72 75 60 60" stroke="var(--color-border-light)" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Central hub (automation) */}
      <circle cx="60" cy="60" r="8" fill="var(--color-accent)" opacity="0.15" />
      <circle cx="60" cy="60" r="4" fill="var(--color-accent)" />

      {/* Output paths (structured output) */}
      <path d="M60 60 L60 20" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />
      <path d="M60 60 L95 50" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />
      <path d="M60 60 L60 100" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />

      {/* Output nodes */}
      <circle cx="60" cy="20" r="2.5" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="95" cy="50" r="2.5" fill="var(--color-accent)" opacity="0.6" />
      <circle cx="60" cy="100" r="2.5" fill="var(--color-accent)" opacity="0.6" />
    </svg>
  );
}
