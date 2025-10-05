
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';

export function AddBudgetForm({
  open,
  setOpen,
  onFormSubmit,
  budgetToEdit,
  categories,
  currentMonth,
  existingCategories = [],
}) {
  const [category, setCategory] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const isEditMode = !!budgetToEdit;
  const monthString = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;

  React.useEffect(() => {
    if (isEditMode && budgetToEdit) {
      setCategory(budgetToEdit.category);
      setAmount(budgetToEdit.amount.toString());
    } else {
      setCategory('');
      setAmount('');
    }
  }, [budgetToEdit, isEditMode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const url = '/api/budgets';
    const method = 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          month: monthString,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar orçamento');
      }

      const savedBudget = await response.json();
      onFormSubmit(savedBudget);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert(`Ocorreu um erro ao salvar o orçamento: ${error.message}`);
    }
  };

  const availableCategories = isEditMode 
    ? categories 
    : categories.filter(cat => !existingCategories.includes(cat));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Orçamento' : 'Novo Orçamento para ' + currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory} disabled={isEditMode}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length > 0 ? (
                  availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Todas as categorias já possuem orçamento.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500.00"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
