"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/onboarding");
  }, [router]);
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
