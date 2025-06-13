import React, { useState } from 'react';
import { Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalReportPanelProps {
  content: string;
  wordCount?: number;
  sectionsCompleted?: number;
  totalSourcesUsed?: number;
  qualityScore?: number;
}

export const FinalReportPanel: React.FC<FinalReportPanelProps> = ({
  content,
  wordCount,
  sectionsCompleted,
  totalSourcesUsed,
  qualityScore
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const calculatedWordCount = wordCount || content.split(' ').length;

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2">📄</span>
          Final Report
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isCopied ? (
              <>
                <Check size={12} className="mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} className="mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="default"
            size="sm"
            className="text-xs"
          >
            <Download size={12} className="mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Report Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Words</p>
          <p className="font-semibold text-sm">{calculatedWordCount.toLocaleString()}</p>
        </div>
        {sectionsCompleted !== undefined && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Sections</p>
            <p className="font-semibold text-sm">{sectionsCompleted}</p>
          </div>
        )}
        {totalSourcesUsed !== undefined && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Sources</p>
            <p className="font-semibold text-sm">{totalSourcesUsed}</p>
          </div>
        )}
        {qualityScore !== undefined && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Quality</p>
            <p className={`font-semibold text-sm ${getQualityColor(qualityScore)}`}>
              {Math.round(qualityScore * 100)}%
            </p>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className={`prose prose-sm max-w-none dark:prose-invert ${!isExpanded ? 'max-h-64 overflow-hidden relative' : ''}`}>
        <div
          className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br/>')
              .replace(/^/, '<p>')
              .replace(/$/, '</p>')
          }}
        />

        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          {isExpanded ? (
            <>
              <EyeOff size={12} className="mr-1" />
              Show Less
            </>
          ) : (
            <>
              <Eye size={12} className="mr-1" />
              Read Full Report
            </>
          )}
        </Button>
      </div>

      {/* Export Options */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Export Options:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Plain Text (.txt)
          </Button>
          <Button
            onClick={() => {
              const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Generated Report</title>
                  <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                    h1, h2, h3 { color: #333; }
                    .stats { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <h1>Generated Report</h1>
                  <div class="stats">
                    <strong>Report Statistics:</strong><br>
                    Words: ${calculatedWordCount.toLocaleString()}<br>
                    ${sectionsCompleted ? `Sections: ${sectionsCompleted}<br>` : ''}
                    ${totalSourcesUsed ? `Sources: ${totalSourcesUsed}<br>` : ''}
                    ${qualityScore ? `Quality Score: ${Math.round(qualityScore * 100)}%<br>` : ''}
                    Generated: ${new Date().toLocaleDateString()}
                  </div>
                  <div class="content">
                    ${content.replace(/\n/g, '<br>')}
                  </div>
                </body>
                </html>
              `;
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `report-${new Date().toISOString().split('T')[0]}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            HTML (.html)
          </Button>
        </div>
      </div>
    </div>
  );
};
