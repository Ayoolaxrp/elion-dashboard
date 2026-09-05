import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Small rendering helpers for documentation bodies. No animation,    */
/* minimal footprint : reading speed first.                            */
/* ------------------------------------------------------------------ */

function Anchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label="Link to this section"
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[var(--color-accent-bright)] no-underline -ml-5 pr-1 inline-block align-middle"
    >
      #
    </a>
  );
}

export function DocH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="group scroll-mt-28 text-xl font-semibold tracking-tight text-[var(--color-text-primary)] mt-12 mb-3"
    >
      <Anchor id={id} />
      {children}
    </h2>
  );
}

export function DocH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)] mt-8 mb-2">
      {children}
    </h3>
  );
}

export function DocP({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-7 text-[var(--color-text-secondary)] mb-4">
      {children}
    </p>
  );
}

export function DocLead({ children }: { children: ReactNode }) {
  return (
    <p className="text-base leading-7 text-[var(--color-text-muted)] mb-6">
      {children}
    </p>
  );
}

export function DocUL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5 mb-5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-6 text-[var(--color-text-secondary)]">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]/70" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocOL({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5 mb-5 list-none counter-reset-none">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-6 text-[var(--color-text-secondary)]">
          <span className="mt-0.5 shrink-0 h-5 min-w-5 px-1 flex items-center justify-center rounded text-[11px] font-semibold bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

type CalloutVariant = "info" | "warn" | "review";

const CALLOUT_STYLES: Record<CalloutVariant, { border: string; label: string; icon: string }> = {
  info: {
    border: "border-[var(--color-accent)]/30",
    label: "text-[var(--color-accent-bright)]",
    icon: "i",
  },
  warn: {
    border: "border-[var(--color-warning)]/40",
    label: "text-[var(--color-warning)]",
    icon: "!",
  },
  review: {
    border: "border-[var(--color-warning)]/40",
    label: "text-[var(--color-warning)]",
    icon: "◷",
  },
};

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title: string;
  children: ReactNode;
}) {
  const s = CALLOUT_STYLES[variant];
  return (
    <aside className={`rounded-xl border ${s.border} bg-[var(--color-surface-elevated)]/50 px-5 py-4 mb-6`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${s.label} mb-1.5`}>
        {title}
      </p>
      <div className="text-sm leading-6 text-[var(--color-text-secondary)]">{children}</div>
    </aside>
  );
}

/** Marks a specific legal/doc statement as pending owner/legal review. */
export function ReviewFlag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block mt-1 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-2 py-1 text-xs leading-5 text-[var(--color-warning)]">
      ⚠ Pending review  · {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-1.5 py-0.5 text-[13px] text-[var(--color-text-primary)] font-mono">
      {children}
    </code>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-1.5 py-0.5 text-[13px] text-[var(--color-text-primary)] font-mono">
      {children}
    </code>
  );
}

export function DocDivider() {
  return <hr className="my-10 border-[var(--color-border)]" aria-hidden />;
}
