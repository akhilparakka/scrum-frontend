import React, { useState, useCallback } from "react";
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
import { WorkflowStatusPanel } from "./workflow-status-panel";
import { ReportPlanPanel } from "./report-plan-panel";
import { SectionsPanel } from "./sections-panel";
import { SourcesPanel } from "./sources-panel";
import { InterruptPanel } from "./interrupt-panel";
import { FinalReportPanel } from "./final-report-panel";

export const ReportGenerator: React.FC = () => {
  const [state, setState] = useState<ReportGenerationState>({
    thread_id: "",
    current_phase: "starting",
    progress_percentage: 0,
    sections: [],
    completed_sections: [],
    sources_by_section: {},
    is_generating: false,
    workflow_messages: [],
  });

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    setState((prevState) => {
      const newState = { ...prevState };

      switch (event.event_type) {
        case "workflow_status":
          if (isEventOfType<WorkflowStatusEvent>(event, "workflow_status")) {
            newState.current_phase = event.phase;
            newState.progress_percentage = event.progress_percentage || 0;
            newState.workflow_messages = [
              ...prevState.workflow_messages.slice(-4), // Keep last 5 messages
              event.message,
            ];
          }
          break;

        case "report_plan_generated":
          if (isEventOfType<ReportPlanEvent>(event, "report_plan_generated")) {
            newState.sections = event.sections;
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
            // Update section status in the main sections array
            newState.sections = prevState.sections.map((s) =>
              s.name === event.section.name
                ? { ...s, status: "completed", content: event.section.content }
                : s,
            );
          }
          break;

        case "search_results":
          if (isEventOfType<SearchResultsEvent>(event, "search_results")) {
            newState.sources_by_section = {
              ...prevState.sources_by_section,
              [event.section_name]: event.sources,
            };
          }
          break;

        case "final_report":
          if (isEventOfType<FinalReportEvent>(event, "final_report")) {
            newState.final_report = event.content;
            newState.is_generating = false;
          }
          break;

        case "interrupt":
          if (isEventOfType<InterruptEvent>(event, "interrupt")) {
            newState.pending_interrupt = event;
          }
          break;
      }

      return newState;
    });
  }, []);

  const startReportGeneration = useCallback(
    async (message: string) => {
      setState((prev) => ({
        ...prev,
        is_generating: true,
        thread_id: `thread-${Date.now()}`,
        current_phase: "starting",
        progress_percentage: 0,
        sections: [],
        completed_sections: [],
        sources_by_section: {},
        final_report: undefined,
        pending_interrupt: undefined,
        workflow_messages: [],
      }));

      try {
        const response = await fetch("http://localhost:8000/api/chat/stream", {
          method: "POST",
          headers: {
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            thread_id: state.thread_id || `thread-${Date.now()}`,
            max_search_iterations: 3,
            interrupt_feedback: "",
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const events = chunk.split("\n\n").filter(Boolean);

          for (const eventString of events) {
            const event = parseStreamEvent(eventString);
            if (event) {
              handleStreamEvent(event);
            }
          }
        }
      } catch (error) {
        console.error("Streaming error:", error);
        setState((prev) => ({
          ...prev,
          is_generating: false,
          current_phase: "error",
        }));
      }
    },
    [state.thread_id, handleStreamEvent],
  );

  const respondToInterrupt = useCallback(
    async (response: string) => {
      if (!state.pending_interrupt) return;

      setState((prev) => ({ ...prev, pending_interrupt: undefined }));

      // Continue with the interrupt response
      await startReportGeneration(response);
    },
    [state.pending_interrupt, startReportGeneration],
  );

  return (
    <div className="w-full h-full bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Workflow Status & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <WorkflowStatusPanel
              phase={state.current_phase}
              progress={state.progress_percentage}
              messages={state.workflow_messages}
              isGenerating={state.is_generating}
              onStart={startReportGeneration}
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

            {state.final_report && (
              <FinalReportPanel
                content={state.final_report}
                sectionsCompleted={state.completed_sections.length}
                totalSourcesUsed={
                  Object.values(state.sources_by_section).flat().length
                }
              />
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
                onRespond={respondToInterrupt}
              />
            )}

            {/* Empty state when no content */}
            {!state.is_generating &&
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
                      Start by describing the report you'd like to generate in
                      the panel on the left.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Progress indicator at the bottom when generating */}
        {state.is_generating && (
          <div className="fixed bottom-4 right-4 bg-card border shadow-lg rounded-lg p-4 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <div>
                <p className="text-sm font-medium">Generating Report</p>
                <p className="text-xs text-muted-foreground">
                  {state.current_phase} - {state.progress_percentage}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
