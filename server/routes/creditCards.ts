
import express from 'express';
import { db } from '../db/database';
import { protect } from '../middleware/auth';
import { sql } from 'kysely';

const router = express.Router();

// Get all credit cards for the logged-in user with spent amount
router.get('/', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    const cards = await db.selectFrom('credit_cards')
      .leftJoin('transactions', 'transactions.credit_card_id', 'credit_cards.id')
      .select([
        'credit_cards.id',
        'credit_cards.name',
        'credit_cards.limit_amount',
        'credit_cards.closing_day',
        'credit_cards.due_day',
        sql<number>`COALESCE(SUM(CASE WHEN transactions.type = 'expense' THEN transactions.amount ELSE 0 END), 0)`.as('spent')
      ])
      .where('credit_cards.user_id', '=', userId)
      .groupBy('credit_cards.id')
      .orderBy('credit_cards.name', 'asc')
      .execute();
    res.json(cards);
  } catch (error) {
    console.error('Failed to fetch credit cards:', error);
    res.status(500).json({ message: 'Failed to fetch credit cards' });
  }
});

// Get open invoice for a specific credit card
router.get('/:id/invoice', protect, async (req, res) => {
  const userId = req.user!.id;
  const cardId = parseInt(req.params.id, 10);

  try {
    const card = await db.selectFrom('credit_cards')
      .selectAll()
      .where('id', '=', cardId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!card) {
      res.status(404).json({ message: 'Credit card not found' });
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    const closingDay = card.closing_day;
    const dueDay = card.due_day;

    let invoiceStartDate: Date;
    let invoiceEndDate: Date;
    let dueDate: Date;

    const closingDateThisMonth = new Date(Date.UTC(currentYear, currentMonth, closingDay));

    if (today.getUTCDate() > closingDay) {
      // Invoice period is for next month's payment
      invoiceStartDate = new Date(Date.UTC(currentYear, currentMonth, closingDay + 1));
      invoiceEndDate = new Date(Date.UTC(currentYear, currentMonth + 1, closingDay));
      
      let dueMonth = currentMonth + 1;
      let dueYear = currentYear;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear += 1;
      }
      dueDate = new Date(Date.UTC(dueYear, dueMonth, dueDay));

    } else {
      // Invoice period is for this month's payment
      invoiceStartDate = new Date(Date.UTC(currentYear, currentMonth - 1, closingDay + 1));
      invoiceEndDate = new Date(Date.UTC(currentYear, currentMonth, closingDay));
      dueDate = new Date(Date.UTC(currentYear, currentMonth, dueDay));
    }
    
    const transactions = await db.selectFrom('transactions')
      .selectAll()
      .where('credit_card_id', '=', cardId)
      .where('user_id', '=', userId)
      .where('type', '=', 'expense')
      .where('date', '>=', invoiceStartDate.toISOString().split('T')[0])
      .where('date', '<=', invoiceEndDate.toISOString().split('T')[0])
      .orderBy('date', 'asc')
      .execute();

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      startDate: invoiceStartDate.toISOString(),
      endDate: invoiceEndDate.toISOString(),
      dueDate: dueDate.toISOString(),
      transactions,
      totalAmount,
    });

  } catch (error) {
    console.error('Failed to fetch invoice data:', error);
    res.status(500).json({ message: 'Failed to fetch invoice data' });
  }
});

// Add a new credit card for the logged-in user
router.post('/', protect, async (req, res) => {
  const userId = req.user!.id;
  const { name, limit_amount, closing_day, due_day } = req.body;

  if (!name || limit_amount === undefined || !closing_day || !due_day) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const newCard = await db
      .insertInto('credit_cards')
      .values({
        user_id: userId,
        name,
        limit_amount: parseFloat(limit_amount),
        closing_day: parseInt(closing_day, 10),
        due_day: parseInt(due_day, 10),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Failed to add credit card:', error);
    res.status(500).json({ message: 'Failed to add credit card' });
  }
});

// Update a credit card for the logged-in user
router.put('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, limit_amount, closing_day, due_day } = req.body;

    if (!name || limit_amount === undefined || !closing_day || !due_day) {
        res.status(400).json({ message: 'All fields are required' });
        return;
    }

    try {
        const updatedCard = await db
            .updateTable('credit_cards')
            .set({
                name,
                limit_amount: parseFloat(limit_amount),
                closing_day: parseInt(closing_day, 10),
                due_day: parseInt(due_day, 10),
            })
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .returningAll()
            .executeTakeFirst();

        if (!updatedCard) {
            res.status(404).json({ message: 'Credit card not found' });
            return;
        }
        res.json(updatedCard);
    } catch (error) {
        console.error('Failed to update credit card:', error);
        res.status(500).json({ message: 'Failed to update credit card' });
    }
});

// Delete a credit card for the logged-in user
router.delete('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    try {
        // We need to set credit_card_id to NULL in transactions before deleting the card
        await db.transaction().execute(async (trx) => {
            await trx
                .updateTable('transactions')
                .set({ credit_card_id: null })
                .where('credit_card_id', '=', parseInt(id, 10))
                .where('user_id', '=', userId)
                .execute();

            const result = await trx
                .deleteFrom('credit_cards')
                .where('id', '=', parseInt(id, 10))
                .where('user_id', '=', userId)
                .executeTakeFirst();

            if (result.numDeletedRows === 0n) {
                throw new Error('Credit card not found');
            }
        });
        
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete credit card:', error);
        if (error.message === 'Credit card not found') {
            res.status(404).json({ message: 'Credit card not found' });
        } else {
            res.status(500).json({ message: 'Failed to delete credit card' });
        }
    }
});

export default router;
