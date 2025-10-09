
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
import { DollarSign, CreditCard, Wallet, PlusCircle } from 'lucide-react';
import { ExpenseChart } from '@/components/ExpenseChart';
import { MonthlySummaryChart } from '@/components/MonthlySummaryChart';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BalanceCard } from '@/components/BalanceCard';
import { BudgetAlerts } from '@/components/BudgetAlerts';
import { UpcomingBills } from '@/components/UpcomingBills';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FormattedCurrency } from '@/components/FormattedCurrency';

export default function Dashboard() {
  const [transactions, setTransactions] = React.useState([]);
  const [creditCards, setCreditCards] = React.useState([]);
  const [goals, setGoals] = React.useState([]);
  const [budgets, setBudgets] = React.useState([]);
  const [recurring, setRecurring] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [transactionsRes, cardsRes, goalsRes, budgetsRes, recurringRes] = await Promise.all([
        apiFetch('/api/transactions'),
        apiFetch('/api/credit-cards'),
        apiFetch('/api/goals'),
        apiFetch(`/api/budgets/${year}/${month}`),
        apiFetch('/api/recurring-transactions'),
      ]);
      if (!transactionsRes.ok || !cardsRes.ok || !goalsRes.ok || !budgetsRes.ok || !recurringRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const transactionsData = await transactionsRes.json();
      const cardsData = await cardsRes.json();
      const goalsData = await goalsRes.json();
      const budgetsData = await budgetsRes.json();
      const recurringData = await recurringRes.json();

      setTransactions(transactionsData);
      setCreditCards(cardsData);
      setGoals(goalsData);
      setBudgets(budgetsData);
      setRecurring(recurringData);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    if (recurring.length > 0) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setUTCDate(today.getUTCDate() + 3);

        const dueSoon = recurring
            .filter(t => t.type === 'expense')
            .map(t => ({ ...t, dueDate: new Date(t.start_date) }))
            .filter(t => {
                const dueDate = new Date(t.start_date);
                dueDate.setUTCHours(12,0,0,0);
                return dueDate >= today && dueDate <= threeDaysFromNow;
            });

        if (dueSoon.length > 0) {
            const billDescriptions = dueSoon.map(b => b.description).join(', ');
            toast({
                title: 'Alerta de Contas a Vencer!',
                description: `Você tem ${dueSoon.length} conta(s) vencendo em breve: ${billDescriptions}.`,
                variant: 'destructive',
            });
        }
    }
  }, [recurring, toast]);

  const handleFormSubmit = (savedTransaction) => {
    // Refetch all data to ensure consistency, especially for goals and budgets
    fetchData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  };

  const { totalIncome, totalExpenses, cardExpenses } = React.useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense');
      
    const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);

    const cardExpenses = expenses
      .filter(t => t.credit_card_id !== null)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: totalExpenses,
      cardExpenses,
    };
  }, [transactions]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BalanceCard totalIncome={totalIncome} totalExpenses={totalExpenses} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
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
              <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4 grid gap-4 auto-rows-min">
                <MonthlySummaryChart transactions={transactions} />
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
                            {transactions.length > 0 ? (
                            transactions.slice(0, 5).map((t) => (
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
                                Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3 grid gap-4 auto-rows-min">
                <UpcomingBills recurringTransactions={recurring} />
                <BudgetAlerts budgets={budgets} transactions={transactions} />
                <ExpenseChart transactions={transactions} />
            </div>
        </div>
      </div>
    </div>
  );
}
