
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, BellRing } from 'lucide-react';
import { FormattedCurrency } from './FormattedCurrency';

interface UpcomingBillsProps {
  recurringTransactions: any[];
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  });
};

const getDaysUntilDue = (dueDate: Date) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setUTCHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function UpcomingBills({ recurringTransactions }: UpcomingBillsProps) {
  const upcomingBills = React.useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);

    return recurringTransactions
      .filter(t => t.type === 'expense')
      .map(t => ({ ...t, dueDate: new Date(t.start_date) }))
      .filter(t => {
        const dueDate = new Date(t.start_date);
        dueDate.setUTCHours(12,0,0,0); // Avoid timezone issues
        return dueDate >= today && dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [recurringTransactions]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Contas a Vencer</CardTitle>
        <BellRing className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {upcomingBills.length > 0 ? (
          <div className="space-y-4">
            {upcomingBills.slice(0, 5).map(bill => {
              const daysUntilDue = getDaysUntilDue(bill.dueDate);
              let urgencyColor = 'text-muted-foreground';
              if (daysUntilDue <= 3) urgencyColor = 'text-red-400';
              else if (daysUntilDue <= 7) urgencyColor = 'text-orange-400';

              return (
                <div key={bill.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none">{bill.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(bill.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium"><FormattedCurrency value={bill.amount} valueClasses="text-sm" symbolClasses="text-xs" /></p>
                    <p className={`text-xs ${urgencyColor}`}>
                      {daysUntilDue === 0 ? 'Vence hoje' : `Vence em ${daysUntilDue} dia(s)`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pt-4">
            <CalendarClock className="h-8 w-8 text-green-400 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conta a vencer nos próximos 30 dias.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
