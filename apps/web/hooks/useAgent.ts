"use client";
import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../lib/api";

// ── Types ──────────────────────────────────────────────────────────
export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolName: string;
  result: unknown;
}

export interface AgentStep {
  text: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string | AssistantContent;
  createdAt: string;
}

export interface AssistantContent {
  text: string;
  toolCalls: ToolCall[];
  steps: AgentStep[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

// ── Hook ───────────────────────────────────────────────────────────
export function useAgent() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch conversation list ──
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/agent/conversations`, {
        withCredentials: true,
      });
      setConversations(res.data.conversations || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load a conversation ──
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setActiveConversationId(conversationId);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/v1/agent/conversations/${conversationId}`,
        { withCredentials: true }
      );
      setMessages(res.data.conversation.messages || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Start a new conversation ──
  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // ── Send a message ──
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsSending(true);
      setError(null);

      // Optimistically add the user message
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/agent/chat`,
          {
            message,
            conversationId: activeConversationId || undefined,
          },
          { withCredentials: true }
        );

        const data = res.data;

        // Update the active conversation ID (important for new conversations)
        if (data.conversationId) {
          setActiveConversationId(data.conversationId);
        }

        // Add the assistant message
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: {
            text: data.response,
            toolCalls: data.toolCalls || [],
            steps: data.steps || [],
          },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Refresh the conversations list to show the new/updated conversation
        fetchConversations();
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.response?.data?.details || "Failed to send message");
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, fetchConversations]
  );

  // ── Delete a conversation ──
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/v1/agent/conversations/${conversationId}`,
          { withCredentials: true }
        );
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          startNewConversation();
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to delete conversation");
      }
    },
    [activeConversationId, startNewConversation]
  );

  return {
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
  };
}
