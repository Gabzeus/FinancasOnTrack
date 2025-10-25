
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { AddGoalForm } from '@/components/AddGoalForm';
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

export default function SmartSavingsPage() {
  const [goals, setGoals] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [goalToEdit, setGoalToEdit] = React.useState(null);
  const [goalToDelete, setGoalToDelete] = React.useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const fetchGoals = async () => {
    try {
      const response = await apiFetch('/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchGoals();
  }, []);

  const handleFormSubmit = (savedGoal) => {
    setGoals(prev =>
      [...prev.filter(g => g.id !== savedGoal.id), savedGoal]
      .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    );
    setGoalToEdit(null);
  };

  const handleAddClick = () => {
    setGoalToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (goal) => {
    setGoalToEdit(goal);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (goal) => {
    setGoalToDelete(goal);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      const response = await apiFetch(`/api/goals/${goalToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete goal.');
    } finally {
      setIsDeleteAlertOpen(false);
      setGoalToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sem prazo';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Poupança Inteligente</h2>
        <div className="flex items-center space-x-2">
          <Button className="bg-primary hover:bg-primary/90" onClick={handleAddClick}>
            <PlusCircle className="mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">{goal.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(goal)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(goal)} className="text-red-500 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Meta: <FormattedCurrency value={goal.target_amount} valueClasses="text-sm" symbolClasses="text-xs" />
                  </p>
                  <div className="text-2xl font-bold text-green-400">
                    <FormattedCurrency value={goal.current_amount} />
                  </div>
                  <Progress value={percentage} className="mt-4 h-4" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{percentage.toFixed(1)}%</span>
                    {goal.target_date && <span>Prazo: {formatDate(goal.target_date)}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <PiggyBank className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma meta de poupança definida.</p>
          <Button variant="link" onClick={handleAddClick}>Crie sua primeira meta agora</Button>
        </div>
      )}

      <AddGoalForm
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onFormSubmit={handleFormSubmit}
        goalToEdit={goalToEdit}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente a meta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGoalToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
