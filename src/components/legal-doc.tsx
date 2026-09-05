import type { ReactNode } from "react";
import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export function LegalDoc({
  title,
  description,
  lastUpdated,
  sections,
  children,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
  children?: ReactNode;
}) {
  return (
    <div id="top" className="min-h-screen bg-[var(--color-surface)]">
      <LandingNav />
      <main>
        <div className="max-w-5xl mx-auto px-6 py-14 sm:py-20">
          {/* Header */}
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-bright)] mb-4">
              ELION · Legal
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)] max-w-2xl">{description}</p>
            <div className="mt-5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                Last updated: {lastUpdated}
              </span>
              {children}
            </div>
          </header>

          <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
            {/* Section nav */}
            <aside className="hidden lg:block self-start" aria-label="Document sections">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                  Contents
                </p>
                <ol className="space-y-0.5 border-l border-[var(--color-border)]">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="flex gap-2 items-start text-[13px] leading-snug border-l-2 -ml-px pl-3 py-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors border-transparent"
                      >
                        <span className="text-[10px] text-[var(--color-text-muted)]/60 mt-0.5 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/docs"
                  className="inline-block mt-6 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  ← Browse documentation
                </Link>
              </div>
            </aside>

            {/* Content */}
            <div className="min-w-0 max-w-[65ch]">
              <div className="lg:hidden mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                  Contents
                </p>
                <ol className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {sections.map((s, i) => (
                    <li key={s.id} className="text-xs">
                      <a href={`#${s.id}`} className="text-[var(--color-accent-bright)] hover:underline underline-offset-2">
                        {i + 1}. {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>

              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-heading`}
                  className={i > 0 ? "mt-12 border-t border-[var(--color-border)] pt-10" : undefined}
                >
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-xs font-semibold text-[var(--color-accent-bright)] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2
                      id={`${s.id}-heading`}
                      className="scroll-mt-28 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]"
                    >
                      {s.title}
                    </h2>
                  </div>
                  <div className="space-y-4 text-[15px] leading-7 text-[var(--color-text-secondary)]">
                    {s.body}
                  </div>
                </section>
              ))}

              <div className="mt-14 border-t border-[var(--color-border)] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <a
                  href="#top"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  ↑ Back to top
                </a>
                <p className="text-xs text-[var(--color-text-muted)]/80">
                  Questions?{" "}
                  <a href="mailto:legal@elion.com.ng" className="text-[var(--color-accent-bright)] hover:underline underline-offset-2">
                    legal@elion.com.ng
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Small styled body helpers for legal content. */
export function LP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function LUL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[11px] h-1 w-1 rounded-full bg-[var(--color-accent)]/60 shrink-0" aria-hidden />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Amber marker for items pending legal/owner review. */
export function LegalReview({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-4 py-3 text-sm leading-6 text-[var(--color-warning)]">
      ⚠ Pending review  · {children}
    </div>
  );
}
