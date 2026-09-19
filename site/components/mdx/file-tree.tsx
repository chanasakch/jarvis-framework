import { FileIcon, FolderIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * `<FileTree><Folder name="apps/"><Folder name="api/"><File name="main.go" /></Folder></Folder><File name="jarvis.config.yaml" /></FileTree>`
 * — a real directory listing (e.g. what `/jarvis-init` adds to a repo), not a screenshot.
 */
export function FileTree({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

export function Folder({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <li>
      <div className="flex items-center gap-1.5 text-foreground">
        <FolderIcon aria-hidden="true" className="size-3.5 shrink-0 text-brand" />
        {name}
      </div>
      {children && <ul className="mt-0.5 space-y-0.5 border-l border-border pl-4">{children}</ul>}
    </li>
  );
}

export function File({ name }: { name: string }) {
  return (
    <li className="flex items-center gap-1.5 text-muted-foreground">
      <FileIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {name}
    </li>
  );
}
