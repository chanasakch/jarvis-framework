import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock } from "@/components/mdx/code-block";
import { StatusBadge, type Approval, type PhaseStatus, type Severity } from "@/components/mdx/status-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Internal visual QA page — excluded from the sitemap and production nav (see
// lib/seo/sitemap-entries.ts and components/layout/header.tsx). Not localized: this is
// for reviewing the token layer, not end-user content.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  { label: "Base", tokens: ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground"] },
  { label: "Interactive", tokens: ["primary", "primary-foreground", "secondary", "secondary-foreground", "accent", "accent-foreground", "muted", "muted-foreground"] },
  { label: "Structure", tokens: ["border", "input", "ring", "destructive", "destructive-foreground"] },
  { label: "Brand", tokens: ["brand", "brand-foreground"] },
];

const PHASES: PhaseStatus[] = ["pending", "in_progress", "gate_failed", "passed", "approved", "forced", "skipped", "blocked", "parked"];
const SEVERITIES: Severity[] = ["critical", "major", "minor", "info"];
const APPROVALS: Approval[] = ["human", "none"];

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-8 shrink-0 rounded-md ring-1 ring-border"
        style={{ backgroundColor: `var(--${token})` }}
      />
      <code className="text-xs text-muted-foreground">--{token}</code>
    </div>
  );
}

const SAMPLE_CODE = `// apps/api/internal/otp/repository_mysql.go
func (r *Repo) FindByPhone(ctx context.Context, phone string) (*OTP, error) {
	const q = "SELECT id, code, expires_at FROM otps WHERE phone = ?"
	row := r.db.QueryRowContext(ctx, q, phone)
	var otp OTP
	if err := row.Scan(&otp.ID, &otp.Code, &otp.ExpiresAt); err != nil {
		return nil, fmt.Errorf("find otp by phone: %w", err)
	}
	return &otp, nil
}`;

export default async function TokensDevPage() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl space-y-10 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Design tokens</h1>
          <p className="text-sm text-muted-foreground">Internal QA page — not linked from the site.</p>
        </div>
        <ThemeToggle />
      </header>

      <section aria-labelledby="colors-h" className="space-y-4">
        <h2 id="colors-h" className="text-base font-semibold">Colors</h2>
        <p className="text-sm text-muted-foreground">
          Toggle the theme above to review dark mode — every swatch reads its live CSS variable,
          nothing here is a hard-coded hex value.
        </p>
        {COLOR_GROUPS.map((g) => (
          <div key={g.label} className="space-y-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{g.label}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.tokens.map((t) => (
                <Swatch key={t} token={t} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <Separator />

      <section aria-labelledby="type-h" className="space-y-3">
        <h2 id="type-h" className="text-base font-semibold">Type scale</h2>
        <p className="text-display-lg font-semibold tracking-tight">Display lg</p>
        <p className="text-display-md font-semibold tracking-tight">Display md</p>
        <p className="text-display-sm font-semibold tracking-tight">Display sm</p>
        <p className="text-2xl font-semibold tracking-tight">Heading 2xl</p>
        <p className="text-xl font-semibold">Heading xl</p>
        <p className="text-base font-medium">Body base — font-medium</p>
        <p className="text-sm">Body sm — the default paragraph size</p>
        <p className="text-xs text-muted-foreground">Caption xs — muted-foreground</p>
        <p className="font-mono text-sm">font-mono — JetBrains Mono, used for code and IDs</p>
      </section>

      <Separator />

      <section aria-labelledby="radius-h" className="space-y-3">
        <h2 id="radius-h" className="text-base font-semibold">Radius scale</h2>
        <div className="flex flex-wrap items-end gap-4">
          {/* Literal class names, not interpolated — Tailwind's scanner only sees string literals. */}
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-sm bg-primary" />
            <code className="text-xs text-muted-foreground">rounded-sm</code>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-md bg-primary" />
            <code className="text-xs text-muted-foreground">rounded-md</code>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-lg bg-primary" />
            <code className="text-xs text-muted-foreground">rounded-lg</code>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-xl bg-primary" />
            <code className="text-xs text-muted-foreground">rounded-xl</code>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-full bg-primary" />
            <code className="text-xs text-muted-foreground">rounded-full (badges/pills)</code>
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="badges-h" className="space-y-4">
        <h2 id="badges-h" className="text-base font-semibold">Status badges</h2>
        <p className="text-sm text-muted-foreground">Every value: icon + label + color, never color alone.</p>
        <div className="space-y-3">
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Phase status</h3>
            <div className="flex flex-wrap gap-2">
              {PHASES.map((p) => (
                <StatusBadge key={p} kind="phase" value={p} label={p} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Severity</h3>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <StatusBadge key={s} kind="severity" value={s} label={s} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Approval</h3>
            <div className="flex flex-wrap gap-2">
              {APPROVALS.map((a) => (
                <StatusBadge key={a} kind="approval" value={a} label={a === "human" ? "human approval" : "no approval"} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Plain badge</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">neutral</Badge>
              <Badge variant="outline">outline</Badge>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="buttons-h" className="space-y-4">
        <h2 id="buttons-h" className="text-base font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
        <Input placeholder="Input field" className="max-w-xs" />
      </section>

      <Separator />

      <section aria-labelledby="callouts-h" className="space-y-2">
        <h2 id="callouts-h" className="text-base font-semibold">Callouts</h2>
        <Callout kind="note" title="Note">This is background information, no action required.</Callout>
        <Callout kind="tip" title="Tip">A shortcut or a better way to do something.</Callout>
        <Callout kind="warning" title="Warning">Something that could go wrong if ignored.</Callout>
        <Callout kind="danger" title="Danger">A destructive or irreversible action.</Callout>
      </section>

      <Separator />

      <section aria-labelledby="card-h" className="space-y-2">
        <h2 id="card-h" className="text-base font-semibold">Card</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Resting surface</CardTitle>
            <CardDescription>1px ring, never a shadow — shadows are reserved for floating surfaces.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">ring-1 ring-foreground/10, rounded-xl.</CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="code-h" className="space-y-2">
        <h2 id="code-h" className="text-base font-semibold">Code block</h2>
        <CodeBlock code={SAMPLE_CODE} lang="go" filename="repository_mysql.go" />
      </section>
    </main>
  );
}
