"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { HealthcareServerIndex } from "@/types";

interface OmronBPDashboardProps {
  data: HealthcareServerIndex;
}

interface Reading {
  id: string;
  date: string;
  systolic: string;
  diastolic: string;
  pulse: string;
  measurement_position: string;
  time_of_day: string;
  irregular_heartbeat: string;
}

interface Device {
  id: string;
  model: string;
  device_name: string;
  serial_number: string;
  battery_level: string;
  last_sync: string;
  status: string;
}

const COLORS = {
  systolic: "#ef4444",
  diastolic: "#3b82f6",
  pulse: "#10b981",
  morning: "#f59e0b",
  evening: "#8b5cf6",
  normal: "#10b981",
  elevated: "#f59e0b",
  stage1: "#f97316",
  stage2: "#ef4444",
  crisis: "#dc2626",
};

function classifyBP(systolic: number, diastolic: number): string {
  if (systolic >= 180 || diastolic >= 120) return "Crisis";
  if (systolic >= 140 || diastolic >= 90) return "Stage 2";
  if (systolic >= 130 || diastolic >= 80) return "Stage 1";
  if (systolic >= 120 && diastolic < 80) return "Elevated";
  return "Normal";
}

function classificationColor(classification: string): string {
  switch (classification) {
    case "Normal": return COLORS.normal;
    case "Elevated": return COLORS.elevated;
    case "Stage 1": return COLORS.stage1;
    case "Stage 2": return COLORS.stage2;
    case "Crisis": return COLORS.crisis;
    default: return "var(--muted)";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SummaryCard({
  title,
  value,
  unit,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  color?: string;
  icon: string;
}) {
  return (
    <div className="card-static p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{title}</p>
          <p className="text-2xl font-bold mt-1" style={color ? { color } : {}}>
            {value}
            {unit && <span className="text-sm font-normal text-[var(--muted)] ml-1">{unit}</span>}
          </p>
          {subtitle && (
            <p className="text-xs mt-1 text-[var(--muted)]">{subtitle}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function OmronBPDashboard({ data }: OmronBPDashboardProps) {
  const readings = (data.categories.find((c) => c.id === "readings")?.items || []) as unknown as Reading[];
  const devices = (data.categories.find((c) => c.id === "devices")?.items || []) as unknown as Device[];

  // Parse numeric values
  const parsed = readings.map((r) => ({
    ...r,
    sys: parseInt(r.systolic),
    dia: parseInt(r.diastolic),
    pul: parseInt(r.pulse),
    classification: classifyBP(parseInt(r.systolic), parseInt(r.diastolic)),
  }));

  // Sort oldest first for charts
  const sorted = [...parsed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const latest = parsed[0];
  if (!latest) {
    return (
      <div className="card-static p-8 text-center">
        <p className="text-[var(--muted)]">No blood pressure readings available.</p>
      </div>
    );
  }

  // Averages
  const avgSys = Math.round(parsed.reduce((s, r) => s + r.sys, 0) / parsed.length);
  const avgDia = Math.round(parsed.reduce((s, r) => s + r.dia, 0) / parsed.length);
  const avgPulse = Math.round(parsed.reduce((s, r) => s + r.pul, 0) / parsed.length);
  const avgClassification = classifyBP(avgSys, avgDia);

  // Morning vs evening
  const morning = parsed.filter((r) => r.time_of_day === "morning");
  const evening = parsed.filter((r) => r.time_of_day === "evening");
  const avgMorningSys = morning.length ? Math.round(morning.reduce((s, r) => s + r.sys, 0) / morning.length) : 0;
  const avgMorningDia = morning.length ? Math.round(morning.reduce((s, r) => s + r.dia, 0) / morning.length) : 0;
  const avgEveningSys = evening.length ? Math.round(evening.reduce((s, r) => s + r.sys, 0) / evening.length) : 0;
  const avgEveningDia = evening.length ? Math.round(evening.reduce((s, r) => s + r.dia, 0) / evening.length) : 0;

  // Irregular heartbeat count
  const irregularCount = parsed.filter((r) => r.irregular_heartbeat === "True").length;

  // Classification distribution
  const classificationCounts: Record<string, number> = {};
  for (const r of parsed) {
    classificationCounts[r.classification] = (classificationCounts[r.classification] || 0) + 1;
  }
  const pieData = Object.entries(classificationCounts).map(([name, value]) => ({ name, value }));
  const pieColors = pieData.map((d) => classificationColor(d.name));

  // Chart data - BP trend
  const bpChartData = sorted.map((r) => ({
    date: formatDate(r.date),
    systolic: r.sys,
    diastolic: r.dia,
  }));

  // Chart data - pulse trend
  const pulseChartData = sorted.map((r) => ({
    date: formatDate(r.date),
    pulse: r.pul,
  }));

  // Morning vs Evening bar chart
  const morningEveningData = [
    { name: "Morning", systolic: avgMorningSys, diastolic: avgMorningDia },
    { name: "Evening", systolic: avgEveningSys, diastolic: avgEveningDia },
  ];

  const device = devices[0];

  // Custom pie label
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Latest BP"
          value={`${latest.sys}/${latest.dia}`}
          unit="mmHg"
          subtitle={latest.classification}
          icon="🩺"
          color={classificationColor(latest.classification)}
        />
        <SummaryCard
          title="Average BP"
          value={`${avgSys}/${avgDia}`}
          unit="mmHg"
          subtitle={avgClassification}
          icon="📊"
          color={classificationColor(avgClassification)}
        />
        <SummaryCard
          title="Avg Pulse"
          value={avgPulse}
          unit="bpm"
          icon="💓"
          color={COLORS.pulse}
        />
        <SummaryCard
          title="Readings"
          value={parsed.length}
          subtitle={`${morning.length} AM / ${evening.length} PM`}
          icon="📋"
        />
        <SummaryCard
          title="Irregular HB"
          value={irregularCount}
          subtitle={irregularCount > 0 ? `${((irregularCount / parsed.length) * 100).toFixed(1)}% of readings` : "None detected"}
          icon="⚠️"
          color={irregularCount > 0 ? COLORS.stage1 : COLORS.normal}
        />
        {device && (
          <SummaryCard
            title="Device"
            value={device.device_name}
            subtitle={`Battery: ${device.battery_level}%`}
            icon="📱"
          />
        )}
      </div>

      {/* BP Trend Chart */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Blood Pressure Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bpChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                domain={[50, 160]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {/* AHA reference zones */}
              <ReferenceLine y={120} stroke={COLORS.elevated} strokeDasharray="6 4" label={{ value: "120", fill: COLORS.elevated, fontSize: 10, position: "right" }} />
              <ReferenceLine y={130} stroke={COLORS.stage1} strokeDasharray="6 4" label={{ value: "130", fill: COLORS.stage1, fontSize: 10, position: "right" }} />
              <ReferenceLine y={140} stroke={COLORS.stage2} strokeDasharray="6 4" label={{ value: "140", fill: COLORS.stage2, fontSize: 10, position: "right" }} />
              <ReferenceLine y={80} stroke={COLORS.diastolic} strokeDasharray="3 6" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke={COLORS.systolic}
                strokeWidth={2}
                dot={{ fill: COLORS.systolic, r: 2 }}
                name="Systolic"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke={COLORS.diastolic}
                strokeWidth={2}
                dot={{ fill: COLORS.diastolic, r: 2 }}
                name="Diastolic"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle row: Morning vs Evening + Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning vs Evening */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Morning vs Evening Average</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={morningEveningData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} domain={[0, 160]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="systolic" fill={COLORS.systolic} name="Systolic" radius={[4, 4, 0, 0]} />
                <Bar dataKey="diastolic" fill={COLORS.diastolic} name="Diastolic" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification Pie */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">AHA Classification Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-sm">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: classificationColor(d.name) }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pulse Trend */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Pulse Rate Trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pulseChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="pulse"
                stroke={COLORS.pulse}
                strokeWidth={2}
                dot={{ fill: COLORS.pulse, r: 2 }}
                name="Pulse (bpm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Readings Table */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">All Readings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-2 text-[var(--muted)]">Date</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Systolic</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Diastolic</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Pulse</th>
                <th className="text-left py-2 px-2 text-[var(--muted)]">Time</th>
                <th className="text-left py-2 px-2 text-[var(--muted)]">Classification</th>
                <th className="text-center py-2 px-2 text-[var(--muted)]">IHB</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 px-2">{formatDateTime(r.date)}</td>
                  <td className="text-right py-2 px-2 font-medium" style={{ color: COLORS.systolic }}>{r.sys}</td>
                  <td className="text-right py-2 px-2 font-medium" style={{ color: COLORS.diastolic }}>{r.dia}</td>
                  <td className="text-right py-2 px-2">{r.pul}</td>
                  <td className="py-2 px-2 capitalize">{r.time_of_day}</td>
                  <td className="py-2 px-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: classificationColor(r.classification) + "22", color: classificationColor(r.classification) }}
                    >
                      {r.classification}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    {r.irregular_heartbeat === "True" && (
                      <span className="text-[var(--warning)]" title="Irregular heartbeat detected">⚠</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
