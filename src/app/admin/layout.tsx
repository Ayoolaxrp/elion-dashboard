"use client";
import AdminSidebar from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <div className="lg:ml-60">{children}</div>
    </div>
  );
}