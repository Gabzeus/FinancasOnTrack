
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';

export function AddGoalForm({
  open,
  setOpen,
  onFormSubmit,
  goalToEdit,
}) {
  const [name, setName] = React.useState('');
  const [targetAmount, setTargetAmount] = React.useState('');
  const [currentAmount, setCurrentAmount] = React.useState('');
  const [targetDate, setTargetDate] = React.useState('');

  const isEditMode = !!goalToEdit;

  React.useEffect(() => {
    if (isEditMode && goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.target_amount.toString());
      setCurrentAmount(goalToEdit.current_amount.toString());
      setTargetDate(goalToEdit.target_date ? goalToEdit.target_date.split('T')[0] : '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
    }
  }, [goalToEdit, isEditMode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      alert('Por favor, preencha o nome e o valor da meta.');
      return;
    }

    const url = isEditMode
      ? `/api/goals/${goalToEdit.id}`
      : '/api/goals';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount || '0'),
          target_date: targetDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar meta');
      }

      const savedGoal = await response.json();
      onFormSubmit(savedGoal);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(`Ocorreu um erro ao salvar a meta: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Meta Financeira' : 'Adicionar Nova Meta'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Edite os detalhes da sua meta.' : 'Crie uma nova meta para economizar dinheiro.'}
          </DialogDescription>
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
              placeholder="Ex: Viagem para a praia"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetAmount" className="text-right">
              Valor da Meta
            </Label>
            <Input
              id="targetAmount"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="2000.00"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentAmount" className="text-right">
              Valor Atual
            </Label>
            <Input
              id="currentAmount"
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="150.00"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetDate" className="text-right">
              Data Alvo
            </Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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
