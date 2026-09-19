import type { ReactNode } from "react";

/** `<Steps><Step title="Install">...</Step><Step title="Verify">...</Step></Steps>` —
 *  numbered, connected steps for sequential instructions (getting-started, etc.). The
 *  number itself is a CSS counter, not a static index, so steps can be reordered or
 *  added in MDX without any prop bookkeeping. */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="my-6 space-y-0 [counter-reset:step]">{children}</div>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative pb-8 pl-10 last:pb-0 [counter-increment:step]">
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground before:content-[counter(step)]"
      />
      <span className="absolute top-7 left-3.5 h-[calc(100%-1.75rem)] w-px bg-border last:hidden" />
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-1 space-y-2 text-sm text-muted-foreground [&_a]:text-foreground [&_code]:text-foreground">
        {children}
      </div>
    </div>
  );
}
