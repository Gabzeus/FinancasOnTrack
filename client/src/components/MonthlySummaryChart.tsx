
import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { format, parseISO } from 'date-fns';

interface MonthlyDataItem {
  name: string;
  income: number;
  expense: number;
  date: Date;
}

export function MonthlySummaryChart({ transactions }) {
  const monthlyData = React.useMemo(() => {
    const data = transactions.reduce((acc, t) => {
      const month = format(parseISO(t.date), 'MMM/yy');
      if (!acc[month]) {
        acc[month] = { name: month, income: 0, expense: 0, date: parseISO(t.date) };
      }
      acc[month][t.type] += t.amount;
      return acc;
    }, {} as Record<string, MonthlyDataItem>);

    return Object.values(data).sort((a: MonthlyDataItem, b: MonthlyDataItem) => a.date.getTime() - b.date.getTime());
  }, [transactions]);

  if (monthlyData.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">Nenhuma transação no período selecionado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Resumo do Período</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value)} />
              <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
              <Legend />
              <Bar dataKey="income" fill="#00C49F" name="Receita" />
              <Bar dataKey="expense" fill="#FF8042" name="Despesa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
