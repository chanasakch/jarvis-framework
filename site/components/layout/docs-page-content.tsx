import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AgentsCatalog } from "@/components/reference/agents-catalog";
import { CommandsExplorer } from "@/components/reference/commands-explorer";
import { ConfigReference } from "@/components/reference/config-reference";
import { SdlcPipeline } from "@/components/landing/sdlc-pipeline";
import { CommandMap } from "@/components/viz/command-map";
import { WorkflowMatrix } from "@/components/viz/workflow-matrix";
import { DOCS_SLUGS, type DocSlug } from "@/lib/content/nav";
import { docExists, loadDoc } from "@/lib/content/mdx";
import { getAgents, getCli, getCommands, getConfigKeys, getWorkflows } from "@/lib/generated/loaders";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo/alternates";

import { DocsShell } from "./docs-shell";
import type { Heading } from "./docs-toc";

/**
 * Shared implementation behind both app/(en)/docs/[...slug]/page.tsx and
 * app/th/docs/[...slug]/page.tsx (D-018's "thin wrapper, shared logic" pattern).
 *
 * Two kinds of docs page:
 *  - Reference (commands, agents, workflows, configuration): rendered from generated
 *    JSON via a dedicated component — never a hand-copied table (SITE_SPEC.md S6 rule).
 *  - Hand-written (everything else): real MDX under content/<locale>/docs/<slug>.mdx.
 */
const REFERENCE_SLUGS = new Set(["commands", "agents", "workflows", "configuration"]);

export function docsStaticParams() {
  return DOCS_SLUGS.map((slug) => ({ slug: [slug] }));
}

export function docsMetadata(locale: Locale, slugParts: string[]): Metadata {
  const slug = slugParts[0] as DocSlug | undefined;
  const dict = getDictionary(locale);
  if (!slug || !DOCS_SLUGS.includes(slug)) return {};
  const title = dict.docsNav[slug];
  return pageMetadata(locale, `/docs/${slug}`, title, dict.footer.tagline);
}

function ReferenceBody({ locale, dict, slug }: { locale: Locale; dict: Dictionary; slug: string }) {
  if (slug === "commands") {
    const commands = getCommands();
    const cli = getCli();
    return (
      <>
        <CommandMap dict={dict} commands={commands} cli={cli} />
        <CommandsExplorer locale={locale} dict={dict} commands={commands} cli={cli} />
      </>
    );
  }
  if (slug === "agents") return <AgentsCatalog locale={locale} dict={dict} agents={getAgents()} />;
  if (slug === "workflows") {
    const workflows = getWorkflows();
    return (
      <>
        <WorkflowMatrix dict={dict} workflows={workflows} />
        <SdlcPipeline dict={dict} workflows={workflows} embedded />
      </>
    );
  }
  return <ConfigReference locale={locale} dict={dict} configKeys={getConfigKeys()} />;
}

export async function DocsPageContent({ locale, slugParts }: { locale: Locale; slugParts: string[] }) {
  const slug = slugParts[0] as DocSlug | undefined;
  if (!slug || slugParts.length !== 1 || !DOCS_SLUGS.includes(slug)) notFound();

  const dict = getDictionary(locale);
  const title = dict.docsNav[slug];

  if (REFERENCE_SLUGS.has(slug)) {
    // Reference pages exist in one language of prose (the JSON they render is the same
    // for both locales; translated strings come from content/i18n/generated.th.json).
    const headings: Heading[] = [];
    return (
      <DocsShell locale={locale} dict={dict} activeSlug={slug} headings={headings}>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <ReferenceBody locale={locale} dict={dict} slug={slug} />
      </DocsShell>
    );
  }

  const translated = docExists(locale, slug);
  const sourceLocale: Locale = translated ? locale : "en";
  if (!docExists(sourceLocale, slug)) notFound();

  const { content, frontmatter, headings } = await loadDoc(sourceLocale, slug);

  return (
    <DocsShell locale={locale} dict={dict} activeSlug={slug} headings={headings} translated={translated}>
      <h1 className="text-2xl font-semibold tracking-tight">{frontmatter.title || title}</h1>
      {content}
    </DocsShell>
  );
}
