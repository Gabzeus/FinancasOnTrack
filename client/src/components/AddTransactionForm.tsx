
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
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

export function AddTransactionForm({
  open,
  setOpen,
  onFormSubmit,
  transactionToEdit,
  creditCards = [],
  goals = [],
}) {
  const [type, setType] = React.useState('expense');
  const [category, setCategory] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [creditCardId, setCreditCardId] = React.useState('');
  const [goalId, setGoalId] = React.useState('');
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [frequency, setFrequency] = React.useState('monthly');
  const [endDate, setEndDate] = React.useState('');
  const { toast } = useToast();

  const isEditMode = !!transactionToEdit;

  React.useEffect(() => {
    if (isEditMode && transactionToEdit) {
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setDate(transactionToEdit.date.split('T')[0]);
      setCreditCardId(transactionToEdit.credit_card_id?.toString() || '');
      setGoalId(''); // Editing goal allocation is not supported
      setIsRecurring(false); // Editing recurring from here is not supported
    } else {
      // Reset form for adding
      setType('expense');
      setCategory('');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCreditCardId('');
      setGoalId('');
      setIsRecurring(false);
      setFrequency('monthly');
      setEndDate('');
    }
  }, [transactionToEdit, isEditMode, open]);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  React.useEffect(() => {
    // Reset category if type changes, but not on initial load in edit mode
    if (transactionToEdit && type === transactionToEdit.type) return;
    setCategory('');
  }, [type, transactionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !amount || !description || !category || !date) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    let url = isEditMode
      ? `/api/transactions/${transactionToEdit.id}`
      : '/api/transactions';
    let method = isEditMode ? 'PUT' : 'POST';
    let body: any = {
      type,
      amount: parseFloat(amount),
      description,
      category,
      date,
      credit_card_id: (creditCardId && creditCardId !== 'none') ? parseInt(creditCardId, 10) : null,
      goal_id: (goalId && goalId !== 'none') ? parseInt(goalId, 10) : null,
    };

    if (isRecurring && !isEditMode) {
      url = '/api/recurring-transactions';
      method = 'POST';
      body = {
        type,
        amount: parseFloat(amount),
        description,
        category,
        frequency,
        start_date: date,
        end_date: endDate || null,
        credit_card_id: (creditCardId && creditCardId !== 'none') ? parseInt(creditCardId, 10) : null,
      };
    }

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar transação');
      }

      const savedTransaction = await response.json();
      onFormSubmit(savedTransaction);
      setOpen(false);
      toast({
        title: 'Sucesso!',
        description: `Transação ${isRecurring ? 'recorrente ' : ''}salva com sucesso.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao salvar a transação: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Transação' : 'Adicionar Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {!isEditMode && (
            <div className="flex items-center space-x-2 justify-end">
              <Label htmlFor="recurring-switch">Recorrente</Label>
              <Switch
                id="recurring-switch"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select value={type} onValueChange={setType} disabled={isEditMode}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
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
              placeholder="0.00"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === 'expense' && creditCards.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creditCard" className="text-right">
                Cartão
              </Label>
              <Select value={creditCardId} onValueChange={setCreditCardId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Nenhum (Débito/Dinheiro)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Débito/Dinheiro)</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === 'income' && goals.length > 0 && !isEditMode && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goal" className="text-right">
                Alocar na Meta
              </Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id.toString()}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data {isRecurring ? 'de Início' : ''}
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          {isRecurring && !isEditMode && (
            <>
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
                <Label htmlFor="endDate" className="text-right">Data Final</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-3" />
              </div>
            </>
          )}
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
