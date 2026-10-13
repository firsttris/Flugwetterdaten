import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, as: Tag = "h2", ...props }: React.ComponentProps<"h2"> & { as?: "h2" | "h3" }) {
  return <Tag data-slot="card-title" className={cn("text-sm font-semibold", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="card-description" className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-4", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
