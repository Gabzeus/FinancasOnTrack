
import express from 'express';
import { db } from '../db/database';
import { protect } from '../middleware/auth';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { z } from 'zod';
import { startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();
router.use(protect);

const summarySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

router.post('/send-summary', async (req, res) => {
    const userId = req.user!.id;
    const whatsappNumber = req.user!.whatsapp_number;

    if (!whatsappNumber) {
        res.status(400).json({ message: 'Número de WhatsApp não configurado.' });
        return;
    }

    try {
        const { startDate, endDate } = summarySchema.parse(req.body);

        const from = startDate ? new Date(startDate) : startOfMonth(new Date());
        const to = endDate ? new Date(endDate) : endOfMonth(new Date());

        const transactions = await db.selectFrom('transactions')
            .where('user_id', '=', userId)
            .where('date', '>=', from.toISOString().split('T')[0])
            .where('date', '<=', to.toISOString().split('T')[0])
            .select(['type', 'amount'])
            .execute();

        const summary = transactions.reduce((acc, t) => {
            if (t.type === 'income') {
                acc.income += t.amount;
            } else {
                acc.expense += t.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });

        const balance = summary.income - summary.expense;

        const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(date);

        const message = `*Resumo Financeiro FinTrack* 📊\n\n` +
                        `*Período:* de ${formatDate(from)} a ${formatDate(to)}\n\n` +
                        `🟢 *Receitas:* ${formatCurrency(summary.income)}\n` +
                        `🔴 *Despesas:* ${formatCurrency(summary.expense)}\n\n` +
                        `💰 *Saldo:* ${formatCurrency(balance)}`;

        sendWhatsAppMessage(whatsappNumber, message);

        res.status(200).json({ message: 'Resumo enviado com sucesso.' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.issues.map(e => e.message).join(', ') });
            return;
        }
        console.error('Failed to send summary:', error);
        res.status(500).json({ message: 'Falha ao enviar resumo.' });
    }
});

export default router;
