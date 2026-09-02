import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-[var(--color-accent)]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Page not found
        </h1>
        <p className="text-gray-400 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
