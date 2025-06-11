import { useState, useCallback, useRef } from "react";
import { ChatService, type ChatServiceCallbacks } from "./chat-service";
import type { Message } from "../messages/types";

export interface UseChatOptions {
  baseUrl?: string;
  threadId?: string;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const chatServiceRef = useRef(
    new ChatService(options.baseUrl || process.env.NEXT_PUBLIC_API_URL),
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);

      // Create user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        threadId: options.threadId || "__default",
        role: "user",
        content: content.trim(),
        contentChunks: [content.trim()],
        isStreaming: false,
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);

      // Prepare conversation history for future use if needed
      const conversationMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const callbacks: ChatServiceCallbacks = {
        onMessageStart: (message: Message) => {
          setMessages((prev) => [...prev, message]);
        },
        onMessageUpdate: (message: Message) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === message.id ? { ...message } : msg)),
          );
        },
        onMessageComplete: (message: Message) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === message.id ? { ...message } : msg)),
          );
          setIsLoading(false);
        },
        onError: (err: Error) => {
          setError(err);
          setIsLoading(false);
          options.onError?.(err);
        },
      };

      try {
        // Get the latest user message content
        const latestUserMessage = content.trim();

        // Set up parameters for the stream
        const params = {
          thread_id: options.threadId || "__default",
          auto_accepted_plan: true,
          max_plan_iterations: 3,
          max_step_num: 10,
          enable_background_investigation: false,
          mcp_settings: {},
        };

        // Track current assistant message being built
        let currentMessage: Message | null = null;

        // Stream the response
        for await (const event of chatServiceRef.current.streamChat(
          latestUserMessage,
          params,
          { abortSignal: abortControllerRef.current.signal },
        )) {
          switch (event.type) {
            case "message_chunk":
              if (!currentMessage) {
                // Start new assistant message
                currentMessage = {
                  id: event.data.id,
                  threadId: event.data.thread_id,
                  agent: event.data.agent,
                  role: "assistant",
                  content: event.data.content || "",
                  contentChunks: [event.data.content || ""],
                  isStreaming: true,
                };
                callbacks.onMessageStart?.(currentMessage);
              } else {
                // Update existing message - create new object to ensure React detects change
                currentMessage = {
                  ...currentMessage,
                  content: currentMessage.content + (event.data.content || ""),
                  contentChunks: [...currentMessage.contentChunks, event.data.content || ""],
                };
                callbacks.onMessageUpdate?.(currentMessage);
              }
              break;

            case "tool_calls":
              if (currentMessage) {
                currentMessage = {
                  ...currentMessage,
                  toolCalls: event.data.tool_calls.map((tc) => ({
                    id: tc.id,
                    name: tc.name,
                    args: tc.args,
                  })),
                };
                callbacks.onMessageUpdate?.(currentMessage);
              }
              break;

            case "tool_call_result":
              if (currentMessage && currentMessage.toolCalls) {
                const updatedToolCalls = currentMessage.toolCalls.map((tc) =>
                  tc.id === event.data.tool_call_id
                    ? { ...tc, result: event.data.content }
                    : tc
                );
                currentMessage = {
                  ...currentMessage,
                  toolCalls: updatedToolCalls,
                };
                callbacks.onMessageUpdate?.(currentMessage);
              }
              break;

            case "interrupt":
              if (currentMessage) {
                currentMessage = {
                  ...currentMessage,
                  options: event.data.options,
                  finishReason: "interrupt",
                };
                callbacks.onMessageUpdate?.(currentMessage);
              }
              break;
          }

          if (currentMessage && event.data.finish_reason) {
            currentMessage = {
              ...currentMessage,
              isStreaming: false,
              finishReason: event.data.finish_reason,
            };
            callbacks.onMessageComplete?.(currentMessage);
            currentMessage = null;
          }
        }

        if (currentMessage) {
          currentMessage = {
            ...currentMessage,
            isStreaming: false,
            finishReason: "stop",
          };
          callbacks.onMessageComplete?.(currentMessage);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
        options.onError?.(error);
      }
    },
    [isLoading, messages, options],
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  };
}
