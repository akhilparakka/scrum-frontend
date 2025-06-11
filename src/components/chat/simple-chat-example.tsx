"use client";
import { useState } from "react";
import { useChat } from "@/core/chat";
import { Button } from "@/components/ui/button";
import { MessageComponent } from "./message";

/**
 * Simple chat example showing minimal integration
 * Perfect for getting started or as a reference implementation
 */
export function SimpleChatExample() {
  const [input, setInput] = useState("");
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages, 
    clearError 
  } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const messageToSend = input.trim();
    setInput("");
    await sendMessage(messageToSend);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Simple Chat</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearMessages}
          disabled={messages.length === 0}
        >
          Clear Chat
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 bg-card">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageComponent key={message.id} message={message} />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-destructive text-sm">
                Error: {error.message}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-destructive hover:text-destructive/80 h-auto p-1"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            "Send"
          )}
        </Button>
      </form>

      {/* Simple stats */}
      <div className="text-xs text-muted-foreground mt-2 text-center">
        {messages.length} messages • {input.length}/2000 characters
      </div>
    </div>
  );
}