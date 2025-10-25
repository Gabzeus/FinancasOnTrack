
import * as React from 'react';
import { AddTransactionForm } from '@/components/AddTransactionForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, CreditCard, PlusCircle } from 'lucide-react';
import { ExpenseChart } from '@/components/ExpenseChart';
import { MonthlySummaryChart } from '@/components/MonthlySummaryChart';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BalanceCard } from '@/components/BalanceCard';
import { UpcomingBills } from '@/components/UpcomingBills';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FormattedCurrency } from '@/components/FormattedCurrency';
import { Progress } from '@/components/ui/progress';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const [transactions, setTransactions] = React.useState([]);
  const [creditCards, setCreditCards] = React.useState([]);
  const [goals, setGoals] = React.useState([]);
  const [recurring, setRecurring] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchData = async () => {
    try {
      const [transactionsRes, cardsRes, goalsRes, recurringRes] = await Promise.all([
        apiFetch('/api/transactions'),
        apiFetch('/api/credit-cards'),
        apiFetch('/api/goals'),
        apiFetch('/api/recurring-transactions'),
      ]);
      if (!transactionsRes.ok || !cardsRes.ok || !goalsRes.ok || !recurringRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const transactionsData = await transactionsRes.json();
      const cardsData = await cardsRes.json();
      const goalsData = await goalsRes.json();
      const recurringData = await recurringRes.json();

      setTransactions(transactionsData);
      setCreditCards(cardsData);
      setGoals(goalsData);
      setRecurring(recurringData);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setUTCDate(today.getUTCDate() + 3);

    const dueSoonBills = recurring
        .filter(t => t.type === 'expense')
        .filter(t => {
            const dueDate = new Date(t.start_date);
            dueDate.setUTCHours(12,0,0,0);
            return dueDate >= today && dueDate <= threeDaysFromNow;
        });

    if (dueSoonBills.length > 0) {
        const billDescriptions = dueSoonBills.map(b => b.description).join(', ');
        toast({
            title: 'Alerta de Contas a Vencer!',
            description: `Você tem ${dueSoonBills.length} conta(s) vencendo em breve: ${billDescriptions}.`,
            variant: 'destructive',
        });
    }

    creditCards.forEach(card => {
      const percentage = card.limit_amount > 0 ? (card.spent / card.limit_amount) * 100 : 0;
      if (percentage >= 90) {
        toast({
          title: `Alerta de Limite: ${card.name}`,
          description: `Você utilizou ${percentage.toFixed(0)}% do seu limite.`,
          variant: percentage >= 100 ? 'destructive' : 'default',
        });
      }
    });

  }, [recurring, creditCards, toast]);

  const handleFormSubmit = (savedTransaction) => {
    fetchData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  };

  const filteredTransactions = React.useMemo(() => {
    if (!dateRange?.from) {
      return transactions;
    }
    const toDate = dateRange.to ?? dateRange.from;
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setUTCHours(0,0,0,0);
      return transactionDate >= dateRange.from! && transactionDate <= toDate;
    });
  }, [transactions, dateRange]);

  const { totalIncome, totalExpenses, cardExpenses } = React.useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = filteredTransactions.filter((t) => t.type === 'expense');
      
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);

    const cardExpenses = expenses
      .filter(t => t.credit_card_id !== null)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: totalExpenses,
      cardExpenses,
    };
  }, [filteredTransactions]);

  const getProgressColor = (percentage) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <DateRangePicker date={dateRange} setDate={setDateRange} />
           <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2" />
              Adicionar Transação
            </Button>
            <AddTransactionForm 
              open={isFormOpen}
              setOpen={setIsFormOpen}
              onFormSubmit={handleFormSubmit}
              transactionToEdit={null}
              creditCards={creditCards}
              goals={goals}
            />
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <BalanceCard totalIncome={totalIncome} totalExpenses={totalExpenses} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                <FormattedCurrency value={totalIncome} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesa</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                <FormattedCurrency value={totalExpenses} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas (Cartão)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                <FormattedCurrency value={cardExpenses} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-4">
                <MonthlySummaryChart transactions={filteredTransactions} />
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Transações Recentes</CardTitle>
                        <Button asChild variant="link">
                            <Link to="/transactions">Ver todas</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                            <TableHead className="hidden sm:table-cell">Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                            filteredTransactions.slice(0, 5).map((t) => (
                                <TableRow key={t.id}>
                                <TableCell>
                                  <div>{t.description}</div>
                                  {t.credit_card_name && <div className="text-xs text-muted-foreground">{t.credit_card_name}</div>}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{t.category}</TableCell>
                                <TableCell className="hidden sm:table-cell">{formatDate(t.date)}</TableCell>
                                <TableCell
                                    className={`text-right font-medium ${
                                    t.type === 'income'
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }`}
                                >
                                    {t.type === 'income' ? '+' : '-'}{' '}
                                    <FormattedCurrency value={t.amount} valueClasses="text-sm" symbolClasses="text-xs" />
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                Nenhuma transação encontrada no período.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
                <UpcomingBills recurringTransactions={recurring} />
                <Card>
                    <CardHeader>
                        <CardTitle>Limites de Cartão</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {creditCards.length > 0 ? creditCards.map(card => {
                            const percentage = card.limit_amount > 0 ? (card.spent / card.limit_amount) * 100 : 0;
                            return (
                                <div key={card.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">{card.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            <FormattedCurrency value={card.spent} /> / <FormattedCurrency value={card.limit_amount} />
                                        </span>
                                    </div>
                                    <Progress value={percentage} className="h-3" indicatorClassName={getProgressColor(percentage)} />
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cartão de crédito cadastrado.</p>
                        )}
                    </CardContent>
                </Card>
                <ExpenseChart transactions={filteredTransactions} />
            </div>
        </div>
      </div>
    </div>
  );
}
