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
  MessageCircle,
  Check,
  AlertCircle,
  ArrowLeft,
  Bot,
  Code,
  Brain,
  Calculator,
  Clock,
  Trash2,
  Key,
  Shield,
  FileOutput,
  Settings,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import axios, { type AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../../lib/api";

// ── Icon Map ───────────────────────────────────────────────────────────────────

type IconKey =
  | "webhook"
  | "manual"
  | "email"
  | "database"
  | "schedule"
  | "file"
  | "api"
  | "telegram"
  | "discord"
  | "ai-agent";

const iconMap: Record<IconKey, LucideIcon> = {
  webhook: Webhook,
  manual: PlayCircle,
  email: Mail,
  database: Database,
  schedule: Calendar,
  file: FileText,
  api: Zap,
  telegram: Send,
  discord: MessageCircle,
  "ai-agent": Bot,
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

// ── AI Agent Sub-Node Types ────────────────────────────────────────────────────

interface AIAgentNodeData {
  label: string;
  subtitle: string;
  type: "action";
  availableActionId: "ai-agent";
  metadata: Record<string, string>;
  childCount: number;
  onDelete: () => void;
  onAdd: () => void;
  onAddModel: () => void;
  onAddMemory: () => void;
  onAddTool: () => void;
  onAddOutput: () => void;
  modelAttached: boolean;
  memoryAttached: boolean;
  toolCount: number;
  outputAttached: boolean;
  [key: string]: unknown;
}

type AIAgentNodeType = Node<AIAgentNodeData, "aiAgent">;

interface SubNodeData {
  label: string;
  subType: "model" | "memory" | "tool" | "output";
  icon: string;
  parentAgentId: string;
  config: Record<string, string>;
  onDelete: () => void;
  [key: string]: unknown;
}

type SubNodeType = Node<SubNodeData, "subNode">;

type AnyNodeType = CustomNodeType | AIAgentNodeType | SubNodeType;

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
  parent: Node,
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
          "— nodex Automation",
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
    case "manual":
      return {
        name: "Manual Trigger",
      };
    case "discord":
      return {
        name: "Discord Message",
        webhookUrl: "",
        content: "",
        username: "",
      };
    case "ai-agent":
      return {
        name: "AI Agent",
        systemPrompt: [
          "You are an AI agent with a Timer tool operating inside an automation workflow.",
          "",
          "Role:",
          "- Process incoming requests and trigger events",
          "- Extract timer/reminder/delay requests from natural language",
          "- Schedule messages to be sent at specific times via email, telegram, or discord",
          "",
          "Timer Capabilities:",
          "- Extract durations ('5 minutes', 'an hour', '30 seconds') and convert to total seconds",
          "- Identify the specific task or reason for the timer",
          "- Understand relative time ('in two hours', 'tomorrow at 3pm')",
          "",
          "Instructions:",
          "- When a user asks to set a timer, reminder, or delay, use the set_timer tool",
          "- Always convert time to seconds for delay_seconds",
          "- If no reason given, use 'General Timer' as the default label",
          "- Confirm to the user once the tool has executed",
          "",
          "Duration Conversions:",
          "- 30 seconds = 30, 5 minutes = 300, 1 hour = 3600, 1 day = 86400",
          "",
          "Timer Behavior:",
          "- Short timers (<=60s): Active wait, message sent immediately after delay",
          "- Long timers (>60s): Scheduled in DB, background worker sends at scheduled time",
          "",
          "After setting a timer, confirm with: what will be sent, to whom, via which channel, and when.",
        ].join("\n"),
        model: "llama-3.3-70b-versatile",
        maxSteps: "6",
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

// ── AI Agent Compound Node ─────────────────────────────────────────────────────

const TOOL_SUB_NODES = [
  { id: "scheduleTimer", name: "Timer", icon: "clock", description: "Schedule message for a specific date/time" },
];

function getSubNodeIcon(iconId: string, className?: string) {
  switch (iconId) {
    case "calculator": return <Calculator className={className} />;
    case "code": return <Code className={className} />;
    case "clock": return <Clock className={className} />;
    case "brain": return <Brain className={className} />;
    case "email": return <Mail className={className} />;
    case "discord": return <MessageCircle className={className} />;
    case "telegram": return <Send className={className} />;
    case "database": return <Database className={className} />;
    case "output": return <FileOutput className={className} />;
    case "key": return <Key className={className} />;
    case "groq": return <span className={`font-bold text-sm ${className}`}>G</span>;
    case "gemini": return <span className={`font-bold text-lg ${className}`}>G</span>;
    default: return <Code className={className} />;
  }
}

function AIAgentNode({ data }: NodeProps<AIAgentNodeType>) {
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-neutral-600 !border-2 !border-neutral-500 hover:!bg-white transition-colors"
      />

      {/* Main Agent Box */}
      <div className="bg-neutral-800/90 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl p-5 shadow-2xl min-w-[320px] hover:border-amber-500/50 transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-neutral-700 rounded-xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-base">{data.label}</p>
            <p className="text-amber-400/70 text-xs">Groq Agent</p>
          </div>
        </div>

        {/* Diamond Sub-Handles — 4 nodes */}
        <div className="flex items-start justify-center gap-5 pt-3 border-t border-neutral-700/50">
          {/* LLM (Groq) */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={data.onAddModel}
              className={`w-7 h-7 rotate-45 border-2 flex items-center justify-center transition-all ${
                data.modelAttached
                  ? "bg-emerald-500/20 border-emerald-500/50"
                  : "bg-neutral-700 border-neutral-500 hover:border-white/50"
              }`}
            >
              {data.modelAttached ? (
                <Check className="w-3 h-3 -rotate-45 text-emerald-400" />
              ) : (
                <Plus className="w-3 h-3 -rotate-45 text-neutral-400" />
              )}
            </button>
            <span className="text-[9px] text-neutral-500 mt-1">
              LLM{!data.modelAttached && <span className="text-red-400">*</span>}
            </span>
          </div>

          {/* Memory (PostgreSQL) */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={data.onAddMemory}
              className={`w-7 h-7 rotate-45 border-2 flex items-center justify-center transition-all ${
                data.memoryAttached
                  ? "bg-blue-500/20 border-blue-500/50"
                  : "bg-neutral-700 border-neutral-500 hover:border-white/50"
              }`}
            >
              {data.memoryAttached ? (
                <Check className="w-3 h-3 -rotate-45 text-blue-400" />
              ) : (
                <Plus className="w-3 h-3 -rotate-45 text-neutral-400" />
              )}
            </button>
            <span className="text-[9px] text-neutral-500 mt-1">Memory</span>
          </div>

          {/* Tool */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={data.onAddTool}
              className={`w-7 h-7 rotate-45 border-2 flex items-center justify-center transition-all ${
                data.toolCount > 0
                  ? "bg-violet-500/20 border-violet-500/50 hover:border-violet-400"
                  : "bg-neutral-700 border-neutral-500 hover:border-white/50"
              }`}
            >
              {data.toolCount > 0 ? (
                <span className="text-[8px] -rotate-45 text-violet-400 font-bold">{data.toolCount}</span>
              ) : (
                <Plus className="w-3 h-3 -rotate-45 text-neutral-400" />
              )}
            </button>
            <span className="text-[9px] text-neutral-500 mt-1">Tools</span>
          </div>

          {/* Output */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={data.onAddOutput}
              className={`w-7 h-7 rotate-45 border-2 flex items-center justify-center transition-all ${
                data.outputAttached
                  ? "bg-orange-500/20 border-orange-500/50"
                  : "bg-neutral-700 border-neutral-500 hover:border-white/50"
              }`}
            >
              {data.outputAttached ? (
                <Check className="w-3 h-3 -rotate-45 text-orange-400" />
              ) : (
                <Plus className="w-3 h-3 -rotate-45 text-neutral-400" />
              )}
            </button>
            <span className="text-[9px] text-neutral-500 mt-1">Output</span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-neutral-600 !border-2 !border-neutral-500 hover:!bg-white transition-colors"
      />

      {/* Delete button */}
      <button
        onClick={data.onDelete}
        className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-3.5 h-3.5 text-neutral-500 hover:text-red-400" />
      </button>

      {/* Add next action button */}
      <button
        className="absolute -right-4 top-8 w-7 h-7 bg-white hover:bg-neutral-200 border border-neutral-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_12px_rgba(255,255,255,0.1)]"
        onClick={data.onAdd}
        title="Add action from this node"
      >
        <Plus className="w-4 h-4 text-black" />
      </button>
    </div>
  );
}


// ── Sub-Node Component ─────────────────────────────────────────────────────────

function SubNode({ data }: NodeProps<SubNodeType>) {
  const colorMap = {
    model:  { border: "border-emerald-500/40", bg: "bg-emerald-500/5", accent: "text-emerald-400", ring: "ring-emerald-500/20" },
    memory: { border: "border-blue-500/40",    bg: "bg-blue-500/5",    accent: "text-blue-400",    ring: "ring-blue-500/20" },
    tool:   { border: "border-violet-500/40",  bg: "bg-violet-500/5",  accent: "text-violet-400",  ring: "ring-violet-500/20" },
    output: { border: "border-orange-500/40",  bg: "bg-orange-500/5",  accent: "text-orange-400",  ring: "ring-orange-500/20" },
  };
  const colors = colorMap[data.subType] || colorMap.tool;

  return (
    <div className="relative group flex flex-col items-center">
      {/* Circular node */}
      <div
        className={`w-16 h-16 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-lg ring-4 ${colors.ring} hover:scale-105 transition-all cursor-default`}
      >
        {getSubNodeIcon(data.icon, `w-6 h-6 ${colors.accent}`)}

        {/* Checkmark badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-neutral-900">
          <Check className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <p className={`text-xs font-medium ${colors.accent}`}>{data.label}</p>
        {data.subType === "model" && (
          <p className="text-[9px] text-neutral-600">Groq LLM</p>
        )}
        {data.subType === "memory" && (
          <p className="text-[9px] text-neutral-600">PostgreSQL</p>
        )}
        {data.subType === "output" && (
          <p className="text-[9px] text-neutral-600">Response Format</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={data.onDelete}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
  aiAgent: AIAgentNode,
  subNode: SubNode,
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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
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
  const [toolPickerOpen, setToolPickerOpen] = useState(false);
  const [toolPickerAgentId, setToolPickerAgentId] = useState<string | null>(null);

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
          `${API_BASE_URL}/api/v1/availableTrigger`,
          { withCredentials: true }
        ),
        axios.get<{ availableActionNodes: AvailableNode[] }>(
          `${API_BASE_URL}/api/v1/availableActions`,
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
    const defaultMeta = getDefaultMetadata(item.id);

    // Skip modal for webhook trigger — add directly to canvas
    if ((item.id === "webhook" || item.id === "manual") && sidebarType === "trigger") {
      const nodeId = `node-${Date.now()}`;
      const newNode: CustomNodeType = {
        id: nodeId,
        type: "custom",
        position: { x: 400, y: 80 },
        data: buildNodeData(nodeId, item, "trigger", defaultMeta, 0),
      };
      setNodes((nds) => [...nds, newNode]);
      setSidebarOpen(false);
      setSidebarType("action");
      return;
    }

    // Removed ai-agent auto-skip logic to allow modal to open

    setSelectedItem(item);
    setMetadata(defaultMeta);
    setSidebarOpen(false);
    setModalOpen(true);
  }

  // ── AI Agent: Add Model Sub-Node (Groq LLM) ───────────────────────────────

  function addModelSubNode(agentNodeId: string): void {
    const agentNode = nodes.find((n) => n.id === agentNodeId);
    if (!agentNode) return;

    const existingModel = nodes.find(
      (n) => n.type === "subNode" && (n.data as any).subType === "model" && (n.data as any).parentAgentId === agentNodeId
    );
    if (existingModel) {
      addToast("LLM already attached", "info");
      return;
    }

    const subId = `sub-model-${Date.now()}`;
    const subNode: SubNodeType = {
      id: subId,
      type: "subNode",
      position: {
        x: agentNode.position.x - 100,
        y: agentNode.position.y + 240,
      },
      data: {
        label: "Groq\nLLaMA 3.3 70B",
        subType: "model",
        icon: "groq",
        parentAgentId: agentNodeId,
        config: { provider: "groq", model: "llama-3.3-70b-versatile" },
        onDelete: () => deleteSubNode(subId, agentNodeId),
      },
    };

    setNodes((nds) =>
      [...nds, subNode].map((n) =>
        n.id === agentNodeId && n.type === "aiAgent"
          ? { ...n, data: { ...(n.data as AIAgentNodeData), modelAttached: true } }
          : n
      )
    );
    setEdges((eds) => [
      ...eds,
      {
        id: `sub-edge-${agentNodeId}-${subId}`,
        source: agentNodeId,
        target: subId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "6, 4" },
      },
    ]);
    addToast("Groq LLM attached — configure API key in settings", "success");
  }

  // ── AI Agent: Add Memory Sub-Node (PostgreSQL) ────────────────────────────

  function addMemorySubNode(agentNodeId: string): void {
    const agentNode = nodes.find((n) => n.id === agentNodeId);
    if (!agentNode) return;

    const existingMemory = nodes.find(
      (n) => n.type === "subNode" && (n.data as any).subType === "memory" && (n.data as any).parentAgentId === agentNodeId
    );
    if (existingMemory) {
      addToast("Memory already attached", "info");
      return;
    }

    const subId = `sub-memory-${Date.now()}`;
    const subNode: SubNodeType = {
      id: subId,
      type: "subNode",
      position: {
        x: agentNode.position.x - 10,
        y: agentNode.position.y + 240,
      },
      data: {
        label: "PostgreSQL\nMemory",
        subType: "memory",
        icon: "database",
        parentAgentId: agentNodeId,
        config: { type: "postgres", windowSize: "20" },
        onDelete: () => deleteSubNode(subId, agentNodeId),
      },
    };

    setNodes((nds) =>
      [...nds, subNode].map((n) =>
        n.id === agentNodeId && n.type === "aiAgent"
          ? { ...n, data: { ...(n.data as AIAgentNodeData), memoryAttached: true } }
          : n
      )
    );
    setEdges((eds) => [
      ...eds,
      {
        id: `sub-edge-${agentNodeId}-${subId}`,
        source: agentNodeId,
        target: subId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "6, 4" },
      },
    ]);
    addToast("PostgreSQL Memory attached", "success");
  }

  // ── AI Agent: Add Output Sub-Node ─────────────────────────────────────────

  function addOutputSubNode(agentNodeId: string): void {
    const agentNode = nodes.find((n) => n.id === agentNodeId);
    if (!agentNode) return;

    const existingOutput = nodes.find(
      (n) => n.type === "subNode" && (n.data as any).subType === "output" && (n.data as any).parentAgentId === agentNodeId
    );
    if (existingOutput) {
      addToast("Output already attached", "info");
      return;
    }

    const subId = `sub-output-${Date.now()}`;
    const subNode: SubNodeType = {
      id: subId,
      type: "subNode",
      position: {
        x: agentNode.position.x + 230,
        y: agentNode.position.y + 240,
      },
      data: {
        label: "Text\nOutput",
        subType: "output",
        icon: "output",
        parentAgentId: agentNodeId,
        config: { format: "text" },
        onDelete: () => deleteSubNode(subId, agentNodeId),
      },
    };

    setNodes((nds) =>
      [...nds, subNode].map((n) =>
        n.id === agentNodeId && n.type === "aiAgent"
          ? { ...n, data: { ...(n.data as AIAgentNodeData), outputAttached: true } }
          : n
      )
    );
    setEdges((eds) => [
      ...eds,
      {
        id: `sub-edge-${agentNodeId}-${subId}`,
        source: agentNodeId,
        target: subId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#f97316", strokeWidth: 2, strokeDasharray: "6, 4" },
      },
    ]);
    addToast("Output format attached", "success");
  }

  // ── AI Agent: Open Tool Picker ────────────────────────────────────────────

  function openToolPicker(agentNodeId: string): void {
    setToolPickerAgentId(agentNodeId);
    setToolPickerOpen(true);
  }

  // ── AI Agent: Add Tool Sub-Node ───────────────────────────────────────────

  function addToolSubNode(agentNodeId: string, toolDef: typeof TOOL_SUB_NODES[0]): void {
    const agentNode = nodes.find((n) => n.id === agentNodeId);
    if (!agentNode) return;

    // Count existing tool sub-nodes for this agent
    const existingTools = nodes.filter(
      (n) => n.type === "subNode" && (n.data as any).subType === "tool" && (n.data as any).parentAgentId === agentNodeId
    );

    // Check if this tool is already added
    if (existingTools.some((n) => (n.data as any).config?.toolId === toolDef.id)) {
      addToast(`${toolDef.name} already added`, "info");
      return;
    }

    const subId = `sub-tool-${Date.now()}`;
    const offsetX = existingTools.length * 90;
    const subNode: SubNodeType = {
      id: subId,
      type: "subNode",
      position: {
        x: agentNode.position.x + 100 + offsetX,
        y: agentNode.position.y + 220,
      },
      data: {
        label: toolDef.name,
        subType: "tool",
        icon: toolDef.icon,
        parentAgentId: agentNodeId,
        config: { toolId: toolDef.id },
        onDelete: () => deleteSubNode(subId, agentNodeId),
      },
    };

    setNodes((nds) =>
      [...nds, subNode].map((n) =>
        n.id === agentNodeId && n.type === "aiAgent"
          ? { ...n, data: { ...(n.data as AIAgentNodeData), toolCount: existingTools.length + 1 } }
          : n
      )
    );
    setEdges((eds) => [
      ...eds,
      {
        id: `sub-edge-${agentNodeId}-${subId}`,
        source: agentNodeId,
        target: subId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "6, 4" },
      },
    ]);
    addToast(`${toolDef.name} tool added`, "success");
  }

  // ── Delete Sub-Node ────────────────────────────────────────────────────────

  function deleteSubNode(subNodeId: string, agentNodeId: string): void {
    const subNode = nodes.find((n) => n.id === subNodeId);
    const subType = subNode ? (subNode.data as any).subType : null;

    setNodes((nds) => {
      const filtered = nds.filter((n) => n.id !== subNodeId);
      return filtered.map((n) => {
        if (n.id === agentNodeId && n.type === "aiAgent") {
          const agentData = n.data as AIAgentNodeData;
          if (subType === "model") {
            return { ...n, data: { ...agentData, modelAttached: false } };
          } else if (subType === "memory") {
            return { ...n, data: { ...agentData, memoryAttached: false } };
          } else if (subType === "tool") {
            return { ...n, data: { ...agentData, toolCount: Math.max(0, agentData.toolCount - 1) } };
          } else if (subType === "output") {
            return { ...n, data: { ...agentData, outputAttached: false } };
          }
        }
        return n;
      });
    });
    setEdges((eds) => eds.filter((e) => e.source !== subNodeId && e.target !== subNodeId));
  }

  // ── Delete node ────────────────────────────────────────────────────────────

  function deleteNode(nodeId: string): void {
    // If deleting an AI Agent, also delete all its sub-nodes
    const subNodeIds = nodes
      .filter((n) => n.type === "subNode" && (n.data as any).parentAgentId === nodeId)
      .map((n) => n.id);
    const idsToDelete = new Set([nodeId, ...subNodeIds]);

    setNodes((nds) => nds.filter((n) => !idsToDelete.has(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target))
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

    if (selectedItem.id === "ai-agent") {
      const ts = Date.now();
      const modelSubId = `sub-model-${ts}`;
      const memorySubId = `sub-memory-${ts + 1}`;
      const timerSubId = `sub-tool-${ts + 2}`;

      const agentNode: AIAgentNodeType = {
        id: nodeId,
        type: "aiAgent",
        position,
        data: {
          label: "AI Agent",
          subtitle: "Tools Agent",
          type: "action",
          availableActionId: "ai-agent",
          metadata: metadata, // Use the configured metadata from the modal!
          childCount: 0,
          onDelete: () => deleteNode(nodeId),
          onAdd: () => handleAddFromNode(nodeId),
          onAddModel: () => addModelSubNode(nodeId),
          onAddMemory: () => addMemorySubNode(nodeId),
          onAddTool: () => openToolPicker(nodeId),
          onAddOutput: () => addOutputSubNode(nodeId),
          modelAttached: true,
          memoryAttached: true,
          toolCount: 1,
          outputAttached: false,
        },
      };

      const modelSub: SubNodeType = {
        id: modelSubId,
        type: "subNode",
        position: { x: position.x - 100, y: position.y + 240 },
        data: {
          label: "Groq\nLLaMA 3.3 70B",
          subType: "model",
          icon: "groq",
          parentAgentId: nodeId,
          config: { provider: "groq", model: "llama-3.3-70b-versatile" },
          onDelete: () => deleteSubNode(modelSubId, nodeId),
        },
      };

      const memorySub: SubNodeType = {
        id: memorySubId,
        type: "subNode",
        position: { x: position.x - 10, y: position.y + 240 },
        data: {
          label: "PostgreSQL\nMemory",
          subType: "memory",
          icon: "database",
          parentAgentId: nodeId,
          config: { type: "postgres", windowSize: "20" },
          onDelete: () => deleteSubNode(memorySubId, nodeId),
        },
      };

      const timerSub: SubNodeType = {
        id: timerSubId,
        type: "subNode",
        position: { x: position.x + 100, y: position.y + 220 },
        data: {
          label: "Timer",
          subType: "tool",
          icon: "clock",
          parentAgentId: nodeId,
          config: { toolId: "scheduleTimer" },
          onDelete: () => deleteSubNode(timerSubId, nodeId),
        },
      };

      setNodes((nds) => {
        const updated = [...nds, agentNode as any, modelSub as any, memorySub as any, timerSub as any];
        if (parentNode) {
          return updated.map((n) =>
            n.id === parentNode.id
              ? { ...n, data: { ...n.data, childCount: countChildren(parentNode.id) + 1 } }
              : n
          );
        }
        return updated;
      });

      const subEdges = [
        {
          id: `sub-edge-${nodeId}-${modelSubId}`,
          source: nodeId,
          target: modelSubId,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "6, 4" },
        },
        {
          id: `sub-edge-${nodeId}-${memorySubId}`,
          source: nodeId,
          target: memorySubId,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "6, 4" },
        },
        {
          id: `sub-edge-${nodeId}-${timerSubId}`,
          source: nodeId,
          target: timerSubId,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "6, 4" },
        },
      ];

      setEdges((eds) => {
        const newEdges = [...eds, ...subEdges];
        if (parentNode) {
          return [...newEdges, createEdge(parentNode.id, nodeId)];
        }
        return newEdges;
      });
      
      setModalOpen(false);
      setSelectedItem(null);
      setMetadata({});
      setAddAfterNodeId(null);
      addToast("AI Agent added with Groq LLM, PostgreSQL Memory, and Timer tool", "success");
      return;
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
    const triggerNode = nodes.find((n) => (n.data as any).type === "trigger");
    const actionNodes = nodes.filter((n) => (n.data as any).type === "action");

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
      const saveRes = await axios.post(`${API_BASE_URL}/api/v1/workflow`, payload, {
        withCredentials: true,
      });

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
  const hasTrigger = nodes.some((n) => (n.data as any).type === "trigger");
  const parentNodeLabel = addAfterNodeId
    ? (nodes.find((n) => n.id === addAfterNodeId)?.data as any)?.label
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-screen bg-[#2F2F2F] flex relative">
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
          className="bg-[#2F2F2F]"
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
            gap={24}
            size={1.5}
            color="#989898"
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
                  onClick={async () => {
                    // First save the workflow to get a workflow ID
                    try {
                      const triggerNode = nodes.find((n) => (n.data as any).type === "trigger");
                      if (!triggerNode) {
                        addToast("You must add a Trigger node first.", "error"); return;
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
                        if (node && (node.data as any).type === "action") {
                          orderedActionIds.push(current);
                        }
                        const children = childrenMap.get(current) ?? [];
                        queue.push(...children);
                      }

                      if (orderedActionIds.length === 0) {
                        addToast("Warning: No actions connected to the trigger", "error");
                        return; // Prevent running empty workflows
                      }

                      const payload = {
                        availableTriggerId: (triggerNode.data as any).availableActionId,
                        triggerMeta: triggerNode.data.metadata,
                        actions: orderedActionIds.map((id, index) => {
                          const node = nodes.find((n) => n.id === id)!;
                          return {
                            availableActionId: (node.data as any).availableActionId,
                            actionMeta: node.data.metadata,
                            sortingOrder: index,
                          };
                        }),
                      };

                      addToast("Saving workflow...", "info");
                      const saveRes = await axios.post(`${API_BASE_URL}/api/v1/workflow`, payload, { withCredentials: true });
                      const newWorkflowId = saveRes.data.workflowId || saveRes.data.workflow?.id || saveRes.data.id;
                      
                      if (!newWorkflowId) {
                        addToast("Failed to create workflow to execute", "error"); return;
                      }

                      addToast("Running workflow...", "info");
                      await axios.post(`${API_BASE_URL}/api/v1/workflow/${newWorkflowId}/execute`, {}, { withCredentials: true });
                      addToast("Workflow executed successfully!", "success");
                    } catch (err: unknown) {
                      addToast(`Execute failed: ${(err as any)?.response?.data?.error || (err as any).message}`, "error");
                    }
                  }}
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

      {/* ── Tool Picker Panel ──────────────────────────────────────────── */}
      {toolPickerOpen && toolPickerAgentId && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setToolPickerOpen(false)}
          />
          <div className="relative bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 w-[400px] max-h-[500px] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/30 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Add Tool</h2>
                  <p className="text-neutral-500 text-xs">Select a tool for the agent</p>
                </div>
              </div>
              <button
                onClick={() => setToolPickerOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto max-h-[380px]">
              {TOOL_SUB_NODES.map((toolDef) => {
                const alreadyAdded = nodes.some(
                  (n) => n.type === "subNode" && (n.data as any).config?.toolId === toolDef.id && (n.data as any).parentAgentId === toolPickerAgentId
                );
                return (
                  <button
                    key={toolDef.id}
                    onClick={() => {
                      if (!alreadyAdded) {
                        addToolSubNode(toolPickerAgentId, toolDef);
                      }
                    }}
                    disabled={alreadyAdded}
                    className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 group/tool ${
                      alreadyAdded
                        ? "bg-violet-500/5 border border-violet-500/20 opacity-60 cursor-default"
                        : "bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 hover:border-violet-500/30"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                      alreadyAdded
                        ? "bg-violet-500/10 border-violet-500/30"
                        : "bg-neutral-700 border-neutral-600 group-hover/tool:border-violet-500/30"
                    }`}>
                      {getSubNodeIcon(toolDef.icon, `w-4 h-4 ${
                        alreadyAdded ? "text-violet-400" : "text-neutral-400 group-hover/tool:text-violet-400"
                      }`)}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-white text-sm font-medium">{toolDef.name}</p>
                      <p className="text-neutral-500 text-[10px]">{toolDef.description}</p>
                    </div>
                    {alreadyAdded && (
                      <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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

              {/* ── Discord fields ────────────────────────────────────── */}
              {selectedItem.id === "discord" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={metadata.webhookUrl ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, webhookUrl: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm font-mono"
                    />
                    <p className="text-neutral-600 text-[10px] mt-1.5">
                      Go to Channel Settings → Integrations → Webhooks to create one
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Message Content
                    </label>
                    <textarea
                      value={metadata.content ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, content: e.target.value })
                      }
                      rows={4}
                      placeholder="Enter the message to send..."
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Bot Username (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Workflow Bot"
                      value={metadata.username ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, username: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                    />
                  </div>
                </>
              )}

              {/* ── AI Agent fields ──────────────────────────────────── */}
              {selectedItem.id === "ai-agent" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Task Instruction (Optional)
                    </label>
                    <textarea
                      value={metadata.taskInstruction ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, taskInstruction: e.target.value })
                      }
                      rows={3}
                      placeholder="e.g. Set a timer for 2 minutes to send a Telegram message to 1225009749 saying hello"
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm mb-4"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                      System Prompt
                    </label>
                    <textarea
                      value={metadata.systemPrompt ?? ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, systemPrompt: e.target.value })
                      }
                      rows={10}
                      placeholder="Define the agent's role, capabilities, and behavior..."
                      className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none font-mono text-xs leading-relaxed"
                    />
                    <p className="text-neutral-600 text-[10px] mt-1.5">
                      Instructions that define how the agent behaves when this workflow runs
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Model
                      </label>
                      <select
                        value={metadata.model ?? "llama-3.3-70b-versatile"}
                        onChange={(e) =>
                          setMetadata({ ...metadata, model: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B</option>
                        <option value="llama-3.1-8b-instant">LLaMA 3.1 8B</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                        Max Steps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={metadata.maxSteps ?? "6"}
                        onChange={(e) =>
                          setMetadata({ ...metadata, maxSteps: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all text-sm"
                      />
                      <p className="text-neutral-600 text-[10px] mt-1.5">
                        Max tool-call rounds before stopping
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl">
                    <p className="text-violet-400 text-xs font-medium mb-1">Available Tools</p>
                    <p className="text-neutral-500 text-[10px] leading-relaxed">
                      Timer — schedule messages to be sent at a specific date and time via Email, Telegram, or Discord.
                    </p>
                  </div>
                </>
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
