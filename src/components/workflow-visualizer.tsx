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
  action: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", activeBg: "bg-blue-100", activeBorder: "border-blue-400" },
  condition: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", activeBg: "bg-amber-100", activeBorder: "border-amber-400" },
  delay: { bg: "bg-zinc-50", border: "border-zinc-200", icon: "text-zinc-500", activeBg: "bg-zinc-100", activeBorder: "border-zinc-400" },
  output: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", activeBg: "bg-emerald-100", activeBorder: "border-emerald-400" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", activeBg: "bg-red-100", activeBorder: "border-red-400" },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  idle: { color: "", label: "" },
  running: { color: "text-amber-600", label: "Running" },
  success: { color: "text-emerald-600", label: "Done" },
  error: { color: "text-red-600", label: "Error" },
  skipped: { color: "text-zinc-400", label: "Skip" },
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
                  !isActive && status === "success" && "bg-emerald-50 border-emerald-200",
                  !isActive && status === "error" && "bg-red-50 border-red-200",
                  !isActive && status === "skipped" && "opacity-40",
                  !isActive && status === "idle" && `${style.bg} ${style.border}`,
                )}
              >
                {status === "running" && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
                {status === "success" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                {status === "error" && <AlertTriangle className="w-3 h-3 text-red-600" />}
                {!statusConfig[status]?.color && node.type === "trigger" && <Zap className={cn("w-3 h-3", style.icon)} />}
                <span className="text-zinc-800">{node.label}</span>
              </div>
              {i < workflow.nodes.length - 1 && (
                <svg className="w-4 h-4 text-zinc-300 shrink-0" viewBox="0 0 16 16" fill="none">
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
          <h4 className="text-sm font-semibold text-zinc-900">{workflow.name}</h4>
          <p className="text-xs text-zinc-500">{workflow.nodes.length} steps &bull; {workflow.edges.length} connections</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${(completedCount / totalNodes) * 100}%` }} />
              </div>
              <span className="text-xs text-zinc-500 font-mono">{completedCount}/{totalNodes}</span>
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
      <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-200">
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
                        !isActive && status === "success" && "bg-emerald-50 border-emerald-200",
                        !isActive && status === "error" && "bg-red-50 border-red-200",
                        !isActive && status === "skipped" && "opacity-40",
                        !isActive && status === "idle" && `${style.bg} ${style.border}`,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {status === "running" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        ) : status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : status === "error" ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : status === "skipped" ? (
                          <Clock className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <span className={style.icon}>{node.icon}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-900 leading-tight">{node.label}</p>
                          {node.description && <p className="text-[10px] text-zinc-500 mt-0.5">{node.description}</p>}
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
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 16 16" fill="none">
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
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <h5 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Execution Log</h5>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {runLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1">
                <span className="text-zinc-400 font-mono w-16 shrink-0">{entry.time}</span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    entry.status === "running" && "bg-amber-500 animate-pulse",
                    entry.status === "success" && "bg-emerald-500",
                    entry.status === "error" && "bg-red-500",
                  )}
                />
                <span className="text-zinc-800 truncate">{entry.node}</span>
                <span
                  className={cn(
                    "ml-auto font-medium shrink-0",
                    entry.status === "running" && "text-amber-600",
                    entry.status === "success" && "text-emerald-600",
                    entry.status === "error" && "text-red-600",
                  )}
                >
                  {entry.status}
                </span>
              </div>
            ))}
            {!isRunning && runLog.length > 0 && (
              <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center gap-2 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-zinc-500">
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
