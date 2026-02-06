"use client";

import { useState, useMemo } from "react";

interface CsvFile {
  name: string;
  headers: string[];
  rows: string[][];
}

interface ServerDataBrowserProps {
  csvFiles: CsvFile[];
}

export default function ServerDataBrowser({ csvFiles }: ServerDataBrowserProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  const currentFile = csvFiles[activeTab];

  const filteredRows = useMemo(() => {
    if (!search.trim()) return currentFile.rows;
    const q = search.toLowerCase();
    return currentFile.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q))
    );
  }, [currentFile, search]);

  const totalRows = currentFile.rows.length;
  const shownRows = filteredRows.length;

  return (
    <div className="data-section">
      {csvFiles.length > 1 && (
        <div className="sheet-tabs">
          {csvFiles.map((file, i) => (
            <button
              key={file.name}
              className={`sheet-tab ${i === activeTab ? "active" : ""}`}
              onClick={() => { setActiveTab(i); setSearch(""); }}
            >
              {file.name.replace(".csv", "")}
            </button>
          ))}
        </div>
      )}

      <div className="data-toolbar">
        <input
          type="text"
          className="filter-input"
          placeholder={`Search ${currentFile.name.replace(".csv", "")}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="data-row-count">
          {search.trim()
            ? `${shownRows} of ${totalRows} rows`
            : `${totalRows} rows`}
        </span>
      </div>

      <div className="sheet-content">
        {filteredRows.length === 0 ? (
          <div className="no-tools">No matching rows</div>
        ) : (
          <table>
            <thead>
              <tr>
                {currentFile.headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
