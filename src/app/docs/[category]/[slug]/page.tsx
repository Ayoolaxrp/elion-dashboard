import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, LifeBuoy } from "lucide-react";
import {
  DOC_CATEGORIES,
  getDocCategory,
  getDocArticle,
  getPrevNext,
  formatReadingTime,
  docPath,
} from "@/content/docs";

export const dynamicParams = true;

export function generateStaticParams() {
  return DOC_CATEGORIES.flatMap((cat) =>
    cat.articles.map((a) => ({ category: cat.slug, slug: a.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category: catSlug, slug } = await params;
  const article = getDocArticle(catSlug, slug);
  if (!article) return { title: "Documentation" };
  return {
    title: `${article.title}  · Docs`,
    description: article.description,
    alternates: { canonical: docPath(catSlug, slug) },
  };
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: catSlug, slug } = await params;
  const cat = getDocCategory(catSlug);
  const article = cat ? getDocArticle(catSlug, slug) : undefined;
  if (!cat || !article) notFound();

  const { prev, next } = getPrevNext(catSlug, slug);

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-text-primary)] transition-colors">Home</Link>
        <span className="mx-2" aria-hidden>/</span>
        <Link href="/docs" className="hover:text-[var(--color-text-primary)] transition-colors">
          Documentation
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <Link href={`/docs/${cat.slug}`} className="hover:text-[var(--color-text-primary)] transition-colors">
          {cat.title}
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-[var(--color-text-secondary)]">{article.title}</span>
      </nav>

      {/* Title */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
          <span className="px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent-bright)] font-medium">
            {cat.title}
          </span>
          <span className="text-[var(--color-text-muted)]">Updated {article.updated}</span>
          <span aria-hidden>·</span>
          <span className="text-[var(--color-text-muted)]">{formatReadingTime(article)}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {article.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-[var(--color-text-muted)]">
          {article.description}
        </p>
      </header>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_180px] xl:gap-12">
        {/* Article body */}
        <article className="min-w-0 max-w-2xl pb-4">{article.body}</article>

        {/* On this page (desktop) */}
        {article.toc.length > 0 && (
          <aside className="hidden xl:block self-start">
            <nav aria-label="On this page" className="sticky top-24">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                On this page
              </p>
              <ul className="space-y-1.5 border-l border-[var(--color-border)]">
                {article.toc.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`block text-[12.5px] leading-snug border-l-2 -ml-px pl-3 transition-colors ${
                        i === 0
                          ? "border-[var(--color-accent)] text-[var(--color-text-primary)] font-medium"
                          : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="/docs"
                className="inline-block mt-6 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                ← All documentation
              </a>
            </nav>
          </aside>
        )}
      </div>

      {/* Prev / next */}
      <nav aria-label="Article navigation" className="mt-12 border-t border-[var(--color-border)] pt-6 grid sm:grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={docPath(prev.categorySlug, prev.slug)}
            className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3.5 transition-colors hover:border-[var(--color-border-light)]"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-bright)] shrink-0 transition-colors" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Previous</span>
              <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}
        {next && (
          <Link
            href={docPath(next.categorySlug, next.slug)}
            className="group flex items-center justify-end gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3.5 transition-colors hover:border-[var(--color-border-light)] sm:justify-start sm:flex-row-reverse sm:text-right"
          >
            <span className="min-w-0 sm:text-right">
              <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Next</span>
              <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">{next.title}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-bright)] shrink-0 transition-colors" aria-hidden />
          </Link>
        )}
      </nav>

      {/* Support CTA */}
      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <LifeBuoy className="w-5 h-5 text-[var(--color-accent-bright)] mt-0.5 shrink-0" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Need help with this?</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Contact ELION support and we&apos;ll point you to the right answer.
            </p>
          </div>
        </div>
        <Link
          href="/landing/support"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-light)] transition-colors"
        >
          Contact support
          <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
