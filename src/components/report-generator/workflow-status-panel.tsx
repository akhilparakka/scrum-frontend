import React, { useState } from 'react';
import { WorkflowPhase, PHASE_CONFIG } from '@/types/report-types';

interface WorkflowStatusPanelProps {
  phase: WorkflowPhase;
  progress: number;
  messages: string[];
  isGenerating: boolean;
  onStart: (message: string) => void;
}

export const WorkflowStatusPanel: React.FC<WorkflowStatusPanelProps> = ({
  phase,
  progress,
  messages,
  isGenerating,
  onStart
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const phaseConfig = PHASE_CONFIG[phase];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isGenerating) {
      onStart(inputMessage.trim());
      setInputMessage('');
    }
  };

  const getProgressBarColor = () => {
    switch (phaseConfig.color) {
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      case 'indigo': return 'bg-indigo-500';
      case 'pink': return 'bg-pink-500';
      case 'gray': return 'bg-gray-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🎯</span>
        Report Generation
      </h2>

      {/* Phase Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {phaseConfig.icon} {phaseConfig.label}
          </span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>

        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-1">{phaseConfig.description}</p>
        {phaseConfig.estimated_duration && (
          <p className="text-xs text-muted-foreground">
            Estimated: {phaseConfig.estimated_duration}
          </p>
        )}
      </div>

      {/* Input Form */}
      {!isGenerating && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex flex-col space-y-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe what kind of report you'd like to generate..."
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
              rows={3}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Generate Report
            </button>
          </div>
        </form>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Recent Updates:</h3>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {messages.slice(-3).map((msg, idx) => (
              <div key={idx} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator when generating */}
      {isGenerating && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">
            Generating report...
          </span>
        </div>
      )}
    </div>
  );
};
