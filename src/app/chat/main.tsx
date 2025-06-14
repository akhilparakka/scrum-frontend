"use client";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useState, useRef, KeyboardEvent, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  StreamEvent,
  ReportGenerationState,
  WorkflowStatusEvent,
  SectionCompletedEvent,
  SearchResultsEvent,
  FinalReportEvent,
  InterruptEvent,
  ReportPlanEvent,
  parseStreamEvent,
  isEventOfType,
} from "@/types/report-types";
import { WorkflowStatusPanel } from "@/components/report-generator/workflow-status-panel";
import { ReportPlanPanel } from "@/components/report-generator/report-plan-panel";
import { SectionsPanel } from "@/components/report-generator/sections-panel";
import { SourcesPanel } from "@/components/report-generator/sources-panel";
import { InterruptPanel } from "@/components/report-generator/interrupt-panel";
import { FinalReportPanel } from "@/components/report-generator/final-report-panel";

export default function Main() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, setState] = useState<ReportGenerationState>({
    thread_id: `thread-${Date.now()}`,
    current_phase: "starting",
    progress_percentage: 0,
    sections: [],
    completed_sections: [],
    sources_by_section: {},
    is_generating: false,
    workflow_messages: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEditor = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  const handleStreamEvent = (event: StreamEvent) => {
    console.log("Received event:", event);

    setState((prevState) => {
      const newState = { ...prevState };

      switch (event.event_type) {
        case "workflow_status":
          if (isEventOfType<WorkflowStatusEvent>(event, "workflow_status")) {
            newState.current_phase = event.phase;
            newState.progress_percentage = event.progress_percentage || 0;
            newState.workflow_messages = [
              ...prevState.workflow_messages.slice(-4),
              event.message,
            ];
            console.log(
              `Phase: ${event.phase}, Progress: ${event.progress_percentage}%`,
            );
          }
          break;

        case "report_plan_generated":
          if (isEventOfType<ReportPlanEvent>(event, "report_plan_generated")) {
            newState.sections = event.sections;
            console.log(
              "Report plan generated with",
              event.sections.length,
              "sections",
            );
          }
          break;

        case "section_completed":
          if (
            isEventOfType<SectionCompletedEvent>(event, "section_completed")
          ) {
            newState.completed_sections = [
              ...prevState.completed_sections,
              event.section,
            ];
            newState.sections = prevState.sections.map((s) =>
              s.name === event.section.name
                ? { ...s, status: "completed", content: event.section.content }
                : s,
            );
            console.log("Section completed:", event.section.name);
          }
          break;

        case "search_results":
          if (isEventOfType<SearchResultsEvent>(event, "search_results")) {
            newState.sources_by_section = {
              ...prevState.sources_by_section,
              [event.section_name]: event.sources,
            };
            console.log(
              "Search results for",
              event.section_name,
              ":",
              event.sources.length,
              "sources",
            );
          }
          break;

        case "final_report":
        case "report_completed":
        case "report_final":
          console.log("Final report event received!", event);
          if (
            isEventOfType<FinalReportEvent>(event, "final_report") ||
            event.event_type === "report_completed" ||
            event.event_type === "report_final"
          ) {
            // Handle different possible content field names
            const content =
              event.content ||
              event.report_content ||
              event.final_content ||
              event.text;
            if (content) {
              newState.final_report = content;
              newState.is_generating = false;
              newState.current_phase = "completed";
              newState.progress_percentage = 100;
              console.log(
                "Final report set with content length:",
                content?.length,
              );
            } else {
              console.warn(
                "Final report event received but no content found:",
                event,
              );
            }
          }
          break;

        case "message_chunk":
          // Handle final report content from message_chunk events
          if (
            event.agent === "compile_final_report" &&
            event.phase === "finalization"
          ) {
            console.log(
              "Final report content received via message_chunk:",
              event,
            );
            if (event.content) {
              newState.final_report = event.content;
              newState.is_generating = false;
              newState.current_phase = "completed";
              newState.progress_percentage = 100;
              console.log(
                "Final report set from message_chunk with content length:",
                event.content.length,
              );
            }
          }
          break;

        case "interrupt":
          if (isEventOfType<InterruptEvent>(event, "interrupt")) {
            newState.pending_interrupt = event;
            console.log("Interrupt received:", event.question);
          }
          break;

        default:
          console.log("Unhandled event type:", event.event_type);
      }

      return newState;
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || inputValue.length > 2000) return;

    const messageToSend = inputValue.trim();
    const isInterruptResponse = !!state.pending_interrupt;

    setInputValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);
    setError(null);

    // Only reset state for new generation, not for interrupt responses
    if (!isInterruptResponse) {
      setState((prev) => ({
        ...prev,
        is_generating: true,
        current_phase: "starting",
        progress_percentage: 0,
        sections: [],
        completed_sections: [],
        sources_by_section: {},
        final_report: undefined,
        pending_interrupt: undefined,
        workflow_messages: [],
      }));
    } else {
      // For interrupt responses, just clear the interrupt and mark as generating
      setState((prev) => ({
        ...prev,
        pending_interrupt: undefined,
        is_generating: true,
      }));
    }

    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: isInterruptResponse ? "" : messageToSend,
          thread_id: state.thread_id,
          max_search_iterations: 3,
          interrupt_feedback: isInterruptResponse ? messageToSend : "",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("Stream completed");
            break;
          }

          const chunk = decoder.decode(value);
          const events = chunk.split("\n\n").filter(Boolean);

          for (const eventString of events) {
            console.log("Raw event string:", eventString);
            const event = parseStreamEvent(eventString);
            if (event) {
              handleStreamEvent(event);
            } else {
              console.log("Failed to parse event:", eventString);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setState((prev) => ({
        ...prev,
        is_generating: false,
        current_phase: "error",
      }));
    } finally {
      setIsLoading(false);
      setState((prev) => ({
        ...prev,
        is_generating: false,
      }));
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

  const clearError = () => {
    setError(null);
  };

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
        <div className="flex-1 overflow-y-auto pt-4 pb-4">
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Workflow Status & Controls */}
              <div className="lg:col-span-1 space-y-6">
                <WorkflowStatusPanel
                  phase={state.current_phase}
                  progress={state.progress_percentage}
                  messages={state.workflow_messages}
                  isGenerating={state.is_generating || isLoading}
                  onStart={async (message) => {
                    setInputValue(message);
                    // Trigger send after setting the value
                    setTimeout(() => {
                      handleSendMessage();
                    }, 100);
                  }}
                />

                {state.sections.length > 0 && (
                  <ReportPlanPanel sections={state.sections} />
                )}
              </div>

              {/* Middle Column - Sections & Content */}
              <div className="lg:col-span-1 space-y-6">
                {state.completed_sections.length > 0 && (
                  <SectionsPanel sections={state.completed_sections} />
                )}

                {state.final_report ? (
                  <FinalReportPanel
                    content={state.final_report}
                    sectionsCompleted={state.completed_sections.length}
                    totalSourcesUsed={
                      Object.values(state.sources_by_section).flat().length
                    }
                  />
                ) : state.current_phase === "completed" &&
                  state.progress_percentage === 100 ? (
                  <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">⚠️</div>
                      <h3 className="text-lg font-semibold mb-2">
                        Report Completed
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The report generation is complete but the final report
                        content was not received.
                      </p>
                      <pre className="text-xs mt-4 p-2 bg-muted rounded">
                        Phase: {state.current_phase}, Progress:{" "}
                        {state.progress_percentage}%
                      </pre>
                    </div>
                  </div>
                ) : null}

                {/* Debug Information Panel */}
                {(state.is_generating || isLoading) && (
                  <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-4">
                    <h4 className="font-medium mb-2">Debug Information</h4>
                    <div className="text-xs space-y-1">
                      <div>Phase: {state.current_phase}</div>
                      <div>Progress: {state.progress_percentage}%</div>
                      <div>Is Loading: {isLoading ? "Yes" : "No"}</div>
                      <div>
                        Is Generating: {state.is_generating ? "Yes" : "No"}
                      </div>
                      <div>Thread ID: {state.thread_id}</div>
                      <div>Sections: {state.sections.length}</div>
                      <div>
                        Completed Sections: {state.completed_sections.length}
                      </div>
                      <div>
                        Has Final Report: {state.final_report ? "Yes" : "No"}
                      </div>
                      <div>
                        Final Report Length: {state.final_report?.length || 0}
                      </div>
                      <div>
                        Has Interrupt: {state.pending_interrupt ? "Yes" : "No"}
                      </div>
                      <div>
                        Last Messages:{" "}
                        {state.workflow_messages.slice(-2).join(", ")}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-destructive">
                        <strong>Error:</strong> {error}
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
              </div>

              {/* Right Column - Sources & Interrupts */}
              <div className="lg:col-span-1 space-y-6">
                {Object.keys(state.sources_by_section).length > 0 && (
                  <SourcesPanel sourcesBySection={state.sources_by_section} />
                )}

                {state.pending_interrupt && (
                  <InterruptPanel
                    interrupt={state.pending_interrupt}
                    onRespond={(response) => {
                      setInputValue(response);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                  />
                )}

                {/* Empty state when no content */}
                {!state.is_generating &&
                  !isLoading &&
                  state.sections.length === 0 &&
                  Object.keys(state.sources_by_section).length === 0 &&
                  !state.pending_interrupt && (
                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold mb-2">
                          Ready to Generate
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Start by describing the report you'd like to generate
                          using the input below.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-background">
          <div className="max-w-7xl mx-auto p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder={
                  isLoading
                    ? "Generating report..."
                    : state.pending_interrupt
                      ? "Respond to the interrupt..."
                      : "Describe the report you'd like to generate..."
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
                  inputValue.length > 2000
                    ? "Message too long"
                    : state.pending_interrupt
                      ? "Send interrupt response"
                      : "Generate report"
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
                  ? "Generating report..."
                  : state.pending_interrupt
                    ? "Responding to interrupt - Press Enter to send"
                    : "Press Enter to generate, Shift+Enter for new line"}
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
