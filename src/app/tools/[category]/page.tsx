import Link from "next/link";
import { ToolDefinition, ToolServerData } from "@/types";
import ToolBrowser from "@/components/ToolBrowser";

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
  // Convert server ID to readable name
  // e.g., "brave-search" -> "Brave Search"
  // e.g., "coffee_roaster" -> "Coffee Roaster"
  return serverId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractServerName(toolName: string): string {
  // Extract server name from tool name
  // e.g., "brave-search_brave_web_search" -> "brave-search"
  // e.g., "amazon_get-orders-history" -> "amazon"
  const underscoreIndex = toolName.indexOf("_");
  if (underscoreIndex === -1) return toolName;
  return toolName.substring(0, underscoreIndex);
}

// Map category routes to their tools JSON files
const CATEGORY_TOOLS_FILES: Record<string, string> = {
  shopping: "shopping-tools.json",
  medical: "healthcare-tools.json",
};

async function getCategoryData(category: string): Promise<ToolServerData[]> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Check if this category has a consolidated tools file
    const toolsFileName = CATEGORY_TOOLS_FILES[category];

    if (toolsFileName) {
      const toolsFile = path.join(
        process.cwd(),
        "public",
        "data",
        toolsFileName
      );

      const mockDataDir = path.join(
        process.cwd(),
        "public",
        "data",
        "mock-data"
      );

      try {
        const fileData = await fs.readFile(toolsFile, "utf-8");
        const allTools: ToolDefinition[] = JSON.parse(fileData);

        // Group tools by server name (extracted from tool name prefix)
        const serverMap = new Map<string, ToolDefinition[]>();

        for (const tool of allTools) {
          const serverId = extractServerName(tool.name);
          if (!serverMap.has(serverId)) {
            serverMap.set(serverId, []);
          }
          serverMap.get(serverId)!.push(tool);
        }

        // Get list of server directories with mock data
        let mockDataServers: string[] = [];
        try {
          mockDataServers = await fs.readdir(mockDataDir);
        } catch {
          // Mock data directory may not exist
        }

        // Convert to ToolServerData array
        const servers: ToolServerData[] = await Promise.all(
          Array.from(serverMap.entries()).map(async ([serverId, tools]) => {
            // Check if this server has mock data
            let dataFiles: string[] = [];
            if (mockDataServers.includes(serverId)) {
              try {
                const serverDataDir = path.join(mockDataDir, serverId);
                const files = await fs.readdir(serverDataDir);
                dataFiles = files.filter(f => f.endsWith('.csv'));
              } catch {
                // No data files
              }
            }

            return {
              filename: `${serverId}_tools.json`,
              name: formatServerName(serverId),
              tools,
              dataFiles: dataFiles.length > 0 ? dataFiles : undefined,
              dataDir: dataFiles.length > 0 ? serverId : undefined,
            };
          })
        );

        // Sort by server name
        servers.sort((a, b) => a.name.localeCompare(b.name));

        return servers;
      } catch {
        return [];
      }
    }

    // For other categories, fall back to reading individual tool files
    const toolsDir = path.join(
      process.cwd(),
      "public",
      "tools",
      category,
      "tools"
    );

    const dataDir = path.join(
      process.cwd(),
      "public",
      "tools",
      category,
      "data"
    );

    // Read all files in the tools directory
    let toolFiles: string[];
    try {
      const files = await fs.readdir(toolsDir);
      toolFiles = files.filter(f => f.endsWith("_tools.json"));
    } catch {
      return [];
    }

    // Read all data files to check for matches
    let dataFiles: string[] = [];
    try {
      const files = await fs.readdir(dataDir);
      dataFiles = files.filter(f => f.endsWith("_data.xlsx") || f.endsWith("_data.csv"));
    } catch {
      // Data directory may not exist, that's ok
    }

    // Load all tool files in parallel
    const serverPromises = toolFiles.map(async (filename) => {
      try {
        const filePath = path.join(toolsDir, filename);
        const fileData = await fs.readFile(filePath, "utf-8");
        const tools: ToolDefinition[] = JSON.parse(fileData);

        // Check for matching data file
        // e.g., amazon_tools.json -> amazon_data.xlsx or amazon_data.csv
        const baseName = filename.replace(/_tools\.json$/, "");
        const matchingDataFile = dataFiles.find(
          df => df.startsWith(baseName + "_data.")
        );

        return {
          filename,
          name: formatServerName(baseName),
          tools,
          dataFile: matchingDataFile,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(serverPromises);
    const servers: ToolServerData[] = results.filter((s) => s !== null);

    // Sort by server name
    servers.sort((a, b) => a.name.localeCompare(b.name));

    return servers;
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
  const servers = await getCategoryData(category);

  const categoryName = CATEGORY_NAMES[category] || category;
  const categoryIcon = CATEGORY_ICONS[category] || "📦";
  const totalTools = servers.reduce((sum, s) => sum + s.tools.length, 0);

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
              Browse and copy MCP tool definitions
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {servers.length}
            </div>
            <div className="text-sm text-[var(--muted)]">
              server{servers.length !== 1 ? "s" : ""}
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

      {/* Tool Browser */}
      <ToolBrowser category={category} servers={servers} />
    </div>
  );
}
