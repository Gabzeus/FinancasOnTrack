
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
