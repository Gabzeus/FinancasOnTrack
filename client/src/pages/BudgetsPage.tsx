
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { AddBudgetForm } from '@/components/AddBudgetForm';
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
import { buttonVariants } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { FormattedCurrency } from '@/components/FormattedCurrency';

const expenseCategories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [budgetToEdit, setBudgetToEdit] = React.useState(null);
  const [budgetToDelete, setBudgetToDelete] = React.useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const fetchBudgets = async () => {
    const year = currentMonth.getFullYear();
    const month = (currentMonth.getMonth() + 1).toString();
    try {
      const response = await apiFetch(`/api/budgets/${year}/${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  const handleFormSubmit = (savedBudget) => {
    fetchBudgets(); // Refetch all budgets for the month
    setBudgetToEdit(null);
  };

  const handleAddClick = () => {
    setBudgetToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (budget) => {
    setBudgetToEdit(budget);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (budget) => {
    setBudgetToDelete(budget);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      const response = await apiFetch(`/api/budgets/${budgetToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }
      setBudgets(prev => prev.filter(b => b.id !== budgetToDelete.id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete budget.');
    } finally {
      setIsDeleteAlertOpen(false);
      setBudgetToDelete(null);
    }
  };

  const changeMonth = (offset) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Avoid issues with month lengths
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
        <div className="flex items-center space-x-2">
          <Button className="bg-primary hover:bg-primary/90" onClick={handleAddClick}>
            <PlusCircle className="mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-4">
        <Button variant="outline" onClick={() => changeMonth(-1)}>Mês Anterior</Button>
        <span className="text-xl font-semibold capitalize">
          {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="outline" onClick={() => changeMonth(1)}>Próximo Mês</Button>
      </div>

      {budgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{budget.category}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(budget)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(budget)} className="text-red-500 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold"><FormattedCurrency value={budget.amount} /></div>
                  <p className="text-xs text-muted-foreground">
                    Gasto: <FormattedCurrency value={budget.spent} valueClasses="text-xs" symbolClasses="text-xs" />
                  </p>
                  <Progress value={percentage} className="mt-4 h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum orçamento definido para este mês.</p>
          <Button variant="link" onClick={handleAddClick}>Criar um agora</Button>
        </div>
      )}

      <AddBudgetForm
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onFormSubmit={handleFormSubmit}
        budgetToEdit={budgetToEdit}
        categories={expenseCategories}
        currentMonth={currentMonth}
        existingCategories={budgets.map(b => b.category)}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o orçamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBudgetToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
