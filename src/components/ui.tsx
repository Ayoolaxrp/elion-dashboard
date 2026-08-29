"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Search, X } from "lucide-react";

/* StatCard */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  gradient?: "primary" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, change, changeLabel, icon, gradient = "primary" }: StatCardProps) {
  const iconBg = {
    primary: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
    success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    danger: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  }[gradient];

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {change > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-success)]" />
              ) : change < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-[var(--color-error)]" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              )}
              <span className={cn("text-xs font-semibold", change > 0 ? "text-[var(--color-success)]" : change < 0 ? "text-[var(--color-error)]" : "text-[var(--color-text-muted)]")}>
                {Math.abs(change)}%
              </span>
              {changeLabel && <span className="text-xs text-[var(--color-text-muted)]">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* Badge */
interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const v = {
    default: "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
    success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30",
    warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
    danger: "bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30",
    info: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30",
    outline: "bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)]",
  }[variant];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider", v, className)}>
      {children}
    </span>
  );
}

/* PageHeader */
interface PageHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">{icon}</div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* Button */
interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}

export function Button({ children, variant = "primary", size = "md", disabled = false, onClick, className, type = "button" }: ButtonProps) {
  const v = {
    primary: "bg-[var(--color-surface)] text-white hover:bg-[var(--color-surface-raised)]",
    secondary: "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]",
    danger: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]",
    ghost: "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]",
  }[variant];
  const s = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3.5 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        v,
        s,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* Input */
interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export function Input({ label, placeholder, value, onChange, type = "text", className, multiline = false, rows = 3 }: InputProps) {
  const base = cn(
    "w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors",
  );
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>}
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={rows}
          className={cn(base, "resize-none", className)}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(base, className)}
        />
      )}
    </div>
  );
}

/* Select */
interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ label, value, onChange, options, className }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors appearance-none cursor-pointer",
          className,
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* Card */
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-5",
        hover && "hover:border-[var(--color-border-light)] transition-colors cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* EmptyState */
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)] mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Modal */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg w-full max-w-lg mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* SearchBar */
interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({ placeholder = "Search...", value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors"
      />
    </div>
  );
}

/* Tabs */
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-0.5 p-0.5 bg-[var(--color-surface-elevated)] rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer",
            activeTab === tab.id ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1 text-xs text-[var(--color-text-muted)]">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ProgressBar */
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export function ProgressBar({ value, max = 100, color = "primary", size = "sm" }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const c = {
    primary: "bg-[var(--color-surface)]",
    success: "bg-[var(--color-success)]/100",
    warning: "bg-[var(--color-warning)]/100",
    danger: "bg-[var(--color-error)]/100",
  }[color];
  return (
    <div className={cn("w-full bg-[var(--color-surface-elevated)] rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2")}>
      <div className={cn("h-full rounded-full transition-all duration-500", c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* Toggle */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", checked ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-hover)]")}
      >
        <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[var(--color-surface-raised)] transition-transform", checked && "translate-x-4")} />
      </button>
      {label && <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>}
    </label>
  );
}

/* StatusDot */
interface StatusDotProps {
  status: "active" | "inactive" | "pending" | "error";
}

export function StatusDot({ status }: StatusDotProps) {
  const colors = {
    active: "bg-[var(--color-success)]/100",
    inactive: "bg-zinc-400",
    pending: "bg-[var(--color-warning)]/100",
    error: "bg-[var(--color-error)]/100",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])} />
      <span className={cn("relative inline-flex rounded-full h-2 w-2", colors[status])} />
    </span>
  );
}

/* DataTable */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (item: any) => ReactNode;
  className?: string;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = "No data available" }: DataTableProps) {
  if (data.length === 0)
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">{emptyMessage}</div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th key={col.key} className={cn("text-left text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider py-2.5 px-3", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn("py-2.5 px-3 text-sm", col.className)}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
