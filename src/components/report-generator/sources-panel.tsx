import React, { useState } from 'react';
import { SourceInfo } from '@/types/report-types';
import { ExternalLink } from 'lucide-react';

interface SourcesPanelProps {
  sourcesBySection: Record<string, SourceInfo[]>;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ sourcesBySection }) => {
  const [activeSection, setActiveSection] = useState<string>(
    Object.keys(sourcesBySection)[0] || ''
  );

  const sections = Object.keys(sourcesBySection);
  const currentSources = sourcesBySection[activeSection] || [];

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🔍</span>
        Research Sources
      </h2>

      {sections.length > 1 && (
        <div className="mb-4">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className="w-full p-2 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background"
          >
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {currentSources.map((source, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-sm line-clamp-2 flex-1">
                {source.title}
              </h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded ml-2 flex-shrink-0">
                #{source.source_number}
              </span>
            </div>

            {source.domain && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">{source.domain}</p>
            )}

            <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
              {source.summary}
            </p>

            {source.relevance_score && (
              <div className="flex items-center mb-2">
                <span className="text-xs text-muted-foreground mr-2">Relevance:</span>
                <div className="flex-1 bg-muted rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full"
                    style={{ width: `${source.relevance_score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {Math.round(source.relevance_score * 100)}%
                </span>
              </div>
            )}

            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              View Source <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        ))}

        {currentSources.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No sources available for this section yet.</p>
          </div>
        )}
      </div>

      {sections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total sections: {sections.length}</span>
            <span>Current sources: {currentSources.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
