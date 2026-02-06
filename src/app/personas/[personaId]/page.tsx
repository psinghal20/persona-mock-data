import Link from "next/link";
import { PersonaProfile, IndexData, EmbeddedHealthProfile, HealthcareData } from "@/types";

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

function formatAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function HealthProfileSection({ health }: { health: EmbeddedHealthProfile }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="text-2xl">🏥</span> Health Profile
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Health Info */}
        <div className="card-static p-4">
          <h3 className="section-header">Basic Info</h3>
          <div className="space-y-0">
            <div className="info-row">
              <span className="info-label">Age</span>
              <span className="info-value">{formatAge(health.demographics.dob)} years</span>
            </div>
            <div className="info-row">
              <span className="info-label">Height</span>
              <span className="info-value">{health.demographics.height_cm} cm</span>
            </div>
            <div className="info-row">
              <span className="info-label">Weight</span>
              <span className="info-value">{health.demographics.weight_kg} kg</span>
            </div>
            {health.demographics.blood_type && (
              <div className="info-row">
                <span className="info-label">Blood Type</span>
                <span className="info-value">{health.demographics.blood_type}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vitals */}
        {health.vitals && (
          <div className="card-static p-4">
            <h3 className="section-header">Vitals</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Blood Pressure</span>
                <span className="info-value">{health.vitals.blood_pressure.systolic}/{health.vitals.blood_pressure.diastolic}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Resting HR</span>
                <span className="info-value">{health.vitals.resting_hr} bpm</span>
              </div>
              {health.vitals.spo2 && (
                <div className="info-row">
                  <span className="info-label">SpO2</span>
                  <span className="info-value">{health.vitals.spo2}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body Composition */}
        {health.body_composition && (
          <div className="card-static p-4">
            <h3 className="section-header">Body Composition</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Body Fat</span>
                <span className="info-value">{health.body_composition.body_fat_pct}%</span>
              </div>
              <div className="info-row">
                <span className="info-label">Muscle Mass</span>
                <span className="info-value">{health.body_composition.muscle_mass_kg} kg</span>
              </div>
              {health.body_composition.metabolic_age && (
                <div className="info-row">
                  <span className="info-label">Metabolic Age</span>
                  <span className="info-value">{health.body_composition.metabolic_age} years</span>
                </div>
              )}
              {health.body_composition.bmr_kcal && (
                <div className="info-row">
                  <span className="info-label">BMR</span>
                  <span className="info-value">{health.body_composition.bmr_kcal} kcal</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fitness */}
        {health.fitness && (
          <div className="card-static p-4">
            <h3 className="section-header">Fitness</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Level</span>
                <span className="info-value capitalize">{health.fitness.level.replace(/_/g, ' ')}</span>
              </div>
              {health.fitness.vo2_max && (
                <div className="info-row">
                  <span className="info-label">VO2 Max</span>
                  <span className="info-value">{health.fitness.vo2_max}</span>
                </div>
              )}
              {health.fitness.daily_activity?.steps_target && (
                <div className="info-row">
                  <span className="info-label">Steps Target</span>
                  <span className="info-value">{health.fitness.daily_activity.steps_target.toLocaleString()}</span>
                </div>
              )}
            </div>
            {health.fitness.weekly_workouts && health.fitness.weekly_workouts.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-[var(--muted)] mb-2">Weekly Workouts</div>
                <div className="flex flex-wrap gap-1">
                  {health.fitness.weekly_workouts.map((w, i) => (
                    <span key={i} className="tag text-xs">
                      {w.type.replace(/_/g, ' ')} ({w.frequency}x)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sleep */}
        {health.sleep && (
          <div className="card-static p-4">
            <h3 className="section-header">Sleep</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Target</span>
                <span className="info-value">{health.sleep.target_hours} hours</span>
              </div>
              <div className="info-row">
                <span className="info-label">Quality</span>
                <span className="info-value capitalize">{health.sleep.quality}</span>
              </div>
              {health.sleep.schedule?.chronotype && (
                <div className="info-row">
                  <span className="info-label">Chronotype</span>
                  <span className="info-value capitalize">{health.sleep.schedule.chronotype.replace(/_/g, ' ')}</span>
                </div>
              )}
              {health.sleep.schedule?.typical_bedtime && (
                <div className="info-row">
                  <span className="info-label">Bedtime</span>
                  <span className="info-value">{health.sleep.schedule.typical_bedtime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nutrition */}
        {health.nutrition && (
          <div className="card-static p-4">
            <h3 className="section-header">Nutrition</h3>
            <div className="space-y-0">
              <div className="info-row">
                <span className="info-label">Diet Type</span>
                <span className="info-value capitalize">{health.nutrition.diet_type}</span>
              </div>
              {health.nutrition.calorie_target && (
                <div className="info-row">
                  <span className="info-label">Calorie Target</span>
                  <span className="info-value">{health.nutrition.calorie_target.toLocaleString()} kcal</span>
                </div>
              )}
              {health.nutrition.macros && (
                <div className="info-row">
                  <span className="info-label">Macros</span>
                  <span className="info-value text-xs">P:{health.nutrition.macros.protein_pct}% C:{health.nutrition.macros.carbs_pct}% F:{health.nutrition.macros.fat_pct}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conditions, Medications, Allergies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conditions */}
        {health.conditions && health.conditions.length > 0 && (
          <div className="card-static p-4">
            <h3 className="section-header">Conditions</h3>
            <div className="space-y-2">
              {health.conditions.map((condition, i) => (
                <div key={i} className="text-sm">
                  <div className="font-medium">{condition.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {condition.severity} · {condition.status} · {condition.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {health.medications && health.medications.length > 0 && (
          <div className="card-static p-4">
            <h3 className="section-header">Medications</h3>
            <div className="space-y-2">
              {health.medications.map((med, i) => (
                <div key={i} className="text-sm">
                  <div className="font-medium">{med.name} {med.dose}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {med.frequency.replace(/_/g, ' ')} · {med.route}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {health.allergies && health.allergies.length > 0 && (
          <div className="card-static p-4">
            <h3 className="section-header">Allergies</h3>
            <div className="space-y-2">
              {health.allergies.map((allergy, i) => (
                <div key={i} className="text-sm">
                  <div className="font-medium">{allergy.allergen}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {allergy.severity} · {allergy.reaction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Devices & Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Devices */}
        {health.devices && (
          <div className="card-static p-4">
            <h3 className="section-header">Connected Devices</h3>
            <div className="flex flex-wrap gap-2">
              {health.devices.fitness_tracker?.enabled && (
                <span className="tag">
                  {health.devices.fitness_tracker.brand} {health.devices.fitness_tracker.model}
                </span>
              )}
              {health.devices.smart_scale?.enabled && (
                <span className="tag">
                  {health.devices.smart_scale.brand} {health.devices.smart_scale.model}
                </span>
              )}
              {health.devices.cgm?.enabled && (
                <span className="tag">
                  CGM: {health.devices.cgm.brand} {health.devices.cgm.model}
                </span>
              )}
              {health.devices.blood_pressure_monitor?.enabled && (
                <span className="tag">BP Monitor</span>
              )}
            </div>
          </div>
        )}

        {/* Insurance */}
        {health.insurance && (
          <div className="card-static p-4">
            <h3 className="section-header">Insurance</h3>
            <div className="space-y-0">
              {health.insurance.provider && (
                <div className="info-row">
                  <span className="info-label">Provider</span>
                  <span className="info-value">{health.insurance.provider}</span>
                </div>
              )}
              {health.insurance.plan && (
                <div className="info-row">
                  <span className="info-label">Plan</span>
                  <span className="info-value">{health.insurance.plan}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthcareServersSection({ healthcare, personaId }: { healthcare: HealthcareData; personaId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📊</span> Healthcare Data Sources
        </h2>
        <div className="text-sm text-[var(--muted)]">
          {healthcare.stats.total_items.toLocaleString()} records from {healthcare.stats.servers_count} sources
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthcare.servers.map((server) => (
          <Link
            key={server.id}
            href={`/personas/${personaId}/healthcare/${server.id}`}
            className="card p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold">{server.name}</div>
                <div className="text-sm text-[var(--muted)] mt-1">
                  {server.item_count.toLocaleString()} records · {server.category_count} categories
                </div>
                <div className="text-xs text-[var(--muted)] mt-2">
                  {server.categories.slice(0, 3).map((cat, i) => (
                    <span key={cat.id}>
                      {i > 0 && " · "}
                      {cat.name}
                    </span>
                  ))}
                  {server.categories.length > 3 && ` +${server.categories.length - 3} more`}
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
  );
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
              {/* Obsidian Vault tile */}
              {profile.obsidian && profile.obsidian.total_notes > 0 && (
                <Link
                  href={`/personas/${personaId}/obsidian`}
                  className="card p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Obsidian Vault
                      </div>
                      <div className="text-sm text-[var(--muted)] mt-1">
                        {profile.obsidian.total_notes} notes · {profile.obsidian.folders.filter(f => f.note_count > 0).length} folders
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Profile Section */}
      {profile.health_profile && <HealthProfileSection health={profile.health_profile} />}

      {/* Healthcare Servers Section */}
      {profile.healthcare && <HealthcareServersSection healthcare={profile.healthcare} personaId={personaId} />}

    </div>
  );
}
