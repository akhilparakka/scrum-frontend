"use client";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useChat } from "@/core/chat";
import type { Message } from "@/core/messages/types";
import { MessageComponent } from "@/components/chat/message";

export default function Main() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, clearError } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleEditor = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || inputValue.length > 2000) return;

    const messageToSend = inputValue.trim();
    setInputValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 2000) {
      setInputValue(value);
    }
    const target = e.target;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 200) + "px";
  };

  const renderMessage = (message: Message) => (
    <MessageComponent key={message.id} message={message} />
  );

  const mainContentVariants = {
    full: {
      width: "100%",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
    half: {
      width: "50%",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
  };

  const panelVariants = {
    hidden: {
      x: "100%",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
    visible: {
      x: "0%",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
  };

  const buttonVariants = {
    closed: {
      x: "-1rem",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
    open: {
      x: "-50vw",
      transition: {
        type: "tween",
        ease: "easeInOut",
        duration: 0.4,
      },
    },
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="h-full bg-background flex flex-col"
        variants={mainContentVariants}
        animate={isEditorOpen ? "half" : "full"}
        initial="full"
      >
        <div className="flex-1 overflow-y-auto pt-20 pb-4">
          <div className="max-w-3xl mx-auto px-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-4">Welcome to Chat</h1>
                <p className="text-muted-foreground">
                  Start a conversation or click the arrow to open the editor
                  panel.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map(renderMessage)}
                {isLoading && messages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="max-w-[80%] bg-card text-card-foreground border rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <motion.div
                            className="w-2 h-2 bg-current rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-current rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.5,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-current rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 1,
                            }}
                          />
                        </div>
                        <span className="text-sm opacity-70">
                          Claude is thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-destructive">
                        <strong>Error:</strong> {error.message}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="text-destructive hover:text-destructive/80"
                      >
                        ✕
                      </Button>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-background">
          <div className="max-w-3xl mx-auto p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder={
                  isLoading ? "Claude is thinking..." : "Message Claude..."
                }
                className="w-full min-h-[60px] max-h-[200px] p-4 pr-12 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-60"
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                style={{
                  scrollbarWidth: "thin",
                }}
              />
              <button
                className="absolute right-3 bottom-3 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={
                  !inputValue.trim() || isLoading || inputValue.length > 2000
                }
                onClick={handleSendMessage}
                title={
                  inputValue.length > 2000 ? "Message too long" : "Send message"
                }
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {isLoading
                  ? "Claude is responding..."
                  : "Press Enter to send, Shift+Enter for new line"}
              </span>
              <span
                className={inputValue.length > 1800 ? "text-destructive" : ""}
              >
                {inputValue.length} / 2000
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="fixed top-1/2 -translate-y-1/2 right-0 z-40"
        variants={buttonVariants}
        animate={isEditorOpen ? "open" : "closed"}
        initial="closed"
      >
        <Button
          onClick={toggleEditor}
          variant="outline"
          size="icon"
          className="shadow-lg hover:shadow-xl transition-shadow duration-200"
        >
          {isEditorOpen ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </motion.div>

      {/* Sliding editor panel */}
      <motion.div
        className="fixed top-0 right-0 h-full w-1/2 bg-background border-l shadow-2xl z-30"
        variants={panelVariants}
        animate={isEditorOpen ? "visible" : "hidden"}
        initial="hidden"
      >
        <div className="pt-12 h-full overflow-hidden">
          {" "}
          <SimpleEditor />
        </div>
      </motion.div>
    </div>
  );
}
