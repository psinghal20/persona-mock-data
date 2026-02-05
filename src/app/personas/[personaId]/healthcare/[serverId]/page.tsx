import Link from "next/link";
import { PersonaProfile, IndexData, HealthcareServerIndex, HealthcareItem } from "@/types";
import FitbitDashboard from "@/components/FitbitDashboard";
import WhoopDashboard from "@/components/WhoopDashboard";
import GarminDashboard from "@/components/GarminDashboard";
import RenphoDashboard from "@/components/RenphoDashboard";
import MyFitnessPalDashboard from "@/components/MyFitnessPalDashboard";

interface PageProps {
  params: Promise<{ personaId: string; serverId: string }>;
}

async function getProfile(personaId: string): Promise<PersonaProfile> {
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
  return JSON.parse(data);
}

async function getHealthcareServerData(
  personaId: string,
  serverId: string
): Promise<HealthcareServerIndex | null> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    personaId,
    "healthcare",
    serverId,
    "index.json"
  );
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function getAllPersonaIds(): Promise<string[]> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "index.json");
  const data = await fs.readFile(filePath, "utf-8");
  const index: IndexData = JSON.parse(data);
  return index.personas.map((p) => p.id);
}

export async function generateStaticParams() {
  const personaIds = await getAllPersonaIds();
  const params: { personaId: string; serverId: string }[] = [];

  for (const personaId of personaIds) {
    try {
      const profile = await getProfile(personaId);
      if (profile.healthcare?.servers) {
        for (const server of profile.healthcare.servers) {
          params.push({ personaId, serverId: server.id });
        }
      }
    } catch {
      // Skip if profile doesn't exist
    }
  }

  return params;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatFieldName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

// Fields to exclude from display (internal or redundant)
const EXCLUDED_FIELDS = ["id", "persona_id", "server_id"];

// Fields that should be displayed prominently as the item title
const TITLE_FIELDS = ["name", "medication", "allergen", "type", "activity_type", "workout_type"];

// Fields that contain dates
const DATE_FIELDS = ["date", "onset_date", "start_date", "end_date", "appointment_date"];

function getItemTitle(item: HealthcareItem): string {
  for (const field of TITLE_FIELDS) {
    if (item[field] && typeof item[field] === "string" && item[field] !== "") {
      return item[field] as string;
    }
  }
  // Fallback to date or id
  if (item.date) return formatDate(item.date);
  if (item.id) return item.id;
  return "Record";
}

function ItemCard({ item }: { item: HealthcareItem }) {
  const title = getItemTitle(item);
  const fields = Object.entries(item).filter(
    ([key]) => !EXCLUDED_FIELDS.includes(key) && !TITLE_FIELDS.includes(key)
  );

  return (
    <div className="card-static p-4">
      <div className="font-medium mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {fields.map(([key, value]) => (
          <div key={key} className="contents">
            <span className="text-[var(--muted)]">{formatFieldName(key)}</span>
            <span className="text-[var(--foreground)]">
              {DATE_FIELDS.includes(key) ? formatDate(String(value)) : formatFieldValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  category,
}: {
  category: { id: string; name: string; item_count: number; items: HealthcareItem[] };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <span className="text-sm text-[var(--muted)]">
          {category.item_count} {category.item_count === 1 ? "record" : "records"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.items.map((item, index) => (
          <ItemCard key={item.id || index} item={item} />
        ))}
      </div>
    </div>
  );
}

export default async function HealthcareServerPage({ params }: PageProps) {
  const { personaId, serverId } = await params;
  const [profile, serverData] = await Promise.all([
    getProfile(personaId),
    getHealthcareServerData(personaId, serverId),
  ]);

  if (!serverData) {
    return (
      <div className="space-y-6">
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/personas">Personas</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href={`/personas/${personaId}`}>{profile.name}</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Healthcare</span>
        </nav>
        <div className="card-static p-8 text-center">
          <p className="text-[var(--muted)]">Healthcare data not found for this server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href={`/personas/${personaId}`}>{profile.name}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{serverData.server_name}</span>
      </nav>

      {/* Header */}
      <div className="card-static p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {serverId.includes("garmin") ? "⌚" :
             serverId.includes("fitbit") ? "📱" :
             serverId.includes("whoop") ? "💪" :
             serverId.includes("libre") || serverId.includes("cgm") ? "🩸" :
             serverId.includes("athena") || serverId.includes("fhir") ? "🏥" :
             serverId.includes("renpho") ? "⚖️" :
             serverId.includes("myfitnesspal") ? "🍎" :
             serverId.includes("genetic") ? "🧬" :
             serverId.includes("pharmacy") ? "💊" : "📊"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{serverData.server_name}</h1>
            <p className="text-[var(--muted)] mt-1">
              Healthcare data for {profile.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {serverData.summary.total_items.toLocaleString()}
            </div>
            <div className="text-sm text-[var(--muted)]">records</div>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {serverData.summary.category_count}
            </div>
            <div className="text-sm text-[var(--muted)]">categories</div>
          </div>
        </div>
      </div>

      {/* Content - Dashboard for fitness trackers, Categories for others */}
      {serverId === "fitbit" ? (
        <FitbitDashboard data={serverData} />
      ) : serverId === "whoop" ? (
        <WhoopDashboard data={serverData} />
      ) : serverId === "garmin_health" ? (
        <GarminDashboard data={serverData} />
      ) : serverId === "renpho" ? (
        <RenphoDashboard data={serverData} />
      ) : serverId === "myfitnesspal" ? (
        <MyFitnessPalDashboard data={serverData} />
      ) : (
        <div className="space-y-8">
          {serverData.categories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
