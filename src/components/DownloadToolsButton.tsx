"use client";

function getBasePath() {
  const path = window.location.pathname;
  const match = path.match(/^(\/persona-mock-data)/);
  return match ? match[1] : "";
}

export default function DownloadToolsButton({ fileName, label }: { fileName: string; label: string }) {
  async function handleDownload() {
    const basePath = getBasePath();
    try {
      const res = await fetch(`${basePath}/data/${fileName}`);
      if (!res.ok) return;
      const tools = await res.json();
      const blob = new Blob([JSON.stringify(tools, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }

  return (
    <button onClick={handleDownload} className="download-tools-btn">
      {label}
    </button>
  );
}
