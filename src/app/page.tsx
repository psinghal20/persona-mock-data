import Link from "next/link";
import { IndexData, ToolDefinition } from "@/types";

async function getPersonaStats(): Promise<{ personas: number; orders: number }> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public", "data", "index.json");
    const data = await fs.readFile(filePath, "utf-8");
    const indexData: IndexData = JSON.parse(data);
    return {
      personas: indexData.stats.total_personas,
      orders: indexData.stats.total_orders,
    };
  } catch {
    return { personas: 0, orders: 0 };
  }
}

async function getToolCategoryStats(category: string): Promise<{ servers: number; tools: number }> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    
    const toolsDir = path.join(process.cwd(), "public", "tools", category, "tools");
    
    // Read all files in the tools directory
    let files: string[];
    try {
      files = await fs.readdir(toolsDir);
    } catch {
      return { servers: 0, tools: 0 };
    }
    
    // Filter for *_tools.json files
    const toolFiles = files.filter(f => f.endsWith("_tools.json"));
    const serverCount = toolFiles.length;
    let toolCount = 0;
    
    // Count tools from each file
    for (const filename of toolFiles) {
      try {
        const filePath = path.join(toolsDir, filename);
        const fileData = await fs.readFile(filePath, "utf-8");
        const tools: ToolDefinition[] = JSON.parse(fileData);
        toolCount += tools.length;
      } catch {
        // Skip files that can't be parsed
      }
    }
    
    return { servers: serverCount, tools: toolCount };
  } catch {
    return { servers: 0, tools: 0 };
  }
}

export default async function Home() {
  const [personaStats, shoppingStats, medicalStats, professionalStats] = await Promise.all([
    getPersonaStats(),
    getToolCategoryStats("shopping"),
    getToolCategoryStats("medical"),
    getToolCategoryStats("professional"),
  ]);

  return (
    <div className="home-container">
      <div className="space-y-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">MCP Atlas Browser</h1>
          <p className="text-[var(--muted)]">Browse persona data and MCP tool definitions</p>
        </div>
        
        <div className="category-cards">
          {/* Personas Card */}
          <Link href="/personas" className="category-card personas">
            <div className="card-icon">👤</div>
            <h2>Personas</h2>
            <p className="category-stats">
              <span>{personaStats.personas} Persona{personaStats.personas !== 1 ? "s" : ""}</span>
              <span>•</span>
              <span>{personaStats.orders} Order{personaStats.orders !== 1 ? "s" : ""}</span>
            </p>
          </Link>

          {/* Shopping Card */}
          <Link href="/tools/shopping" className="category-card shopping">
            <div className="card-icon">🛒</div>
            <h2>Shopping</h2>
            <p className="category-stats">
              {shoppingStats.servers > 0 ? (
                <>
                  <span>{shoppingStats.servers} Server{shoppingStats.servers !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{shoppingStats.tools} Tool{shoppingStats.tools !== 1 ? "s" : ""}</span>
                </>
              ) : (
                <span>No data</span>
              )}
            </p>
          </Link>

          {/* Medical Card */}
          <Link href="/tools/medical" className="category-card medical">
            <div className="card-icon">🏥</div>
            <h2>Medical</h2>
            <p className="category-stats">
              {medicalStats.servers > 0 ? (
                <>
                  <span>{medicalStats.servers} Server{medicalStats.servers !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{medicalStats.tools} Tool{medicalStats.tools !== 1 ? "s" : ""}</span>
                </>
              ) : (
                <span>No data yet</span>
              )}
            </p>
          </Link>

          {/* Professional Card */}
          <Link href="/tools/professional" className="category-card professional">
            <div className="card-icon">💼</div>
            <h2>Professional</h2>
            <p className="category-stats">
              {professionalStats.servers > 0 ? (
                <>
                  <span>{professionalStats.servers} Server{professionalStats.servers !== 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{professionalStats.tools} Tool{professionalStats.tools !== 1 ? "s" : ""}</span>
                </>
              ) : (
                <span>No data yet</span>
              )}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
