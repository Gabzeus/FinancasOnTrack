import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface SpendingLimitFormProps {
  onSubmit: (data: { category: string; limitAmount: number; period: string }) => void;
  categories: string[];
  isLoading?: boolean;
}

export function SpendingLimitForm({
  onSubmit,
  categories,
  isLoading = false
}: SpendingLimitFormProps) {
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [period, setPeriod] = useState("monthly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !limitAmount || !period) {
      alert("Preencha todos os campos");
      return;
    }

    if (isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) {
      alert("Insira um valor válido");
      return;
    }

    onSubmit({
      category,
      limitAmount: Number(limitAmount),
      period
    });

    setCategory("");
    setLimitAmount("");
    setPeriod("monthly");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definir Limite de Gasto</CardTitle>
        <CardDescription>Configure limites para suas categorias de gastos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Limite (R$)</label>
              <Input
                type="number"
                placeholder="100.00"
                step="0.01"
                min="0"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Definir Limite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
