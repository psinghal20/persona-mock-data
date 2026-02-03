import Link from "next/link";
import { StoreIndex, StoreCategory, PersonaProfile, IndexData } from "@/types";

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

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase().replace(/[^a-z]/g, "_");
  return `badge badge-${normalized}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function CategorySection({
  category,
  personaId,
  storeId,
}: {
  category: StoreCategory;
  personaId: string;
  storeId: string;
}) {
  const hasCost = category.has_cost;
  const label = category.label;
  const labelCapitalized = capitalize(label);

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <h3 className="section-header mb-0">{category.name}</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--muted)]">
            {category.summary.total_count} {label}
          </span>
          {hasCost && category.summary.total_spent > 0 && (
            <span className="font-medium text-[var(--accent)]">
              {formatCurrency(category.summary.total_spent)}
            </span>
          )}
        </div>
      </div>

      {/* Category Items */}
      <div className="card-static overflow-hidden">
        {category.items.map((item) => (
          <Link
            key={item.order_id}
            href={`/personas/${personaId}/store/${storeId}/order/${item.order_id}`}
            className="order-row"
          >
            <div className="flex items-center gap-4">
              <div>
                {item.display_name ? (
                  <>
                    <div className="font-medium">{item.display_name}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {item.description ? `${item.description} · ` : ""}{item.order_id}
                    </div>
                  </>
                ) : item.item_preview ? (
                  <>
                    <div className="font-medium">{item.item_preview}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {item.order_id} · {formatDate(item.created_at)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-mono text-sm">{item.order_id}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      {formatDate(item.created_at)}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm text-[var(--muted)]">
                {item.item_count} item{item.item_count !== 1 ? "s" : ""}
              </div>
              {hasCost && (
                <div className="font-medium w-24 text-right">
                  {formatCurrency(item.total)}
                </div>
              )}
              <span className={getStatusClass(item.status)}>
                {item.status}
              </span>
              <svg
                className="w-4 h-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
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

      {/* Items List - always use CategorySection */}
      <div className="space-y-8">
        {storeData.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            personaId={personaId}
            storeId={storeId}
          />
        ))}
      </div>
    </div>
  );
}
