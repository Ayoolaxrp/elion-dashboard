import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { DOC_CATEGORIES, getDocCategory, formatReadingTime } from "@/content/docs";

export const dynamicParams = true;

export function generateStaticParams() {
  return DOC_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getDocCategory(slug);
  if (!cat) return { title: "Documentation" };
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: `/docs/${cat.slug}` },
  };
}

export default async function DocsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = getDocCategory(slug);
  if (!cat) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--color-text-primary)] transition-colors">Home</Link>
        <span className="mx-2" aria-hidden>/</span>
        <Link href="/docs" className="hover:text-[var(--color-text-primary)] transition-colors">
          Documentation
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-[var(--color-text-secondary)]">{cat.title}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">{cat.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">{cat.description}</p>
      </header>

      <div className="space-y-3">
        {cat.articles.map((article) => (
          <Link
            key={article.slug}
            href={`/docs/${cat.slug}/${article.slug}`}
            className="group flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 transition-colors hover:border-[var(--color-border-light)]"
          >
            <div className="p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shrink-0">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-bright)] transition-colors" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight group-hover:text-[var(--color-accent-bright)] transition-colors">
                {article.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{article.description}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]/70">
                {article.updated} · {formatReadingTime(article)}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] mt-1 group-hover:text-[var(--color-accent-bright)] group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
