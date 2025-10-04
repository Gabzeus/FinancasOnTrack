
import { db } from '../db/database';
import { sql } from 'kysely';

async function getSettings(userId: number) {
    const settings = await db.selectFrom('settings')
        .where('user_id', '=', userId)
        .selectAll()
        .execute();
    return settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});
}

// This is a mock notification service. In a real app, this would send an email or push notification.
function sendNotification(subject: string, body: string) {
    console.log('--- NOTIFICATION ---');
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('--------------------');
}

export async function checkBudgetAndNotify(userId: number, category: string, transactionDate: string) {
    const settings = await getSettings(userId);
    if (settings['budget_alerts_enabled'] !== 'true') {
        console.log(`Budget alerts are disabled for user ${userId}. Skipping check.`);
        return;
    }

    const date = new Date(transactionDate);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const monthStr = `${year}-${month}`;

    const budget = await db.selectFrom('budgets')
        .where('user_id', '=', userId)
        .where('category', '=', category)
        .where('month', '=', monthStr)
        .select('amount')
        .executeTakeFirst();

    if (!budget) {
        return; // No budget for this category/month
    }

    const startDate = `${monthStr}-01`;
    const endDate = new Date(year, date.getMonth() + 1, 0).getDate();
    const fullEndDate = `${monthStr}-${endDate}`;

    const result = await db.selectFrom('transactions')
        .select(sql<number>`sum(amount)`.as('spent'))
        .where('type', '=', 'expense')
        .where('user_id', '=', userId)
        .where('category', '=', category)
        .where('date', '>=', startDate)
        .where('date', '<=', fullEndDate)
        .executeTakeFirst();

    const spent = result?.spent || 0;
    const budgetAmount = budget.amount;
    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (percentage >= 100) {
        sendNotification(
            `Alerta de Orçamento: ${category}`,
            `Você ultrapassou seu orçamento de ${formatCurrency(budgetAmount)} para a categoria "${category}" este mês. Gasto atual: ${formatCurrency(spent)} (${percentage.toFixed(0)}%).`
        );
    } else if (percentage >= 90) {
        sendNotification(
            `Alerta de Orçamento: ${category}`,
            `Você está perto de atingir seu orçamento para a categoria "${category}". Gasto atual: ${formatCurrency(spent)} de ${formatCurrency(budgetAmount)} (${percentage.toFixed(0)}%).`
        );
    }
}
