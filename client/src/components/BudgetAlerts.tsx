
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { FormattedCurrency } from './FormattedCurrency';

interface BudgetAlertsProps {
  budgets: any[];
  transactions: any[];
}

export function BudgetAlerts({ budgets, transactions }: BudgetAlertsProps) {
  const categoryExpenses = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    return expenses.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {});
  }, [transactions]);

  const budgetAlerts = React.useMemo(() => {
    return budgets
      .map(budget => {
        const spent = categoryExpenses[budget.category] || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        return {
          ...budget,
          spent,
          percentage,
        };
      })
      .filter(budget => budget.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categoryExpenses]);

  const getProgressColor = (percentage) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    return 'bg-yellow-400';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Alertas de Orçamento</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {budgetAlerts.length > 0 ? (
          <div className="space-y-4">
            {budgetAlerts.map(alert => (
              <div key={alert.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{alert.category}</span>
                  <span className={`text-sm font-bold ${alert.percentage > 100 ? 'text-red-400' : ''}`}>
                    {alert.percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={alert.percentage} className="h-2 [&>div]:bg-primary" indicatorClassName={getProgressColor(alert.percentage)} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span><FormattedCurrency value={alert.spent} valueClasses="text-xs" symbolClasses="text-xs" /></span>
                  <span><FormattedCurrency value={alert.amount} valueClasses="text-xs" symbolClasses="text-xs" /></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pt-4">
            <CheckCircle className="h-8 w-8 text-green-400 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento próximo do limite.</p>
            <p className="text-xs text-muted-foreground">Bom trabalho!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
