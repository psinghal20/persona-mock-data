"use client";

import { useState } from "react";
import { ToolDefinition } from "@/types";

interface ToolsListProps {
  tools: ToolDefinition[];
}

function ToolItem({ tool }: { tool: ToolDefinition }) {
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

export default function ToolsList({ tools }: ToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="no-tools">No tools in this server</div>
    );
  }

  return (
    <div className="tools-list">
      {tools.map((tool, index) => (
        <ToolItem key={tool.name || index} tool={tool} />
      ))}
    </div>
  );
}
