import Link from "next/link";
import { PersonaProfile, IndexData } from "@/types";

interface PageProps {
  params: Promise<{ personaId: string }>;
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

async function getAllPersonaIds(): Promise<string[]> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "index.json");
  const data = await fs.readFile(filePath, "utf-8");
  const index: IndexData = JSON.parse(data);
  return index.personas.map((p) => p.id);
}

export async function generateStaticParams() {
  const ids = await getAllPersonaIds();
  return ids.map((id) => ({ personaId: id }));
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

export default async function PersonaPage({ params }: PageProps) {
  const { personaId } = await params;
  const profile = await getProfile(personaId);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link href="/personas">Personas</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{profile.name}</span>
      </nav>

      {/* Profile Header */}
      <div className="card-static p-6">
        <div className="flex items-start gap-6">
          <div className="avatar w-20 h-20 text-2xl flex-shrink-0">
            {profile.initials}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-[var(--muted)] mt-1">
              {profile.professional.profession} · {profile.professional.industry}
            </p>
            <p className="text-sm text-[var(--muted)] mt-2">
              {profile.location.address}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)]">
              {formatNumber(profile.stats.total_orders)}
            </div>
            <div className="text-sm text-[var(--muted)]">total orders</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Demographics */}
          <div className="card-static p-4">
            <h3 className="section-header">Demographics</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Age Group</span>
                <span className="info-value capitalize">{profile.demographics.age_group}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Gender</span>
                <span className="info-value capitalize">{profile.demographics.gender}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ethnicity</span>
                <span className="info-value">{profile.demographics.ethnicity}</span>
              </div>
              {profile.demographics.marital_status && (
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className="info-value capitalize">{profile.demographics.marital_status}</span>
                </div>
              )}
              {profile.demographics.family_role && (
                <div className="info-row">
                  <span className="info-label">Role</span>
                  <span className="info-value capitalize">{profile.demographics.family_role}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="card-static p-4">
            <h3 className="section-header">Location</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">City</span>
                <span className="info-value">{profile.location.city}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Region</span>
                <span className="info-value">{profile.location.region}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Country</span>
                <span className="info-value">{profile.location.country}</span>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="card-static p-4">
            <h3 className="section-header">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, i) => (
                <span key={i} className="tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="card-static p-4">
            <h3 className="section-header">Personality Traits</h3>
            <div className="flex flex-wrap gap-2">
              {profile.personality_traits.map((trait, i) => (
                <span key={i} className="tag">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stores and Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="card-static p-4">
            <h3 className="section-header">Summary</h3>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {profile.summary}
            </p>
          </div>

          {/* Stores */}
          <div>
            <h3 className="section-header">Stores ({profile.stores.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/personas/${personaId}/store/${store.id}`}
                  className="card p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{store.name}</div>
                      <div className="text-sm text-[var(--muted)] mt-1">
                        {store.categories && store.categories.length > 1 ? (
                          store.categories.map((cat, i) => (
                            <span key={cat.id}>
                              {i > 0 && " · "}
                              {formatNumber(cat.item_count)} {cat.name.toLowerCase()}
                            </span>
                          ))
                        ) : (
                          <span>{formatNumber(store.item_count)} {store.transaction_label}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
