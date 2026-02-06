import Link from "next/link";
import { StoreIndex, PersonaProfile, IndexData } from "@/types";
import StoreItemBrowser from "@/components/StoreItemBrowser";

interface PageProps {
  params: Promise<{ personaId: string; storeId: string }>;
}

async function getStoreData(
  personaId: string,
  storeId: string
): Promise<StoreIndex> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "stores",
    storeId,
    "index.json"
  );
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

async function getPersonaName(personaId: string): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "profile.json"
  );
  const data = await fs.readFile(filePath, "utf-8");
  const profile: PersonaProfile = JSON.parse(data);
  return profile.name;
}

async function getAllParams(): Promise<{ personaId: string; storeId: string }[]> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const indexPath = path.join(process.cwd(), "public", "data", "index.json");
  const indexData = await fs.readFile(indexPath, "utf-8");
  const index: IndexData = JSON.parse(indexData);

  const params: { personaId: string; storeId: string }[] = [];

  for (const persona of index.personas) {
    const profilePath = path.join(
      process.cwd(),
      "public",
      "data",
      persona.id,
      "profile.json"
    );
    const profileData = await fs.readFile(profilePath, "utf-8");
    const profile: PersonaProfile = JSON.parse(profileData);

    for (const store of profile.stores) {
      params.push({ personaId: persona.id, storeId: store.id });
    }
  }

  return params;
}

export async function generateStaticParams() {
  return await getAllParams();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function StorePage({ params }: PageProps) {
  const { personaId, storeId } = await params;
  const storeData = await getStoreData(personaId, storeId);
  const personaName = await getPersonaName(personaId);

  const hasCost = storeData.has_cost;
  const hasMultipleCategories = storeData.categories && storeData.categories.length > 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}`}>{personaName}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{storeData.store_name}</span>
      </nav>

      {/* Store Header */}
      <div className="card-static p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{storeData.store_name}</h1>
            <p className="text-[var(--muted)] mt-1">
              Activity for {personaName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {storeData.summary.total_count}
            </div>
            <div className="text-sm text-[var(--muted)]">total items</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={`grid gap-4 ${hasCost ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div className="stat-card">
          <div className="stat-value text-xl">{storeData.summary.total_count}</div>
          <div className="stat-label">Total Items</div>
        </div>
        {hasCost && (
          <div className="stat-card">
            <div className="stat-value text-xl">{formatCurrency(storeData.summary.total_spent)}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-value text-xl">{storeData.summary.first_date || "-"}</div>
          <div className="stat-label">First Activity</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-xl">{storeData.summary.last_date || "-"}</div>
          <div className="stat-label">Last Activity</div>
        </div>
      </div>

      {/* Category Tabs - only show for multi-category stores */}
      {hasMultipleCategories && storeData.categories && (
        <div className="flex gap-2 flex-wrap">
          {storeData.categories.map((cat) => (
            <div
              key={cat.id}
              className="px-3 py-1.5 rounded-full text-sm bg-[var(--card)] border border-[var(--border)]"
            >
              {cat.name}
              <span className="ml-2 text-[var(--muted)]">
                {cat.summary.total_count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Items List with filter */}
      <StoreItemBrowser
        categories={storeData.categories}
        personaId={personaId}
        storeId={storeId}
      />
    </div>
  );
}
