import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { stagger } from "@/lib/reveal";
import generatedTh from "@/content/i18n/generated.th.json";
import type { Agent } from "@/lib/generated/schemas";
import { translate } from "@/lib/generated/translatable";
import type { Dictionary, Locale } from "@/lib/i18n";

export function AgentsCatalog({ locale, dict, agents }: { locale: Locale; dict: Dictionary; agents: Agent[] }) {
  const thDict = locale === "th" ? (generatedTh as Record<string, string>) : {};
  const t = dict.reference.agents;

  return (
    <Reveal className="not-prose grid gap-4 sm:grid-cols-2">
      {agents.map((a, i) => (
        <Card key={a.id} style={stagger(i)} className="reveal">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-mono text-sm">{a.id}</CardTitle>
              <Badge variant="neutral">{a.model}</Badge>
            </div>
            <CardDescription>{translate(`agent:${a.id}.description`, a.description, thDict).text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-muted-foreground">{translate(`agent:${a.id}.role`, a.role, thDict).text}</p>
            {a.modes && (
              <p>
                <span className="font-medium">{t.modesLabel}:</span>{" "}
                <span className="font-mono text-muted-foreground">{a.modes.join(", ")}</span>
              </p>
            )}
            <p>
              <span className="font-medium">{t.toolsLabel}:</span>{" "}
              <span className="font-mono text-muted-foreground">{a.tools.join(", ")}</span>
            </p>
            <p>
              <span className="font-medium">{t.inputsLabel}:</span> <span className="text-muted-foreground">{a.inputs}</span>
            </p>
            <p>
              <span className="font-medium">{t.outputsLabel}:</span>{" "}
              <span className="font-mono text-muted-foreground">{a.outputs}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </Reveal>
  );
}
