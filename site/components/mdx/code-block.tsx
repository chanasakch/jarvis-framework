import { CopyButton } from "@/components/ui/copy-button";
import { highlight } from "@/lib/shiki";
import { cn } from "@/lib/utils";

/**
 * Filename tab + language label + copy button, wrapping build-time Shiki output.
 * The highlighted HTML comes only from our own source strings (MDX authored in this
 * repo, or code samples we write) — never third-party or user input — so rendering it
 * with dangerouslySetInnerHTML is the standard, safe pattern every static-site code
 * highlighter uses (re-parsing Shiki's HTML into React elements would add nothing).
 */
export async function CodeBlock({
  code,
  lang,
  filename,
  className,
}: {
  code: string;
  lang: string;
  filename?: string;
  className?: string;
}) {
  const html = await highlight(code.trimEnd(), lang);

  return (
    <div
      data-slot="code-block"
      className={cn("group relative my-4 overflow-hidden rounded-lg border border-code-border", className)}
    >
      <div className="flex items-center justify-between border-b border-code-border bg-code-bg px-3 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{filename ?? lang}</span>
        <div className="flex items-center gap-2">
          {filename && <span className="text-xs text-muted-foreground">{lang}</span>}
          <CopyButton value={code} />
        </div>
      </div>
      {/* tabIndex + role: WCAG 2.1.1/2.1.3 — a long code line scrolls horizontally with
          no focusable content inside it otherwise, so the region itself must be a
          keyboard-reachable scroll target (found by axe-core on a real docs page). */}
      <div
        role="region"
        aria-label={filename ?? lang}
        tabIndex={0}
        className="overflow-x-auto text-sm [&_.shiki]:m-0 [&_.shiki]:p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
