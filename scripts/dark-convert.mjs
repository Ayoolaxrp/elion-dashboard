import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const files = execSync('find src -name "*.tsx" -type f', { encoding: "utf-8" })
  .trim().split("\n").filter(Boolean);

const replacements = [
  ["bg-zinc-800/50", "bg-[var(--color-surface)]/80"],
  ["bg-zinc-800", "bg-[var(--color-surface-raised)]"],
  ["bg-zinc-900", "bg-[var(--color-surface)]"],
  ["bg-zinc-50", "bg-[var(--color-surface)]"],
  ["bg-white", "bg-[var(--color-surface-raised)]"],
  ["bg-zinc-100", "bg-[var(--color-surface-elevated)]"],
  ["bg-zinc-200", "bg-[var(--color-surface-hover)]"],
  ["text-zinc-900", "text-[var(--color-text-primary)]"],
  ["text-zinc-800", "text-[var(--color-text-primary)]"],
  ["text-zinc-700", "text-[var(--color-text-secondary)]"],
  ["text-zinc-600", "text-[var(--color-text-secondary)]"],
  ["text-zinc-500", "text-[var(--color-text-muted)]"],
  ["text-zinc-400", "text-[var(--color-text-muted)]"],
  ["text-zinc-300", "text-[var(--color-text-muted)]"],
  ["border-zinc-200", "border-[var(--color-border)]"],
  ["border-zinc-100", "border-[var(--color-border)]"],
  ["border-zinc-300", "border-[var(--color-border-light)]"],
  ["border-zinc-700/50", "border-[var(--color-border)]"],
  ["border-zinc-700", "border-[var(--color-border)]"],
  ["hover:bg-zinc-50", "hover:bg-[var(--color-surface-elevated)]"],
  ["hover:bg-zinc-100", "hover:bg-[var(--color-surface-hover)]"],
  ["hover:bg-zinc-200", "hover:bg-[var(--color-surface-hover)]"],
  ["hover:bg-zinc-800", "hover:bg-[var(--color-surface-hover)]"],
  ["hover:text-zinc-900", "hover:text-[var(--color-text-primary)]"],
  ["hover:text-zinc-800", "hover:text-[var(--color-text-primary)]"],
  ["hover:text-zinc-600", "hover:text-[var(--color-text-secondary)]"],
  ["hover:text-zinc-300", "hover:text-[var(--color-text-muted)]"],
  ["hover:border-zinc-300", "hover:border-[var(--color-border-light)]"],
  ["focus:ring-zinc-900/10", "focus:ring-[var(--color-accent)]/30"],
  ["focus:border-zinc-400", "focus:border-[var(--color-accent)]"],
  ["focus:border-zinc-900", "focus:border-[var(--color-accent)]"],
  ["bg-blue-50", "bg-[var(--color-accent)]/10"],
  ["bg-blue-600", "bg-[var(--color-accent)]"],
  ["bg-blue-700", "bg-[var(--color-accent-hover)]"],
  ["text-blue-600", "text-[var(--color-accent)]"],
  ["text-blue-700", "text-[var(--color-accent)]"],
  ["hover:bg-blue-50", "hover:bg-[var(--color-accent)]/15"],
  ["hover:bg-blue-600", "hover:bg-[var(--color-accent-hover)]"],
  ["border-blue-200", "border-[var(--color-accent)]/30"],
  ["border-blue-500/20", "border-[var(--color-accent)]/20"],
  ["border-blue-500/50", "border-[var(--color-accent)]/40"],
  ["bg-emerald-500/10", "bg-[var(--color-success)]/10"],
  ["bg-emerald-50", "bg-[var(--color-success)]/10"],
  ["bg-emerald-500", "bg-[var(--color-success)]"],
  ["text-emerald-400", "text-[var(--color-success)]"],
  ["text-emerald-500", "text-[var(--color-success)]"],
  ["text-emerald-600", "text-[var(--color-success)]"],
  ["text-emerald-700", "text-[var(--color-success)]"],
  ["border-emerald-200", "border-[var(--color-success)]/30"],
  ["bg-amber-50", "bg-[var(--color-warning)]/10"],
  ["bg-amber-500", "bg-[var(--color-warning)]"],
  ["text-amber-400", "text-[var(--color-warning)]"],
  ["text-amber-500", "text-[var(--color-warning)]"],
  ["text-amber-600", "text-[var(--color-warning)]"],
  ["text-amber-700", "text-[var(--color-warning)]"],
  ["border-amber-200", "border-[var(--color-warning)]/30"],
  ["bg-red-50", "bg-[var(--color-error)]/10"],
  ["bg-red-600", "bg-[var(--color-error)]"],
  ["bg-red-700", "bg-[var(--color-error)]"],
  ["text-red-400", "text-[var(--color-error)]"],
  ["text-red-500", "text-[var(--color-error)]"],
  ["text-red-600", "text-[var(--color-error)]"],
  ["text-red-700", "text-[var(--color-error)]"],
  ["border-red-200", "border-[var(--color-error)]/30"],
  ["border-red-500/20", "border-[var(--color-error)]/20"],
  ["border-red-500/50", "border-[var(--color-error)]/40"],
  ["hover:bg-red-600", "hover:bg-[var(--color-error)]"],
  ["hover:bg-red-700", "hover:bg-[var(--color-error)]"],
  ["bg-indigo-600", "bg-[var(--color-accent)]"],
  ["hover:bg-indigo-500", "hover:bg-[var(--color-accent-hover)]"],
  ["hover:bg-indigo-600", "hover:bg-[var(--color-accent-hover)]"],
  ["text-indigo-400", "text-[var(--color-accent)]"],
  ["text-indigo-300", "text-[var(--color-accent)]"],
  ["focus:ring-indigo-500/50", "focus:ring-[var(--color-accent)]/30"],
  ["focus:border-indigo-500", "focus:border-[var(--color-accent)]"],
  ["bg-purple-50", "bg-[var(--color-accent)]/10"],
  ["text-purple-600", "text-[var(--color-accent)]"],
  ["bg-black/30", "bg-black/50"],
  ["bg-black/40", "bg-black/60"],
];

let totalChanges = 0;
let filesChanged = 0;

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    const changes = (content.match(/var\(--color-/g) || []).length;
    totalChanges += changes;
    filesChanged++;
    writeFileSync(file, content, "utf-8");
    console.log("OK " + file + ": " + changes + " refs");
  }
}
console.log("\nDone: " + filesChanged + " files, " + totalChanges + " total dark theme refs");
