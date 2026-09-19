import { Ban, FileCode2, GitBranch, Hash, ShieldCheck, Users2, type LucideIcon } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n";

const ICONS: Record<keyof Dictionary["landing"]["features"]["items"], LucideIcon> = {
  orchestrator: GitBranch,
  gates: ShieldCheck,
  traceability: Hash,
  standards: FileCode2,
  hooks: Ban,
  team: Users2,
};

export function FeatureGrid({ dict }: { dict: Dictionary }) {
  const { features } = dict.landing;
  const items = Object.entries(features.items) as [keyof Dictionary["landing"]["features"]["items"], { title: string; body: string }][];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{features.heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{features.subhead}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([key, item]) => {
          const Icon = ICONS[key];
          return (
            <Card key={key}>
              <CardHeader>
                <Icon aria-hidden="true" className="mb-2 size-5 text-brand" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
