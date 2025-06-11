"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { createOpenAI } from "@ai-sdk/openai";
import { BlockNoteEditor, filterSuggestionItems } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { en } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  FormattingToolbar,
  FormattingToolbarController,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  AIMenuController,
  AIToolbarButton,
  createAIExtension,
  createBlockNoteAIClient,
  getAISlashMenuItems,
} from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";

// AI Client Setup - only create if in browser environment
const createAIClient = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const client = createBlockNoteAIClient({
      apiKey: "dummy-key",
      baseURL: "http://localhost:3000/api/ai",
    });

    const model = createOpenAI({
      ...client.getProviderSettings("openai"),
    })("gpt-3.5-turbo");

    return { client, model };
  } catch (error) {
    console.warn("AI client initialization failed:", error);
    return null;
  }
};

// Custom Formatting toolbar with Tailwind styling
function CustomFormattingToolbar() {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          <FormattingToolbar>
            {getFormattingToolbarItems()}
            <AIToolbarButton />
          </FormattingToolbar>
        </div>
      )}
    />
  );
}

// Slash menu with AI commands
function SuggestionMenuWithAI({ editor }: { editor: BlockNoteEditor }) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) =>
        filterSuggestionItems(
          [
            ...getDefaultReactSlashMenuItems(editor),
            ...getAISlashMenuItems(editor),
          ],
          query,
        )
      }
    />
  );
}

function SimpleEditorCore() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Early return if not in browser environment
  if (typeof window === "undefined") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-300">Loading editor...</p>
      </div>
    );
  }

  // Create a new BlockNote editor instance
  const aiConfig = createAIClient();

  const editor = useCreateBlockNote({
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: aiConfig
      ? [
          createAIExtension({
            model: aiConfig.model,
          }),
        ]
      : [],
    initialContent: [
      {
        type: "heading",
        props: {
          level: 1,
        },
        content: "Getting started",
      },
      {
        type: "paragraph",
        content: [
          "Welcome to the ",
          {
            type: "text",
            text: "Simple Editor",
            styles: {
              backgroundColor: "yellow",
            },
          },
          " template! This template integrates open source UI components and Tiptap extensions licensed under MIT.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "Integrate it by following the ",
          {
            type: "link",
            href: "#",
            content: "Tiptap UI Components docs",
          },
          " or using our CLI tool.",
        ],
      },
      {
        type: "codeBlock",
        props: {
          language: "bash",
        },
        content: "npx @tiptap/cli init",
      },
      {
        type: "heading",
        props: {
          level: 2,
        },
        content: "Features",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "A fully responsive rich text editor with built-in support for common formatting and layout tools. Type markdown ",
            styles: {
              italic: true,
            },
          },
          {
            type: "text",
            text: "**",
            styles: {
              code: true,
            },
          },
          {
            type: "text",
            text: " or use keyboard shortcuts ",
            styles: {
              italic: true,
            },
          },
          {
            type: "text",
            text: "⌘+B",
            styles: {
              code: true,
            },
          },
          {
            type: "text",
            text: " for ",
            styles: {
              italic: true,
            },
          },
          {
            type: "text",
            text: "most",
            styles: {
              bold: true,
            },
          },
          {
            type: "text",
            text: " all common markdown marks. ✨",
            styles: {
              italic: true,
            },
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          "Add images, customize alignment, and apply ",
          {
            type: "text",
            text: "advanced formatting",
            styles: {
              backgroundColor: "blue",
              textColor: "white",
            },
          },
          " to make your writing more engaging and professional.",
        ],
      },
      {
        type: "heading",
        props: {
          level: 3,
        },
        content: "Placeholder Image",
      },
      {
        type: "paragraph",
        content:
          "Uploading your own images is disabled in this demo to protect against copyright infringement.",
      },
    ],
  });

  if (!isMounted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-300">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="flex-1 p-8 overflow-y-auto">
        <BlockNoteView
          editor={editor}
          formattingToolbar={false}
          slashMenu={false}
          className="tiptap-editor-theme"
        >
          <AIMenuController />
          <CustomFormattingToolbar />
          <SuggestionMenuWithAI editor={editor} />
        </BlockNoteView>
      </div>

      <style jsx global>{`
        /* Core Editor Styling */
        .tiptap-editor-theme {
          background: #000000 !important;
          color: #ffffff !important;
          border: none !important;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            "Roboto",
            sans-serif;
        }

        .tiptap-editor-theme .bn-editor {
          background: #000000 !important;
          color: #ffffff !important;
        }

        .tiptap-editor-theme .ProseMirror {
          background: #000000 !important;
          color: #ffffff !important;
          padding: 1rem !important;
          line-height: 1.6 !important;
          font-size: 16px !important;
          outline: none !important;
        }

        /* Heading Styles */
        .tiptap-editor-theme h1 {
          color: #ffffff !important;
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          margin: 2rem 0 1rem 0 !important;
          line-height: 1.2 !important;
        }

        .tiptap-editor-theme h2 {
          color: #ffffff !important;
          font-size: 2rem !important;
          font-weight: 600 !important;
          margin: 1.5rem 0 1rem 0 !important;
          line-height: 1.3 !important;
        }

        .tiptap-editor-theme h3 {
          color: #ffffff !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin: 1.25rem 0 0.75rem 0 !important;
          line-height: 1.4 !important;
        }

        /* Paragraph Styles */
        .tiptap-editor-theme p {
          color: #e0e0e0 !important;
          margin: 0.75rem 0 !important;
          line-height: 1.6 !important;
        }

        /* Code Block Styles */
        .tiptap-editor-theme .bn-code-block {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          border-radius: 8px !important;
          margin: 1rem 0 !important;
          padding: 1rem !important;
        }

        .tiptap-editor-theme .bn-code-block code {
          color: #00ff87 !important;
          font-family: "Fira Code", "Monaco", "Menlo", monospace !important;
          font-size: 14px !important;
          background: transparent !important;
        }

        /* Inline Code Styles */
        .tiptap-editor-theme code {
          background: #1a1a1a !important;
          color: #00ff87 !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 4px !important;
          font-family: "Fira Code", "Monaco", "Menlo", monospace !important;
          font-size: 0.9em !important;
        }

        /* Link Styles */
        .tiptap-editor-theme a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          transition: color 0.2s ease !important;
        }

        .tiptap-editor-theme a:hover {
          color: #60a5fa !important;
        }

        /* Bold Text */
        .tiptap-editor-theme strong {
          color: #ffffff !important;
          font-weight: 700 !important;
        }

        /* Italic Text */
        .tiptap-editor-theme em {
          color: #e0e0e0 !important;
          font-style: italic !important;
        }

        /* Highlighted Text */
        .tiptap-editor-theme [data-background-color="yellow"] {
          background-color: #fbbf24 !important;
          color: #000000 !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 3px !important;
        }

        .tiptap-editor-theme [data-background-color="blue"] {
          background-color: #3b82f6 !important;
          color: #ffffff !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 3px !important;
        }

        /* Formatting Toolbar Styles */
        .tiptap-editor-theme .bn-toolbar {
          background: #1f2937 !important;
          border: none !important;
          padding: 0.5rem !important;
        }

        .tiptap-editor-theme .bn-toolbar button {
          background: transparent !important;
          border: 1px solid transparent !important;
          color: #e5e7eb !important;
          border-radius: 6px !important;
          padding: 0.5rem !important;
          margin: 0 0.1rem !important;
          transition: all 0.2s ease !important;
        }

        .tiptap-editor-theme .bn-toolbar button:hover {
          background: #374151 !important;
          border-color: #4b5563 !important;
          color: #ffffff !important;
        }

        .tiptap-editor-theme .bn-toolbar button[data-active="true"] {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
          color: #ffffff !important;
        }

        /* Selection Styles */
        .tiptap-editor-theme .ProseMirror-selectednode {
          outline: 2px solid #3b82f6 !important;
          border-radius: 4px !important;
        }

        /* Suggestion Menu Styles */
        .tiptap-editor-theme .bn-suggestion-menu {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        }

        .tiptap-editor-theme .bn-suggestion-menu-item {
          color: #e5e7eb !important;
          padding: 0.75rem 1rem !important;
          transition: background-color 0.2s ease !important;
        }

        .tiptap-editor-theme .bn-suggestion-menu-item:hover,
        .tiptap-editor-theme .bn-suggestion-menu-item[data-selected="true"] {
          background: #374151 !important;
          color: #ffffff !important;
        }

        /* AI Menu Styles */
        .tiptap-editor-theme .bn-ai-menu {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        }

        .tiptap-editor-theme .bn-ai-menu button {
          color: #e5e7eb !important;
          background: transparent !important;
          border: none !important;
          padding: 0.75rem 1rem !important;
          transition: background-color 0.2s ease !important;
        }

        .tiptap-editor-theme .bn-ai-menu button:hover {
          background: #374151 !important;
          color: #ffffff !important;
        }

        /* Placeholder Text */
        .tiptap-editor-theme
          .ProseMirror
          p.is-editor-empty:first-child::before {
          color: #6b7280 !important;
          content: attr(data-placeholder) !important;
          float: left !important;
          height: 0 !important;
          pointer-events: none !important;
        }

        /* Focus Styles */
        .tiptap-editor-theme .ProseMirror:focus {
          outline: none !important;
        }

        /* Scrollbar Styling */
        .tiptap-editor-theme .ProseMirror::-webkit-scrollbar {
          width: 8px;
        }

        .tiptap-editor-theme .ProseMirror::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        .tiptap-editor-theme .ProseMirror::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .tiptap-editor-theme .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Export as default for dynamic import
const SimpleEditorWrapper = SimpleEditorCore;

export const SimpleEditor = dynamic(
  () => Promise.resolve({ default: SimpleEditorWrapper }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-300">Loading editor...</p>
      </div>
    ),
  },
);
