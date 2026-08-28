"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Search, X } from "lucide-react";

/* StatCard */
interface StatCardProps { label: string; value: string | number; change?: number; changeLabel?: string; icon: ReactNode; gradient?: "primary" | "success" | "warning" | "danger"; }
export function StatCard({ label, value, change, changeLabel, icon, gradient = "primary" }: StatCardProps) {
  const g = { primary: "gradient-primary", success: "gradient-success", warning: "gradient-warning", danger: "gradient-danger" }[gradient];
  return (
    <div className={cn("glass-card rounded-xl p-5 transition-all duration-200 hover:border-primary/30", g)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {change > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-success" /> : change < 0 ? <ArrowDownRight className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={cn("text-xs font-medium", change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground")}>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">{icon}</div>
      </div>
    </div>
  );
}

/* Badge */
interface BadgeProps { children: ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "outline"; className?: string; }
export function Badge({ children, variant = "default", className }: BadgeProps) {
  const v = { default: "bg-secondary text-secondary-foreground", success: "bg-success/10 text-success border-success/20", warning: "bg-warning/10 text-warning border-warning/20", danger: "bg-destructive/10 text-destructive border-destructive/20", info: "bg-info/10 text-info border-info/20", outline: "bg-transparent border border-border text-muted-foreground" }[variant];
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", v, className)}>{children}</span>;
}

/* PageHeader */
interface PageHeaderProps { title: string; description: string; icon: ReactNode; actions?: ReactNode; }
export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <div><h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{description}</p></div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/* Button */
interface ButtonProps { children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" | "lg"; disabled?: boolean; onClick?: () => void; className?: string; type?: "button" | "submit"; }
export function Button({ children, variant = "primary", size = "md", disabled = false, onClick, className, type = "button" }: ButtonProps) {
  const v = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90", ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50" }[variant];
  const s = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-sm" }[size];
  return <button type={type} onClick={onClick} disabled={disabled} className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", v, s, className)}>{children}</button>;
}

/* Input */
interface InputProps { label?: string; placeholder?: string; value?: string; onChange?: (value: string) => void; type?: string; className?: string; multiline?: boolean; rows?: number; }
export function Input({ label, placeholder, value, onChange, type = "text", className, multiline = false, rows = 3 }: InputProps) {
  const base = cn("w-full px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200");
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      {multiline ? <textarea placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} rows={rows} className={cn(base, "resize-none", className)} /> : <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} className={cn(base, className)} />}
    </div>
  );
}

/* Select */
interface SelectProps { label?: string; value?: string; onChange?: (value: string) => void; options: { value: string; label: string }[]; className?: string; }
export function Select({ label, value, onChange, options, className }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <select value={value} onChange={(e) => onChange?.(e.target.value)} className={cn("w-full px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 appearance-none cursor-pointer", className)}>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

/* Card */
interface CardProps { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void; }
export function Card({ children, className, hover = false, onClick }: CardProps) {
  return <div onClick={onClick} className={cn("glass-card rounded-xl p-5", hover && "transition-all duration-200 hover:border-primary/30 cursor-pointer", className)}>{children}</div>;
}

/* EmptyState */
interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Modal */
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; }
export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl w-full max-w-lg mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* SearchBar */
interface SearchBarProps { placeholder?: string; value?: string; onChange?: (value: string) => void; }
export function SearchBar({ placeholder = "Search...", value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200" />
    </div>
  );
}

/* Tabs */
interface TabsProps { tabs: { id: string; label: string; count?: number }[]; activeTab: string; onTabChange: (id: string) => void; }
export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer", activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {tab.label}{tab.count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ProgressBar */
interface ProgressBarProps { value: number; max?: number; color?: "primary" | "success" | "warning" | "danger"; size?: "sm" | "md"; }
export function ProgressBar({ value, max = 100, color = "primary", size = "sm" }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const c = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-destructive" }[color];
  return <div className={cn("w-full bg-secondary rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2.5")}><div className={cn("h-full rounded-full transition-all duration-500", c)} style={{ width: `${pct}%` }} /></div>;
}

/* Toggle */
interface ToggleProps { checked: boolean; onChange: (checked: boolean) => void; label?: string; }
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn("relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer", checked ? "bg-primary" : "bg-secondary")}>
        <span className={cn("absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200", checked && "translate-x-[18px]")} />
      </button>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </label>
  );
}

/* StatusDot */
interface StatusDotProps { status: "active" | "inactive" | "pending" | "error"; }
export function StatusDot({ status }: StatusDotProps) {
  const colors = { active: "bg-success", inactive: "bg-muted-foreground", pending: "bg-warning", error: "bg-destructive" };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={cn("animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])} />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", colors[status])} />
    </span>
  );
}

/* DataTable */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Column<T = Record<string, unknown>> { key: string; label: string; render?: (item: any) => ReactNode; className?: string; }
interface DataTableProps<T = Record<string, unknown>> { columns: Column<T>[]; data: T[]; emptyMessage?: string; }
export function DataTable({ columns, data, emptyMessage = "No data available" }: DataTableProps) {
  if (data.length === 0) return <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="border-b border-border">{columns.map((col) => <th key={col.key} className={cn("text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4", col.className)}>{col.label}</th>)}</tr></thead>
        <tbody>{data.map((item, i) => <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">{columns.map((col) => <td key={col.key} className={cn("py-3 px-4 text-sm", col.className)}>{col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
