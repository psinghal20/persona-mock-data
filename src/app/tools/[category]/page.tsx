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

function formatServerName(filename: string): string {
  // Remove _tools.json suffix and convert to readable name
  // e.g., "amazon_tools.json" -> "Amazon"
  // e.g., "coffee-roaster_tools.json" -> "Coffee Roaster"
  const baseName = filename.replace(/_tools\.json$/, "");
  return baseName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getCategoryData(category: string): Promise<ToolServerData[]> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

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
          name: formatServerName(filename),
          tools,
          dataFile: matchingDataFile,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(serverPromises);
    const servers = results.filter((s): s is ToolServerData => s !== null);
    
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
