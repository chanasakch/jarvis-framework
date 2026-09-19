"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";

import { useSearch } from "./search-provider";

export function SearchTrigger({ dict }: { dict: Dictionary }) {
  const { setOpen } = useSearch();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="hidden text-muted-foreground sm:inline-flex"
    >
      <SearchIcon />
      {dict.search.buttonLabel}
      <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        {dict.search.shortcutHint}
      </kbd>
    </Button>
  );
}

export function SearchTriggerIcon({ dict }: { dict: Dictionary }) {
  const { setOpen } = useSearch();
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={dict.search.buttonLabel} onClick={() => setOpen(true)} className="sm:hidden">
      <SearchIcon />
    </Button>
  );
}
