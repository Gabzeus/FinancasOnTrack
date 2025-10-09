
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';

export function AddCreditCardForm({
  open,
  setOpen,
  onFormSubmit,
  cardToEdit,
}) {
  const [name, setName] = React.useState('');
  const [limit, setLimit] = React.useState('');
  const [closingDay, setClosingDay] = React.useState('');
  const [dueDay, setDueDay] = React.useState('');

  const isEditMode = !!cardToEdit;

  React.useEffect(() => {
    if (isEditMode && cardToEdit) {
      setName(cardToEdit.name);
      setLimit(cardToEdit.limit_amount.toString());
      setClosingDay(cardToEdit.closing_day.toString());
      setDueDay(cardToEdit.due_day.toString());
    } else {
      // Reset form for adding
      setName('');
      setLimit('');
      setClosingDay('');
      setDueDay('');
    }
  }, [cardToEdit, isEditMode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !limit || !closingDay || !dueDay) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const url = isEditMode
      ? `/api/credit-cards/${cardToEdit.id}`
      : '/api/credit-cards';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name,
          limit_amount: parseFloat(limit),
          closing_day: parseInt(closingDay, 10),
          due_day: parseInt(dueDay, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar cartão de crédito');
      }

      const savedCard = await response.json();
      onFormSubmit(savedCard);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(`Ocorreu um erro ao salvar o cartão: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Cartão de Crédito' : 'Adicionar Novo Cartão'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cartão Nubank"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="limit" className="text-right">
              Limite
            </Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="5000.00"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="closingDay" className="text-right">
              Dia do Fechamento
            </Label>
            <Input
              id="closingDay"
              type="number"
              min="1"
              max="31"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              placeholder="Ex: 20"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDay" className="text-right">
              Dia do Vencimento
            </Label>
            <Input
              id="dueDay"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Ex: 28"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
