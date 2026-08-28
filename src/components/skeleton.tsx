"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-800/50 ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatSkeleton() {
  return (
    <div className="space-y-2 p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/60">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
