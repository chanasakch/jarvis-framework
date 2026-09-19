import generatedTh from "@/content/i18n/generated.th.json";
import type { ConfigKey } from "@/lib/generated/schemas";
import { translate } from "@/lib/generated/translatable";
import type { Dictionary, Locale } from "@/lib/i18n";

function groupBySection(keys: ConfigKey[]): Map<string, ConfigKey[]> {
  const groups = new Map<string, ConfigKey[]>();
  for (const k of keys) {
    const section = k.path.split(".")[0] ?? k.path;
    const list = groups.get(section) ?? [];
    list.push(k);
    groups.set(section, list);
  }
  return groups;
}

export function ConfigReference({ locale, dict, configKeys }: { locale: Locale; dict: Dictionary; configKeys: ConfigKey[] }) {
  const thDict = locale === "th" ? (generatedTh as Record<string, string>) : {};
  const t = dict.reference.config;
  const groups = groupBySection(configKeys);

  return (
    <div className="not-prose space-y-8">
      {[...groups.entries()].map(([section, keys]) => (
        <div key={section}>
          <h3 className="mb-2 font-mono text-sm font-semibold text-muted-foreground uppercase">{section}:</h3>
          {/* tabIndex + role: same WCAG 2.1.1/2.1.3 fix as mdx-components.tsx's table
              wrapper — a scrollable region must be keyboard-reachable. */}
          <div role="region" aria-label={section} tabIndex={0} className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t.pathHeader}</th>
                  <th className="px-3 py-2 text-left font-medium">{t.defaultHeader}</th>
                  <th className="px-3 py-2 text-left font-medium">{t.descriptionHeader}</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.path}>
                    <td className="border-t border-border px-3 py-2 align-top font-mono text-xs">{k.path}</td>
                    <td className="border-t border-border px-3 py-2 align-top font-mono text-xs text-muted-foreground">{k.default}</td>
                    <td className="border-t border-border px-3 py-2 align-top text-muted-foreground">
                      {translate(`config:${k.path}.description`, k.description, thDict).text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
