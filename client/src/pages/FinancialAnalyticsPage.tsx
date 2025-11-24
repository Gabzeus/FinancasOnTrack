import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SpendingAlertsPanel } from "../components/SpendingAlertsPanel";
import { CategoryBreakdownChart } from "../components/CategoryBreakdownChart";
import { SpendingLimitForm } from "../components/SpendingLimitForm";
import { FormattedCurrency } from "../components/FormattedCurrency";
import { Button } from "../components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";

interface FinancialSummary {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  categoryBreakdown: any[];
  topCategories: any[];
  allAlerts: any[];
}

export function FinancialAnalyticsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary(period);
    fetchCategories();
  }, [period]);

  const fetchSummary = async (selectedPeriod: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics/summary?period=${selectedPeriod}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to fetch summary");
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(errorMessage);
      console.error("Failed to fetch summary:", errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/analytics/categories", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleAddSpendingLimit = async (data: any) => {
    try {
      const response = await fetch("/api/analytics/spending-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to create limit");
      
      alert("Limite definido com sucesso!");
      fetchSummary(period);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar limite");
    }
  };

  const periodLabels = {
    daily: "Diário",
    weekly: "Semanal",
    monthly: "Mensal"
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Análise Financeira</h1>
        <p className="text-gray-600">Visualize seus gastos e configure limites de orçamento</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Tabs defaultValue="monthly" onValueChange={(v) => setPeriod(v as any)}>
        <TabsList>
          <TabsTrigger value="daily">{periodLabels.daily}</TabsTrigger>
          <TabsTrigger value="weekly">{periodLabels.weekly}</TabsTrigger>
          <TabsTrigger value="monthly">{periodLabels.monthly}</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6 mt-6">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <FormattedCurrency value={summary.totalIncome} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Entrada de dinheiro</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                    Despesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <FormattedCurrency value={summary.totalExpense} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Saída de dinheiro</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Saldo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summary.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <FormattedCurrency value={summary.netAmount} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Resultado do período</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alerts */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Alertas e Notificações</h2>
            {summary && (
              <SpendingAlertsPanel alerts={summary.allAlerts} isLoading={isLoading} />
            )}
          </div>

          {/* Category Breakdown */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Distribuição por Categoria</h2>
            {summary && (
              <Card>
                <CardContent className="pt-6">
                  <CategoryBreakdownChart
                    data={summary.categoryBreakdown}
                    isLoading={isLoading}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Categories */}
          {summary && summary.topCategories.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Principais Gastos</h2>
              <div className="space-y-2">
                {summary.topCategories.map((cat, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium capitalize">{cat.category}</p>
                          <p className="text-sm text-gray-600">
                            {cat.transactionCount} transação(ões)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            <FormattedCurrency value={cat.total} />
                          </p>
                          <p className="text-sm text-gray-600">{cat.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Spending Limit Form */}
          <div>
            <SpendingLimitForm
              categories={categories}
              onSubmit={handleAddSpendingLimit}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
