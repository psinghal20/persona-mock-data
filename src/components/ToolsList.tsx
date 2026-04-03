"use client";

import { useState } from "react";
import { ToolDefinition } from "@/types";

interface ToolsListProps {
  tools: ToolDefinition[];
  toolNotes?: Record<string, string>;
}

function ToolItem({ tool, note }: { tool: ToolDefinition; note?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(tool, null, 2);
  const toolName = tool.name || "Unknown Tool";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={`tool ${isOpen ? "open" : ""}`}>
      <div className="tool-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="tool-title">
          <span className="chevron">▶</span>
          <h4>{toolName}</h4>
          {note && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/30">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
              </svg>
              {note}
            </span>
          )}
        </div>
        <button
          className={`copy-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy JSON"}
        </button>
      </div>
      <div className="tool-content">
        <pre className="json-display">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}

export default function ToolsList({ tools, toolNotes }: ToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="no-tools">No tools in this server</div>
    );
  }

  return (
    <div className="tools-list">
      {tools.map((tool, index) => (
        <ToolItem key={tool.name || index} tool={tool} note={toolNotes?.[tool.name]} />
      ))}
    </div>
  );
}
