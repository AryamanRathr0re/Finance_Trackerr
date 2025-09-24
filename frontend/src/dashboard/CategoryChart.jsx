import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
];

export function CategoryChart({ transactions }) {
  const data = useMemo(() => {
    const totals = new Map();
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      const key = t.category || "Uncategorized";
      const current = totals.get(key) || 0;
      totals.set(key, current + Math.abs(t.amount));
    }
    return Array.from(totals.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-4">
      <h3 className="text-sm font-medium text-zinc-700 mb-2">
        Expenses by Category
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}








