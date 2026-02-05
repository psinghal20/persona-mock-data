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
  ComposedChart,
  Area,
} from "recharts";
import { HealthcareServerIndex } from "@/types";

interface RenphoDashboardProps {
  data: HealthcareServerIndex;
}

interface Measurement {
  id: string;
  date: string;
  timestamp: string;
  weight: number;
  bmi: number;
  body_fat: number;
  muscle_mass: number;
  water_percentage: number;
  bone_mass: number;
  visceral_fat: number;
  metabolic_age: number;
  bmr: number;
}

const COLORS = {
  weight: "#3b82f6",
  bodyFat: "#ef4444",
  muscle: "#10b981",
  water: "#06b6d4",
  bmi: "#8b5cf6",
  visceral: "#f59e0b",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SummaryCard({
  title,
  value,
  unit,
  trend,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  icon: string;
}) {
  return (
    <div className="card-static p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{title}</p>
          <p className="text-2xl font-bold mt-1" style={color ? { color } : {}}>
            {typeof value === "number" ? value.toLocaleString() : value}
            {unit && <span className="text-sm font-normal text-[var(--muted)] ml-1">{unit}</span>}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
              {trend.isPositive ? "+" : ""}{trend.value.toFixed(1)} from first
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function MetricGauge({ label, value, unit, min, max, color }: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-[var(--muted)]">{label}</span>
        <span className="font-medium">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function RenphoDashboard({ data }: RenphoDashboardProps) {
  // Extract measurements
  const measurements = (data.categories.find((c) => c.id === "measurements")?.items || []) as unknown as Measurement[];

  // Sort by date (oldest first for charts)
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get latest and first measurements for comparison
  const latest = measurements[0];
  const oldest = sortedMeasurements[0];

  // Calculate trends
  const weightTrend = latest && oldest ? {
    value: latest.weight - oldest.weight,
    isPositive: latest.weight < oldest.weight, // For weight, lower is usually better
  } : undefined;

  const bodyFatTrend = latest && oldest ? {
    value: latest.body_fat - oldest.body_fat,
    isPositive: latest.body_fat < oldest.body_fat,
  } : undefined;

  const muscleTrend = latest && oldest ? {
    value: latest.muscle_mass - oldest.muscle_mass,
    isPositive: latest.muscle_mass > oldest.muscle_mass,
  } : undefined;

  // Prepare chart data
  const weightChartData = sortedMeasurements.map((m) => ({
    date: formatDate(m.date),
    weight: m.weight,
    bmi: m.bmi,
  }));

  const bodyCompChartData = sortedMeasurements.map((m) => ({
    date: formatDate(m.date),
    bodyFat: m.body_fat,
    muscle: m.muscle_mass,
    water: m.water_percentage,
  }));

  const visceralChartData = sortedMeasurements.map((m) => ({
    date: formatDate(m.date),
    visceral: m.visceral_fat,
    metabolicAge: m.metabolic_age,
    bmr: m.bmr,
  }));

  if (!latest) {
    return (
      <div className="card-static p-8 text-center">
        <p className="text-[var(--muted)]">No measurements available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard
          title="Weight"
          value={latest.weight.toFixed(1)}
          unit="kg"
          trend={weightTrend}
          icon="⚖️"
          color={COLORS.weight}
        />
        <SummaryCard
          title="BMI"
          value={latest.bmi.toFixed(1)}
          icon="📊"
          color={COLORS.bmi}
        />
        <SummaryCard
          title="Body Fat"
          value={latest.body_fat.toFixed(1)}
          unit="%"
          trend={bodyFatTrend}
          icon="📉"
          color={COLORS.bodyFat}
        />
        <SummaryCard
          title="Muscle Mass"
          value={latest.muscle_mass.toFixed(1)}
          unit="kg"
          trend={muscleTrend}
          icon="💪"
          color={COLORS.muscle}
        />
        <SummaryCard
          title="Metabolic Age"
          value={latest.metabolic_age}
          unit="yrs"
          icon="🎂"
        />
        <SummaryCard
          title="BMR"
          value={latest.bmr}
          unit="kcal"
          icon="🔥"
        />
      </div>

      {/* Latest Measurement Details */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Latest Measurement ({formatDate(latest.date)})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricGauge label="Body Fat" value={latest.body_fat} unit="%" min={10} max={40} color={COLORS.bodyFat} />
          <MetricGauge label="Muscle Mass" value={latest.muscle_mass} unit="kg" min={20} max={40} color={COLORS.muscle} />
          <MetricGauge label="Water" value={latest.water_percentage} unit="%" min={40} max={70} color={COLORS.water} />
          <MetricGauge label="BMI" value={latest.bmi} unit="" min={15} max={35} color={COLORS.bmi} />
          <MetricGauge label="Visceral Fat" value={latest.visceral_fat} unit="" min={1} max={15} color={COLORS.visceral} />
          <MetricGauge label="Bone Mass" value={latest.bone_mass} unit="kg" min={1} max={4} color="#94a3b8" />
        </div>
      </div>

      {/* Weight & BMI Trend */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Weight & BMI Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="weight"
                stroke={COLORS.weight}
                fill={COLORS.weight}
                fillOpacity={0.2}
                name="Weight (kg)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bmi"
                stroke={COLORS.bmi}
                strokeWidth={2}
                dot={{ fill: COLORS.bmi, strokeWidth: 2 }}
                name="BMI"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Body Composition Trend */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Body Composition Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bodyCompChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke={COLORS.bodyFat}
                strokeWidth={2}
                dot={{ fill: COLORS.bodyFat, strokeWidth: 2 }}
                name="Body Fat %"
              />
              <Line
                type="monotone"
                dataKey="muscle"
                stroke={COLORS.muscle}
                strokeWidth={2}
                dot={{ fill: COLORS.muscle, strokeWidth: 2 }}
                name="Muscle Mass (kg)"
              />
              <Line
                type="monotone"
                dataKey="water"
                stroke={COLORS.water}
                strokeWidth={2}
                dot={{ fill: COLORS.water, strokeWidth: 2 }}
                name="Water %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metabolic Metrics Trend */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Metabolic Metrics Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visceralChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 50", "dataMax + 50"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="visceral"
                stroke={COLORS.visceral}
                strokeWidth={2}
                name="Visceral Fat"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="metabolicAge"
                stroke={COLORS.bmi}
                strokeWidth={2}
                name="Metabolic Age"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bmr"
                stroke={COLORS.muscle}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="BMR (kcal)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Measurements Table */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">All Measurements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-2 text-[var(--muted)]">Date</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Weight</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">BMI</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Body Fat</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Muscle</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Water</th>
                <th className="text-right py-2 px-2 text-[var(--muted)]">Visceral</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m, index) => (
                <tr key={index} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 px-2">{formatDate(m.date)}</td>
                  <td className="text-right py-2 px-2">{m.weight.toFixed(1)} kg</td>
                  <td className="text-right py-2 px-2">{m.bmi.toFixed(1)}</td>
                  <td className="text-right py-2 px-2">{m.body_fat.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2">{m.muscle_mass.toFixed(1)} kg</td>
                  <td className="text-right py-2 px-2">{m.water_percentage.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2">{m.visceral_fat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
