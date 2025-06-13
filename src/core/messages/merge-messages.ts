import type {
  ChatEvent,
  InterruptEvent,
  MessageChunkEvent,
  SectionCompletedEvent,
  ToolCallChunksEvent,
  ToolCallResultEvent,
  ToolCallsEvent,
} from "../api";
import { deepClone } from "../utils/deep-clone";
import type { Message, Section } from "./types";

export function mergeMessage(message: Message, event: ChatEvent) {
  if (event.type === "message_chunk") {
    mergeTextMessage(message, event);
  } else if (event.type === "tool_calls" || event.type === "tool_call_chunks") {
    mergeToolCallMessage(message, event);
  } else if (event.type === "tool_call_result") {
    mergeToolCallResultMessage(message, event);
  } else if (event.type === "interrupt") {
    mergeInterruptMessage(message, event);
  } else if (event.type === "section_completed") {
    mergeSectionCompletedMessage(message, event);
  }
  if (event.data.finish_reason) {
    message.finishReason = event.data.finish_reason;
    message.isStreaming = false;
    if (message.toolCalls) {
      message.toolCalls.forEach((toolCall) => {
        if (toolCall.argsChunks?.length) {
          toolCall.args = JSON.parse(toolCall.argsChunks.join(""));
          delete toolCall.argsChunks;
        }
      });
    }
  }

  return deepClone(message);
}

function mergeTextMessage(message: Message, event: MessageChunkEvent) {
  if (event.data.content) {
    message.content += event.data.content;
    message.contentChunks.push(event.data.content);
  }

  // Check if this is an implicit interrupt (clarification request)
  if (
    event.data.agent &&
    (event.data.agent.includes("clarify") ||
      event.data.agent === "clarify_with_user") &&
    !event.data.content &&
    !event.data.finish_reason
  ) {
    console.log("🚨 Detected implicit interrupt from agent:", event.data.agent);
    message.finishReason = "interrupt";
    message.isStreaming = false;
  }
}

function mergeToolCallMessage(
  message: Message,
  event: ToolCallsEvent | ToolCallChunksEvent,
) {
  if (event.type === "tool_calls" && event.data.tool_calls[0]?.name) {
    message.toolCalls = event.data.tool_calls.map((raw) => ({
      id: raw.id,
      name: raw.name,
      args: raw.args,
      result: undefined,
    }));
  }

  message.toolCalls ??= [];
  for (const chunk of event.data.tool_call_chunks) {
    if (chunk.id) {
      const toolCall = message.toolCalls.find(
        (toolCall) => toolCall.id === chunk.id,
      );
      if (toolCall) {
        toolCall.argsChunks = [chunk.args];
      }
    } else {
      const streamingToolCall = message.toolCalls.find(
        (toolCall) => toolCall.argsChunks?.length,
      );
      if (streamingToolCall) {
        streamingToolCall.argsChunks!.push(chunk.args);
      }
    }
  }
}

function mergeToolCallResultMessage(
  message: Message,
  event: ToolCallResultEvent,
) {
  const toolCall = message.toolCalls?.find(
    (toolCall) => toolCall.id === event.data.tool_call_id,
  );
  if (toolCall) {
    toolCall.result = event.data.content;
  }
}

function mergeInterruptMessage(message: Message, event: InterruptEvent) {
  console.log("🚨 Processing interrupt event:", {
    messageId: message.id,
    eventData: event.data,
    hasOptions: !!(event.data.options && event.data.options.length > 0),
  });

  message.isStreaming = false;
  message.options = event.data.options;

  console.log("🚨 Message after interrupt merge:", {
    messageId: message.id,
    isStreaming: message.isStreaming,
    optionsCount: message.options?.length || 0,
    finishReason: message.finishReason,
  });
}

function mergeSectionCompletedMessage(
  message: Message,
  event: SectionCompletedEvent,
) {
  // Initialize sections array if it doesn't exist
  if (!message.sections) {
    message.sections = [];
  }

  // Add the completed section to the sections array
  const section: Section = {
    name: event.data.section_name,
    content: event.data.section_content,
    source_str: event.data.source_str,
  };
  message.sections.push(section);

  // Add section completion information to the message content
  const sectionInfo = `\n\n**Section Completed: ${event.data.section_name}**\n${event.data.section_content}`;
  message.content += sectionInfo;
  message.contentChunks.push(sectionInfo);
}
