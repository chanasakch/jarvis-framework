"use client";

import { FileText, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getStaticSearchItems } from "@/lib/search/static-index";
import type { SearchItem } from "@/lib/search/types";

import { useSearch } from "./search-provider";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function CommandPalette({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { open, setOpen } = useSearch();
  const [items, setItems] = useState<SearchItem[]>(() => getStaticSearchItems(locale, dict));
  const router = useRouter();

  useEffect(() => {
    // Built by scripts/generate-search-index.ts (S4) — commands, agents, workflows and
    // MDX headings per locale. Absent before that step runs, or if the build changed the
    // shape; either way we already have the static nav items and keep working.
    let cancelled = false;
    fetch(`${basePath}/search-index.${locale}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<SearchItem[]>) : null))
      .then((generated) => {
        if (!cancelled && generated) setItems([...getStaticSearchItems(locale, dict), ...generated]);
      })
      .catch(() => {
        /* stay on the static fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [locale, dict]);

  function onSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  const pages = items.filter((i) => i.group === "pages");
  const commands = items.filter((i) => i.group === "commands");

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={dict.search.buttonLabel}>
      <CommandInput placeholder={dict.search.placeholder} />
      <CommandList>
        <CommandEmpty>{dict.search.empty}</CommandEmpty>
        {pages.length > 0 && (
          <CommandGroup heading={dict.search.groupPages}>
            {pages.map((item) => (
              <CommandItem key={item.id} value={`${item.title} ${(item.keywords ?? []).join(" ")}`} onSelect={() => onSelect(item.href)}>
                <FileText />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {commands.length > 0 && (
          <CommandGroup heading={dict.search.groupCommands}>
            {commands.map((item) => (
              <CommandItem key={item.id} value={`${item.title} ${(item.keywords ?? []).join(" ")}`} onSelect={() => onSelect(item.href)}>
                <Terminal />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
