"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessagesBlock } from "./components/messages-block";
import { ResearchBlock } from "./components/research-block";

interface Message {
  id: string;
  role: string;
  content: string;
  agent: string;
  isStreaming?: boolean;
  tool_calls?: any[];
  finish_reason?: string;
  tool_call_id?: string;
}

export default function Main() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [researchContent, setResearchContent] = useState<string>("");
  const [agent, setAgent] = useState<string>("coordinator");
  const doubleColumnMode = agent === "planner";

  const handleNewMessage = (
    newMessage: Message,
    newResearchContent: string,
    newAgent: string
  ) => {
    setAgent(newAgent);

    // Handle research content for non-coordinator agents
    if (
      newAgent !== "coordinator" &&
      newAgent !== "user" &&
      newAgent !== "error"
    ) {
      setResearchContent((prev) => {
        // Avoid duplicate content by checking if this content is already included
        if (prev.includes(newMessage.content)) {
          return prev;
        }
        return prev + newMessage.content;
      });
    }

    // Handle messages for coordinator, user, and error agents
    if (
      newAgent === "coordinator" ||
      newMessage.role === "user" ||
      newAgent === "error" ||
      newMessage.role === "tool"
    ) {
      setMessages((prev) => {
        const existingIndex = prev.findIndex((msg) => msg.id === newMessage.id);

        if (existingIndex >= 0) {
          // Update existing message
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...newMessage };
          return updated;
        } else {
          // Add new message
          return [...prev, newMessage];
        }
      });
    }
  };

  const clearResearch = () => {
    setResearchContent("");
  };

  const clearMessages = () => {
    setMessages([]);
    setResearchContent("");
    setAgent("coordinator");
  };

  return (
    <div
      className={cn(
        "flex h-full w-full justify-center-safe px-4 pt-12 pb-4",
        doubleColumnMode && "gap-8"
      )}
    >
      {/* Header with controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {researchContent && (
          <button
            onClick={clearResearch}
            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear Research
          </button>
        )}
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      <MessagesBlock
        className={cn(
          "shrink-0 transition-all duration-300 ease-out",
          !doubleColumnMode &&
            `w-[768px] translate-x-[min(max(calc((100vw-538px)*0.75),575px)/2,960px/2)]`,
          doubleColumnMode && `w-[538px]`
        )}
        messages={messages.filter(
          (msg) =>
            msg.agent === "coordinator" ||
            msg.role === "user" ||
            msg.agent === "error" ||
            msg.role === "tool"
        )}
        onSendMessage={handleNewMessage}
      />

      <ResearchBlock
        className={cn(
          "w-[min(max(calc((100vw-538px)*0.75),575px),960px)] pb-4 transition-all duration-300 ease-out",
          researchContent === "" && "scale-0 opacity-0",
          researchContent !== "" && "scale-100 opacity-100"
        )}
        content={researchContent}
      />
    </div>
  );
}
