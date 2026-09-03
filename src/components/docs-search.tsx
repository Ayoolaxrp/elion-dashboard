"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export interface SearchableDoc {
  categorySlug: string;
  categoryTitle: string;
  slug: string;
  title: string;
  description: string;
}

const MAX_RESULTS = 8;

export function DocsSearch({ docs }: { docs: SearchableDoc[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return docs
      .map((d) => {
        const hay = `${d.title} ${d.description} ${d.categoryTitle}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (hay.includes(t)) score += 1;
          if (d.title.toLowerCase().includes(t)) score += 3;
        }
        return { d, score };
      })
      .filter((r) => r.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.d);
  }, [q, docs]);

  const showPanel = focused && q.length >= 2;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search documentation…"
          aria-label="Search documentation"
          className="w-full h-12 pl-11 pr-11 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[15px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]/60 focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--color-text-muted)] text-center">
              No results for &ldquo;{query}&rdquo;. Try &ldquo;calendar&rdquo;, &ldquo;booking&rdquo; or &ldquo;pending&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {results.map((r) => (
                <li key={`${r.categorySlug}/${r.slug}`}>
                  <Link
                    href={`/docs/${r.categorySlug}/${r.slug}`}
                    onMouseDown={(e) => e.preventDefault()}
                    className="block px-4 py-3 hover:bg-[var(--color-surface-elevated)]/60 transition-colors"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{r.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{r.description}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent-bright)] mt-1">
                      {r.categoryTitle}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
