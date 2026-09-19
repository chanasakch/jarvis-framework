import fs from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { compileMDX } from "next-mdx-remote/rsc";

import { getMdxComponents } from "@/components/mdx/mdx-components";
import type { Heading } from "@/components/layout/docs-toc";
import type { Locale } from "@/lib/i18n";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export interface DocFrontmatter {
  title: string;
  description?: string;
}

export function docMdxPath(locale: Locale, slug: string): string {
  return path.join(CONTENT_ROOT, locale, "docs", `${slug}.mdx`);
}

export function docExists(locale: Locale, slug: string): boolean {
  return fs.existsSync(docMdxPath(locale, slug));
}

/** Same slugger rehype-slug uses, run in the same per-document, order-dependent,
 *  duplicate-safe way — so a TOC id here always matches the id actually rendered on
 *  the heading (rehype-slug runs during compileMDX below). */
function extractHeadings(source: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const line of source.split("\n")) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1]?.length === 2 ? 2 : 3;
    const text = (m[2] ?? "").replace(/[*_`]/g, "");
    headings.push({ id: slugger.slug(text), text, level });
  }
  return headings;
}

export async function loadDoc(locale: Locale, slug: string) {
  const filePath = docMdxPath(locale, slug);
  const source = fs.readFileSync(filePath, "utf8");
  const headings = extractHeadings(source);

  const { content, frontmatter } = await compileMDX<DocFrontmatter>({
    source,
    components: getMdxComponents(locale),
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return { content, frontmatter, headings };
}
