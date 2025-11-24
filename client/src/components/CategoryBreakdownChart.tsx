import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B88B",
  "#ABEBC6"
];

export function CategoryBreakdownChart({ data, isLoading = false }: CategoryBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Nenhuma transação neste período</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="total"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => `R$ ${value.toFixed(2)}`}
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
