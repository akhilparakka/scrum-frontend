import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  agent: string;
}

interface MessagesBlockProps {
  className?: string;
  messages: Message[];
  onSendMessage: (
    message: Message,
    researchContent: string,
    agent: string
  ) => void;
}

export function MessagesBlock({
  className,
  messages,
  onSendMessage,
}: MessagesBlockProps) {
  const [input, setInput] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [currentAgent, setCurrentAgent] = useState("coordinator");
  const eventSourceRef = useRef<EventSource | null>(null);
  const accumulatedContentRef = useRef<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create a new message for the user input
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      agent: "user",
    };
    onSendMessage(userMessage, researchContent, "user");

    // Initialize accumulated content for this message
    const messageId = (Date.now() + 1).toString();
    accumulatedContentRef.current[messageId] = "";

    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: input }],
          thread_id: "__default",
          max_plan_iterations: 1,
          max_step_num: 3,
          auto_accepted_plan: false,
          interrupt_feedback: null,
          mcp_settings: {},
          enable_background_investigation: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Process all complete lines (leave incomplete line in buffer)
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith("event:")) {
            const eventType = line.replace("event:", "").trim();
            const nextLine = lines[++i];
            if (nextLine && nextLine.startsWith("data:")) {
              try {
                const data = JSON.parse(nextLine.replace("data:", "").trim());
                const {
                  agent,
                  content,
                  id = messageId,
                  role = "assistant",
                } = data;

                if (typeof content === "string") {
                  accumulatedContentRef.current[id] =
                    (accumulatedContentRef.current[id] || "") + content;

                  const accumulatedContent = accumulatedContentRef.current[id];
                  setCurrentAgent(agent);

                  const newMessage = {
                    id,
                    role,
                    content: accumulatedContent,
                    agent,
                  };

                  // Always send the message to main.tsx
                  onSendMessage(
                    newMessage,
                    // For non-coordinator agents, send content to research
                    agent !== "coordinator"
                      ? accumulatedContent
                      : researchContent,
                    agent
                  );
                }
              } catch (error) {
                console.error("Error parsing SSE data:", error);
              }
            }
          }
        }

        // Keep the last (possibly incomplete) line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setInput("");
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center">No messages yet.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "mb-4 p-3 rounded-lg",
                msg.role === "user"
                  ? "bg-blue-100 ml-auto max-w-[80%] text-gray-800"
                  : "bg-gray-800 mr-auto max-w-[80%] text-white"
              )}
            >
              <div
                className={cn(
                  "text-xs mb-1",
                  msg.role === "user" ? "text-blue-600" : "text-gray-300"
                )}
              >
                {msg.agent === "planner"
                  ? "Planner"
                  : msg.role === "user"
                  ? "You"
                  : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          placeholder="Type your message..."
        />
      </form>
    </div>
  );
}
