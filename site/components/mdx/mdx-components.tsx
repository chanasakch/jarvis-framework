import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps, ReactElement } from "react";

import { CodeBlock } from "@/components/mdx/code-block";
import { StatusBadge } from "@/components/mdx/status-badge";
import { Callout } from "@/components/mdx/callout";
import { File, Folder, FileTree } from "@/components/mdx/file-tree";
import { Step, Steps } from "@/components/mdx/steps";
import { RoleMap } from "@/components/sdlc/role-map";
import { SdlcLifecycle } from "@/components/sdlc/sdlc-lifecycle";
import { TraceChain } from "@/components/sdlc/trace-chain";
import { StandardsIndex } from "@/components/reference/standards-index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDictionary, localizeHref, type Locale } from "@/lib/i18n";

/**
 * MDX authoring convention: files never include an H1 — the page title comes from
 * frontmatter and is rendered by DocsShell; content starts at `##` (level 2), matching
 * lib/content/mdx.ts's heading extractor (level 2-3 only). Internal links are always
 * written locale-relative (`/docs/gates`, never `/th/docs/gates`) in BOTH the English
 * and Thai source — the Anchor component below prefixes them for the current locale at
 * render time, so a translated page never has to remember to add /th by hand.
 */

// Real bug an axe-core run caught: with no override, a link inside MDX prose inherited
// the same color as its surrounding text (both from the `p` override below), so it had
// no visual distinction at all (WCAG 1.4.1). Underline + brand color fixes it in both
// themes without depending on color alone.
const LINK_CLASS = "font-medium text-brand underline underline-offset-2 hover:text-brand/80";

function makeAnchor(locale: Locale) {
  return function Anchor({ href = "", className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    const cls = className ? `${LINK_CLASS} ${className}` : LINK_CLASS;
    if (href.startsWith("#")) return <Link href={href} className={cls} {...props} />;
    if (href.startsWith("/")) return <Link href={localizeHref(locale, href)} className={cls} {...props} />;
    return <a href={href} target="_blank" rel="noreferrer noopener" className={cls} {...props} />;
  };
}

// MDX gives fenced code as <pre><code className="language-x">text</code></pre>; unwrap
// it and render through the real Shiki pipeline instead of a plain <pre>.
function Pre({ children }: { children: ReactElement<{ className?: string; children?: string }> }) {
  const codeProps = children?.props ?? {};
  const lang = (codeProps.className ?? "").replace("language-", "") || "text";
  const code = typeof codeProps.children === "string" ? codeProps.children : "";
  return <CodeBlock code={code} lang={lang} />;
}

export function getMdxComponents(locale: Locale) {
  return {
  a: makeAnchor(locale),
  pre: Pre,
  h2: (props: ComponentProps<"h2">) => <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight scroll-mt-24" {...props} />,
  h3: (props: ComponentProps<"h3">) => <h3 className="mt-8 mb-2 text-lg font-semibold tracking-tight scroll-mt-24" {...props} />,
  p: (props: ComponentProps<"p">) => <p className="my-4 text-sm leading-relaxed text-foreground/90" {...props} />,
  ul: (props: ComponentProps<"ul">) => <ul className="my-4 list-disc space-y-1 pl-6 text-sm" {...props} />,
  ol: (props: ComponentProps<"ol">) => <ol className="my-4 list-decimal space-y-1 pl-6 text-sm" {...props} />,
  li: (props: ComponentProps<"li">) => <li className="text-foreground/90" {...props} />,
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="my-4 border-l-2 border-border pl-4 text-sm text-muted-foreground italic" {...props} />
  ),
  hr: (props: ComponentProps<"hr">) => <hr className="my-8 border-border" {...props} />,
  code: (props: ComponentProps<"code">) => (
    <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  table: (props: ComponentProps<"table">) => (
    // tabIndex + role: an axe-core run found this scrollable region had no keyboard
    // access on narrow viewports (WCAG 2.1.1/2.1.3) — a mouse-drag-only horizontal
    // scroll with no way to reach it via keyboard.
    <div role="region" aria-label="Table" tabIndex={0} className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentProps<"thead">) => <thead className="border-b border-border bg-muted/50" {...props} />,
  th: (props: ComponentProps<"th">) => <th className="px-3 py-2 text-left font-medium" {...props} />,
  td: (props: ComponentProps<"td">) => <td className="border-t border-border px-3 py-2 align-top" {...props} />,

  Callout,
  Steps,
  Step,
  FileTree,
  Folder,
  File,
  StatusBadge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  StandardsIndex: () => <StandardsIndex locale={locale} />,
  SdlcLifecycle: () => <SdlcLifecycle dict={getDictionary(locale)} />,
  RoleMap: () => <RoleMap dict={getDictionary(locale)} />,
  TraceChain: () => <TraceChain dict={getDictionary(locale)} />,
  };
}
