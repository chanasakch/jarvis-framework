import { Reveal } from "@/components/ui/reveal";
import type { Workflow } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { stagger } from "@/lib/reveal";
import { buildMatrix, type MatrixCell } from "@/lib/viz/workflow-matrix";
import { cn } from "@/lib/utils";

const fill = (template: string, vars: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/**
 * Every work type against every phase, drawn from the workflow files: one glance shows that
 * a hotfix skips design, a spike stops after investigation, and where the human approvals
 * sit. It uses the same marks as the interactive pipeline below it (a ring for an approval,
 * dashed for an optional phase, a plus for an extra agent), and every cell also has text
 * for a screen reader, so meaning never rides on shape or colour alone.
 */
export function WorkflowMatrix({ dict, workflows }: { dict: Dictionary; workflows: Workflow[] }) {
  const t = dict.viz.workflowMatrix;
  const { phases, rows } = buildMatrix(workflows);

  const describe = (cell: MatrixCell | undefined) => {
    if (!cell) return t.none;
    const parts = [t.run];
    if (cell.approval) parts.push(t.approval);
    if (cell.optionalFlag) parts.push(fill(t.optional, { flag: cell.optionalFlag }));
    for (const flag of cell.conditionalFlags) parts.push(fill(t.conditional, { flag }));
    return parts.join(". ");
  };

  return (
    <Reveal threshold={0.2} className="not-prose my-6">
      <p className="mb-3 text-sm text-muted-foreground">{t.intro}</p>

      {/* Focusable: the grid scrolls sideways on a phone, and a keyboard user must reach it. */}
      <div role="region" aria-label={t.caption} tabIndex={0} className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t.caption}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th scope="col" className="sticky left-0 z-10 min-w-28 bg-muted px-3 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t.workTypeHeader}
              </th>
              {phases.map((id) => (
                <th key={id} scope="col" className="h-28 w-8 px-0.5 pb-2 text-center align-bottom font-mono text-[11px] font-medium [writing-mode:vertical-rl] rotate-180">
                  {id}
                </th>
              ))}
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">
                {t.phasesHeader}
              </th>
              <th scope="col" className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground">
                {t.approvalsHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id} className="group border-b border-border transition-colors duration-(--motion-fast) last:border-0 hover:bg-muted/40 focus-within:bg-muted/40">
                <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left group-hover:bg-muted">
                  <span className="block font-mono text-sm font-medium">{row.id}</span>
                  <span className="block font-mono text-[10px] text-muted-foreground">{row.idPrefix}</span>
                </th>
                {phases.map((id, c) => {
                  const cell = row.cells[id];
                  return (
                    <td key={id} className="px-0.5 py-2 text-center">
                      <span className="sr-only">{describe(cell)}</span>
                      {cell ? (
                        <span
                          aria-hidden="true"
                          style={stagger(r + c, 12)}
                          className={cn(
                            "reveal-pop relative mx-auto block size-3.5 rounded-full",
                            cell.optionalFlag ? "border-2 border-dashed border-brand bg-background" : "bg-brand",
                            cell.approval && "ring-4 ring-brand/25",
                          )}
                        >
                          {cell.conditionalFlags.length > 0 && (
                            <span className="absolute -top-2 -right-2 text-[10px] leading-none font-bold text-foreground">+</span>
                          )}
                        </span>
                      ) : (
                        <span aria-hidden="true" className="mx-auto block h-0.5 w-2.5 bg-border" />
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-mono text-sm tabular-nums">{row.phaseCount}</td>
                <td className="px-2 py-2 text-center font-mono text-sm tabular-nums">{row.approvalCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-brand" />
          {t.legendRun}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-brand ring-4 ring-brand/25" />
          {t.legendApproval}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-dashed border-brand" />
          {t.legendOptional}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground">+</span>
          {t.legendConditional}
        </li>
      </ul>
    </Reveal>
  );
}
