
import { db } from '../db/database';
import { sendWhatsAppMessage } from './whatsappService';
import {
  getSpendingSummary,
  FinancialSummary,
  SpendingAlert
} from './financialAnalyticsService';

/**
 * Generate and send daily summary report
 */
export async function sendDailySummary(userId: number): Promise<void> {
  try {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user || !user.whatsapp_number) {
      console.log(`[WhatsApp] User ${userId} has no WhatsApp number configured`);
      return;
    }

    const summary = await getSpendingSummary(userId, 'daily');
    const message = formatDailySummary(summary);

    await sendWhatsAppMessage(user.whatsapp_number, message);
    await logReport(userId, 'daily', message);

    console.log(`[WhatsApp] Daily summary sent to ${user.whatsapp_number}`);
  } catch (error) {
    console.error('[WhatsApp] Error sending daily summary:', error);
  }
}

/**
 * Generate and send weekly summary report
 */
export async function sendWeeklySummary(userId: number): Promise<void> {
  try {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user || !user.whatsapp_number) {
      console.log(`[WhatsApp] User ${userId} has no WhatsApp number configured`);
      return;
    }

    const summary = await getSpendingSummary(userId, 'weekly');
    const message = formatWeeklySummary(summary);

    await sendWhatsAppMessage(user.whatsapp_number, message);
    await logReport(userId, 'weekly', message);

    console.log(`[WhatsApp] Weekly summary sent to ${user.whatsapp_number}`);
  } catch (error) {
    console.error('[WhatsApp] Error sending weekly summary:', error);
  }
}

/**
 * Generate and send monthly summary report
 */
export async function sendMonthlySummary(userId: number): Promise<void> {
  try {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user || !user.whatsapp_number) {
      console.log(`[WhatsApp] User ${userId} has no WhatsApp number configured`);
      return;
    }

    const summary = await getSpendingSummary(userId, 'monthly');
    const message = formatMonthlySummary(summary);

    await sendWhatsAppMessage(user.whatsapp_number, message);
    await logReport(userId, 'monthly', message);

    console.log(`[WhatsApp] Monthly summary sent to ${user.whatsapp_number}`);
  } catch (error) {
    console.error('[WhatsApp] Error sending monthly summary:', error);
  }
}

/**
 * Send alert if spending limits are exceeded
 */
export async function sendSpendingAlerts(userId: number): Promise<void> {
  try {
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user || !user.whatsapp_number) {
      console.log(`[WhatsApp] User ${userId} has no WhatsApp number configured`);
      return;
    }

    // Check all relevant periods
    const periods: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
    let hasAlerts = false;

    for (const period of periods) {
      const summary = await getSpendingSummary(userId, period);
      
      const criticalAlerts = summary.allAlerts.filter(a => a.severity === 'critical');
      
      if (criticalAlerts.length > 0) {
        hasAlerts = true;
        const message = formatAlerts(criticalAlerts, period);
        await sendWhatsAppMessage(user.whatsapp_number, message);
        await logReport(userId, 'alert', message);
      }
    }

    if (hasAlerts) {
      console.log(`[WhatsApp] Alerts sent to ${user.whatsapp_number}`);
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending spending alerts:', error);
  }
}

/**
 * Format daily summary message
 */
function formatDailySummary(summary: FinancialSummary): string {
  let message = `📊 *Resumo do Dia - ${summary.period}*\n\n`;
  message += `Receita: *R$ ${summary.totalIncome.toFixed(2)}*\n`;
  message += `Despesa: *R$ ${summary.totalExpense.toFixed(2)}*\n`;
  message += `Saldo: *R$ ${summary.netAmount.toFixed(2)}*\n\n`;

  if (summary.topCategories.length > 0) {
    message += `*Principais Categorias:*\n`;
    for (const cat of summary.topCategories) {
      message += `• ${cat.category}: R$ ${cat.total.toFixed(2)} (${cat.percentage.toFixed(0)}%)\n`;
    }
  }

  if (summary.allAlerts.length > 0) {
    message += `\n*Alertas:*\n`;
    for (const alert of summary.allAlerts.slice(0, 2)) {
      message += `${alert.message}\n`;
    }
  }

  message += `\nQuer ver mais detalhes? Acesse seu dashboard! 📱`;
  return message;
}

/**
 * Format weekly summary message
 */
function formatWeeklySummary(summary: FinancialSummary): string {
  let message = `📅 *Resumo Semanal - ${summary.period}*\n\n`;
  message += `Receita: *R$ ${summary.totalIncome.toFixed(2)}*\n`;
  message += `Despesa: *R$ ${summary.totalExpense.toFixed(2)}*\n`;
  message += `Saldo: *R$ ${summary.netAmount.toFixed(2)}*\n\n`;

  if (summary.topCategories.length > 0) {
    message += `*Top 3 Categorias:*\n`;
    summary.topCategories.forEach((cat, i) => {
      const emojis = ['🥇', '🥈', '🥉'];
      message += `${emojis[i]} ${cat.category}: R$ ${cat.total.toFixed(2)}\n`;
    });
  }

  const totalCategories = summary.categoryBreakdown.length;
  if (totalCategories > 3) {
    message += `\n...e mais ${totalCategories - 3} categorias\n`;
  }

  // Spending trend suggestion
  if (summary.totalExpense > 100) {
    const avgDaily = summary.totalExpense / 7;
    message += `\n💡 *Dica:* Sua média diária é de R$ ${avgDaily.toFixed(2)}. `;
    message += `Que tal definir uma meta semanal?\n`;
  }

  if (summary.allAlerts.length > 0) {
    message += `\n⚠️ *Você tem ${summary.allAlerts.length} alerta(s)*\n`;
  }

  return message;
}

/**
 * Format monthly summary message
 */
function formatMonthlySummary(summary: FinancialSummary): string {
  let message = `📈 *Resumo Mensal - ${summary.period}*\n\n`;
  message += `Receita: *R$ ${summary.totalIncome.toFixed(2)}*\n`;
  message += `Despesa: *R$ ${summary.totalExpense.toFixed(2)}*\n`;
  message += `Saldo: *R$ ${summary.netAmount.toFixed(2)}*\n\n`;

  if (summary.topCategories.length > 0) {
    message += `*Maiores Gastos:*\n`;
    let totalTop = 0;
    summary.topCategories.forEach(cat => {
      totalTop += cat.total;
      message += `• ${cat.category}: R$ ${cat.total.toFixed(2)} (${cat.percentage.toFixed(0)}%)\n`;
    });

    const otherTotal = summary.totalExpense - totalTop;
    if (otherTotal > 0) {
      const otherPercentage = (otherTotal / summary.totalExpense) * 100;
      message += `• Outros: R$ ${otherTotal.toFixed(2)} (${otherPercentage.toFixed(0)}%)\n`;
    }
  }

  // Suggestions
  if (summary.categoryBreakdown.length > 0) {
    const maxCategory = summary.categoryBreakdown[0];
    message += `\n💰 *Sugestão:* ${maxCategory.category} foi sua maior despesa. `;
    message += `Quer estabelecer um limite mensal?\n`;
  }

  if (summary.allAlerts.length > 0) {
    const criticalCount = summary.allAlerts.filter(a => a.severity === 'critical').length;
    if (criticalCount > 0) {
      message += `\n🚨 Você ultrapassou ${criticalCount} limite(s) este mês\n`;
    }
  }

  message += `\n👉 Confira seu dashboard completo para mais insights!`;
  return message;
}

/**
 * Format alert messages
 */
function formatAlerts(alerts: SpendingAlert[], period: string): string {
  let message = `🚨 *ALERTA DE GASTOS EXCESSIVOS*\n\n`;

  for (const alert of alerts) {
    message += `*${alert.category.toUpperCase()}*\n`;
    message += `${alert.message}\n`;
    
    if (alert.percentageUsed) {
      message += `Uso: ${alert.percentageUsed.toFixed(0)}% do limite\n`;
    }
    message += `\n`;
  }

  message += `⚠️ Tome ação agora para evitar problemas com seus orçamentos!\n`;
  message += `Acesse seu dashboard para revisar e ajustar seus limites.`;

  return message;
}

/**
 * Log report sent to database
 */
async function logReport(
  userId: number,
  reportType: 'daily' | 'weekly' | 'monthly' | 'alert',
  messageContent: string
): Promise<void> {
  try {
    await db
      .insertInto('whatsapp_reports')
      .values({
        user_id: userId,
        report_type: reportType,
        message_content: messageContent
      })
      .execute();

    console.log(`[WhatsApp] Report logged: ${reportType} for user ${userId}`);
  } catch (error) {
    console.error('[WhatsApp] Error logging report:', error);
  }
}
