import React from "react";
import Link from "next/link";
import { PersonaProfile, IndexData, HealthcareServerIndex, HealthcareItem } from "@/types";

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

async function getHealthcareClinicalServerData(
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
    "healthcare_clinical",
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
      if (profile.healthcare_clinical?.servers) {
        for (const server of profile.healthcare_clinical.servers) {
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

// Fields to always hide (internal IDs, redundant data)
const HIDDEN_FIELDS = new Set([
  "id", "persona_id", "patient_id", "server_id",
  "problem_id", "allergy_id", "prescription_id", "encounter_id",
  "vital_id", "lab_id", "report_id", "pgx_id", "risk_id",
  "carrier_id", "note_id", "claim_id", "remittance_id",
  "order_id", "specimen_id", "referral_id", "coverage_id",
  "letter_id", "auth_id", "rx_id", "history_id",
  "provider_id", "department_id", "payer_id", "medication_id",
  "ordering_provider_id", "requesting_provider_id", "referring_provider_id",
  "receiving_provider_id", "referring_dept_id", "receiving_dept_id",
  "prescriber_id", "collector_id", "pharmacy_id", "plan_id",
  "result_id", "ndc_code", "rxnorm_code", "loinc_code",
  "primary",
]);

// Fields used as the card title
const TITLE_FIELDS = [
  "description", "allergen_name", "medication_name", "test_name",
  "condition", "gene", "encounter_type", "note_type",
  "device_name", "service_description", "plan_name", "name",
  "specimen_type", "referral_reason",
];

// Fields rendered as status badges
const STATUS_FIELDS = new Set(["status", "carrier_status", "metabolizer_status", "risk_level", "abnormal_flag", "flagged"]);

// Fields with long text that should render full-width
const LONG_TEXT_FIELDS = new Set([
  "notes", "assessment", "plan", "subjective_preview", "objective_preview",
  "clinical_recommendation", "recommended_screening", "flag_reason",
  "affected_drugs", "chief_complaint", "genetic_markers",
]);

// Date fields
const DATE_FIELDS = new Set([
  "date", "onset_date", "start_date", "end_date", "encounter_date",
  "effective_date", "written_date", "collected_date", "verified_date",
  "created_date", "sent_date", "scheduled_date", "completed_date",
  "determination_date", "letter_date", "claim_date", "payment_date",
  "expiration_date", "created_at", "updated_at", "signed_at",
  "recorded_at", "collected_at", "resulted_at", "reported_at",
  "submitted_date", "accepted_date", "adjudicated_date", "paid_date",
  "remittance_date", "period_start", "period_end",
]);

// Currency fields
const CURRENCY_FIELDS = new Set([
  "total_billed", "total_allowed", "total_paid", "patient_responsibility",
  "payment_amount", "adjustment_amount", "copay_primary", "copay_specialist",
  "deductible", "deductible_met", "out_of_pocket_max", "oop_met",
]);

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || value === "0" && false;
}

function formatValue(key: string, value: unknown): string {
  if (isEmpty(value)) return "";
  const str = String(value);
  if (DATE_FIELDS.has(key)) return formatDate(str);
  if (CURRENCY_FIELDS.has(key)) {
    const num = parseFloat(str);
    return isNaN(num) ? str : `$${num.toFixed(2)}`;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return str;
}

function getStatusColor(key: string, value: string): string {
  const v = value.toLowerCase();
  if (key === "abnormal_flag") {
    if (v === "h" || v === "high") return "bg-red-900/40 text-red-300";
    if (v === "l" || v === "low") return "bg-blue-900/40 text-blue-300";
    return "bg-zinc-800 text-zinc-300";
  }
  if (key === "risk_level") {
    if (v === "elevated" || v === "high") return "bg-red-900/40 text-red-300";
    if (v === "average" || v === "moderate") return "bg-yellow-900/40 text-yellow-300";
    if (v === "low") return "bg-green-900/40 text-green-300";
  }
  if (key === "flagged") {
    return v === "1" ? "bg-red-900/40 text-red-300" : "bg-green-900/40 text-green-300";
  }
  if (v === "active" || v === "paid" || v === "completed" || v === "signed" || v === "final" || v === "processed" || v === "approved" || v === "not_carrier" || v === "normal" || v === "picked up" || v === "picked_up")
    return "bg-green-900/40 text-green-300";
  if (v === "pending" || v === "submitted" || v === "draft" || v === "open" || v === "intermediate" || v === "pending collection" || v === "pending_collection")
    return "bg-yellow-900/40 text-yellow-300";
  if (v === "inactive" || v === "closed" || v === "cancelled" || v === "denied" || v === "discontinued")
    return "bg-zinc-800 text-zinc-400";
  if (v === "severe" || v === "critical" || v === "carrier")
    return "bg-red-900/40 text-red-300";
  return "bg-zinc-800 text-zinc-300";
}

function getItemTitle(item: HealthcareItem): string {
  for (const field of TITLE_FIELDS) {
    const val = item[field];
    if (val && typeof val === "string" && val !== "") {
      return val.replace(/_/g, " ");
    }
  }
  if (item.id) return String(item.id);
  return "Record";
}

function ItemCard({ item }: { item: HealthcareItem }) {
  const title = getItemTitle(item);

  // Collect statuses, short fields, and long text fields
  const statuses: { key: string; value: string }[] = [];
  const shortFields: { key: string; value: string }[] = [];
  const longFields: { key: string; value: string }[] = [];

  for (const [key, rawValue] of Object.entries(item)) {
    if (HIDDEN_FIELDS.has(key)) continue;
    if (TITLE_FIELDS.includes(key)) continue;
    if (isEmpty(rawValue)) continue;

    const value = formatValue(key, rawValue);
    if (!value) continue;

    if (STATUS_FIELDS.has(key)) {
      const label = key === "flagged"
        ? (String(rawValue) === "1" ? "Flagged" : "OK")
        : value.replace(/_/g, " ");
      statuses.push({ key, value: label });
    } else if (LONG_TEXT_FIELDS.has(key) && value.length > 60) {
      longFields.push({ key, value });
    } else {
      shortFields.push({ key, value });
    }
  }

  return (
    <div className="card-static p-4">
      {/* Title + status badges */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-medium">{title}</div>
        {statuses.length > 0 && (
          <div className="flex gap-1 flex-shrink-0">
            {statuses.map(({ key, value }) => (
              <span
                key={key}
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(key, value)}`}
              >
                {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Short fields in 2-col grid */}
      {shortFields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {shortFields.map(({ key, value }) => (
            <div key={key} className="contents">
              <span className="text-[var(--muted)]">{formatFieldName(key)}</span>
              <span className="text-[var(--foreground)]">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Long text fields rendered full-width */}
      {longFields.map(({ key, value }) => (
        <div key={key} className="mt-3 text-sm">
          <div className="text-[var(--muted)] text-xs mb-1">{formatFieldName(key)}</div>
          <div className="text-[var(--foreground)] whitespace-pre-line leading-relaxed">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// Table view for categories with uniform tabular data
const TABLE_CONFIGS: Record<string, { columns: string[]; headers: string[] }> = {
  labs: {
    columns: ["test_name", "result_value", "result_unit", "reference_range", "abnormal_flag", "status"],
    headers: ["Test", "Result", "Unit", "Ref Range", "Flag", "Status"],
  },
  test_results: {
    columns: ["test_name", "result_value", "result_unit", "reference_range", "abnormal_flag", "critical_flag"],
    headers: ["Test", "Result", "Unit", "Ref Range", "Flag", "Critical"],
  },
  vitals: {
    columns: ["recorded_at", "blood_pressure_systolic", "blood_pressure_diastolic", "pulse", "oxygen_saturation", "temperature_f", "weight_lbs", "source"],
    headers: ["Date", "BP Sys", "BP Dia", "Pulse", "SpO2", "Temp", "Weight", "Source"],
  },
  prescriptions: {
    columns: ["medication_name", "dosage", "frequency", "route", "refills", "status", "written_date", "expiration_date"],
    headers: ["Medication", "Dose", "Frequency", "Route", "Refills", "Status", "Written", "Expires"],
  },
  medication_history: {
    columns: ["medication_name", "dosage", "frequency", "status", "start_date", "end_date", "pharmacy_name"],
    headers: ["Medication", "Dose", "Frequency", "Status", "Start", "End", "Pharmacy"],
  },
  claims: {
    columns: ["claim_id", "submitted_date", "total_billed", "total_allowed", "total_paid", "patient_responsibility", "status"],
    headers: ["Claim", "Submitted", "Billed", "Allowed", "Paid", "Patient Resp", "Status"],
  },
  remittance: {
    columns: ["claim_id", "check_number", "payment_amount", "patient_responsibility", "payment_date"],
    headers: ["Claim", "Check #", "Amount", "Patient Resp", "Payment Date"],
  },
  specimens: {
    columns: ["specimen_type", "barcode", "collection_date", "status"],
    headers: ["Type", "Barcode", "Collected", "Status"],
  },
  lab_orders: {
    columns: ["order_id", "order_date", "priority", "status", "clinical_indication"],
    headers: ["Order", "Date", "Priority", "Status", "Indication"],
  },
  glucose_reports: {
    columns: ["period_start", "period_end", "average_glucose", "gmi", "time_in_range", "time_below_range", "time_above_range", "flagged"],
    headers: ["From", "To", "Avg Glucose", "GMI", "TIR%", "Below%", "Above%", "Flag"],
  },
};

// Categories that render single-column (full-width) cards
const FULL_WIDTH_CATEGORIES = new Set(["clinical_notes"]);

function TableView({
  items,
  config,
}: {
  items: HealthcareItem[];
  config: { columns: string[]; headers: string[] };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {config.headers.map((header, i) => (
              <th key={i} className="text-left py-2 px-3 text-[var(--muted)] font-medium whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, rowIdx) => (
            <tr key={item.id || rowIdx} className="border-b border-[var(--border)]/50">
              {config.columns.map((col, colIdx) => {
                const raw = item[col];
                const value = formatValue(col, raw);
                const isFlag = col === "abnormal_flag" || col === "critical_flag" || col === "flagged";
                const isStatus = col === "status";
                const flagged = isFlag && value && value !== "0" && value !== "";
                return (
                  <td key={colIdx} className="py-2 px-3">
                    {isFlag && flagged ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300">
                        {col === "critical_flag" ? "CRIT" : col === "flagged" ? (String(raw) === "1" ? "!" : "") : value}
                      </span>
                    ) : isStatus && value ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor("status", value)}`}>
                        {value.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span>{value || "-"}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Custom renderers for specific category types ---

function str(item: HealthcareItem, key: string): string {
  const v = item[key];
  return v != null && v !== "" ? String(v) : "";
}

function InsuranceCoverageView({ items }: { items: HealthcareItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const deductible = parseFloat(str(item, "deductible")) || 0;
        const deductibleMet = parseFloat(str(item, "deductible_met")) || 0;
        const oopMax = parseFloat(str(item, "out_of_pocket_max")) || 0;
        const oopMet = parseFloat(str(item, "oop_met")) || 0;
        const deductiblePct = deductible > 0 ? Math.min((deductibleMet / deductible) * 100, 100) : 0;
        const oopPct = oopMax > 0 ? Math.min((oopMet / oopMax) * 100, 100) : 0;
        const coinsurance = parseFloat(str(item, "coinsurance_rate")) || 0;

        return (
          <div key={item.id || i} className="card-static p-5 space-y-5">
            {/* Plan header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{str(item, "plan_name") || "Insurance Plan"}</div>
                <div className="text-sm text-[var(--muted)] mt-1">
                  Member: {str(item, "member_id")} &middot; Group: {str(item, "group_number")}
                </div>
              </div>
              {str(item, "status") && (
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor("status", str(item, "status"))}`}>
                  {str(item, "status")}
                </span>
              )}
            </div>

            {/* Dates */}
            <div className="flex gap-6 text-sm">
              {str(item, "effective_date") && (
                <div>
                  <span className="text-[var(--muted)]">Effective: </span>
                  <span>{formatDate(str(item, "effective_date"))}</span>
                </div>
              )}
              {str(item, "termination_date") && (
                <div>
                  <span className="text-[var(--muted)]">Terminates: </span>
                  <span>{formatDate(str(item, "termination_date"))}</span>
                </div>
              )}
            </div>

            {/* Copays */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--card)" }}>
                <div className="text-xs text-[var(--muted)] mb-1">Primary Copay</div>
                <div className="text-xl font-bold">${str(item, "copay_primary")}</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--card)" }}>
                <div className="text-xs text-[var(--muted)] mb-1">Specialist Copay</div>
                <div className="text-xl font-bold">${str(item, "copay_specialist")}</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--card)" }}>
                <div className="text-xs text-[var(--muted)] mb-1">Coinsurance</div>
                <div className="text-xl font-bold">{(coinsurance * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--muted)]">Deductible</span>
                  <span>${deductibleMet.toFixed(2)} / ${deductible.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${deductiblePct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--muted)]">Out-of-Pocket Max</span>
                  <span>${oopMet.toFixed(2)} / ${oopMax.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${oopPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorAuthView({ items }: { items: HealthcareItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id || i} className="card-static p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{str(item, "description") || str(item, "service_type") || "Authorization"}</div>
              <div className="text-sm text-[var(--muted)] mt-1">
                {str(item, "cpt_code") && <>CPT: {str(item, "cpt_code")}</>}
                {str(item, "icd10_code") && <> &middot; ICD-10: {str(item, "icd10_code")}</>}
              </div>
            </div>
            {str(item, "status") && (
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor("status", str(item, "status"))}`}>
                {str(item, "status")}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-sm">
            {[
              { label: "Requested", date: str(item, "requested_date") },
              { label: "Determined", date: str(item, "determination_date") },
              { label: "Expires", date: str(item, "expiration_date") },
            ].filter(s => s.date).map((step, idx, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                {idx > 0 && <span className="text-[var(--muted)]">&rarr;</span>}
                <div className="text-center">
                  <div className="text-xs text-[var(--muted)]">{step.label}</div>
                  <div>{formatDate(step.date)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {str(item, "urgency") && (
              <div className="contents">
                <span className="text-[var(--muted)]">Urgency</span>
                <span className="capitalize">{str(item, "urgency")}</span>
              </div>
            )}
            {str(item, "approved_units") && (
              <div className="contents">
                <span className="text-[var(--muted)]">Approved Units</span>
                <span>{str(item, "approved_units")}</span>
              </div>
            )}
          </div>

          {str(item, "notes") && (
            <div className="text-sm text-[var(--muted)] italic">{str(item, "notes")}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DeterminationLetterView({ items }: { items: HealthcareItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id || i} className="card-static p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="text-sm text-[var(--muted)]">
              {str(item, "letter_date") && formatDate(str(item, "letter_date"))}
            </div>
            {str(item, "determination") && (
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor("status", str(item, "determination"))}`}>
                {str(item, "determination")}
              </span>
            )}
          </div>
          {str(item, "reason") && (
            <div className="text-sm leading-relaxed">{str(item, "reason")}</div>
          )}
          {str(item, "appeal_deadline") && (
            <div className="text-sm">
              <span className="text-[var(--muted)]">Appeal Deadline: </span>
              {formatDate(str(item, "appeal_deadline"))}
            </div>
          )}
          {str(item, "appeal_instructions") && (
            <div className="text-sm text-[var(--muted)]">{str(item, "appeal_instructions")}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReferralView({ items }: { items: HealthcareItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const steps = [
          { label: "Created", date: str(item, "created_date") },
          { label: "Sent", date: str(item, "sent_date") },
          { label: "Scheduled", date: str(item, "scheduled_date") },
          { label: "Completed", date: str(item, "completed_date") },
        ].filter(s => s.date);

        return (
          <div key={item.id || i} className="card-static p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{str(item, "reason") || "Referral"}</div>
                {str(item, "icd10_code") && (
                  <div className="text-sm text-[var(--muted)] mt-1">ICD-10: {str(item, "icd10_code")}</div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {str(item, "urgency") && (
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-zinc-800 text-zinc-300">
                    {str(item, "urgency")}
                  </span>
                )}
                {str(item, "status") && (
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor("status", str(item, "status"))}`}>
                    {str(item, "status")}
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            {steps.length > 0 && (
              <div className="flex items-center gap-1">
                {steps.map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-1 flex-1">
                    {idx > 0 && (
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    )}
                    <div className="flex flex-col items-center text-center min-w-0">
                      <div className="w-3 h-3 rounded-full bg-[var(--accent)] mb-1 flex-shrink-0" />
                      <div className="text-xs font-medium">{step.label}</div>
                      <div className="text-xs text-[var(--muted)]">{formatDate(step.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Clinical notes */}
            {str(item, "clinical_notes") && (
              <div className="text-sm">
                <div className="text-xs text-[var(--muted)] mb-1">Clinical Notes</div>
                <div className="leading-relaxed">{str(item, "clinical_notes")}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Map category IDs to custom renderers
const CUSTOM_RENDERERS: Record<string, (items: HealthcareItem[]) => React.ReactNode> = {
  patient_coverage: (items) => <InsuranceCoverageView items={items} />,
  prior_authorizations: (items) => <PriorAuthView items={items} />,
  determination_letters: (items) => <DeterminationLetterView items={items} />,
  referrals: (items) => <ReferralView items={items} />,
};

function CategorySection({
  category,
}: {
  category: { id: string; name: string; item_count: number; items: HealthcareItem[] };
}) {
  const tableConfig = TABLE_CONFIGS[category.id];
  const customRenderer = CUSTOM_RENDERERS[category.id];
  const isFullWidth = FULL_WIDTH_CATEGORIES.has(category.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <span className="text-sm text-[var(--muted)]">
          {category.item_count} {category.item_count === 1 ? "record" : "records"}
        </span>
      </div>
      {customRenderer ? (
        customRenderer(category.items)
      ) : tableConfig ? (
        <div className="card-static p-4">
          <TableView items={category.items} config={tableConfig} />
        </div>
      ) : (
        <div className={isFullWidth ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {category.items.map((item, index) => (
            <ItemCard key={item.id || index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function getServerIcon(serverId: string): string {
  if (serverId.includes("athena")) return "🏥";
  if (serverId.includes("lab")) return "🧪";
  if (serverId.includes("prescri")) return "💊";
  if (serverId.includes("billing") || serverId.includes("claims")) return "💳";
  if (serverId.includes("prior_auth")) return "📋";
  if (serverId.includes("clinical_doc")) return "📝";
  if (serverId.includes("referral")) return "🔗";
  return "🩺";
}

export default async function HealthcareClinicalServerPage({ params }: PageProps) {
  const { personaId, serverId } = await params;
  const [profile, serverData] = await Promise.all([
    getProfile(personaId),
    getHealthcareClinicalServerData(personaId, serverId),
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
          <span className="breadcrumb-current">Clinical</span>
        </nav>
        <div className="card-static p-8 text-center">
          <p className="text-[var(--muted)]">Clinical data not found for this server.</p>
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
            {getServerIcon(serverId)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{serverData.server_name}</h1>
            <p className="text-[var(--muted)] mt-1">
              Clinical data for {profile.name}
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

      {/* Categories */}
      <div className="space-y-8">
        {serverData.categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
