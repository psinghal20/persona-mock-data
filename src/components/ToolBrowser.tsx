"use client";

import { useState } from "react";
import { ToolServerData, ToolDefinition } from "@/types";

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

interface CsvData {
  headers: string[];
  rows: string[][];
}

interface CsvModalProps {
  serverName: string;
  files: { name: string; data: CsvData }[];
  onClose: () => void;
}

function parseCSV(text: string): CsvData {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  // Simple CSV parsing (handles basic cases)
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => parseLine(line));

  return { headers, rows };
}

function CsvModal({ serverName, files, onClose }: CsvModalProps) {
  const [activeFile, setActiveFile] = useState(0);

  const currentFile = files[activeFile];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{serverName} - Mock Data</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        {files.length > 1 && (
          <div className="sheet-tabs">
            {files.map((file, i) => (
              <button
                key={file.name}
                className={`sheet-tab ${i === activeFile ? "active" : ""}`}
                onClick={() => setActiveFile(i)}
              >
                {file.name.replace('.csv', '')}
              </button>
            ))}
          </div>
        )}
        <div className="modal-body">
          <div className="sheet-content active">
            <table>
              <thead>
                <tr>
                  {currentFile.data.headers.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentFile.data.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const [csvModal, setCsvModal] = useState<{
    serverName: string;
    files: { name: string; data: CsvData }[];
  } | null>(null);

  const handleViewData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!server.dataFiles || !server.dataDir) return;

    setIsLoadingData(true);
    try {
      // Load all CSV files for this server
      const filePromises = server.dataFiles.map(async (filename) => {
        const response = await fetch(
          `${basePath}/data/mock-data/${server.dataDir}/${encodeURIComponent(filename)}`
        );
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        const text = await response.text();
        return { name: filename, data: parseCSV(text) };
      });

      const files = await Promise.all(filePromises);
      setCsvModal({ serverName: server.name, files });
    } catch (err) {
      console.error("Failed to load data:", err);
      alert("Failed to load data files");
    } finally {
      setIsLoadingData(false);
    }
  };

  const hasData = server.dataFiles && server.dataFiles.length > 0;

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
          {hasData && (
            <button
              className="mock-data-btn"
              onClick={handleViewData}
              disabled={isLoadingData}
            >
              {isLoadingData ? "Loading..." : `View Mock Data (${server.dataFiles!.length} files)`}
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

      {csvModal && (
        <CsvModal
          serverName={csvModal.serverName}
          files={csvModal.files}
          onClose={() => setCsvModal(null)}
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
