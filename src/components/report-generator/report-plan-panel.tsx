import React from 'react';
import { SectionInfo } from '@/types/report-types';

interface ReportPlanPanelProps {
  sections: SectionInfo[];
}

export const ReportPlanPanel: React.FC<ReportPlanPanelProps> = ({ sections }) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">📋</span>
        Report Plan
      </h2>

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border-l-4 ${
              section.status === 'completed'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : section.status === 'in_progress'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                : 'border-border bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm">{section.name}</h3>
              <div className="flex items-center space-x-2">
                {section.has_research && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    Research
                  </span>
                )}
                <StatusBadge status={section.status} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{section.description}</p>
            {section.word_count && (
              <p className="text-xs text-muted-foreground mt-1">
                {section.word_count} words
              </p>
            )}
            {section.sources_count && section.sources_count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {section.sources_count} sources
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility Components
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = {
    planned: { color: 'bg-secondary text-secondary-foreground', text: 'Planned' },
    in_progress: { color: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200', text: 'In Progress' },
    completed: { color: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200', text: 'Completed' },
    error: { color: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200', text: 'Error' }
  };

  const statusConfig = config[status as keyof typeof config] || config.planned;

  return (
    <span className={`text-xs px-2 py-1 rounded ${statusConfig.color}`}>
      {statusConfig.text}
    </span>
  );
};
