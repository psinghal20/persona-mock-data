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

interface WhoopDashboardProps {
  data: HealthcareServerIndex;
}

interface CycleData {
  id: string;
  date: string;
  strain: number;
  kilojoules: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

interface RecoveryData {
  id: string;
  date: string;
  recovery_score: number;
  resting_heart_rate: number;
  hrv: number;
  spo2: number;
  skin_temp: number;
  state: string;
}

interface SleepData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_nap: boolean;
  respiratory_rate: number;
}

interface WorkoutData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  sport_name: string;
  strain: number;
}

const COLORS = {
  strain: "#ef4444",
  recovery: "#10b981",
  sleep: "#6366f1",
  hrv: "#8b5cf6",
  warning: "#f59e0b",
  primary: "#3b82f6",
};

const RECOVERY_COLORS = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calculateSleepDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10;
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

function RecoveryGauge({ score, state }: { score: number; state: string }) {
  const color = RECOVERY_COLORS[state as keyof typeof RECOVERY_COLORS] || RECOVERY_COLORS.green;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold"
          fill="var(--foreground)"
        >
          {score}%
        </text>
      </svg>
      <span className="text-sm text-[var(--muted)] mt-2 capitalize">{state} Recovery</span>
    </div>
  );
}

export default function WhoopDashboard({ data }: WhoopDashboardProps) {
  // Extract data from categories
  const cycles = (data.categories.find((c) => c.id === "cycles")?.items || []) as unknown as CycleData[];
  const recovery = (data.categories.find((c) => c.id === "recovery")?.items || []) as unknown as RecoveryData[];
  const sleepData = (data.categories.find((c) => c.id === "sleep")?.items || []) as unknown as SleepData[];
  const workouts = (data.categories.find((c) => c.id === "workouts")?.items || []) as unknown as WorkoutData[];

  // Sort by date (oldest first for charts)
  const sortedCycles = [...cycles].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedSleep = [...sleepData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate summary metrics
  const avgStrain = cycles.length > 0
    ? (cycles.reduce((sum, c) => sum + c.strain, 0) / cycles.length).toFixed(1)
    : "0";
  const avgRecovery = recovery.length > 0
    ? Math.round(recovery.reduce((sum, r) => sum + r.recovery_score, 0) / recovery.length)
    : 0;
  const latestRecovery = recovery[0];
  const avgHRV = recovery.length > 0
    ? (recovery.reduce((sum, r) => sum + r.hrv, 0) / recovery.length).toFixed(1)
    : "0";
  const avgSleepHours = sleepData.length > 0
    ? (sleepData.reduce((sum, s) => sum + calculateSleepDuration(s.start_time, s.end_time), 0) / sleepData.length).toFixed(1)
    : "0";
  const totalWorkouts = workouts.length;

  // Prepare chart data
  const strainChartData = sortedCycles.slice(-14).map((c) => ({
    date: formatDate(c.date),
    strain: c.strain,
    kilojoules: Math.round(c.kilojoules / 1000),
  }));

  // Merge recovery data with cycles by matching index (since recovery doesn't have dates)
  const recoveryChartData = sortedCycles.slice(-14).map((c, i) => {
    const recoveryItem = recovery[cycles.length - 1 - i];
    return {
      date: formatDate(c.date),
      recovery: recoveryItem?.recovery_score || 0,
      hrv: recoveryItem?.hrv || 0,
    };
  });

  const sleepChartData = sortedSleep.slice(-14).map((s) => ({
    date: formatDate(s.date),
    duration: calculateSleepDuration(s.start_time, s.end_time),
    respiratoryRate: s.respiratory_rate,
  }));

  // Workout breakdown
  const workoutCounts: Record<string, number> = {};
  workouts.forEach((w) => {
    workoutCounts[w.sport_name] = (workoutCounts[w.sport_name] || 0) + 1;
  });
  const workoutPieData = Object.entries(workoutCounts).map(([name, count]) => ({
    name,
    value: count,
  }));
  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard title="Avg Strain" value={avgStrain} icon="🔥" color={COLORS.strain} />
        <SummaryCard title="Avg Recovery" value={avgRecovery} unit="%" icon="💚" color={COLORS.recovery} />
        <SummaryCard title="Avg HRV" value={avgHRV} unit="ms" icon="💓" color={COLORS.hrv} />
        <SummaryCard title="Avg Sleep" value={avgSleepHours} unit="hrs" icon="😴" />
        <SummaryCard title="Workouts" value={totalWorkouts} icon="🏋️" />
      </div>

      {/* Recovery Gauge and Latest Stats */}
      {latestRecovery && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Latest Recovery</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RecoveryGauge score={latestRecovery.recovery_score} state={latestRecovery.state} />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{latestRecovery.resting_heart_rate}</div>
                <div className="text-sm text-[var(--muted)]">Resting HR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{latestRecovery.hrv.toFixed(1)}</div>
                <div className="text-sm text-[var(--muted)]">HRV (ms)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{latestRecovery.spo2.toFixed(1)}%</div>
                <div className="text-sm text-[var(--muted)]">SpO2</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{latestRecovery.skin_temp.toFixed(1)}</div>
                <div className="text-sm text-[var(--muted)]">Skin Temp</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strain Chart */}
      <div className="card-static p-4">
        <h3 className="text-lg font-semibold mb-4">Daily Strain (Last 14 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={strainChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} domain={[0, 21]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="strain"
                stroke={COLORS.strain}
                fill={COLORS.strain}
                fillOpacity={0.3}
                name="Strain"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery & HRV Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Recovery & HRV (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recoveryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 12 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted)", fontSize: 12 }} />
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
                  dataKey="recovery"
                  stroke={COLORS.recovery}
                  strokeWidth={2}
                  dot={{ fill: COLORS.recovery, strokeWidth: 2 }}
                  name="Recovery %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hrv"
                  stroke={COLORS.hrv}
                  strokeWidth={2}
                  dot={{ fill: COLORS.hrv, strokeWidth: 2 }}
                  name="HRV (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Chart */}
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Sleep Duration (Last 14 Days)</h3>
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
                <Bar dataKey="duration" fill={COLORS.sleep} name="Sleep (hrs)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workout Breakdown */}
      {workoutPieData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Workout Breakdown</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workoutPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {workoutPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {workoutPieData.map((workout, index) => (
                <div key={workout.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-sm">
                    {workout.name}: {workout.value} sessions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Workouts List */}
      {workouts.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">All Workouts</h3>
          <div className="space-y-2">
            {workouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {workout.sport_name.toLowerCase().includes("walk") ? "🚶" :
                     workout.sport_name.toLowerCase().includes("yoga") ? "🧘" :
                     workout.sport_name.toLowerCase().includes("cycling") ? "🚴" :
                     workout.sport_name.toLowerCase().includes("garden") ? "🌱" :
                     workout.sport_name.toLowerCase().includes("run") ? "🏃" :
                     "🏋️"}
                  </span>
                  <div>
                    <div className="font-medium">{workout.sport_name}</div>
                    <div className="text-sm text-[var(--muted)]">{formatDate(workout.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Strain: {workout.strain.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
