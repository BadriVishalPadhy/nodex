"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../lib/api";
import {
  Plus,
  Activity,
  Play,
  Trash2,
  Zap,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Calendar,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionNode {
  id: string;
  workflowId: string;
  ActionNodeId: string;
  metadata: any;
  sortingOrder: number;
  type: {
    name: string;
    id?: string;
  };
}

interface TriggerNode {
  id: string;
  workflowId: string;
  metadata: any;
  TriggerNodeId: string;
  type: {
    name: string;
    id?: string;
  };
}

interface Workflow {
  id: string;
  triggerId: string;
  userId: string;
  actionsNodes: ActionNode[];
  triggerNodes: TriggerNode;
  createdAt?: string;
  updatedAt?: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastIdCounter = 0;

export default function Dashboard() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = ++toastIdCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/workflow`, {
        withCredentials: true,
      });
      setWorkflows(res.data.workFlows || []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push("/signin");
        return;
      }
      setError(err.message || "Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/workflow/${workflowId}/execute`,
        {},
        { withCredentials: true }
      );
      addToast("Workflow executed successfully!", "success");
    } catch (err: any) {
      addToast(`Failed to execute: ${err?.response?.data?.error || err.message}`, "error");
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/workflow/${workflowId}`,
        { withCredentials: true }
      );
      setWorkflows(workflows.filter((w) => w.id !== workflowId));
      addToast("Workflow deleted.", "success");
    } catch (err: any) {
      addToast(`Failed to delete: ${err?.response?.data?.error || err.message}`, "error");
    }
  };

  const handleCreateWorkflow = () => router.push("/workflow/create");

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/signin");
  };

  // ── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Error Loading Workflows
          </h3>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button
            onClick={fetchWorkflows}
            className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all flex items-center gap-2 mx-auto text-sm font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main Content ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[5%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />

      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-xl border animate-[fadeIn_0.3s_ease] ${
              t.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {t.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
              My Workflows
            </h1>
            <p className="text-neutral-500">
              Manage and automate your tasks •{" "}
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateWorkflow}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all flex items-center gap-2 font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-all"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflows */}
        {workflows.length === 0 ? (
          <div className="text-center py-24 bg-neutral-900/60 backdrop-blur-xl border border-dashed border-neutral-800 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              No Workflows Yet
            </h3>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              Create your first workflow to start automating your daily tasks and processes.
            </p>
            <button
              onClick={handleCreateWorkflow}
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all inline-flex items-center gap-2 font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6 -mx-8 px-8">
            <div className="flex gap-6 min-w-min">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onRun={() => handleRunWorkflow(workflow.id)}
                  onDelete={() => handleDeleteWorkflow(workflow.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Workflow Card ───────────────────────────────────────────────────────────────

function WorkflowCard({
  workflow,
  onRun,
  onDelete,
}: {
  workflow: Workflow;
  onRun: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.hostname}:4000/hooks/catch/${workflow.userId}/${workflow.id}`
      : "";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-[420px] flex-shrink-0 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all group shadow-xl hover:shadow-2xl hover:shadow-white/[0.02]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 truncate">
            Workflow #{workflow.id.slice(0, 8)}
          </h3>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>
                {workflow.actionsNodes.length} action
                {workflow.actionsNodes.length !== 1 ? "s" : ""}
              </span>
            </div>
            {workflow.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(workflow.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRun}
            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all border border-emerald-500/20 hover:border-emerald-500/30"
            title="Run workflow"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 hover:border-red-500/30"
            title="Delete workflow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="bg-[#0a0a0a]/60 rounded-xl p-5 mb-4 border border-neutral-800/50">
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {/* Trigger */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-neutral-500 truncate max-w-[70px] text-center">
              {workflow.triggerNodes.type.name}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-neutral-700 flex-shrink-0" />

          {/* Actions */}
          {workflow.actionsNodes
            .sort((a, b) => a.sortingOrder - b.sortingOrder)
            .map((action, idx) => (
              <React.Fragment key={action.id}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 bg-neutral-800/80 border border-neutral-700/50 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-neutral-300" />
                  </div>
                  <span className="text-[10px] text-neutral-500 truncate max-w-[70px] text-center">
                    {action.type.name}
                  </span>
                </div>
                {idx < workflow.actionsNodes.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-neutral-700 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-[#0a0a0a]/60 rounded-xl p-4 mb-4 border border-neutral-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
            Webhook URL
          </span>
          <button
            onClick={handleCopyWebhook}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
        <code className="text-xs text-neutral-300 break-all block font-mono">
          {webhookUrl}
        </code>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Active</span>
        </div>
        <span className="text-[10px] text-neutral-600 font-mono">
          {workflow.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}
