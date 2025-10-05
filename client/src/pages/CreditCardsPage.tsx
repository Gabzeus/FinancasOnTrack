
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function CreditCardsPage() {
  const [cards, setCards] = React.useState([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [cardToEdit, setCardToEdit] = React.useState(null);
  const [cardToDelete, setCardToDelete] = React.useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

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

  const handleFormSubmit = (savedCard) => {
    setCards(prev => 
      [...prev.filter(c => c.id !== savedCard.id), savedCard]
      .sort((a, b) => a.name.localeCompare(b.name))
    );
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Meus Cartões de Crédito</h2>
        <div className="flex items-center space-x-2">
           <Button className="bg-blue-700 hover:bg-blue-800" onClick={handleAddClick}>
              <PlusCircle className="mr-2" />
              Adicionar Cartão
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Dia de Fechamento</TableHead>
                  <TableHead>Dia de Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.length > 0 ? (
                  cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.name}</TableCell>
                      <TableCell>{formatCurrency(card.limit_amount)}</TableCell>
                      <TableCell>{card.closing_day}</TableCell>
                      <TableCell>{card.due_day}</TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum cartão de crédito cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cartão de crédito.
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
