
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { FormattedCurrency } from './FormattedCurrency';

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export function BalanceCard({ totalIncome, totalExpenses }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses;
  const balanceColor = balance >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
        <Scale className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${balanceColor}`}>
          <FormattedCurrency value={balance} />
        </div>
      </CardContent>
    </Card>
  );
}
