import { fetchStream } from "../sse/fetch-stream";
import { mergeMessage } from "../messages/merge-messages";
import type { Message } from "../messages/types";
import type { ChatEvent } from "../api";

export interface ChatRequest {
  message: string;
  thread_id?: string;
  already_clarified_topic?: boolean;
  max_search_iterations?: number;
  auto_accept_plan?: boolean;
  interrupt_feedback?: string;
}

export interface ChatServiceCallbacks {
  onMessageStart?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onMessageComplete?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export class ChatService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  async *streamChat(
    userMessage: string,
    params: {
      thread_id: string;
      already_clarified_topic?: boolean;
      max_search_iterations?: number;
      auto_accept_plan?: boolean;
      interrupt_feedback?: string;
    },
    options: { abortSignal?: AbortSignal } = {},
  ) {
    const url = `${this.baseUrl}/api/chat/stream`;

    const stream = fetchStream(url, {
      body: JSON.stringify({
        message: userMessage || "",
        ...params,
      }),
      signal: options.abortSignal,
    });
    for await (const event of stream) {
      yield {
        type: event.event,
        data: JSON.parse(event.data),
      } as ChatEvent;
    }
  }

  async sendMessage(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    callbacks?: ChatServiceCallbacks,
  ): Promise<Message[]> {
    const results: Message[] = [];

    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

    const params = {
      thread_id: "__default",
      already_clarified_topic: false,
      max_search_iterations: 3,
      auto_accept_plan: true,
      interrupt_feedback: "",
    };

    let currentMessage: Message | null = null;

    for await (const event of this.streamChat(
      lastUserMessage.content,
      params,
    )) {
      console.log(event, "YAAAAAAAAYYYYYYYY");
      switch (event.type) {
        case "message_chunk":
          if (!currentMessage) {
            currentMessage = {
              id: event.data.id,
              threadId: event.data.thread_id,
              agent: event.data.agent,
              role: "assistant",
              content: event.data.content || "",
              contentChunks: [event.data.content || ""],
              isStreaming: true,
            };
            callbacks?.onMessageStart?.(currentMessage);
          } else {
            currentMessage.content += event.data.content || "";
            currentMessage.contentChunks.push(event.data.content || "");
            callbacks?.onMessageUpdate?.(currentMessage);
          }
          break;

        case "tool_calls":
          if (currentMessage) {
            currentMessage.toolCalls = event.data.tool_calls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
            }));
            callbacks?.onMessageUpdate?.(currentMessage);
          }
          break;

        case "section_completed":
          if (currentMessage) {
            // Initialize sections array if it doesn't exist
            if (!currentMessage.sections) {
              currentMessage.sections = [];
            }

            // Add the completed section to the sections array
            currentMessage.sections.push({
              name: event.data.section_name,
              content: event.data.section_content,
              source_str: event.data.source_str,
            });

            const sectionInfo = `\n\n**Section Completed: ${event.data.section_name}**\n${event.data.section_content}`;
            currentMessage.content += sectionInfo;
            currentMessage.contentChunks.push(sectionInfo);
            callbacks?.onMessageUpdate?.(currentMessage);
          }
          break;
      }

      // Check if message is complete
      if (currentMessage && event.data.finish_reason) {
        currentMessage.isStreaming = false;
        currentMessage.finishReason = event.data.finish_reason;
        callbacks?.onMessageComplete?.(currentMessage);
        results.push(currentMessage);
        currentMessage = null;
      }
    }

    if (currentMessage) {
      currentMessage.isStreaming = false;
      currentMessage.finishReason = "stop";
      callbacks?.onMessageComplete?.(currentMessage);
      results.push(currentMessage);
    }

    return results;
  }
}
