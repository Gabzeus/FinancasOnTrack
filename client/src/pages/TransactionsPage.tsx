
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros'];
const expenseCategories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
];
const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState([]);
  const [filters, setFilters] = React.useState({
    description: '',
    type: 'all',
    category: 'all',
  });

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  React.useEffect(() => {
    let result = transactions;
    if (filters.description) {
      result = result.filter(t => t.description.toLowerCase().includes(filters.description.toLowerCase()));
    }
    if (filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }
    setFilteredTransactions(result);
  }, [filters, transactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Transações</h2>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Input
              placeholder="Filtrar por descrição..."
              value={filters.description}
              onChange={(e) => handleFilterChange('description', e.target.value)}
            />
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        t.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
