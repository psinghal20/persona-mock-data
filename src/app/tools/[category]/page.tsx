import Link from "next/link";
import { ToolDefinition } from "@/types";

interface PageProps {
  params: Promise<{ category: string }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  shopping: "Shopping",
  medical: "Medical",
  professional: "Professional Work",
};

const CATEGORY_ICONS: Record<string, string> = {
  shopping: "🛒",
  medical: "🏥",
  professional: "💼",
};

function formatServerName(serverId: string): string {
  return serverId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractServerName(toolName: string): string {
  const underscoreIndex = toolName.indexOf("_");
  if (underscoreIndex === -1) return toolName;
  return toolName.substring(0, underscoreIndex);
}

// Map category routes to their tools JSON files
const CATEGORY_TOOLS_FILES: Record<string, string> = {
  shopping: "shopping-tools.json",
  medical: "healthcare-tools.json",
};

interface ServerCard {
  serverId: string;
  name: string;
  summary?: string;
  toolCount: number;
  dataFileCount: number;
}

async function getCategoryCards(category: string): Promise<ServerCard[]> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const toolsFileName = CATEGORY_TOOLS_FILES[category];
    if (!toolsFileName) return [];

    const toolsFile = path.join(process.cwd(), "public", "data", toolsFileName);
    const mockDataDir = path.join(process.cwd(), "public", "data", "mock-data");

    const fileData = await fs.readFile(toolsFile, "utf-8");
    const allTools: ToolDefinition[] = JSON.parse(fileData);

    // Load server metadata
    let metadata: Record<string, { summary?: string }> = {};
    try {
      const metaFile = path.join(process.cwd(), "public", "data", "server-metadata.json");
      const metaData = await fs.readFile(metaFile, "utf-8");
      const allMeta = JSON.parse(metaData);
      metadata = allMeta[category] || {};
    } catch {
      // No metadata file
    }

    // Group tools by server
    const serverMap = new Map<string, number>();
    for (const tool of allTools) {
      const serverId = extractServerName(tool.name);
      serverMap.set(serverId, (serverMap.get(serverId) || 0) + 1);
    }

    // Check mock data directories
    let mockDataServers: Set<string> = new Set();
    try {
      const dirs = await fs.readdir(mockDataDir);
      mockDataServers = new Set(dirs);
    } catch {
      // No mock data directory
    }

    const cards: ServerCard[] = [];
    for (const [serverId, toolCount] of serverMap) {
      let dataFileCount = 0;
      if (mockDataServers.has(serverId)) {
        try {
          const serverDir = path.join(mockDataDir, serverId);
          const files = await fs.readdir(serverDir);
          dataFileCount = files.filter(f => f.endsWith(".csv")).length;
        } catch {
          // No data files
        }
      }

      cards.push({
        serverId,
        name: formatServerName(serverId),
        summary: metadata[serverId]?.summary,
        toolCount,
        dataFileCount,
      });
    }

    cards.sort((a, b) => a.name.localeCompare(b.name));
    return cards;
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return [
    { category: "shopping" },
    { category: "medical" },
    { category: "professional" },
  ];
}

export default async function ToolCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cards = await getCategoryCards(category);

  const categoryName = CATEGORY_NAMES[category] || category;
  const categoryIcon = CATEGORY_ICONS[category] || "📦";
  const totalTools = cards.reduce((sum, c) => sum + c.toolCount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{categoryName}</span>
      </nav>

      {/* Header */}
      <div className="card-static p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{categoryIcon}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{categoryName} Tools</h1>
            <p className="text-[var(--muted)] mt-1">
              Browse MCP server tools and mock data
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {cards.length}
            </div>
            <div className="text-sm text-[var(--muted)]">
              server{cards.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {totalTools}
            </div>
            <div className="text-sm text-[var(--muted)]">
              tool{totalTools !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Server Card Grid */}
      {cards.length === 0 ? (
        <div className="card-static p-8 text-center">
          <p className="text-[var(--muted)]">No servers in this category yet.</p>
        </div>
      ) : (
        <div className="server-cards">
          {cards.map((card) => (
            <Link
              key={card.serverId}
              href={`/tools/${category}/${card.serverId}`}
              className="server-card"
            >
              <h3 className="server-card-name">{card.name}</h3>
              {card.summary && (
                <p className="server-card-summary">{card.summary}</p>
              )}
              <div className="server-card-stats">
                <span>{card.toolCount} tool{card.toolCount !== 1 ? "s" : ""}</span>
                {card.dataFileCount > 0 && (
                  <span className="server-card-data">
                    {card.dataFileCount} data file{card.dataFileCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
