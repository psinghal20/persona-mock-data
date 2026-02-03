import Link from "next/link";
import { IndexData } from "@/types";

async function getData(): Promise<IndexData> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "index.json");
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export default async function PersonasPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Personas</span>
      </nav>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-value">{formatNumber(data.stats.total_personas)}</div>
          <div className="stat-label">Personas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatNumber(data.stats.total_orders)}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatNumber(data.stats.total_stores)}</div>
          <div className="stat-label">Stores</div>
        </div>
      </div>

      {/* Personas Grid */}
      <div>
        <h2 className="section-header">All Personas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.personas.map((persona) => (
            <Link
              key={persona.id}
              href={`/personas/${persona.id}`}
              className="card p-4 flex items-center gap-4"
            >
              <div className="avatar w-12 h-12 text-lg flex-shrink-0">
                {persona.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{persona.name}</div>
                <div className="text-sm text-[var(--muted)] truncate">
                  {persona.profession}
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {persona.city}, {persona.region}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium">{formatNumber(persona.total_orders)}</div>
                <div className="text-xs text-[var(--muted)]">orders</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
