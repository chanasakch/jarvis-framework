import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Resting-surface elevation: a 1px ring, never a shadow (SITE_SPEC.md design direction;
// SYSTEM_DESIGN.md §2 Shadows). Shadows are reserved for floating surfaces — see sheet.tsx,
// dialog.tsx, dropdown-menu.tsx.
function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-title" className={cn("text-base leading-snug font-medium", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-4 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
