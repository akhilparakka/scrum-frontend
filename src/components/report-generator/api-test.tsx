import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const ApiTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('Generate a report on AI trends');
  const [threadId, setThreadId] = useState('test-thread-123');

  const addMessage = useCallback((message: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const testStreamingAPI = useCallback(async () => {
    setIsConnected(true);
    setMessages([]);
    addMessage('Starting connection...');

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          thread_id: threadId,
          max_search_iterations: 3,
          interrupt_feedback: ""
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      addMessage('Connected! Listening for events...');

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            addMessage('Stream ended');
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              if (line.startsWith('event:')) {
                addMessage(`Event: ${line.replace('event:', '').trim()}`);
              } else if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.replace('data:', '').trim());
                  addMessage(`Data: ${JSON.stringify(data, null, 2)}`);
                } catch (e) {
                  addMessage(`Raw data: ${line}`);
                }
              } else {
                addMessage(`Raw line: ${line}`);
              }
            }
          }
        }
      } catch (error) {
        addMessage(`Stream reading error: ${error}`);
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      addMessage(`Connection error: ${error}`);
    } finally {
      setIsConnected(false);
    }
  }, [inputMessage, threadId, addMessage]);

  const testWithCurl = useCallback(() => {
    const curlCommand = `curl --request POST \\
  --url http://localhost:8000/api/chat/stream \\
  --header 'Accept: text/event-stream' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "message": "${inputMessage}",
    "thread_id": "${threadId}",
    "max_search_iterations": 3,
    "interrupt_feedback": ""
  }'`;

    navigator.clipboard.writeText(curlCommand).then(() => {
      addMessage('Curl command copied to clipboard!');
    }).catch(() => {
      addMessage('Failed to copy curl command');
    });

    addMessage('Curl command:');
    addMessage(curlCommand);
  }, [inputMessage, threadId, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4">🧪 API Test Console</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full p-3 border rounded-lg bg-background"
              rows={2}
              placeholder="Enter your message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Thread ID</label>
            <input
              type="text"
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
              className="w-full p-3 border rounded-lg bg-background"
              placeholder="thread-123"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={testStreamingAPI}
            disabled={isConnected}
            className="flex-1"
          >
            {isConnected ? 'Connecting...' : 'Test Streaming API'}
          </Button>

          <Button
            onClick={testWithCurl}
            variant="outline"
            className="flex-1"
          >
            Generate Curl Command
          </Button>

          <Button
            onClick={clearMessages}
            variant="outline"
          >
            Clear
          </Button>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">API Response Log</h3>
            <span className="text-xs text-muted-foreground">
              {messages.length} messages
            </span>
          </div>

          <div className="bg-background rounded border max-h-96 overflow-y-auto p-3 font-mono text-xs">
            {messages.length === 0 ? (
              <div className="text-muted-foreground italic">
                No messages yet. Click "Test Streaming API" to start.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-1 break-all">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-3">📋 Expected API Response Format</h3>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Server-Sent Events Format:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`event: workflow_status
data: {"event_type": "workflow_status", "phase": "starting", "message": "Initializing..."}

event: report_plan_generated
data: {"event_type": "report_plan_generated", "sections": [...]}

event: section_completed
data: {"event_type": "section_completed", "section": {...}}

event: final_report
data: {"event_type": "final_report", "content": "..."}
`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Key Event Types:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><code>workflow_status</code> - Progress updates</li>
              <li><code>report_plan_generated</code> - Report structure</li>
              <li><code>section_completed</code> - Individual sections</li>
              <li><code>search_results</code> - Research sources</li>
              <li><code>final_report</code> - Complete report</li>
              <li><code>interrupt</code> - User input required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
