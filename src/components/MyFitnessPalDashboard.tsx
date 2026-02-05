"use client";

import {
  BarChart,
  Bar,
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

interface MyFitnessPalDashboardProps {
  data: HealthcareServerIndex;
}

interface Meal {
  meal_type: string;
  food_name: string;
  servings: number;
  calories: number;
}

interface FoodLog {
  id: string;
  date: string;
  total_calories: number;
  meal_count: number;
  meals: Meal[];
}

interface ExerciseLog {
  id: string;
  log_date: string;
  exercise_id: string;
  duration_minutes: string;
  calories_burned: string;
  notes: string;
  logged_at: string;
}

interface WaterLog {
  id: string;
  log_date: string;
  amount_ml: string;
  logged_at: string;
}

const COLORS = {
  breakfast: "#f59e0b",
  lunch: "#3b82f6",
  dinner: "#8b5cf6",
  snacks: "#10b981",
  water: "#06b6d4",
  exercise: "#ef4444",
  calories: "#f97316",
};

const MEAL_COLORS: Record<string, string> = {
  Breakfast: COLORS.breakfast,
  Lunch: COLORS.lunch,
  Dinner: COLORS.dinner,
  Snacks: COLORS.snacks,
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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

export default function MyFitnessPalDashboard({ data }: MyFitnessPalDashboardProps) {
  // Extract data from categories
  const foodLogs = (data.categories.find((c) => c.id === "food_logs")?.items || []) as unknown as FoodLog[];
  const exerciseLogs = (data.categories.find((c) => c.id === "exercise_logs")?.items || []) as unknown as ExerciseLog[];
  const waterLogs = (data.categories.find((c) => c.id === "water_logs")?.items || []) as unknown as WaterLog[];

  // Group water logs by date
  const waterByDate: Record<string, number> = {};
  waterLogs.forEach((log) => {
    waterByDate[log.log_date] = (waterByDate[log.log_date] || 0) + parseInt(log.amount_ml);
  });

  // Calculate summary metrics
  const totalMealsLogged = foodLogs.reduce((sum, f) => sum + f.meal_count, 0);
  const totalExercises = exerciseLogs.length;
  const totalCaloriesBurned = exerciseLogs.reduce((sum, e) => sum + parseInt(e.calories_burned), 0);
  const avgWater = Object.values(waterByDate).length > 0
    ? Math.round(Object.values(waterByDate).reduce((a, b) => a + b, 0) / Object.values(waterByDate).length)
    : 0;

  // Prepare meal breakdown for pie chart
  const mealBreakdown: Record<string, number> = { Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 };
  foodLogs.forEach((log) => {
    log.meals.forEach((meal) => {
      if (mealBreakdown[meal.meal_type] !== undefined) {
        mealBreakdown[meal.meal_type]++;
      }
    });
  });
  const mealPieData = Object.entries(mealBreakdown)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  // Prepare water chart data
  const waterChartData = Object.entries(waterByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, amount]) => ({
      date: formatDate(date),
      water: amount,
      goal: 2500,
    }));

  // Prepare exercise chart data
  const exerciseByDate: Record<string, { duration: number; calories: number }> = {};
  exerciseLogs.forEach((log) => {
    if (!exerciseByDate[log.log_date]) {
      exerciseByDate[log.log_date] = { duration: 0, calories: 0 };
    }
    exerciseByDate[log.log_date].duration += parseInt(log.duration_minutes);
    exerciseByDate[log.log_date].calories += parseInt(log.calories_burned);
  });
  const exerciseChartData = Object.entries(exerciseByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => ({
      date: formatDate(date),
      duration: data.duration,
      calories: data.calories,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Meals Logged" value={totalMealsLogged} icon="🍽️" />
        <SummaryCard title="Exercises" value={totalExercises} icon="🏃" color={COLORS.exercise} />
        <SummaryCard title="Calories Burned" value={totalCaloriesBurned} unit="kcal" icon="🔥" color={COLORS.calories} />
        <SummaryCard title="Avg Water/Day" value={avgWater} unit="ml" icon="💧" color={COLORS.water} />
      </div>

      {/* Meal Type Breakdown */}
      {mealPieData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Meals by Type</h3>
          <div className="flex items-center justify-center">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mealPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {mealPieData.map((entry) => (
                      <Cell key={entry.name} fill={MEAL_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-4 space-y-2">
              {mealPieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: MEAL_COLORS[entry.name] }}
                  />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Water Intake Chart */}
      {waterChartData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Daily Water Intake</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterChartData}>
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
                <Bar dataKey="water" fill={COLORS.water} name="Water (ml)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="goal" fill="var(--border)" name="Goal" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Exercise Chart */}
      {exerciseChartData.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Exercise Summary</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exerciseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="duration" fill={COLORS.exercise} name="Duration (min)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="calories" fill={COLORS.calories} name="Calories Burned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Food Logs */}
      {foodLogs.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">Food Logs</h3>
          <div className="space-y-4">
            {foodLogs.map((log, logIndex) => (
              <div key={logIndex} className="border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{formatDate(log.date)}</h4>
                  <span className="text-sm text-[var(--muted)]">{log.meal_count} items logged</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {["Breakfast", "Lunch", "Dinner", "Snacks"].map((mealType) => {
                    const meals = log.meals.filter((m) => m.meal_type === mealType);
                    if (meals.length === 0) return null;
                    return (
                      <div key={mealType}>
                        <div
                          className="text-sm font-medium mb-1 flex items-center gap-1"
                          style={{ color: MEAL_COLORS[mealType] }}
                        >
                          <span>
                            {mealType === "Breakfast" ? "🌅" :
                             mealType === "Lunch" ? "☀️" :
                             mealType === "Dinner" ? "🌙" : "🍿"}
                          </span>
                          {mealType}
                        </div>
                        <ul className="text-sm text-[var(--muted)] space-y-1">
                          {meals.map((meal, i) => (
                            <li key={i}>{meal.food_name} ({meal.servings}x)</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Logs */}
      {exerciseLogs.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">All Exercises</h3>
          <div className="space-y-2">
            {exerciseLogs.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {exercise.notes.toLowerCase().includes("walk") ? "🚶" :
                     exercise.notes.toLowerCase().includes("cycl") ? "🚴" :
                     exercise.notes.toLowerCase().includes("garden") ? "🌱" :
                     exercise.notes.toLowerCase().includes("yoga") ? "🧘" :
                     "🏃"}
                  </span>
                  <div>
                    <div className="font-medium">{exercise.notes}</div>
                    <div className="text-sm text-[var(--muted)]">
                      {formatDate(exercise.log_date)} at {formatTime(exercise.logged_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{exercise.duration_minutes} min</div>
                  <div className="text-sm text-[var(--muted)]">{exercise.calories_burned} cal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water Logs */}
      {waterLogs.length > 0 && (
        <div className="card-static p-4">
          <h3 className="text-lg font-semibold mb-4">All Water Logs</h3>
          <div className="space-y-2">
            {waterLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💧</span>
                  <div>
                    <div className="font-medium">{log.amount_ml} ml</div>
                    <div className="text-sm text-[var(--muted)]">
                      {formatDate(log.log_date)} at {formatTime(log.logged_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
