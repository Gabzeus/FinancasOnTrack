
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
import { DollarSign, CreditCard, Activity, PlusCircle } from 'lucide-react';
import { ExpenseChart } from '@/components/ExpenseChart';
import { MonthlySummaryChart } from '@/components/MonthlySummaryChart';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [transactions, setTransactions] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFormSubmit = (savedTransaction) => {
    // This handles both add and edit, but on dashboard we only add
    setTransactions(prev => 
      [...prev.filter(t => t.id !== savedTransaction.id), savedTransaction]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  };

  const { totalIncome, totalExpenses, balance } = React.useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2" />
              Adicionar Transação
            </Button>
            <AddTransactionForm 
              open={isFormOpen}
              setOpen={setIsFormOpen}
              onFormSubmit={handleFormSubmit}
              transactionToEdit={null}
            />
        </div>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  balance >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatCurrency(balance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{transactions.length}</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4 grid gap-4">
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
                                <TableCell>{t.description}</TableCell>
                                <TableCell className="hidden sm:table-cell">{t.category}</TableCell>
                                <TableCell className="hidden sm:table-cell">{formatDate(t.date)}</TableCell>
                                <TableCell
                                    className={`text-right font-medium ${
                                    t.type === 'income'
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                    }`}
                                >
                                    {t.type === 'income' ? '+' : '-'}{' '}
                                    {formatCurrency(t.amount)}
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
            <div className="lg:col-span-3">
                <ExpenseChart transactions={transactions} />
            </div>
        </div>
      </div>
    </div>
  );
}
