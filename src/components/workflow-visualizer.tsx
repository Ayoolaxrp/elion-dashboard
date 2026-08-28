"use client";

import { useState, useCallback, useRef } from "react";
import { Play, RotateCcw, CheckCircle, Clock, Loader2, AlertTriangle, ArrowRight, Zap } from "lucide-react";
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

const nodeTypeStyles: Record<string, { bg: string; border: string; icon: string; activeBg: string; activeBorder: string; glow: string }> = {
  trigger: { bg: "bg-violet-500/10", border: "border-violet-500/30", icon: "text-violet-400", activeBg: "bg-violet-500/20", activeBorder: "border-violet-400", glow: "shadow-violet-500/20" },
  action: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400", activeBg: "bg-blue-500/20", activeBorder: "border-blue-400", glow: "shadow-blue-500/20" },
  condition: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "text-amber-400", activeBg: "bg-amber-500/20", activeBorder: "border-amber-400", glow: "shadow-amber-500/20" },
  delay: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: "text-zinc-400", activeBg: "bg-zinc-500/20", activeBorder: "border-zinc-400", glow: "shadow-zinc-500/20" },
  output: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-400", activeBg: "bg-emerald-500/20", activeBorder: "border-emerald-400", glow: "shadow-emerald-500/20" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400", activeBg: "bg-red-500/20", activeBorder: "border-red-400", glow: "shadow-red-500/20" },
};

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  idle: { color: "", bg: "", border: "", label: "" },
  running: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400", label: "Running" },
  success: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400", label: "Done" },
  error: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-400", label: "Error" },
  skipped: { color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500", label: "Skip" },
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
    if (!visited.has(n.id)) { levels.push([n.id]); visited.add(n.id); }
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
      setRunLog((prev) => prev.map((l) => l.node === node.label && l.status === "running" ? { ...l, status } : l));

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

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {workflow.nodes.map((node, i) => {
          const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
          const status = nodeStatuses[node.id] || "idle";
          const isActive = activeNode === node.id;
          const statusInfo = statusConfig[status];
          return (
            <div key={node.id} className="flex items-center gap-1.5 shrink-0">
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all duration-300",
                isActive && `${style.activeBg} ${style.activeBorder} shadow-md ${style.glow} scale-105`,
                !isActive && status === "success" && "bg-emerald-500/10 border-emerald-500/30",
                !isActive && status === "error" && "bg-red-500/10 border-red-500/30",
                !isActive && status === "skipped" && "opacity-40",
                !isActive && status === "idle" && `${style.bg} ${style.border}`,
              )}>
                {status === "running" && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
                {status === "success" && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                {status === "error" && <AlertTriangle className="w-3 h-3 text-red-400" />}
                {!statusInfo?.color && <span className={style.icon}>{node.type === "trigger" ? <Zap className="w-3 h-3" /> : null}</span>}
                <span className="text-foreground">{node.label}</span>
              </div>
              {i < workflow.nodes.length - 1 && (
                <svg className="w-4 h-4 text-muted-foreground/30 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{workflow.name}</h4>
          <p className="text-xs text-muted-foreground">{workflow.nodes.length} steps &bull; {workflow.edges.length} connections</p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(completedCount / totalNodes) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{completedCount}/{totalNodes}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={reset} disabled={isRunning}><RotateCcw className="w-3.5 h-3.5" />Reset</Button>
          <Button size="sm" onClick={runWorkflow} disabled={isRunning}>
            {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running...</> : <><Play className="w-3.5 h-3.5" />Test Run</>}
          </Button>
        </div>
      </div>

      {/* Visual Flow */}
      <div className="relative bg-secondary/20 rounded-2xl p-6 border border-border/50 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        {levels.map((level, levelIdx) => (
          <div key={levelIdx} className="relative">
            <div className={cn("flex justify-center gap-4", levelIdx > 0 && "mt-4")}>
              {level.map((nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return null;
                const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
                const status = nodeStatuses[nodeId] || "idle";
                const isActive = activeNode === nodeId;
                const statusInfo = statusConfig[status];
                return (
                  <div key={nodeId} className="relative flex flex-col items-center group">
                    <div className={cn(
                      "relative px-5 py-3.5 rounded-xl border-2 transition-all duration-300 min-w-[150px] backdrop-blur-sm",
                      isActive && `scale-105 ${style.activeBg} ${style.activeBorder} shadow-lg ${style.glow}`,
                      !isActive && status === "success" && "bg-emerald-500/10 border-emerald-500/30",
                      !isActive && status === "error" && "bg-red-500/10 border-red-500/30",
                      !isActive && status === "skipped" && "opacity-40",
                      !isActive && status === "idle" && `${style.bg} ${style.border}`,
                    )}>
                      {/* Pulse ring when active */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 rounded-xl border-2 border-primary/20 animate-ping" />
                          <div className="absolute -inset-1 rounded-xl bg-primary/5 animate-pulse" />
                        </>
                      )}
                      <div className="flex items-center gap-2.5">
                        {status === "running" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        ) : status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : status === "error" ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : status === "skipped" ? (
                          <Clock className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <span className={cn(style.icon)}>{node.icon}</span>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">{node.label}</p>
                          {node.description && <p className="text-[10px] text-muted-foreground mt-0.5">{node.description}</p>}
                        </div>
                      </div>
                    </div>
                    {/* Status badge */}
                    {status !== "idle" && statusInfo?.label && (
                      <div className="absolute -top-2.5 -right-2.5">
                        <Badge variant={status === "success" ? "success" : status === "error" ? "danger" : status === "running" ? "info" : "outline"} className="text-[9px] px-1.5 py-0 shadow-sm">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* SVG connector arrows between levels */}
            {levelIdx < levels.length - 1 && (
              <div className="flex justify-center my-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-px h-3 bg-gradient-to-b from-border to-primary/30" />
                  <svg className="w-5 h-5 text-primary/40" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v10M6 10l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="w-px h-3 bg-gradient-to-b from-primary/30 to-border" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Run Log */}
      {runLog.length > 0 && (
        <div className="bg-secondary/20 rounded-2xl border border-border/50 p-4">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Execution Log</h5>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
            {runLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1">
                <span className="text-muted-foreground/60 font-mono w-16 shrink-0">{entry.time}</span>
                <span className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  entry.status === "running" && "bg-amber-400 animate-pulse",
                  entry.status === "success" && "bg-emerald-400",
                  entry.status === "error" && "bg-red-400"
                )} />
                <span className="text-foreground truncate">{entry.node}</span>
                <span className={cn(
                  "ml-auto font-medium shrink-0",
                  entry.status === "running" && "text-amber-400",
                  entry.status === "success" && "text-emerald-400",
                  entry.status === "error" && "text-red-400"
                )}>{entry.status}</span>
              </div>
            ))}
            {!isRunning && runLog.length > 0 && (
              <div className="pt-2 mt-2 border-t border-border/50 flex items-center gap-2 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-muted-foreground">
                  {runLog.filter((l) => l.status === "success").length}/{runLog.length} steps completed successfully
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
