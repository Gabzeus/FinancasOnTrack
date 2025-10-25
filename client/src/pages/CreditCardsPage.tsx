
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from 'lucide-react';
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
import { AddCreditCardForm } from '@/components/AddCreditCardForm';
import { apiFetch } from '@/lib/api';
import { FormattedCurrency } from '@/components/FormattedCurrency';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function CreditCardsPage() {
  const [cards, setCards] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [cardToEdit, setCardToEdit] = React.useState(null);
  const [cardToDelete, setCardToDelete] = React.useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchCards = async () => {
    try {
      const response = await apiFetch('/api/credit-cards');
      if (!response.ok) {
        throw new Error('Failed to fetch credit cards');
      }
      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    fetchCards();
  }, []);

  React.useEffect(() => {
    cards.forEach(card => {
      const percentage = card.limit_amount > 0 ? (card.spent / card.limit_amount) * 100 : 0;
      if (percentage >= 90) {
        toast({
          title: `Alerta de Limite: ${card.name}`,
          description: `Você utilizou ${percentage.toFixed(0)}% do seu limite.`,
          variant: percentage >= 100 ? 'destructive' : 'default',
        });
      }
    });
  }, [cards, toast]);

  const handleFormSubmit = (savedCard) => {
    fetchCards(); // Refetch to get updated spent amount
    setCardToEdit(null);
  };

  const handleAddClick = () => {
    setCardToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (card) => {
    setCardToEdit(card);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (card) => {
    setCardToDelete(card);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;
    try {
      const response = await apiFetch(`/api/credit-cards/${cardToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete credit card');
      }
      setCards(prev => prev.filter(c => c.id !== cardToDelete.id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete credit card.');
    } finally {
      setIsDeleteAlertOpen(false);
      setCardToDelete(null);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Meus Cartões de Crédito</h2>
        <div className="flex items-center space-x-2">
           <Button className="bg-primary hover:bg-primary/90" onClick={handleAddClick}>
              <PlusCircle className="mr-2" />
              Adicionar Cartão
            </Button>
        </div>
      </div>
      
      {cards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const percentage = card.limit_amount > 0 ? (card.spent / card.limit_amount) * 100 : 0;
            return (
              <Card key={card.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">{card.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(card)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(card)} className="text-red-500 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Limite: <FormattedCurrency value={card.limit_amount} valueClasses="text-sm" symbolClasses="text-xs" />
                    </p>
                    <div className="text-2xl font-bold text-red-400">
                      <FormattedCurrency value={card.spent} />
                    </div>
                    <Progress value={percentage} className="h-4" indicatorClassName={getProgressColor(percentage)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{percentage.toFixed(1)}% usado</span>
                      <span>
                        Vencimento: dia {card.due_day}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum cartão de crédito cadastrado.</p>
          <Button variant="link" onClick={handleAddClick}>Cadastre um agora</Button>
        </div>
      )}

      <AddCreditCardForm
        open={isFormOpen}
        setOpen={setIsFormOpen}
        onFormSubmit={handleFormSubmit}
        cardToEdit={cardToEdit}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cartão de crédito e suas transações associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
