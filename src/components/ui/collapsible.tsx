import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Aufklappbarer Bereich auf Basis von <details>, im Stil eines shadcn-Accordions
function Collapsible({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <details className={cn("group border-t", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

export { Collapsible };
