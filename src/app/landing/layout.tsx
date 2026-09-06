// Legacy /landing/* routes render their own chrome (canonical pages wrap
// LandingShell themselves), so this layout only provides the background.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--color-surface-raised)]">{children}</div>;
}