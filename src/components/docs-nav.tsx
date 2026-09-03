"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_CATEGORIES } from "@/content/docs";
import { cn } from "@/lib/utils";

/** Mobile-only horizontal category chips, sticky under the docs header. */
export function DocsMobileChips() {
  const pathname = usePathname();
  const isDocsHome = pathname === "/docs";
  return (
    <nav
      aria-label="Documentation sections"
      className="lg:hidden sticky top-14 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/95 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 overflow-x-auto py-3 [-webkit-overflow-scrolling:touch] scrollbar-none">
        <Link
          href="/docs"
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            isDocsHome
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)] border-[var(--color-accent)]/30"
              : "text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
          )}
        >
          Overview
        </Link>
        {DOC_CATEGORIES.map((cat) => {
          const active = pathname.startsWith(`/docs/${cat.slug}`);
          return (
            <Link
              key={cat.slug}
              href={`/docs/${cat.slug}`}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)] border-[var(--color-accent)]/30"
                  : "text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {cat.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Desktop-only sticky sidebar with every category and article. */
export function DocsSidebar() {
  const pathname = usePathname();
  const isDocsHome = pathname === "/docs";

  const articleActive = (catSlug: string, slug: string) =>
    pathname === `/docs/${catSlug}/${slug}`;

  return (
    <aside className="hidden lg:block self-start">
      <div className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-3 pb-8 -mr-3">
        <Link
          href="/docs"
          className={cn(
            "block text-sm font-medium rounded-lg px-3 py-2 transition-colors",
            isDocsHome
              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
          )}
        >
          Documentation home
        </Link>
        <div className="space-y-6 mt-5">
          {DOC_CATEGORIES.map((cat) => {
            const categoryPageActive = pathname === `/docs/${cat.slug}`;
            return (
              <div key={cat.slug}>
                <Link
                  href={`/docs/${cat.slug}`}
                  className={cn(
                    "flex items-center justify-between text-xs font-semibold uppercase tracking-wider px-3 mb-2 transition-colors",
                    categoryPageActive
                      ? "text-[var(--color-accent-bright)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {cat.title}
                  <span className="text-[10px] font-normal normal-case tracking-normal text-[var(--color-text-muted)]/70">
                    {cat.articles.length}
                  </span>
                </Link>
                <ul className="space-y-px border-l border-[var(--color-border)] ml-3">
                  {cat.articles.map((a) => {
                    const active = articleActive(cat.slug, a.slug);
                    return (
                      <li key={a.slug}>
                        <Link
                          href={`/docs/${cat.slug}/${a.slug}`}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "block text-[13px] leading-snug rounded-r-md border-l-2 py-1.5 pl-3 pr-2 transition-colors -ml-px",
                            active
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-text-primary)] font-medium"
                              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                          )}
                        >
                          {a.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
