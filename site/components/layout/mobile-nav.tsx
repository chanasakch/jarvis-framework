"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { localizeHref, type Dictionary, type Locale } from "@/lib/i18n";

export function MobileNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: localizeHref(locale, "/docs/introduction"), label: dict.nav.docs },
    { href: localizeHref(locale, "/docs/commands"), label: dict.nav.commands },
    { href: localizeHref(locale, "/docs/workflows"), label: dict.nav.workflows },
    { href: localizeHref(locale, "/changelog"), label: dict.nav.changelog },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={dict.nav.openMenu} className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>
            <Link href={localizeHref(locale, "/")} onClick={() => setOpen(false)} className="flex items-center gap-2">
              <Logo className="size-5 text-brand" />
              {dict.meta.frameworkName}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label={dict.nav.docs}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <LanguageSwitch locale={locale} dict={dict} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
