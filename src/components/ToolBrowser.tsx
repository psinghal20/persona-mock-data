"use client";

import { useState } from "react";
import { ToolServerData, ToolDefinition } from "@/types";
import * as XLSX from "xlsx";

// Get basePath from environment (set during build)
const basePath = process.env.NODE_ENV === "production" ? "/persona-mock-data" : "";

interface ToolBrowserProps {
  category: string;
  servers: ToolServerData[];
}

interface ServerComponentProps {
  server: ToolServerData;
  category: string;
}

interface ToolComponentProps {
  tool: ToolDefinition;
}

interface DataModalProps {
  filename: string;
  workbook: XLSX.WorkBook;
  onClose: () => void;
}

function DataModal({ filename, workbook, onClose }: DataModalProps) {
  const [activeSheet, setActiveSheet] = useState(0);
  const sheetNames = workbook.SheetNames;

  const getSheetHtml = (sheetIndex: number) => {
    const sheet = workbook.Sheets[sheetNames[sheetIndex]];
    return XLSX.utils.sheet_to_html(sheet, { editable: false });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{filename}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        {sheetNames.length > 1 && (
          <div className="sheet-tabs">
            {sheetNames.map((name, i) => (
              <button
                key={name}
                className={`sheet-tab ${i === activeSheet ? "active" : ""}`}
                onClick={() => setActiveSheet(i)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <div className="modal-body">
          <div
            className="sheet-content active"
            dangerouslySetInnerHTML={{ __html: getSheetHtml(activeSheet) }}
          />
        </div>
      </div>
    </div>
  );
}

function ToolComponent({ tool }: ToolComponentProps) {
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

function ServerComponent({ server, category }: ServerComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataModal, setDataModal] = useState<{
    filename: string;
    workbook: XLSX.WorkBook;
  } | null>(null);

  const handleViewData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!server.dataFile) return;

    setIsLoadingData(true);
    try {
      const response = await fetch(
        `${basePath}/tools/${category}/data/${encodeURIComponent(server.dataFile)}`
      );
      if (!response.ok) throw new Error("Failed to load data file");

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      setDataModal({ filename: server.dataFile, workbook });
    } catch (err) {
      console.error("Failed to load data:", err);
      alert("Failed to load data file");
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <>
      <div className={`server ${isOpen ? "open" : ""}`}>
        <div className="server-header" onClick={() => setIsOpen(!isOpen)}>
          <div className="server-title">
            <span className="chevron">▶</span>
            <h3>{server.name}</h3>
            <span className="tool-count">
              {server.tools.length} tool{server.tools.length !== 1 ? "s" : ""}
            </span>
          </div>
          {server.dataFile && (
            <button
              className="mock-data-btn"
              onClick={handleViewData}
              disabled={isLoadingData}
            >
              {isLoadingData ? "Loading..." : "View Mock Data"}
            </button>
          )}
        </div>
        <div className="server-content">
          <div className="tools-list">
            {server.tools.length === 0 ? (
              <div className="no-tools">No tools in this server</div>
            ) : (
              server.tools.map((tool, index) => (
                <ToolComponent key={tool.name || index} tool={tool} />
              ))
            )}
          </div>
        </div>
      </div>

      {dataModal && (
        <DataModal
          filename={dataModal.filename}
          workbook={dataModal.workbook}
          onClose={() => setDataModal(null)}
        />
      )}
    </>
  );
}

export default function ToolBrowser({ category, servers }: ToolBrowserProps) {
  if (servers.length === 0) {
    return (
      <div className="card-static p-8 text-center">
        <p className="text-[var(--muted)]">No servers in this category yet.</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          Add *_tools.json files to the tools folder to populate this section.
        </p>
      </div>
    );
  }

  return (
    <div className="tools-container">
      {servers.map((server) => (
        <ServerComponent
          key={server.filename}
          server={server}
          category={category}
        />
      ))}
    </div>
  );
}
