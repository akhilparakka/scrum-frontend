import React, { useState } from 'react';
import { SectionInfo } from '@/types/report-types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionsPanelProps {
  sections: SectionInfo[];
}

export const SectionsPanel: React.FC<SectionsPanelProps> = ({ sections }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">📝</span>
        Completed Sections
      </h2>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="border border-border rounded-lg">
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 flex items-center justify-between"
              onClick={() => setExpandedSection(
                expandedSection === section.name ? null : section.name
              )}
            >
              <div>
                <h3 className="font-medium">{section.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {section.word_count} words
                </p>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                {expandedSection === section.name ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>

            {expandedSection === section.name && section.content && (
              <div className="px-4 pb-4 border-t border-border">
                <div className="prose prose-sm max-w-none mt-3 dark:prose-invert">
                  <div
                    className="text-sm text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: section.content.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
