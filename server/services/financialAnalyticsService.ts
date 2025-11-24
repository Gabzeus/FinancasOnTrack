
import { db } from '../db/database';
import { sql } from 'kysely';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, format, parseISO } from 'date-fns';

export interface CategorySpending {
  category: string;
  total: number;
  transactionCount: number;
  percentage: number;
}

export interface SpendingAlert {
  type: 'limit_warning' | 'limit_exceeded' | 'trend_increase' | 'anomaly';
  category: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  currentAmount: number;
  limitOrThreshold: number;
  percentageUsed?: number;
}

export interface FinancialSummary {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  categoryBreakdown: CategorySpending[];
  topCategories: CategorySpending[];
  allAlerts: SpendingAlert[];
}

/**
 * Get spending summary for a specific period
 */
export async function getSpendingSummary(
  userId: number,
  period: 'daily' | 'weekly' | 'monthly',
  referenceDate: Date = new Date()
): Promise<FinancialSummary> {
  console.log(`[Analytics] Generating ${period} summary for user ${userId} as of ${referenceDate}`);

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  // Determine date range
  if (period === 'daily') {
    startDate = startOfDay(referenceDate);
    endDate = endOfDay(referenceDate);
    periodLabel = format(referenceDate, 'dd/MM/yyyy');
  } else if (period === 'weekly') {
    startDate = startOfWeek(referenceDate, { weekStartsOn: 0 });
    endDate = endOfWeek(referenceDate, { weekStartsOn: 0 });
    periodLabel = `Semana de ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`;
  } else {
    startDate = startOfMonth(referenceDate);
    endDate = endOfMonth(referenceDate);
    periodLabel = format(referenceDate, 'MMMM yyyy');
  }

  const startIso = startDate.toISOString().split('T')[0];
  const endIso = endDate.toISOString().split('T')[0];

  // Fetch transactions in period
  const transactions = await db
    .selectFrom('transactions')
    .selectAll()
    .where('user_id', '=', userId)
    .where('date', '>=', startIso)
    .where('date', '<=', endIso)
    .execute();

  console.log(`[Analytics] Found ${transactions.length} transactions in period`);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Break down by category (expenses only)
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const transaction of expenses) {
    const existing = categoryMap.get(transaction.category) || { total: 0, count: 0 };
    categoryMap.set(transaction.category, {
      total: existing.total + transaction.amount,
      count: existing.count + 1
    });
  }

  const categoryBreakdown: CategorySpending[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      total: data.total,
      transactionCount: data.count,
      percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0
    })
  );

  // Sort by total descending
  categoryBreakdown.sort((a, b) => b.total - a.total);
  const topCategories = categoryBreakdown.slice(0, 3);

  // Check for alerts
  const alerts = await checkSpendingAlerts(userId, categoryBreakdown, period, referenceDate);

  const summary: FinancialSummary = {
    period: periodLabel,
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    categoryBreakdown,
    topCategories,
    allAlerts: alerts
  };

  console.log(`[Analytics] Summary: Income=${totalIncome}, Expense=${totalExpense}, Net=${summary.netAmount}`);
  return summary;
}

/**
 * Check for spending alerts and anomalies
 */
async function checkSpendingAlerts(
  userId: number,
  currentCategoryBreakdown: CategorySpending[],
  period: 'daily' | 'weekly' | 'monthly',
  referenceDate: Date
): Promise<SpendingAlert[]> {
  const alerts: SpendingAlert[] = [];

  // Get spending limits for this user
  const limits = await db
    .selectFrom('spending_limits')
    .selectAll()
    .where('user_id', '=', userId)
    .where('period', '=', period)
    .execute();

  console.log(`[Analytics] Checking ${limits.length} spending limits`);

  // Check each category against its limit
  for (const limit of limits) {
    const categorySpending = currentCategoryBreakdown.find(c => c.category === limit.category);
    const spent = categorySpending?.total || 0;
    const percentageUsed = (spent / limit.limit_amount) * 100;

    if (spent > limit.limit_amount) {
      alerts.push({
        type: 'limit_exceeded',
        category: limit.category,
        message: `⚠️ Você excedeu o limite de ${limit.category} em R$ ${(spent - limit.limit_amount).toFixed(2)}!`,
        severity: 'critical',
        currentAmount: spent,
        limitOrThreshold: limit.limit_amount,
        percentageUsed: percentageUsed
      });
    } else if (percentageUsed >= 85) {
      alerts.push({
        type: 'limit_warning',
        category: limit.category,
        message: `⚠️ Você já usou ${percentageUsed.toFixed(0)}% do limite de ${limit.category} (R$ ${limit.limit_amount.toFixed(2)})`,
        severity: 'warning',
        currentAmount: spent,
        limitOrThreshold: limit.limit_amount,
        percentageUsed: percentageUsed
      });
    }
  }

  // Check for spending trends (compared to previous period)
  const previousSummary = await getSpendingSummary(
    userId,
    period,
    getPreviousPeriodDate(referenceDate, period)
  );

  for (const category of currentCategoryBreakdown) {
    const previousSpending = previousSummary.categoryBreakdown.find(c => c.category === category.category);
    
    if (previousSpending && previousSpending.total > 0) {
      const percentageChange = ((category.total - previousSpending.total) / previousSpending.total) * 100;
      
      if (percentageChange >= 20) {
        const periodName = getPeriodName(period);
        alerts.push({
          type: 'trend_increase',
          category: category.category,
          message: `📈 Seus gastos com ${category.category} aumentaram ${percentageChange.toFixed(0)}% comparado ${periodName}`,
          severity: 'info',
          currentAmount: category.total,
          limitOrThreshold: previousSpending.total,
          percentageUsed: percentageChange
        });
      }
    }
  }

  console.log(`[Analytics] Generated ${alerts.length} alerts`);
  return alerts;
}

/**
 * Get previous period date
 */
function getPreviousPeriodDate(referenceDate: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
  const date = new Date(referenceDate);
  
  if (period === 'daily') {
    date.setDate(date.getDate() - 1);
  } else if (period === 'weekly') {
    date.setDate(date.getDate() - 7);
  } else {
    return subMonths(date, 1);
  }
  
  return date;
}

/**
 * Get period name in Portuguese
 */
function getPeriodName(period: 'daily' | 'weekly' | 'monthly'): string {
  if (period === 'daily') return 'ontem';
  if (period === 'weekly') return 'semana passada';
  return 'mês passado';
}

/**
 * Create spending limit for a user
 */
export async function createSpendingLimit(
  userId: number,
  category: string,
  limitAmount: number,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<void> {
  try {
    await db
      .insertInto('spending_limits')
      .values({
        user_id: userId,
        category,
        limit_amount: limitAmount,
        period
      })
      .onConflict(oc => 
        oc.columns(['user_id', 'category', 'period']).doUpdateSet({
          limit_amount: limitAmount
        })
      )
      .execute();
    
    console.log(`[Analytics] Created/updated limit: ${category} = R$ ${limitAmount}/${period}`);
  } catch (error) {
    console.error('[Analytics] Error creating spending limit:', error);
  }
}

/**
 * Get all spending limits for a user
 */
export async function getUserSpendingLimits(userId: number): Promise<any[]> {
  try {
    const limits = await db
      .selectFrom('spending_limits')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
    
    return limits;
  } catch (error) {
    console.error('[Analytics] Error fetching spending limits:', error);
    return [];
  }
}
