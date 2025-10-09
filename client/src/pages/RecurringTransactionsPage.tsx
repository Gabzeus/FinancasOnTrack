
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { MoreHorizontal, Pencil, PlusCircle, Trash2, Repeat } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddRecurringTransactionForm } from '@/components/AddRecurringTransactionForm';
import { apiFetch } from '@/lib/api';
import { FormattedCurrency } from '@/components/FormattedCurrency';

const frequencyMap = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

export default function RecurringTransactionsPage() {
  const [recurring, setRecurring] = React.useState([]);
  const [creditCards, setCreditCards] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState(null);
  const [itemToDelete, setItemToDelete] = React.useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const fetchData = async () => {
    try {
      const [recurringRes, cardsRes] = await Promise.all([
        apiFetch('/api/recurring-transactions'),
        apiFetch('/api/credit-cards'),
      ]);
      if (!recurringRes.ok || !cardsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      const recurringData = await recurringRes.json();
      const cardsData = await cardsRes.json();
      setRecurring(recurringData);
      setCreditCards(cardsData);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = (savedItem) => {
    setRecurring(prev =>
      [...prev.filter(t => t.id !== savedItem.id), savedItem]
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    );
  };

  const handleAddClick = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await apiFetch(`/api/recurring-transactions/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete recurring transaction');
      }
      setRecurring(prev => prev.filter(t => t.id !== itemToDelete.id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete recurring transaction.');
    } finally {
      setIsDeleteAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Transações Recorrentes</h2>
        <div className="flex items-center space-x-2">
           <Button className="bg-primary hover:bg-primary/90" onClick={handleAddClick}>
              <PlusCircle className="mr-2" />
              Nova Recorrência
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurring.length > 0 ? (
                  recurring.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </TableCell>
                      <TableCell>{frequencyMap[item.frequency]}</TableCell>
                      <TableCell>{formatDate(item.start_date)}</TableCell>
                      <TableCell
                        className={`font-medium ${
                          item.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'} <FormattedCurrency value={item.amount} valueClasses="text-sm" symbolClasses="text-xs" />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-red-500 focus:text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <Repeat className="h-12 w-12 text-muted-foreground mb-2" />
                        Nenhuma transação recorrente encontrada.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddRecurringTransactionForm
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onFormSubmit={handleFormSubmit}
        itemToEdit={itemToEdit}
        creditCards={creditCards}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação recorrente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
