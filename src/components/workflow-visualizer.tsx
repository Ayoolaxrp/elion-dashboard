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
  duration?: number; // ms for animation timing
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
  trigger: { bg: "bg-primary/10", border: "border-primary/30", icon: "text-primary", activeBg: "bg-primary/20", activeBorder: "border-primary" },
  action: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400", activeBg: "bg-blue-500/20", activeBorder: "border-blue-400" },
  condition: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "text-amber-400", activeBg: "bg-amber-500/20", activeBorder: "border-amber-400" },
  delay: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: "text-zinc-400", activeBg: "bg-zinc-500/20", activeBorder: "border-zinc-400" },
  output: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-400", activeBg: "bg-emerald-500/20", activeBorder: "border-emerald-400" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400", activeBg: "bg-red-500/20", activeBorder: "border-red-400" },
};

const statusIcons: Record<string, React.ReactNode> = {
  idle: null,
  running: <Loader2 className="w-4 h-4 animate-spin" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400" />,
  skipped: <Clock className="w-4 h-4 text-zinc-500" />,
};

function getLayout(workflow: WorkflowDefinition) {
  // Simple topological sort for layout
  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

  // Find root nodes (no incoming edges)
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

  // Add any unvisited nodes
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { levels, nodeMap } = getLayout(workflow);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveNode(null);
    setNodeStatuses({});
    setRunLog([]);
  }, []);

  const runWorkflow = useCallback(async () => {
    reset();
    setIsRunning(true);

    const executionOrder: string[] = [];
    // Flatten execution order from levels
    levels.forEach((level) => level.forEach((id) => executionOrder.push(id)));

    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      setActiveNode(nodeId);
      setNodeStatuses((prev) => ({ ...prev, [nodeId]: "running" }));
      setRunLog((prev) => [...prev, { node: node.label, status: "running", time: new Date().toLocaleTimeString() }]);

      // Simulate processing time
      const duration = node.duration || (node.type === "delay" ? 1500 : node.type === "trigger" ? 800 : 1000);
      await new Promise((r) => setTimeout(r, duration));

      // 90% success rate for demo
      const success = Math.random() > 0.1;
      const status = success ? "success" : "error";

      setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
      setRunLog((prev) => prev.map((l) => l.node === node.label && l.status === "running" ? { ...l, status } : l));

      if (!success) {
        // Mark remaining as skipped
        for (let j = i + 1; j < executionOrder.length; j++) {
          const skipId = executionOrder[j];
          const skipNode = nodeMap.get(skipId);
          if (skipNode) {
            setNodeStatuses((prev) => ({ ...prev, [skipId]: "skipped" }));
          }
        }
        break;
      }
    }

    setActiveNode(null);
    setIsRunning(false);
    onRunComplete?.(nodeStatuses);
  }, [levels, nodeMap, reset, onRunComplete, nodeStatuses]);

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {workflow.nodes.map((node, i) => {
          const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
          const status = nodeStatuses[node.id] || "idle";
          const isActive = activeNode === node.id;
          return (
            <div key={node.id} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all duration-300",
                isActive ? `${style.activeBg} ${style.activeBorder} scale-105` : `${style.bg} ${style.border}`,
                status === "success" && "bg-emerald-500/10 border-emerald-500/30",
                status === "error" && "bg-red-500/10 border-red-500/30",
                status === "skipped" && "opacity-40"
              )}>
                {statusIcons[status] || <span className={style.icon}>{node.type === "trigger" ? <Zap className="w-3 h-3" /> : null}</span>}
                <span className="text-foreground">{node.label}</span>
              </div>
              {i < workflow.nodes.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{workflow.name}</h4>
          <p className="text-xs text-muted-foreground">{workflow.nodes.length} steps &bull; {workflow.edges.length} connections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={isRunning}><RotateCcw className="w-3.5 h-3.5" />Reset</Button>
          <Button size="sm" onClick={runWorkflow} disabled={isRunning}>
            {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running...</> : <><Play className="w-3.5 h-3.5" />Test Run</>}
          </Button>
        </div>
      </div>

      {/* Visual Flow */}
      <div className="relative bg-secondary/20 rounded-xl p-6 border border-border/50">
        {levels.map((level, levelIdx) => (
          <div key={levelIdx}>
            <div className={cn("flex justify-center gap-4", levelIdx > 0 && "mt-4")}>
              {level.map((nodeId) => {
                const node = nodeMap.get(nodeId);
                if (!node) return null;
                const style = nodeTypeStyles[node.type] || nodeTypeStyles.action;
                const status = nodeStatuses[nodeId] || "idle";
                const isActive = activeNode === nodeId;
                return (
                  <div key={nodeId} className="relative flex flex-col items-center">
                    <div className={cn(
                      "relative px-5 py-3 rounded-xl border-2 transition-all duration-300 min-w-[140px]",
                      isActive && `scale-110 ${style.activeBg} ${style.activeBorder} shadow-lg shadow-primary/10`,
                      !isActive && status === "success" && "bg-emerald-500/10 border-emerald-500/30",
                      !isActive && status === "error" && "bg-red-500/10 border-red-500/30",
                      !isActive && status === "skipped" && "opacity-40",
                      !isActive && status === "idle" && `${style.bg} ${style.border}`,
                    )}>
                      {/* Pulse ring when active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping" />
                      )}
                      <div className="flex items-center gap-2">
                        {statusIcons[status] || <span className={cn(style.icon)}>{node.icon}</span>}
                        <div>
                          <p className="text-sm font-medium text-foreground">{node.label}</p>
                          {node.description && <p className="text-[10px] text-muted-foreground">{node.description}</p>}
                        </div>
                      </div>
                    </div>
                    {/* Status badge */}
                    {status !== "idle" && (
                      <div className="absolute -top-2 -right-2">
                        <Badge variant={status === "success" ? "success" : status === "error" ? "danger" : "outline"} className="text-[9px] px-1.5 py-0">
                          {status === "running" ? "..." : status === "success" ? "OK" : status === "error" ? "ERR" : "SKIP"}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Connector arrows between levels */}
            {levelIdx < levels.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-border" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 rotate-90" />
                  <div className="w-0.5 h-4 bg-border" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Run Log */}
      {runLog.length > 0 && (
        <div className="bg-secondary/20 rounded-xl border border-border/50 p-4">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Execution Log</h5>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {runLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground/60 font-mono">{entry.time}</span>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  entry.status === "running" && "bg-amber-400 animate-pulse",
                  entry.status === "success" && "bg-emerald-400",
                  entry.status === "error" && "bg-red-400"
                )} />
                <span className="text-foreground">{entry.node}</span>
                <span className={cn(
                  "ml-auto font-medium",
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
