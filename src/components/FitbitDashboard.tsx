"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { HealthcareServerIndex } from "@/types";

interface FitbitDashboardProps {
  data: HealthcareServerIndex;
}

interface DailyStats {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  active_minutes: number;
  floors: number;
  resting_heart_rate: number;
}

interface SleepData {
  date: string;
  duration_hours: number;
  efficiency: number;
  deep_minutes: number;
  light_minutes: number;
  rem_minutes: number;
  awake_minutes: number;
}

interface Activity {
  activity_name: string;
  duration_minutes: string;
  calories: string;
  date: string;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  deep: "#6366f1",
  light: "#a5b4fc",
  rem: "#c084fc",
  awake: "#f87171",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SummaryCard({
  title,
  value,
  unit,
  trend,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; isPositive: boolean };
  icon: string;
}) {
  return (
    <div className="card-static p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
            {unit && <span className="text-sm font-normal text-[var(--muted)] ml-1">{unit}</span>}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}% vs last week
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function FitbitDashboard({ data }: FitbitDashboardProps) {
  // Extract data from categories
  const dailyStats = (data.categories.find((c) => c.id === "daily_stats")?.items || []) as unknown as DailyStats[];
  const sleepData = (data.categories.find((c) => c.id === "sleep")?.items || []) as unknown as SleepData[];
  const activities = (data.categories.find((c) => c.id === "activities")?.items || []) as unknown as Activity[];
  const heartRateData = data.categories.find((c) => c.id === "heart_rate")?.items || [];

  // Sort by date (oldest first for charts)
  const sortedDailyStats = [...dailyStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedSleepData = [...sleepData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate summary metrics
  const avgSteps = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.steps, 0) / dailyStats.length)
    : 0;
  const avgSleep = sleepData.length > 0
    ? (sleepData.reduce((sum, d) => sum + d.duration_hours, 0) / sleepData.length).toFixed(1)
    : "0";
  const avgRestingHR = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.resting_heart_rate, 0) / dailyStats.length)
    : 0;
  const totalActivities = activities.length;
  const avgActiveMinutes = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.active_minutes, 0) / dailyStats.length)
    : 0;

  // Prepare chart data
  const stepsChartData = sortedDailyStats.slice(-14).map((d) => ({
    date: formatDate(d.date),
    steps: d.steps,
    goal: 10000,
  }));

  const sleepChartData = sortedSleepData.slice(-14).map((d) => ({
    date: formatDate(d.date),
    deep: Math.round(d.deep_minutes / 60 * 10) / 10,
    light: Math.round(d.light_minutes / 60 * 10) / 10,
    rem: Math.round(d.rem_minutes / 60 * 10) / 10,
    awake: Math.round(d.awake_minutes / 60 * 10) / 10,
    total: d.duration_hours,
  }));

  const hrChartData = sortedDailyStats.slice(-14).map((d) => ({
    date: formatDate(d.date),
    hr: d.resting_heart_rate,
  }));

  // Activity breakdown
  const activityCounts: Record<string, number> = {};
  activities.forEach((a) => {
    activityCounts[a.activity_name] = (activityCounts[a.activity_name] || 0) + 1;
  });
  const activityPieData = Object.entries(activityCounts).map(([name, count]) => ({
    name,
    value: count,
  }));
  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard title="Avg Steps/Day" value={avgSteps} icon="👟" />
        <SummaryCard title="Avg Sleep" value={avgSleep} unit="hrs" icon="😴" />
        <SummaryCard title="Resting HR" value={avgRestingHR} unit="bpm" icon="❤️" />
        <SummaryCard title="Active Minutes" value={avgActiveMinutes} unit="/day" icon="🏃" />
        <SummaryCard title="Activities" value={totalActivities} icon="🎯" />
      </div>

      {/* Steps Chart */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Daily Steps (Last 14 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stepsChartData}>
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
              <Area
                type="monotone"
                dataKey="steps"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
                name="Steps"
              />
              <Line
                type="monotone"
                dataKey="goal"
                stroke={COLORS.success}
                strokeDasharray="5 5"
                name="Goal"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Sleep Stages (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="deep" stackId="a" fill={COLORS.deep} name="Deep" />
                <Bar dataKey="rem" stackId="a" fill={COLORS.rem} name="REM" />
                <Bar dataKey="light" stackId="a" fill={COLORS.light} name="Light" />
                <Bar dataKey="awake" stackId="a" fill={COLORS.awake} name="Awake" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heart Rate Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Resting Heart Rate (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "var(--muted)", fontSize: 12 }} unit=" bpm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hr"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={{ fill: COLORS.danger, strokeWidth: 2 }}
                  name="Resting HR"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      {activityPieData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Activity Breakdown</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {activityPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {activityPieData.map((activity, index) => (
                <div key={activity.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-sm">
                    {activity.name}: {activity.value} sessions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {activities.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">All Activities</h3>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {activity.activity_name.toLowerCase().includes("run") ? "🏃" :
                     activity.activity_name.toLowerCase().includes("walk") ? "🚶" :
                     activity.activity_name.toLowerCase().includes("yoga") ? "🧘" :
                     activity.activity_name.toLowerCase().includes("cycling") || activity.activity_name.toLowerCase().includes("bike") ? "🚴" :
                     activity.activity_name.toLowerCase().includes("swim") ? "🏊" :
                     activity.activity_name.toLowerCase().includes("weight") || activity.activity_name.toLowerCase().includes("strength") ? "🏋️" :
                     "🎯"}
                  </span>
                  <div>
                    <div className="font-medium">{activity.activity_name}</div>
                    <div className="text-sm text-[var(--muted)]">{formatDate(activity.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{activity.duration_minutes} min</div>
                  <div className="text-sm text-[var(--muted)]">{activity.calories} cal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
