/**
 * TypeScript definitions for Report Generator streaming events
 * These types correspond to the Python streaming events for seamless frontend integration
 */

export type UIComponent =
  | 'workflow_status'
  | 'clarification_dialog'
  | 'plan_display'
  | 'section_progress'
  | 'section_display'
  | 'sources_panel'
  | 'final_report_display'
  | 'interrupt_dialog'
  | 'search_indicator'
  | 'error_display';

export type WorkflowPhase =
  | 'starting'
  | 'clarification'
  | 'planning'
  | 'feedback'
  | 'research_writing'
  | 'compilation'
  | 'final_writing'
  | 'finalization'
  | 'completed'
  | 'error';

export type InterruptType =
  | 'clarification_request'
  | 'plan_feedback_request'
  | 'section_feedback_request'
  | 'user_input_required';

export type SectionStatus = 'planned' | 'in_progress' | 'completed' | 'error';

export interface SourceInfo {
  title: string;
  url: string;
  summary: string;
  source_number: number;
  relevance_score?: number;
  domain?: string;
}

export interface SectionInfo {
  name: string;
  description: string;
  content?: string;
  word_count?: number;
  has_research: boolean;
  status: SectionStatus;
  sources_count?: number;
}

export interface BaseStreamEvent {
  event_type: string;
  thread_id: string;
  timestamp: string;
  ui_component: UIComponent;
}

export interface WorkflowStatusEvent extends BaseStreamEvent {
  event_type: 'workflow_status';
  ui_component: 'workflow_status';
  phase: WorkflowPhase;
  agent?: string;
  message: string;
  progress_percentage?: number;
  estimated_time_remaining?: string;
}

export interface ClarificationRequestEvent extends BaseStreamEvent {
  event_type: 'clarification_request';
  ui_component: 'clarification_dialog';
  question: string;
  context?: string;
  suggestions?: string[];
}

export interface ReportPlanEvent extends BaseStreamEvent {
  event_type: 'report_plan_generated';
  ui_component: 'plan_display';
  sections: SectionInfo[];
  total_sections: number;
  estimated_research_sections: number;
  estimated_word_count?: number;
}

export interface SectionProgressEvent extends BaseStreamEvent {
  event_type: 'section_progress';
  ui_component: 'section_progress';
  section_name: string;
  status: 'started' | 'researching' | 'writing' | 'completed';
  progress_percentage?: number;
  current_step?: string;
}

export interface SectionCompletedEvent extends BaseStreamEvent {
  event_type: 'section_completed';
  ui_component: 'section_display';
  section: SectionInfo;
  research_quality_score?: number;
}

export interface SearchResultsEvent extends BaseStreamEvent {
  event_type: 'search_results';
  ui_component: 'sources_panel';
  section_name: string;
  sources: SourceInfo[];
  search_query?: string;
  total_sources_found: number;
}

export interface FinalReportEvent extends BaseStreamEvent {
  event_type: 'final_report';
  ui_component: 'final_report_display';
  content: string;
  word_count: number;
  sections_completed: number;
  total_sources_used?: number;
  quality_score?: number;
}

export interface InterruptEvent extends BaseStreamEvent {
  event_type: 'interrupt';
  ui_component: 'interrupt_dialog';
  interrupt_type: InterruptType;
  agent: string;
  question: string;
  id: string;
  options?: string[];
  default_response?: string;
}

export interface SearchIndicatorEvent extends BaseStreamEvent {
  event_type: 'search_indicator';
  ui_component: 'search_indicator';
  is_searching: boolean;
  search_query?: string;
  search_engine?: string;
  section_name?: string;
}

export interface ErrorEvent extends BaseStreamEvent {
  event_type: 'error';
  ui_component: 'error_display';
  error_type: string;
  error_message: string;
  is_recoverable: boolean;
  suggested_action?: string;
}

export interface MessageChunkEvent extends BaseStreamEvent {
  event_type: 'message_chunk';
  ui_component: 'workflow_status';
  agent: string;
  phase: WorkflowPhase;
  content: string;
  role: string;
  id: string;
  finish_reason?: string;
}

export interface ToolCallsEvent extends BaseStreamEvent {
  event_type: 'tool_calls';
  agent: string;
  phase: WorkflowPhase;
  tool_calls: any[];
  id: string;
  role: string;
}

export interface ToolCallResultEvent extends BaseStreamEvent {
  event_type: 'tool_call_result';
  agent: string;
  phase: WorkflowPhase;
  tool_call_id: string;
  content: string;
  id: string;
  role: string;
}

export type StreamEvent =
  | WorkflowStatusEvent
  | ClarificationRequestEvent
  | ReportPlanEvent
  | SectionProgressEvent
  | SectionCompletedEvent
  | SearchResultsEvent
  | FinalReportEvent
  | InterruptEvent
  | SearchIndicatorEvent
  | ErrorEvent
  | MessageChunkEvent
  | ToolCallsEvent
  | ToolCallResultEvent;

// Chat API types
export interface ChatRequest {
  message: string;
  thread_id?: string;
  already_clarified_topic?: boolean;
  max_search_iterations?: number;
  auto_accept_plan?: boolean;
  interrupt_feedback?: string;
}

// UI State Management types
export interface ReportGenerationState {
  thread_id: string;
  current_phase: WorkflowPhase;
  progress_percentage: number;
  sections: SectionInfo[];
  completed_sections: SectionInfo[];
  sources_by_section: Record<string, SourceInfo[]>;
  final_report?: string;
  pending_interrupt?: InterruptEvent;
  error?: ErrorEvent;
  is_generating: boolean;
  workflow_messages: string[];
}

// Event handler types for React/Vue components
export type EventHandler<T extends StreamEvent> = (event: T) => void;

export interface EventHandlers {
  onWorkflowStatus?: EventHandler<WorkflowStatusEvent>;
  onClarificationRequest?: EventHandler<ClarificationRequestEvent>;
  onReportPlanGenerated?: EventHandler<ReportPlanEvent>;
  onSectionProgress?: EventHandler<SectionProgressEvent>;
  onSectionCompleted?: EventHandler<SectionCompletedEvent>;
  onSearchResults?: EventHandler<SearchResultsEvent>;
  onFinalReport?: EventHandler<FinalReportEvent>;
  onInterrupt?: EventHandler<InterruptEvent>;
  onSearchIndicator?: EventHandler<SearchIndicatorEvent>;
  onError?: EventHandler<ErrorEvent>;
  onMessageChunk?: EventHandler<MessageChunkEvent>;
  onToolCalls?: EventHandler<ToolCallsEvent>;
  onToolCallResult?: EventHandler<ToolCallResultEvent>;
}

// Utility types for UI components
export interface PhaseConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
  estimated_duration?: string;
}

export const PHASE_CONFIG: Record<WorkflowPhase, PhaseConfig> = {
  starting: {
    label: 'Starting',
    description: 'Initializing report generation',
    icon: '🚀',
    color: 'blue',
    estimated_duration: '5s'
  },
  clarification: {
    label: 'Clarifying',
    description: 'Understanding your requirements',
    icon: '❓',
    color: 'orange',
    estimated_duration: 'User input required'
  },
  planning: {
    label: 'Planning',
    description: 'Creating detailed report structure',
    icon: '📋',
    color: 'purple',
    estimated_duration: '30s'
  },
  feedback: {
    label: 'Feedback',
    description: 'Waiting for your feedback',
    icon: '⏱️',
    color: 'yellow',
    estimated_duration: 'User input required'
  },
  research_writing: {
    label: 'Research & Writing',
    description: 'Researching and writing sections',
    icon: '📚',
    color: 'green',
    estimated_duration: '2-5 minutes'
  },
  compilation: {
    label: 'Compiling',
    description: 'Organizing completed sections',
    icon: '📝',
    color: 'indigo',
    estimated_duration: '10s'
  },
  final_writing: {
    label: 'Final Writing',
    description: 'Writing conclusions and final sections',
    icon: '✍️',
    color: 'pink',
    estimated_duration: '30s'
  },
  finalization: {
    label: 'Finalizing',
    description: 'Compiling your final report',
    icon: '🔧',
    color: 'gray',
    estimated_duration: '15s'
  },
  completed: {
    label: 'Completed',
    description: 'Report generation completed!',
    icon: '✅',
    color: 'green',
    estimated_duration: 'Done'
  },
  error: {
    label: 'Error',
    description: 'An error occurred',
    icon: '❌',
    color: 'red',
    estimated_duration: 'Requires attention'
  }
};

// Event parsing utilities
export function parseStreamEvent(eventString: string): StreamEvent | null {
  try {
    const lines = eventString.trim().split('\n');
    const eventLine = lines.find(line => line.startsWith('event:'));
    const dataLine = lines.find(line => line.startsWith('data:'));

    if (!eventLine || !dataLine) return null;

    const eventType = eventLine.replace('event:', '').trim();
    const eventData = JSON.parse(dataLine.replace('data:', '').trim());

    return { ...eventData, event_type: eventType } as StreamEvent;
  } catch (error) {
    console.error('Failed to parse stream event:', error);
    return null;
  }
}

export function isEventOfType<T extends StreamEvent>(
  event: StreamEvent,
  eventType: T['event_type']
): event is T {
  return event.event_type === eventType;
}

// React hook types (if using React)
export interface UseReportGenerationOptions {
  onEvent?: (event: StreamEvent) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export interface UseReportGenerationResult {
  state: ReportGenerationState;
  sendMessage: (message: string, options?: Partial<ChatRequest>) => void;
  respondToInterrupt: (response: string) => void;
  restart: () => void;
  disconnect: () => void;
  isConnected: boolean;
}
