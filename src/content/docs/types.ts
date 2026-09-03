import type { ReactNode } from "react";

export interface DocSection {
  id: string;
  title: string;
}

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  /** Categories/keywords used by docs search. */
  keywords: string[];
  /** Display date, e.g. "September 2026". */
  updated: string;
  /** Anchor sections mirrored by the article body's DocH2 ids. */
  toc: DocSection[];
  body: ReactNode;
}

export interface DocCategory {
  slug: string;
  title: string;
  description: string;
  articles: DocArticle[];
}

export interface FlatArticle extends DocArticle {
  categorySlug: string;
  categoryTitle: string;
}
