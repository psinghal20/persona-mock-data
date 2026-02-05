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
  ComposedChart,
} from "recharts";
import { HealthcareServerIndex } from "@/types";

interface GarminDashboardProps {
  data: HealthcareServerIndex;
}

interface DailyStats {
  id: string;
  date: string;
  steps: number;
  distance_meters: number;
  calories_total: number;
  calories_active: number;
  floors_climbed: number;
  intensity_minutes: number;
}

interface SleepData {
  id: string;
  date: string;
  sleep_score: number;
}

interface BodyBattery {
  id: string;
  date: string;
  charged: number;
  drained: number;
}

interface HeartRateData {
  id: string;
  date: string;
  resting_hr: string;
  min_hr: string;
  max_hr: string;
  avg_hr: string;
}

interface HRVData {
  id: string;
  date: string;
  hrv_weekly_avg: string;
  hrv_last_night: string;
  hrv_status: string;
}

interface SpO2Data {
  id: string;
  date: string;
  avg_spo2: string;
  min_spo2: string;
  max_spo2: string;
}

interface BodyComposition {
  id: string;
  date: string;
  weight_kg: string;
  bmi: string;
  body_fat_percent: string;
  muscle_mass_kg: string;
}

interface Activity {
  activity_id: string;
  activity_type: string;
  activity_name: string;
  start_time: string;
  duration_seconds: string;
  calories: string;
  distance_meters: string;
  avg_hr: string;
}

const COLORS = {
  steps: "#3b82f6",
  sleepScore: "#6366f1",
  bodyBattery: "#10b981",
  heartRate: "#ef4444",
  hrv: "#8b5cf6",
  spo2: "#06b6d4",
  calories: "#f59e0b",
  charged: "#10b981",
  drained: "#ef4444",
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
  color,
  icon,
}: {
  title: string;
  value: string | number;
  unit?: string;
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
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function GarminDashboard({ data }: GarminDashboardProps) {
  // Extract data from categories
  const dailyStats = (data.categories.find((c) => c.id === "daily_stats")?.items || []) as unknown as DailyStats[];
  const sleepData = (data.categories.find((c) => c.id === "sleep")?.items || []) as unknown as SleepData[];
  const bodyBattery = (data.categories.find((c) => c.id === "body_battery")?.items || []) as unknown as BodyBattery[];
  const heartRateData = (data.categories.find((c) => c.id === "heart_rate")?.items || []) as unknown as HeartRateData[];
  const hrvData = (data.categories.find((c) => c.id === "hrv")?.items || []) as unknown as HRVData[];
  const spo2Data = (data.categories.find((c) => c.id === "spo2")?.items || []) as unknown as SpO2Data[];
  const bodyComposition = (data.categories.find((c) => c.id === "body_composition")?.items || []) as unknown as BodyComposition[];
  const activities = (data.categories.find((c) => c.id === "activities")?.items || []) as unknown as Activity[];

  // Sort by date (oldest first for charts)
  const sortedDailyStats = [...dailyStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedSleepData = [...sleepData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedBodyBattery = [...bodyBattery].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedHeartRate = [...heartRateData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedHRV = [...hrvData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedBodyComp = [...bodyComposition].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate summary metrics
  const avgSteps = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.steps, 0) / dailyStats.length)
    : 0;
  const avgSleepScore = sleepData.length > 0
    ? Math.round(sleepData.reduce((sum, d) => sum + d.sleep_score, 0) / sleepData.length)
    : 0;
  const avgRestingHR = heartRateData.length > 0
    ? Math.round(heartRateData.reduce((sum, d) => sum + parseInt(d.resting_hr), 0) / heartRateData.length)
    : 0;
  const avgIntensityMinutes = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.intensity_minutes, 0) / dailyStats.length)
    : 0;
  const latestWeight = bodyComposition.length > 0 ? parseFloat(bodyComposition[0].weight_kg) : 0;
  const totalActivities = activities.length;

  // Prepare chart data
  const stepsChartData = sortedDailyStats.slice(-14).map((d) => ({
    date: formatDate(d.date),
    steps: d.steps,
    goal: 10000,
  }));

  const sleepScoreChartData = sortedSleepData.slice(-14).map((d) => ({
    date: formatDate(d.date),
    score: d.sleep_score,
  }));

  const bodyBatteryChartData = sortedBodyBattery.slice(-14).map((d) => ({
    date: formatDate(d.date),
    charged: d.charged,
    drained: d.drained,
  }));

  const heartRateChartData = sortedHeartRate.slice(-14).map((d) => ({
    date: formatDate(d.date),
    resting: parseInt(d.resting_hr),
    min: parseInt(d.min_hr),
    max: parseInt(d.max_hr),
    avg: parseInt(d.avg_hr),
  }));

  const hrvChartData = sortedHRV.slice(-14).map((d) => ({
    date: formatDate(d.date),
    lastNight: parseFloat(d.hrv_last_night),
    weeklyAvg: parseFloat(d.hrv_weekly_avg),
  }));

  const bodyCompChartData = sortedBodyComp.map((d) => ({
    date: formatDate(d.date),
    weight: parseFloat(d.weight_kg),
    bodyFat: parseFloat(d.body_fat_percent),
    muscle: parseFloat(d.muscle_mass_kg),
  }));

  // Activity breakdown
  const activityCounts: Record<string, number> = {};
  activities.forEach((a) => {
    const type = a.activity_name || a.activity_type;
    activityCounts[type] = (activityCounts[type] || 0) + 1;
  });
  const activityPieData = Object.entries(activityCounts).map(([name, count]) => ({
    name,
    value: count,
  }));
  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard title="Avg Steps/Day" value={avgSteps} icon="👟" color={COLORS.steps} />
        <SummaryCard title="Sleep Score" value={avgSleepScore} icon="😴" color={COLORS.sleepScore} />
        <SummaryCard title="Resting HR" value={avgRestingHR} unit="bpm" icon="❤️" color={COLORS.heartRate} />
        <SummaryCard title="Intensity Min" value={avgIntensityMinutes} unit="/day" icon="🔥" />
        <SummaryCard title="Weight" value={latestWeight.toFixed(1)} unit="kg" icon="⚖️" />
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
                stroke={COLORS.steps}
                fill={COLORS.steps}
                fillOpacity={0.3}
                name="Steps"
              />
              <Line
                type="monotone"
                dataKey="goal"
                stroke={COLORS.bodyBattery}
                strokeDasharray="5 5"
                name="Goal"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Score Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Sleep Score (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepScoreChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="score" fill={COLORS.sleepScore} name="Sleep Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Body Battery Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Body Battery (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bodyBatteryChartData}>
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
                <Bar dataKey="charged" fill={COLORS.charged} name="Charged" radius={[4, 4, 0, 0]} />
                <Bar dataKey="drained" fill={COLORS.drained} name="Drained" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Heart Rate (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={heartRateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="resting" stroke={COLORS.heartRate} strokeWidth={2} name="Resting" dot={false} />
                <Line type="monotone" dataKey="avg" stroke={COLORS.calories} strokeWidth={2} name="Average" dot={false} />
                <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" name="Max" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HRV Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">HRV (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrvChartData}>
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
                <Line type="monotone" dataKey="lastNight" stroke={COLORS.hrv} strokeWidth={2} name="Last Night" />
                <Line type="monotone" dataKey="weeklyAvg" stroke={COLORS.spo2} strokeWidth={2} strokeDasharray="5 5" name="Weekly Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Body Composition Chart */}
      {bodyCompChartData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Body Composition Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bodyCompChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" stroke={COLORS.steps} strokeWidth={2} name="Weight (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke={COLORS.calories} strokeWidth={2} name="Body Fat %" />
                <Line yAxisId="left" type="monotone" dataKey="muscle" stroke={COLORS.bodyBattery} strokeWidth={2} name="Muscle (kg)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

      {/* All Activities List */}
      {activities.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">All Activities</h3>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {activity.activity_type === "cycling" ? "🚴" :
                     activity.activity_type === "walking" ? "🚶" :
                     activity.activity_type === "yoga" ? "🧘" :
                     activity.activity_name.toLowerCase().includes("garden") || activity.activity_name.toLowerCase().includes("yard") || activity.activity_name.toLowerCase().includes("landscap") ? "🌱" :
                     "🏋️"}
                  </span>
                  <div>
                    <div className="font-medium">{activity.activity_name}</div>
                    <div className="text-sm text-[var(--muted)]">{formatDate(activity.start_time)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{Math.round(parseInt(activity.duration_seconds) / 60)} min</div>
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
