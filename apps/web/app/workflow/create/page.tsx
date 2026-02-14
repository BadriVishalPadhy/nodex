"use client";
import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ConnectionLineType,
  Panel,
  type Node,
  type Edge,
  type Connection,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  X,
  Webhook,
  Mail,
  Database,
  Calendar,
  FileText,
  Zap,
  Loader2,
  Save,
  PlayCircle,
  GitBranch,
  Send,
  Check,
  AlertCircle,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import axios, { type AxiosError } from "axios";
import { useRouter } from "next/navigation";

// ── Icon Map ───────────────────────────────────────────────────────────────────

type IconKey =
  | "webhook"
  | "email"
  | "database"
  | "schedule"
  | "file"
  | "api"
  | "telegram";

const iconMap: Record<IconKey, LucideIcon> = {
  webhook: Webhook,
  email: Mail,
  database: Database,
  schedule: Calendar,
  file: FileText,
  api: Zap,
  telegram: Send,
};

function NodeIcon({
  iconId,
  className,
}: {
  iconId: string;
  className?: string;
}) {
  const Component = iconMap[iconId as IconKey] ?? Webhook;
  return <Component className={className} />;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface AvailableNode {
  id: string;
  name: string;
}

interface CustomNodeData {
  label: string;
  subtitle: string;
  type: "trigger" | "action";
  availableActionId: string;
  metadata: Record<string, string>;
  childCount: number;
  onDelete: () => void;
  onAdd: () => void;
  [key: string]: unknown;
}

type CustomNodeType = Node<CustomNodeData, "custom">;

// ── Constants ──────────────────────────────────────────────────────────────────

const EDGE_STYLE = {
  stroke: "#555",
  strokeWidth: 2,
  strokeDasharray: "5, 5",
} as const;

const NODE_GAP_X = 350;
const NODE_GAP_Y = 220;

// ── Helpers ────────────────────────────────────────────────────────────────────

function createEdge(sourceId: string, targetId: string): Edge {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    animated: true,
    type: "smoothstep",
    style: EDGE_STYLE,
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
  return (
    axiosErr.response?.data?.error ??
    axiosErr.response?.data?.message ??
    axiosErr.message ??
    "An unknown error occurred"
  );
}

function getChildPosition(
  parent: CustomNodeType,
  existingChildCount: number
): { x: number; y: number } {
  const baseX = parent.position.x;
  const baseY = parent.position.y + NODE_GAP_Y;

  if (existingChildCount === 0) {
    return { x: baseX, y: baseY };
  }

  const direction = existingChildCount % 2 === 0 ? -1 : 1;
  const offset = Math.ceil(existingChildCount / 2) * NODE_GAP_X;

  return {
    x: baseX + direction * offset,
    y: baseY,
  };
}

// ── Default Metadata Templates ─────────────────────────────────────────────────

function getDefaultMetadata(actionId: string): Record<string, string> {
  switch (actionId) {
    case "email":
      return {
        name: "Email Notification",
        email: "",
        subject: "Workflow Alert",
        body: [
          "Hi,",
          "",
          "A workflow event was triggered.",
          "",
          "— FlowPilot Automation",
        ].join("\n"),
      };
    case "telegram":
      return {
        name: "Telegram Notification",
        chatId: "",
        message: [
          "⚡ *Workflow Alert*",
          "",
          "A trigger event was detected.",
        ].join("\n"),
      };
    case "webhook":
      return {
        name: "Webhook Trigger",
        walletAddress: "",
      };
    default:
      return {};
  }
}

// ── Custom Node Component ──────────────────────────────────────────────────────

function CustomNode({ data }: NodeProps<CustomNodeType>) {
  const isStart = data.type === "trigger";

  return (
    <div className="relative group">
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-neutral-600 !border-2 !border-neutral-500 hover:!bg-white transition-colors"
        />
      )}

      <div
        className={`bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 p-5 shadow-2xl hover:border-neutral-600 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] transition-all min-w-[200px] ${
          isStart ? "rounded-r-2xl" : "rounded-2xl"
        }`}
        style={
          isStart
            ? {
                borderTopLeftRadius: "100px",
                borderBottomLeftRadius: "100px",
              }
            : {}
        }
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.08)]">
            <NodeIcon
              iconId={data.availableActionId}
              className="w-7 h-7 text-black"
            />
          </div>

          <div className="text-center w-full">
            <p className="text-white font-medium text-sm mb-0.5">
              {data.label}
            </p>
            <p className="text-neutral-500 text-xs">
              {data.subtitle || data.type}
            </p>
          </div>

          {data.childCount > 0 && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full px-2 py-0.5 text-[10px] text-neutral-400">
              <GitBranch className="w-3 h-3" />
              {data.childCount}
            </div>
          )}

          <button
            onClick={data.onDelete}
            className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3.5 h-3.5 text-neutral-500 hover:text-red-400" />
          </button>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-neutral-600 !border-2 !border-neutral-500 hover:!bg-white transition-colors"
      />

      <button
        className="absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-neutral-200 border border-neutral-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_12px_rgba(255,255,255,0.1)]"
        onClick={data.onAdd}
        title="Add action from this node"
      >
        <Plus className="w-4 h-4 text-black" />
      </button>
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

// ── Toast Types ────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastIdCounter = 0;

// ── Main Component ─────────────────────────────────────────────────────────────

export default function WorkflowBuilder() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState<"trigger" | "action">(
    "trigger"
  );
  const [triggers, setTriggers] = useState<AvailableNode[]>([]);
  const [actions, setActions] = useState<AvailableNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AvailableNode | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [addAfterNodeId, setAddAfterNodeId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = ++toastIdCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    fetchTriggersAndActions();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, type: "smoothstep", style: EDGE_STYLE },
          eds
        )
      );
    },
    [setEdges]
  );

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function fetchTriggersAndActions(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [triggerRes, actionRes] = await Promise.all([
        axios.get<{ value: AvailableNode[] }>(
          "http://localhost:8000/api/v1/availableTrigger",
          { withCredentials: true }
        ),
        axios.get<{ availableActionNodes: AvailableNode[] }>(
          "http://localhost:8000/api/v1/availableActions",
          { withCredentials: true }
        ),
      ]);
      setTriggers(triggerRes.data.value ?? []);
      setActions(actionRes.data.availableActionNodes ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Count children ─────────────────────────────────────────────────────────

  function countChildren(nodeId: string): number {
    return edges.filter((e) => e.source === nodeId).length;
  }

  // ── Handle + button click on a node ────────────────────────────────────────

  function handleAddFromNode(nodeId: string): void {
    setAddAfterNodeId(nodeId);
    setSidebarType("action");
    setSidebarOpen(true);
  }

  // ── Build node data ────────────────────────────────────────────────────────

  function buildNodeData(
    nodeId: string,
    item: AvailableNode,
    nodeType: "trigger" | "action",
    meta: Record<string, string>,
    childCount: number
  ): CustomNodeData {
    return {
      label: item.name,
      subtitle: meta.name || nodeType,
      type: nodeType,
      availableActionId: item.id,
      metadata: meta,
      childCount,
      onDelete: () => deleteNode(nodeId),
      onAdd: () => handleAddFromNode(nodeId),
    };
  }

  // ── Refresh child counts ───────────────────────────────────────────────────

  function refreshChildCounts(): void {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          childCount: edges.filter((e) => e.source === node.id).length,
        },
      }))
    );
  }

  // ── Add trigger ────────────────────────────────────────────────────────────

  function addTriggerFromModal(): void {
    if (!selectedItem) return;
    const nodeId = `node-${Date.now()}`;

    const newNode: CustomNodeType = {
      id: nodeId,
      type: "custom",
      position: { x: 400, y: 80 },
      data: buildNodeData(nodeId, selectedItem, "trigger", metadata, 0),
    };

    setNodes((nds) => [...nds, newNode]);
    setModalOpen(false);
    setSelectedItem(null);
    setMetadata({});
    setAddAfterNodeId(null);
    setSidebarType("action");
  }

  // ── Sidebar item click ─────────────────────────────────────────────────────

  function handleSidebarItemClick(item: AvailableNode): void {
    setSelectedItem(item);
    setMetadata(getDefaultMetadata(item.id));
    setSidebarOpen(false);
    setModalOpen(true);
  }

  // ── Delete node ────────────────────────────────────────────────────────────

  function deleteNode(nodeId: string): void {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    setTimeout(refreshChildCounts, 0);
  }

  // ── Add node from modal (handles both trigger and action) ──────────────────

  function addNodeFromModal(): void {
    if (!selectedItem) return;

    // If we're adding a trigger, use the trigger path
    if (sidebarType === "trigger" || (!hasTrigger && !addAfterNodeId)) {
      addTriggerFromModal();
      return;
    }

    const nodeId = `node-${Date.now()}`;

    const parentNode = addAfterNodeId
      ? (nodes.find((n) => n.id === addAfterNodeId) ?? null)
      : nodes.length > 0
        ? (nodes[nodes.length - 1] ?? null)
        : null;

    let position: { x: number; y: number };
    if (parentNode) {
      const existingChildren = countChildren(parentNode.id);
      position = getChildPosition(parentNode, existingChildren);
    } else {
      position = { x: 400, y: 80 };
    }

    const newNode: CustomNodeType = {
      id: nodeId,
      type: "custom",
      position,
      data: buildNodeData(nodeId, selectedItem, "action", metadata, 0),
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      if (parentNode) {
        return updated.map((n) =>
          n.id === parentNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  childCount: countChildren(parentNode.id) + 1,
                },
              }
            : n
        );
      }
      return updated;
    });

    if (parentNode) {
      setEdges((eds) => [...eds, createEdge(parentNode.id, nodeId)]);
    }

    setModalOpen(false);
    setSelectedItem(null);
    setMetadata({});
    setAddAfterNodeId(null);
  }

  // ── Save workflow ──────────────────────────────────────────────────────────

  async function saveWorkflow(): Promise<void> {
    const triggerNode = nodes.find((n) => n.data.type === "trigger");
    const actionNodes = nodes.filter((n) => n.data.type === "action");

    if (!triggerNode) {
      addToast("Please add a trigger first!", "error");
      return;
    }

    if (actionNodes.length === 0) {
      addToast("Please add at least one action!", "error");
      return;
    }

    const childrenMap = new Map<string, string[]>();
    for (const edge of edges) {
      const existing = childrenMap.get(edge.source) ?? [];
      existing.push(edge.target);
      childrenMap.set(edge.source, existing);
    }

    const orderedActionIds: string[] = [];
    const queue = [triggerNode.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = nodes.find((n) => n.id === current);
      if (node && node.data.type === "action") {
        orderedActionIds.push(current);
      }

      const children = childrenMap.get(current) ?? [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }

    const payload = {
      availableTriggerId: triggerNode.data.availableActionId,
      triggerMeta: triggerNode.data.metadata,
      actions: orderedActionIds.map((id, index) => {
        const node = nodes.find((n) => n.id === id)!;
        return {
          availableActionId: node.data.availableActionId,
          actionMeta: node.data.metadata,
          sortingOrder: index,
        };
      }),
    };

    try {
      const saveRes = await axios.post("http://localhost:8000/api/v1/workflow", payload, {
        withCredentials: true,
      });

      // Auto-register Helius webhook if trigger has a wallet address
      const walletAddress = triggerNode.data.metadata?.walletAddress;
      if (walletAddress && walletAddress.trim().length > 0) {
        try {
          await axios.post(
            "http://localhost:8000/api/v1/helius/register",
            {
              workflowId: saveRes.data.workflowId,
              walletAddress: walletAddress.trim(),
            },
            { withCredentials: true }
          );
          addToast("Wallet tracking registered via Helius!", "success");
        } catch (heliusErr: unknown) {
          addToast(
            `Workflow saved but Helius registration failed: ${getErrorMessage(heliusErr)}`,
            "error"
          );
        }
      }

      addToast("Workflow saved successfully!", "success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      addToast(`Error saving: ${getErrorMessage(err)}`, "error");
    }
  }

  // ── Close helpers ──────────────────────────────────────────────────────────

  function closeSidebar(): void {
    setSidebarOpen(false);
    setAddAfterNodeId(null);
  }

  function closeModal(): void {
    setModalOpen(false);
    setSelectedItem(null);
    setAddAfterNodeId(null);
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentItems = sidebarType === "trigger" ? triggers : actions;
  const hasTrigger = nodes.some((n) => n.data.type === "trigger");
  const parentNodeLabel = addAfterNodeId
    ? nodes.find((n) => n.id === addAfterNodeId)?.data.label
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-screen bg-[#0a0a0a] flex relative">
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-[70] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-xl border animate-[fadeIn_0.3s_ease] ${
              t.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : t.type === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-white/5 border-white/10 text-white"
            }`}
          >
            {t.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0a0a0a]"
          defaultEdgeOptions={{
            animated: true,
            type: "smoothstep",
            style: EDGE_STYLE,
          }}
          connectionLineStyle={{
            stroke: "#555",
            strokeWidth: 2,
            strokeDasharray: "5, 5",
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1a1a1a"
          />
          <Controls className="!bg-neutral-900/80 !backdrop-blur-xl !border !border-neutral-800 !rounded-xl !shadow-xl [&>button]:!bg-neutral-800 [&>button]:!border-neutral-700 [&>button]:!text-neutral-400 [&>button:hover]:!bg-neutral-700" />
          <MiniMap
            className="!bg-neutral-900/80 !backdrop-blur-xl !border !border-neutral-800 !rounded-xl"
            nodeColor="#fff"
            maskColor="rgba(0, 0, 0, 0.7)"
          />

          {/* Top Panel */}
          <Panel position="top-left" className="m-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 py-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </Panel>

          <Panel position="top-right" className="flex gap-2 m-4">
            {nodes.length > 0 && (
              <>
                <button
                  onClick={saveWorkflow}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm font-medium active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => addToast("Execute workflow (coming soon)", "info")}
                  className="px-4 py-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 hover:border-neutral-700 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <PlayCircle className="w-4 h-4" />
                  Execute
                </button>
              </>
            )}
            <button
              onClick={() => {
                setAddAfterNodeId(null);
                setSidebarType(hasTrigger ? "action" : "trigger");
                setSidebarOpen(true);
              }}
              className="px-4 py-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 hover:border-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add {hasTrigger ? "Action" : "Trigger"}
            </button>
          </Panel>

          {/* Empty State */}
          {nodes.length === 0 && (
            <Panel position="top-center" className="mt-20">
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-dashed border-neutral-800 rounded-2xl p-8 text-center max-w-md">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Start Building Your Workflow
                </h3>
                <p className="text-neutral-400 mb-6 text-sm">
                  Add a trigger to get started with your automation
                </p>
                <button
                  onClick={() => {
                    setAddAfterNodeId(null);
                    setSidebarType("trigger");
                    setSidebarOpen(true);
                  }}
                  className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all inline-flex items-center gap-2 text-sm font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Add Trigger
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-neutral-900/90 backdrop-blur-2xl border-l border-neutral-800 shadow-2xl shadow-black/50 transform transition-transform duration-300 z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Select {sidebarType === "trigger" ? "Trigger" : "Action"}
            </h2>
            {parentNodeLabel && (
              <p className="text-neutral-400 text-xs mt-1 flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                Branching from &ldquo;{parentNodeLabel}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchTriggersAndActions}
                className="mt-2 text-red-400 text-sm underline hover:text-red-300"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && currentItems.length === 0 && (
            <div className="p-4 text-center text-neutral-500 text-sm">
              No {sidebarType}s available
            </div>
          )}
          {!loading &&
            !error &&
            currentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item)}
                className="w-full p-4 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 hover:border-white/10 rounded-xl transition-all flex items-center gap-4 group/item"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.06)] transition-transform group-hover/item:scale-110">
                  <NodeIcon iconId={item.id} className="w-5 h-5 text-black" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-medium text-sm">{item.name}</p>
                  <p className="text-neutral-500 text-xs">
                    {sidebarType === "trigger"
                      ? "Click to add"
                      : "Configure and add"}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-neutral-600 group-hover/item:text-white transition-colors" />
              </button>
            ))}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        />
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 w-[520px] max-h-[700px] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.06)]">
                  <NodeIcon
                    iconId={selectedItem.id}
                    className="w-5 h-5 text-black"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedItem.name}
                  </h2>
                  <p className="text-neutral-500 text-xs">
                    {parentNodeLabel ? (
                      <>Branching from &ldquo;{parentNodeLabel}&rdquo;</>
                    ) : (
                      "Configure action"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[450px]">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${selectedItem.name} name`}
                  value={metadata.name ?? ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                />
              </div>

              {/* ── Webhook trigger — Wallet Address ────────────────────── */}
              {selectedItem.id === "webhook" && sidebarType === "trigger" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0x1234...Your wallet address"
                    value={metadata.walletAddress ?? ""}
                    onChange={(e) =>
                      setMetadata({ ...metadata, walletAddress: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm font-mono"
                  />
                  <p className="text-neutral-600 text-[10px] mt-1.5">
                    Enter the wallet address to track all incoming &amp; outgoing transactions
                  </p>
                </div>
              )}

              {/* ── Email fields ────────────────────────────────────────── */}
              {selectedItem.id === "email" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      To (Email)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. user@example.com"
                      value={metadata.email ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={metadata.subject ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Body
                    </label>
                    <textarea
                      value={metadata.body ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, body: e.target.value })
                      }
                      rows={6}
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {/* ── Telegram fields ─────────────────────────────────────── */}
              {selectedItem.id === "telegram" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Chat ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321"
                      value={metadata.chatId ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, chatId: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                    />
                    <p className="text-neutral-600 text-[10px] mt-1.5">
                      Send /start to your bot, then call getUpdates to find your
                      chat ID
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      value={metadata.message ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, message: e.target.value })
                      }
                      rows={6}
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {/* ── Webhook fields ──────────────────────────────────────── */}
              {selectedItem.id === "webhook" && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/webhook"
                    value={metadata.webhookUrl ?? ""}
                    onChange={(e) =>
                      setMetadata({ ...metadata, webhookUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Add a description..."
                  value={metadata.description ?? ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addNodeFromModal}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.08)] text-sm font-medium active:scale-[0.98]"
              >
                {sidebarType === "trigger" && !hasTrigger
                  ? "Add Trigger"
                  : "Add to Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
