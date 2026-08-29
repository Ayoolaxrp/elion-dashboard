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
    primary: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  }[gradient];

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {change > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : change < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span className={cn("text-xs font-semibold", change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-zinc-400")}>
                {Math.abs(change)}%
              </span>
              {changeLabel && <span className="text-xs text-zinc-400">{changeLabel}</span>}
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
    default: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    outline: "bg-transparent border border-zinc-200 text-zinc-500",
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
        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">{icon}</div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
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
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
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
    "w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors",
  );
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-zinc-600">{label}</label>}
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
      {label && <label className="text-xs font-semibold text-zinc-600">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors appearance-none cursor-pointer",
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
        "bg-white border border-zinc-200 rounded-lg p-5",
        hover && "hover:border-zinc-300 transition-colors cursor-pointer",
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
      <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm">{description}</p>
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white border border-zinc-200 rounded-lg w-full max-w-lg mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
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
    <div className="flex gap-0.5 p-0.5 bg-zinc-100 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer",
            activeTab === tab.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1 text-xs text-zinc-400">{tab.count}</span>}
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
    primary: "bg-zinc-900",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }[color];
  return (
    <div className={cn("w-full bg-zinc-100 rounded-full overflow-hidden", size === "sm" ? "h-1.5" : "h-2")}>
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
        className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", checked ? "bg-zinc-900" : "bg-zinc-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform", checked && "translate-x-4")} />
      </button>
      {label && <span className="text-sm text-zinc-600">{label}</span>}
    </label>
  );
}

/* StatusDot */
interface StatusDotProps {
  status: "active" | "inactive" | "pending" | "error";
}

export function StatusDot({ status }: StatusDotProps) {
  const colors = {
    active: "bg-emerald-500",
    inactive: "bg-zinc-400",
    pending: "bg-amber-500",
    error: "bg-red-500",
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
      <div className="text-center py-12 text-zinc-400 text-sm">{emptyMessage}</div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200">
            {columns.map((col) => (
              <th key={col.key} className={cn("text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider py-2.5 px-3", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
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
