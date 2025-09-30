
import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MonthlySummaryChart({ transactions }) {
  const monthlyData = React.useMemo(() => {
    const data = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      if (!acc[month]) {
        acc[month] = { name: month, income: 0, expense: 0 };
      }
      acc[month][t.type] += t.amount;
      return acc;
    }, {});

    return Object.values(data).sort((a, b) => {
        const dateA = new Date(`1 ${a.name.replace("'", " 20")}`);
        const dateB = new Date(`1 ${b.name.replace("'", " 20")}`);
        return dateA - dateB;
    }).slice(-6); // Get last 6 months
  }, [transactions]);

  if (monthlyData.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">Nenhuma transação registrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Resumo Mensal (Últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value)} />
              <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
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
