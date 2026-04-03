"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAgent,
  ChatMessage,
  AssistantContent,
  ConversationSummary,
} from "../../hooks/useAgent";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  ArrowLeft,
  Zap,
  Wrench,
  Clock,
  Calculator,
  Mail,
  Bot,
  User,
  Loader2,
  ChevronDown,
  AlertCircle,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

// ── Tool icon map ──────────────────────────────────────────────────
const TOOL_ICONS: Record<string, React.ElementType> = {
  sendEmail: Mail,
  sendDiscord: MessageSquare,
  sendTelegram: Send,
  getCurrentTime: Clock,
  calculateMath: Calculator,
};

const TOOL_LABELS: Record<string, string> = {
  sendEmail: "Send Email",
  sendDiscord: "Discord Message",
  sendTelegram: "Telegram Message",
  getCurrentTime: "Get Current Time",
  calculateMath: "Calculate Math",
};

// ── Helper: Extract text from message content ──────────────────────
function getMessageText(content: string | AssistantContent): string {
  if (typeof content === "string") return content;
  return content.text || "";
}

// ── Helper: Check if assistant message has tool calls ──────────────
function getToolCalls(content: string | AssistantContent) {
  if (typeof content === "string") return [];
  return content.toolCalls || [];
}

function getSteps(content: string | AssistantContent) {
  if (typeof content === "string") return [];
  return content.steps || [];
}

// ══════════════════════════════════════════════════════════════════
// Main Agent Chat Page
// ══════════════════════════════════════════════════════════════════
export default function AgentPage() {
  const router = useRouter();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isSending,
    error,
    fetchConversations,
    loadConversation,
    startNewConversation,
    sendMessage,
    deleteConversation,
    setError,
  } = useAgent();

  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const msg = inputValue;
    setInputValue("");
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full border-r border-neutral-800/80 bg-[#0a0a0a] flex flex-col overflow-hidden shrink-0"
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-neutral-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm tracking-tight">
                    AI Agent
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={startNewConversation}
                className="w-full px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex items-center gap-2 text-sm text-neutral-300 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                New conversation
              </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {conversations.length === 0 && !isLoading && (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-neutral-600" />
                  </div>
                  <p className="text-neutral-600 text-xs">
                    No conversations yet
                  </p>
                </div>
              )}

              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={() => loadConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
            </div>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-neutral-800/80">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-3 py-2 hover:bg-neutral-900 rounded-lg transition-colors flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <header className="h-14 border-b border-neutral-800/80 flex items-center px-4 gap-3 shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-neutral-400">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)
                    ?.title || "Conversation"
                : "New Conversation"}
            </span>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isSending ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-1">
              {messages.map((msg, idx) => (
                <MessageBubble key={msg.id || idx} message={msg} />
              ))}

              {isSending && <ThinkingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-red-500/20 bg-red-500/5"
            >
              <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400/60 hover:text-red-400 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="border-t border-neutral-800/80 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-neutral-900/80 border border-neutral-800 rounded-2xl focus-within:border-neutral-700 focus-within:ring-1 focus-within:ring-neutral-700/50 transition-all">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the agent anything... (e.g. &quot;Send an email to john@example.com&quot;)"
                rows={1}
                disabled={isSending}
                className="w-full bg-transparent text-sm text-white placeholder-neutral-600 px-4 pt-3.5 pb-3 pr-14 resize-none outline-none max-h-40 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="absolute right-2.5 bottom-2.5 p-2 bg-white hover:bg-neutral-200 text-black rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-white/5"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 mt-2 text-center">
              Agent can send emails, Discord &amp; Telegram messages, do math, and
              tell time. Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Empty State
// ══════════════════════════════════════════════════════════════════
function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Hey! I&apos;m your AI Agent
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed mb-8">
            I can send emails, post to Discord &amp; Telegram, do calculations,
            and tell you the current time. Just describe what you need!
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Mail, label: "Send an email to…" },
              { icon: MessageSquare, label: "Post to Discord…" },
              { icon: Calculator, label: "Calculate 1024 × 768" },
              { icon: Clock, label: "What time is it?" },
            ].map((item) => (
              <div
                key={item.label}
                className="px-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-neutral-500 flex items-center gap-2 cursor-default hover:border-neutral-700 hover:text-neutral-400 transition-all"
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Conversation Sidebar Item
// ══════════════════════════════════════════════════════════════════
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${
        isActive
          ? "bg-neutral-800/80 text-white"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
      <span className="flex-1 truncate text-xs">{conversation.title}</span>

      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-neutral-500 hover:text-red-400"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Message Bubble
// ══════════════════════════════════════════════════════════════════
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const text = getMessageText(message.content);
  const toolCalls = getToolCalls(message.content);
  const steps = getSteps(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 py-4 ${isUser ? "" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-neutral-800 border border-neutral-700"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/10"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-neutral-400" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-600">
          {isUser ? "You" : "Agent"}
        </span>

        {/* Tool calls (show before main text for assistant) */}
        {!isUser && steps.length > 0 && (
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                {step.toolCalls?.map((tc, j) => {
                  const Icon = TOOL_ICONS[tc.toolName] || Wrench;
                  const label = TOOL_LABELS[tc.toolName] || tc.toolName;
                  return (
                    <div
                      key={j}
                      className="flex items-start gap-2 px-3 py-2 bg-neutral-900/80 border border-neutral-800/80 rounded-xl text-xs"
                    >
                      <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-amber-400/90 font-medium">
                          {label}
                        </span>
                        <pre className="text-neutral-500 mt-1 text-[10px] leading-relaxed whitespace-pre-wrap break-all font-mono">
                          {JSON.stringify(tc.args, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
                {step.toolResults?.map((tr, k) => (
                  <div
                    key={`result-${k}`}
                    className="flex items-start gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-emerald-400/90 font-medium">
                        {TOOL_LABELS[tr.toolName] || tr.toolName} — Result
                      </span>
                      <pre className="text-neutral-500 mt-1 text-[10px] leading-relaxed whitespace-pre-wrap break-all font-mono">
                        {typeof tr.result === "string"
                          ? tr.result
                          : JSON.stringify(tr.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Show standalone tool calls if no steps */}
        {!isUser && toolCalls.length > 0 && steps.length === 0 && (
          <div className="space-y-1.5">
            {toolCalls.map((tc, i) => {
              const Icon = TOOL_ICONS[tc.toolName] || Wrench;
              const label = TOOL_LABELS[tc.toolName] || tc.toolName;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 bg-neutral-900/80 border border-neutral-800/80 rounded-xl text-xs"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-amber-400/90 font-medium">
                      {label}
                    </span>
                    <pre className="text-neutral-500 mt-1 text-[10px] leading-relaxed whitespace-pre-wrap break-all font-mono">
                      {JSON.stringify(tc.args, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main text */}
        {text && (
          <div
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isUser ? "text-neutral-200" : "text-neutral-300"
            }`}
          >
            {text}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Thinking Indicator
// ══════════════════════════════════════════════════════════════════
function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 py-4"
    >
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-violet-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className="text-xs text-neutral-600">Thinking...</span>
      </div>
    </motion.div>
  );
}
