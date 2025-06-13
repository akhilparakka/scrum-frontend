import React, { useState } from 'react';
import { InterruptEvent } from '@/types/report-types';
import { Button } from '@/components/ui/button';

interface InterruptPanelProps {
  interrupt: InterruptEvent;
  onRespond: (response: string) => void;
}

export const InterruptPanel: React.FC<InterruptPanelProps> = ({ interrupt, onRespond }) => {
  const [response, setResponse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (response.trim()) {
      onRespond(response.trim());
      setResponse('');
    }
  };

  const getInterruptTitle = () => {
    switch (interrupt.interrupt_type) {
      case 'clarification_request':
        return '❓ Clarification Needed';
      case 'plan_feedback_request':
        return '📋 Plan Feedback';
      case 'section_feedback_request':
        return '📝 Section Feedback';
      default:
        return '💬 Input Required';
    }
  };

  const getInterruptDescription = () => {
    switch (interrupt.interrupt_type) {
      case 'clarification_request':
        return 'The system needs more information to proceed with your report.';
      case 'plan_feedback_request':
        return 'Please review the proposed report structure and provide feedback.';
      case 'section_feedback_request':
        return 'Review the completed section and let us know if any changes are needed.';
      default:
        return 'Your input is required to continue the report generation process.';
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-2 text-yellow-800 dark:text-yellow-200">
        {getInterruptTitle()}
      </h2>

      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        {getInterruptDescription()}
      </p>

      <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded border border-yellow-200 dark:border-yellow-700">
        <p className="text-sm text-foreground">{interrupt.question}</p>
        {interrupt.agent && (
          <p className="text-xs text-muted-foreground mt-1">
            Asked by: {interrupt.agent}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your response here..."
          className="w-full p-3 border border-yellow-300 dark:border-yellow-700 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-3 bg-background"
          rows={3}
        />

        <div className="flex space-x-2">
          <Button
            type="submit"
            disabled={!response.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-muted disabled:text-muted-foreground text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1"
          >
            Send Response
          </Button>
        </div>
      </form>

      {interrupt.options && interrupt.options.length > 0 && (
        <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-700">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Quick options:
          </p>
          <div className="flex flex-wrap gap-2">
            {interrupt.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setResponse(option)}
                className="text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-yellow-300 dark:border-yellow-700 px-3 py-1 rounded transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {interrupt.default_response && (
        <div className="mt-3">
          <button
            onClick={() => setResponse(interrupt.default_response!)}
            className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
          >
            Use default response: "{interrupt.default_response}"
          </button>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-400">
          <span>Interrupt ID: {interrupt.id}</span>
          <span>Agent: {interrupt.agent}</span>
        </div>
      </div>
    </div>
  );
};
