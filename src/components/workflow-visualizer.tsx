"use client";

import { useState, useCallback, useRef } from "react";
import { Play, RotateCcw, CheckCircle, Clock, Loader2, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";

export interface WorkflowNode {
  id: string;
  label: string;
  type: "trigger" | "action" | "condition" | "delay" | "output" | "error";
  description?: string;
  icon?: React.ReactNode;
  duration?: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

type NodeStatus = "idle" | "running" | "success" | "error" | "skipped";

interface WorkflowVisualizerProps {
  workflow: WorkflowDefinition;
  onRunComplete?: (results: Record<string, NodeStatus>) => void;
  compact?: boolean;
}

const nodeTypeStyles: Record<string, { bg: string; border: string; icon: string; activeBg: string; activeBorder: string }> = {
  trigger: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", activeBg: "bg-violet-100", activeBorder: "border-violet-400" },
  action: { bg: "bg-[var(--color-accent)]/10", border: "border-[var(--color-accent)]/30", icon: "text-[var(--color-accent)]", activeBg: "bg-blue-100", activeBorder: "border-blue-400" },
  condition: { bg: "bg-[var(--color-warning)]/10", border: "border-[var(--color-warning)]/30", icon: "text-[var(--color-warning)]", activeBg: "bg-amber-100", activeBorder: "border-amber-400" },
  delay: { bg: "bg-[var(--color-surface)]", border: "border-[var(--color-border)]", icon: "text-[var(--color-text-muted)]", activeBg: "bg-[var(--color-surface-elevated)]", activeBorder: "border-zinc-400" },
  output: { bg: "bg-[var(--color-success)]/10", border: "border-[var(--color-success)]/30", icon: "text-[var(--color-success)]", activeBg: "bg-emerald-100", activeBorder: "border-emerald-400" },
  error: { bg: "bg-[var(--color-error)]/10", border: "border-[var(--color-error)]/30", icon: "text-[var(--color-error)]", activeBg: "bg-red-100", activeBorder: "border-red-400" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  idle: { color: "", label: "" },
  running: { color: "text-[var(--color-warning)]", label: "Running" },
  success: { color: "text-[var(--color-success)]", label: "Done" },
  error: { color: "text-[var(--color-error)]", label: "Error" },
  skipped: { color: "text-[var(--color-text-muted)]", label: "Skip" },
};

function getLayout(workflow: WorkflowDefinition) {
  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
  const hasIncoming = new Set(workflow.edges.map((e) => e.to));
  const roots = workflow.nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
  if (roots.length === 0 && workflow.nodes.length > 0) roots.push(workflow.nodes[0].id);
  let currentLevel = roots;
  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach((id) => visited.add(id));
    const nextLevel: string[] = [];
    currentLevel.forEach((id) => {
      workflow.edges.filter((e) => e.from === id && !visited.has(e.to)).forEach((e) => {
        if (!nextLevel.includes(e.to)) nextLevel.push(e.to);
      });
    });
    currentLevel = nextLevel;
  }
  workflow.nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      levels.push([n.id]);
      visited.add(n.id);
    }
  });
  return { levels, nodeMap };
}

export function WorkflowVisualizer({ workflow, onRunComplete, compact = false }: WorkflowVisualizerProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [runLog, setRunLog] = useState<Array<{ node: string; status: string; time: string }>>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { levels, nodeMap } = getLayout(workflow);
  const totalNodes = workflow.nodes.length;

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveNode(null);
    setNodeStatuses({});
    setRunLog([]);
    setCompletedCount(0);
  }, []);

  const runWorkflow = useCallback(async () => {
    reset();
    setIsRunning(true);
    const executionOrder: string[] = [];
    levels.forEach((level) => level.forEach((id) => executionOrder.push(id)));

    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      setActiveNode(nodeId);
      setNodeStatuses((prev) => ({ ...prev, [nodeId]: "running" }));
      setRunLog((prev) => [...prev, { node: node.label, status: "running", time: new Date().toLocaleTimeString() }]);

      const duration = node.duration || (node.type === "delay" ? 1500 : node.type === "trigger" ? 800 : 1000);
      await new Promise((r) => setTimeout(r, duration));

      const success = Math.random() > 0.08;
      const status = success ? "success" : "error";

      setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
      setCompletedCount((prev) => prev + 1);
      setRunLog((prev) => prev.map((l) => (l.node === node.label && l.status === "running" ? { ...l, status } : l)));

      if (!success) {
        for (let j = i + 1; j < executionOrder.length; j++) {
          const skipId = executionOrder[j];
          setNodeStatuses((prev) => ({ ...prev, [skipId]: "skipped" }));
        }
        break;
      }
    }

    setActiveNode(null);
    setIsRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, nodeMap, reset, onRunComplete]);

  /* ──── Compact mode ──── */

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {workflow.nodes.map((node, i) => {
          const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
          const status = nodeStatuses[node.id] || "idle";
          const isActive = activeNode === node.id;
          return (
            <div key={node.id} className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-all duration-300",
                  isActive && `${style.activeBg} ${style.activeBorder} scale-105`,
                  !isActive && status === "success" && "bg-[var(--color-success)]/10 border-[var(--color-success)]/30",
                  !isActive && status === "error" && "bg-[var(--color-error)]/10 border-[var(--color-error)]/30",
                  !isActive && status === "skipped" && "opacity-40",
                  !isActive && status === "idle" && `${style.bg} ${style.border}`,
                )}
              >
                {status === "running" && <Loader2 className="w-3 h-3 animate-spin text-[var(--color-warning)]" />}
                {status === "success" && <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />}
                {status === "error" && <AlertTriangle className="w-3 h-3 text-[var(--color-error)]" />}
                {!statusConfig[status]?.color && node.type === "trigger" && <Zap className={cn("w-3 h-3", style.icon)} />}
                <span className="text-[var(--color-text-primary)]">{node.label}</span>
              </div>
              {i < workflow.nodes.length - 1 && (
                <svg className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ──── Full mode ──── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{workflow.name}</h4>
          <p className="text-xs text-[var(--color-text-muted)]">{workflow.nodes.length} steps &bull; {workflow.edges.length} connections</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-surface)] rounded-full transition-all duration-500" style={{ width: `${(completedCount / totalNodes) * 100}%` }} />
              </div>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{completedCount}/{totalNodes}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={reset} disabled={isRunning}>
            <RotateCcw className="w-3.5 h-3.5" />Reset
          </Button>
          <Button size="sm" onClick={runWorkflow} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />Test Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Visual Flow */}
      <div className="bg-[var(--color-surface)] rounded-lg p-5 border border-[var(--color-border)]">
        {levels.map((level, levelIdx) => (
          <div key={levelIdx}>
            <div className={cn("flex justify-center gap-3", levelIdx > 0 && "mt-3")}>
              {level.map((nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return null;
                const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
                const status = nodeStatuses[nodeId] || "idle";
                const isActive = activeNode === nodeId;
                return (
                  <div key={nodeId} className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "relative px-4 py-3 rounded-lg border-2 transition-all duration-300 min-w-[140px]",
                        isActive && `scale-105 ${style.activeBg} ${style.activeBorder}`,
                        !isActive && status === "success" && "bg-[var(--color-success)]/10 border-[var(--color-success)]/30",
                        !isActive && status === "error" && "bg-[var(--color-error)]/10 border-[var(--color-error)]/30",
                        !isActive && status === "skipped" && "opacity-40",
                        !isActive && status === "idle" && `${style.bg} ${style.border}`,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {status === "running" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-warning)]" />
                        ) : status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                        ) : status === "error" ? (
                          <AlertTriangle className="w-4 h-4 text-[var(--color-error)]" />
                        ) : status === "skipped" ? (
                          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                        ) : (
                          <span className={style.icon}>{node.icon}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">{node.label}</p>
                          {node.description && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{node.description}</p>}
                        </div>
                      </div>
                    </div>
                    {status !== "idle" && statusConfig[status]?.label && (
                      <div className="absolute -top-2 -right-2">
                        <Badge variant={status === "success" ? "success" : status === "error" ? "danger" : status === "running" ? "info" : "outline"}>
                          {statusConfig[status].label}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {levelIdx < levels.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-px h-2 bg-zinc-300" />
                  <svg className="w-4 h-4 text-[var(--color-text-muted)]" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="w-px h-2 bg-zinc-300" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Run Log */}
      {runLog.length > 0 && (
        <div className="bg-[var(--color-surface-raised)] rounded-lg border border-[var(--color-border)] p-4">
          <h5 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Execution Log</h5>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {runLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1">
                <span className="text-[var(--color-text-muted)] font-mono w-16 shrink-0">{entry.time}</span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    entry.status === "running" && "bg-[var(--color-warning)]/100 animate-pulse",
                    entry.status === "success" && "bg-[var(--color-success)]/100",
                    entry.status === "error" && "bg-[var(--color-error)]/100",
                  )}
                />
                <span className="text-[var(--color-text-primary)] truncate">{entry.node}</span>
                <span
                  className={cn(
                    "ml-auto font-medium shrink-0",
                    entry.status === "running" && "text-[var(--color-warning)]",
                    entry.status === "success" && "text-[var(--color-success)]",
                    entry.status === "error" && "text-[var(--color-error)]",
                  )}
                >
                  {entry.status}
                </span>
              </div>
            ))}
            {!isRunning && runLog.length > 0 && (
              <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex items-center gap-2 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                <span className="text-[var(--color-text-muted)]">
                  {runLog.filter((l) => l.status === "success").length}/{runLog.length} steps completed
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
