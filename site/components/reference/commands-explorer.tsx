"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import generatedTh from "@/content/i18n/generated.th.json";
import type { CliCommand, SlashCommand } from "@/lib/generated/schemas";
import { translate } from "@/lib/generated/translatable";
import type { Dictionary, Locale } from "@/lib/i18n";

// Thai translations for generated content are a small static JSON, safe to inline at
// build time — see content/i18n/generated.th.json and lib/generated/translatable.ts.
function translationsFor(locale: Locale): Record<string, string> {
  return locale === "th" ? (generatedTh as Record<string, string>) : {};
}

function CommandCard({ title, description, example, argsLabel, args }: {
  title: string;
  description: string;
  example: string;
  argsLabel: string;
  args?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <code className="font-mono text-sm font-medium">{title}</code>
        <CopyButton value={example} />
      </div>
      {args && (
        <p className="mt-1 text-xs text-muted-foreground">
          {argsLabel}: <code className="font-mono">{args}</code>
        </p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {/* tabIndex: same WCAG 2.1.1/2.1.3 fix as the other code containers on this site. */}
      <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-md bg-code-bg p-2 font-mono text-xs">
        {example}
      </pre>
    </div>
  );
}

export function CommandsExplorer({
  locale,
  dict,
  commands,
  cli,
}: {
  locale: Locale;
  dict: Dictionary;
  commands: SlashCommand[];
  cli: CliCommand[];
}) {
  const [query, setQuery] = useState("");
  const t = dict.reference.commands;
  const thDict = translationsFor(locale);

  const filteredCommands = useMemo(
    () =>
      commands.filter((c) => `${c.id} ${c.description}`.toLowerCase().includes(query.toLowerCase())),
    [commands, query],
  );
  const filteredCli = useMemo(
    () => cli.filter((c) => `${c.id} ${c.description}`.toLowerCase().includes(query.toLowerCase())),
    [cli, query],
  );

  return (
    <div className="not-prose">
      <div className="relative">
        <SearchIcon aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.filterPlaceholder}
          className="pl-9"
          aria-label={t.filterPlaceholder}
        />
      </div>

      <Tabs defaultValue="slash" className="mt-4">
        <TabsList>
          <TabsTrigger value="slash">{t.tabSlash}</TabsTrigger>
          <TabsTrigger value="cli">{t.tabCli}</TabsTrigger>
        </TabsList>

        <TabsContent value="slash" className="mt-4 space-y-3">
          {filteredCommands.length === 0 && <p className="text-sm text-muted-foreground">{t.noResults}</p>}
          {filteredCommands.map((c) => (
            <CommandCard
              key={c.id}
              title={c.id}
              description={translate(`command:${c.name}.description`, c.description, thDict).text}
              argsLabel={t.argumentsLabel}
              args={c.argumentHint}
              example={c.argumentHint && c.argumentHint !== "(no arguments)" ? `${c.id} ${c.argumentHint}` : c.id}
            />
          ))}
        </TabsContent>

        <TabsContent value="cli" className="mt-4 space-y-3">
          {filteredCli.length === 0 && <p className="text-sm text-muted-foreground">{t.noResults}</p>}
          {filteredCli.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <code className="font-mono text-sm font-medium">{c.usage}</code>
                <div className="flex items-center gap-2">
                  {c.humanOnly && <Badge variant="outline">{t.humanOnlyBadge}</Badge>}
                  <CopyButton value={c.humanOnly ? `npm run -s jarvis -- ${c.usage}` : `node .jarvis/scripts/jarvis.js ${c.usage}`} />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{translate(`cli:${c.id}.description`, c.description, thDict).text}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
