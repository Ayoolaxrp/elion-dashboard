import type { DocArticle, DocCategory, FlatArticle } from "./types";
import { gettingStarted } from "./getting-started";
import { clientGuide } from "./client-guide";
import { automations } from "./automations";
import { billing } from "./billing";
import { security } from "./security";
import { troubleshooting } from "./troubleshooting";

export type { DocArticle, DocCategory, FlatArticle };

export const DOC_CATEGORIES: DocCategory[] = [
  gettingStarted,
  clientGuide,
  automations,
  billing,
  security,
  troubleshooting,
];

/** Flat, ordered list of every article (JSX bodies excluded) for navigation + search. */
export const DOC_ARTICLES_FLAT: FlatArticle[] = DOC_CATEGORIES.flatMap((cat) =>
  cat.articles.map((a) => ({
    ...a,
    categorySlug: cat.slug,
    categoryTitle: cat.title,
  }))
);

export function getDocCategory(slug: string): DocCategory | undefined {
  return DOC_CATEGORIES.find((c) => c.slug === slug);
}

export function getDocArticle(categorySlug: string, slug: string): DocArticle | undefined {
  const cat = getDocCategory(categorySlug);
  return cat?.articles.find((a) => a.slug === slug);
}

export function docPath(categorySlug: string, slug: string): string {
  return `/docs/${categorySlug}/${slug}`;
}

/** Previous/next across the flattened article list for article-page navigation. */
export function getPrevNext(categorySlug: string, slug: string) {
  const idx = DOC_ARTICLES_FLAT.findIndex((a) => a.categorySlug === categorySlug && a.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined };
  return {
    prev: idx > 0 ? DOC_ARTICLES_FLAT[idx - 1] : undefined,
    next: idx < DOC_ARTICLES_FLAT.length - 1 ? DOC_ARTICLES_FLAT[idx + 1] : undefined,
  };
}

export function formatReadingTime(article: DocArticle): string {
  let words = 0;
  const walk = (node: unknown): void => {
    if (node == null || typeof node === "boolean") return;
    if (typeof node === "string" || typeof node === "number") {
      words += String(node).split(/\s+/).filter(Boolean).length;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const el = node as { props?: { children?: unknown } };
      if (el.props) walk(el.props.children);
    }
  };
  walk(article.body);
  return `${Math.max(1, Math.round(words / 190))} min read`;
}
