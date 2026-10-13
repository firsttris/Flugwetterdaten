import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ErrorNote({ what }: { what: string }) {
  return <p className="text-sm text-muted-foreground">{what} konnten gerade nicht geladen werden. Wir versuchen es in ein paar Minuten erneut.</p>;
}
