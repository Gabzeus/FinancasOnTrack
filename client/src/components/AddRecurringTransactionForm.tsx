
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

const incomeCategories = ['Salário', 'Freelance', 'Investimentos', 'Outros'];
const expenseCategories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Outros',
];

export function AddRecurringTransactionForm({
  open,
  setOpen,
  onFormSubmit,
  itemToEdit,
  creditCards = [],
}) {
  const [type, setType] = React.useState('expense');
  const [category, setCategory] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [frequency, setFrequency] = React.useState('monthly');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState('');
  const [creditCardId, setCreditCardId] = React.useState('');

  const isEditMode = !!itemToEdit;

  React.useEffect(() => {
    if (isEditMode && itemToEdit) {
      setType(itemToEdit.type);
      setCategory(itemToEdit.category);
      setAmount(itemToEdit.amount.toString());
      setDescription(itemToEdit.description);
      setFrequency(itemToEdit.frequency);
      setStartDate(itemToEdit.start_date.split('T')[0]);
      setEndDate(itemToEdit.end_date ? itemToEdit.end_date.split('T')[0] : '');
      setCreditCardId(itemToEdit.credit_card_id?.toString() || '');
    } else {
      // Reset form
      setType('expense');
      setCategory('');
      setAmount('');
      setDescription('');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setCreditCardId('');
    }
  }, [itemToEdit, isEditMode, open]);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  React.useEffect(() => {
    if (itemToEdit && type === itemToEdit.type) return;
    setCategory('');
  }, [type, itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !amount || !description || !category || !frequency || !startDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const url = isEditMode
      ? `/api/recurring-transactions/${itemToEdit.id}`
      : '/api/recurring-transactions';
    const method = isEditMode ? 'PUT' : 'POST';

    const body = {
      type,
      amount: parseFloat(amount),
      description,
      category,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      credit_card_id: (creditCardId && creditCardId !== 'none') ? parseInt(creditCardId, 10) : null,
    };

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar transação recorrente');
      }

      const savedItem = await response.json();
      onFormSubmit(savedItem);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao salvar a transação recorrente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Assinatura Spotify" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Valor</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {type === 'expense' && creditCards.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creditCard" className="text-right">Cartão</Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Débito/Dinheiro)</SelectItem>
                  {creditCards.map((card) => <SelectItem key={card.id} value={card.id.toString()}>{card.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">Data de Início</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">Data Final</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-3" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
