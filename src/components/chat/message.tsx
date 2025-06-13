import { memo } from "react";
import { motion } from "framer-motion";
import type { Message } from "@/core/messages/types";

interface MessageProps {
  message: Message;
  onOptionSelect?: (option: { text: string; value: string }) => void;
}

export const MessageComponent = memo(
  ({ message, onOptionSelect }: MessageProps) => {
    const isUser = message.role === "user";
    const isStreaming = message.isStreaming;

    const messageVariants = {
      hidden: { opacity: 0, y: 20, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      },
    };

    return (
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border"
          }`}
        >
          {/* Agent indicator */}
          {message.agent && !isUser && (
            <div className="text-xs opacity-70 mb-2 capitalize font-medium">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                {message.agent}
              </span>
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isStreaming && (
              <motion.span
                className="inline-block w-2 h-4 bg-current ml-1"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>

          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <div className="text-xs font-medium opacity-70 mb-2">
                Tool Calls:
              </div>
              <div className="space-y-2">
                {message.toolCalls.map((toolCall) => (
                  <div key={toolCall.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-current/10 px-2 py-1 rounded">
                        {toolCall.name}
                      </span>
                      {toolCall.argsChunks && (
                        <span className="opacity-60">streaming...</span>
                      )}
                    </div>

                    {/* Tool arguments */}
                    {toolCall.args && (
                      <details className="mt-1">
                        <summary className="cursor-pointer opacity-70 hover:opacity-100">
                          Arguments
                        </summary>
                        <pre className="mt-1 text-xs bg-current/5 p-2 rounded overflow-x-auto">
                          {JSON.stringify(toolCall.args, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Tool result */}
                    {toolCall.result && (
                      <div className="mt-2">
                        <div className="opacity-70 mb-1">Result:</div>
                        <div className="bg-current/5 rounded p-2 text-xs">
                          <pre className="whitespace-pre-wrap">
                            {toolCall.result}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options for interrupt messages */}
          {message.options && message.options.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <div className="text-xs font-medium opacity-70 mb-2">
                Choose an option:
              </div>
              <div className="space-y-1">
                {message.options.map((option) => (
                  <button
                    key={option.value}
                    className="block w-full text-left text-xs bg-current/10 hover:bg-current/20 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      onOptionSelect?.(option);
                    }}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message metadata */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-50">
            <span>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {message.finishReason && (
              <span className="capitalize">{message.finishReason}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);

MessageComponent.displayName = "MessageComponent";
