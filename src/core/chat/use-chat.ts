import { useState, useCallback, useRef } from "react";
import { ChatService, type ChatServiceCallbacks } from "./chat-service";
import type { Message } from "../messages/types";
import { mergeMessage } from "../messages/merge-messages";

export interface UseChatOptions {
  baseUrl?: string;
  threadId?: string;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  isInterruptPending: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendInterruptResponse: (response: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInterruptPending, setIsInterruptPending] = useState(false);

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
    setIsInterruptPending(false);
  }, []);

  const sendMessageInternal = useCallback(
    async (content: string, isInterruptResponse: boolean = false) => {
      if (isLoading || !content.trim()) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);

      // If this is an interrupt response, clear the interrupt state
      if (isInterruptResponse) {
        setIsInterruptPending(false);
      }

      // Create user message only if it's not an interrupt response
      if (!isInterruptResponse) {
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
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const callbacks: ChatServiceCallbacks = {
        onMessageStart: (message: Message) => {
          setMessages((prev) => {
            // Check if message already exists
            const existingMessage = prev.find((msg) => msg.id === message.id);
            if (existingMessage) {
              console.log("⚠️ Message already exists, skipping onMessageStart");
              return prev;
            }
            return [...prev, message];
          });
        },
        onMessageUpdate: (message: Message) => {
          setMessages((prev) => {
            const newMessages = prev.map((msg) =>
              msg.id === message.id ? { ...message } : msg,
            );
            const updatedMessage = newMessages.find((m) => m.id === message.id);
            if (!updatedMessage) {
              console.log("⚠️ Message not found for update, adding it");
              return [...prev, message];
            }
            return newMessages;
          });
        },
        onMessageComplete: (message: Message) => {
          console.log("🔔 Message completed:", {
            id: message.id,
            agent: message.agent,
            finishReason: message.finishReason,
            hasOptions: !!(message.options && message.options.length > 0),
            content: message.content.substring(0, 100) + "...",
          });

          setMessages((prev) =>
            prev.map((msg) => (msg.id === message.id ? { ...message } : msg)),
          );
          setIsLoading(false);

          // Improved interrupt detection
          const isInterrupt =
            message.finishReason === "interrupt" ||
            (message.options && message.options.length > 0) ||
            (message.agent &&
              (message.agent.includes("clarify") ||
                message.agent === "clarify_with_user"));

          console.log("🔔 Interrupt detection:", {
            isInterrupt,
            reason: message.finishReason,
            agent: message.agent,
          });

          if (isInterrupt) {
            console.log("🚨 Setting interrupt pending to true");
            setIsInterruptPending(true);
          }
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
          already_clarified_topic: false,
          max_search_iterations: 3,
          auto_accept_plan: true,
          interrupt_feedback: isInterruptResponse ? content.trim() : "",
        };

        // Track current assistant message being built
        let currentMessage: Message | null = null;

        // Stream the response
        for await (const event of chatServiceRef.current.streamChat(
          isInterruptResponse ? "" : latestUserMessage,
          params,
          { abortSignal: abortControllerRef.current.signal },
        )) {
          console.log("📥 Received event:", {
            type: event.type,
            id: event.data.id,
            agent: event.data.agent,
            finishReason: event.data.finish_reason,
            hasContent: !!event.data.content,
          });

          // Check if we need to start a new message or if this is a new message ID
          if (!currentMessage || currentMessage.id !== event.data.id) {
            // If we had a previous message that wasn't completed, complete it
            if (currentMessage) {
              currentMessage.isStreaming = false;
              currentMessage.finishReason = "stop";
              callbacks.onMessageComplete?.(currentMessage);
            }

            // Start new assistant message
            currentMessage = {
              id: event.data.id,
              threadId: event.data.thread_id,
              agent: event.data.agent,
              role: "assistant",
              content: "",
              contentChunks: [],
              isStreaming: true,
            };
            callbacks.onMessageStart?.(currentMessage);
          }

          // Use mergeMessage to handle the event
          currentMessage = mergeMessage(currentMessage, event);
          callbacks.onMessageUpdate?.(currentMessage);

          // Check if message is complete
          if (!currentMessage.isStreaming) {
            callbacks.onMessageComplete?.(currentMessage);
            // Don't set currentMessage to null immediately - let it be handled by the next iteration or completion
          }
        }

        // Final cleanup - ensure any remaining message is completed
        if (currentMessage) {
          currentMessage.isStreaming = false;
          currentMessage.finishReason = "stop";
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

  const sendMessage = useCallback(
    async (content: string) => {
      await sendMessageInternal(content, false);
    },
    [sendMessageInternal],
  );

  const sendInterruptResponse = useCallback(
    async (response: string) => {
      await sendMessageInternal(response, true);
    },
    [sendMessageInternal],
  );

  return {
    messages,
    isLoading,
    error,
    isInterruptPending,
    sendMessage,
    sendInterruptResponse,
    clearMessages,
    clearError,
  };
}
