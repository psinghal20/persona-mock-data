import Link from "next/link";
import { ToolDefinition } from "@/types";
import { parseCSV } from "@/lib/csv";
import ServerDataBrowser from "@/components/ServerDataBrowser";
import ToolsList from "@/components/ToolsList";

interface PageProps {
  params: Promise<{ category: string; serverId: string }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  shopping: "Shopping",
  medical: "Medical",
  professional: "Professional Work",
};

const CATEGORY_TOOLS_FILES: Record<string, string> = {
  shopping: "shopping-tools.json",
  medical: "healthcare-tools.json",
};

function formatServerName(serverId: string): string {
  return serverId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractServerName(toolName: string): string {
  const underscoreIndex = toolName.indexOf("_");
  if (underscoreIndex === -1) return toolName;
  return toolName.substring(0, underscoreIndex);
}

async function getServerData(category: string, serverId: string) {
  const fs = await import("fs/promises");
  const path = await import("path");

  // Load tools for this server
  const toolsFileName = CATEGORY_TOOLS_FILES[category];
  let tools: ToolDefinition[] = [];

  if (toolsFileName) {
    try {
      const toolsFile = path.join(process.cwd(), "public", "data", toolsFileName);
      const fileData = await fs.readFile(toolsFile, "utf-8");
      const allTools: ToolDefinition[] = JSON.parse(fileData);
      tools = allTools.filter((t) => extractServerName(t.name) === serverId);
    } catch {
      // No tools file
    }
  }

  // Load CSV data files
  const csvFiles: { name: string; headers: string[]; rows: string[][] }[] = [];
  const mockDataDir = path.join(process.cwd(), "public", "data", "mock-data", serverId);

  try {
    const files = await fs.readdir(mockDataDir);
    const csvFileNames = files.filter((f) => f.endsWith(".csv")).sort();

    for (const fileName of csvFileNames) {
      try {
        const filePath = path.join(mockDataDir, fileName);
        const text = await fs.readFile(filePath, "utf-8");
        const parsed = parseCSV(text);
        csvFiles.push({
          name: fileName,
          headers: parsed.headers,
          rows: parsed.rows,
        });
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // No mock data directory for this server
  }

  const totalRecords = csvFiles.reduce((sum, f) => sum + f.rows.length, 0);

  // Load server metadata
  let summary: string | undefined;
  try {
    const metaFile = path.join(process.cwd(), "public", "data", "server-metadata.json");
    const metaData = await fs.readFile(metaFile, "utf-8");
    const allMeta = JSON.parse(metaData);
    summary = allMeta[category]?.[serverId]?.summary;
  } catch {
    // No metadata file
  }

  return { tools, csvFiles, totalRecords, summary };
}

export async function generateStaticParams() {
  const fs = await import("fs/promises");
  const path = await import("path");

  const params: { category: string; serverId: string }[] = [];

  for (const [category, fileName] of Object.entries(CATEGORY_TOOLS_FILES)) {
    try {
      const toolsFile = path.join(process.cwd(), "public", "data", fileName);
      const fileData = await fs.readFile(toolsFile, "utf-8");
      const allTools: ToolDefinition[] = JSON.parse(fileData);

      const serverIds = new Set<string>();
      for (const tool of allTools) {
        serverIds.add(extractServerName(tool.name));
      }

      for (const serverId of serverIds) {
        params.push({ category, serverId });
      }
    } catch {
      // Skip if file not found
    }
  }

  return params;
}

export default async function ServerDetailPage({ params }: PageProps) {
  const { category, serverId } = await params;
  const { tools, csvFiles, totalRecords, summary } = await getServerData(category, serverId);

  const categoryName = CATEGORY_NAMES[category] || category;
  const serverName = formatServerName(serverId);
  const hasData = csvFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/tools/${category}`}>{categoryName}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{serverName}</span>
      </nav>

      {/* Header */}
      <div className="card-static p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{serverName}</h1>
            <p className="text-[var(--muted)] mt-1">{summary || "MCP Server"}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {tools.length}
            </div>
            <div className="text-sm text-[var(--muted)]">
              tool{tools.length !== 1 ? "s" : ""}
            </div>
          </div>
          {hasData && (
            <>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {csvFiles.length}
                </div>
                <div className="text-sm text-[var(--muted)]">
                  data file{csvFiles.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {totalRecords.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--muted)]">records</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Browser */}
      {hasData && (
        <div className="card-static p-6">
          <h2 className="section-header">Mock Data</h2>
          <ServerDataBrowser csvFiles={csvFiles} />
        </div>
      )}

      {/* Tool Definitions */}
      {tools.length > 0 && (
        <div className="card-static">
          <div className="p-6 pb-0">
            <h2 className="section-header mb-0">
              Tool Definitions ({tools.length})
            </h2>
          </div>
          <ToolsList tools={tools} />
        </div>
      )}
    </div>
  );
}
