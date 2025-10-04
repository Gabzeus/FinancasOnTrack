
import express from 'express';
import { db } from '../db/database';
import { protect } from '../middleware/auth';

const router = express.Router();

// Get all recurring transactions for the logged-in user
router.get('/', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    const recurringTransactions = await db
      .selectFrom('recurring_transactions')
      .leftJoin('credit_cards', 'credit_cards.id', 'recurring_transactions.credit_card_id')
      .select([
        'recurring_transactions.id',
        'recurring_transactions.type',
        'recurring_transactions.amount',
        'recurring_transactions.description',
        'recurring_transactions.category',
        'recurring_transactions.frequency',
        'recurring_transactions.start_date',
        'recurring_transactions.end_date',
        'recurring_transactions.credit_card_id',
        'credit_cards.name as credit_card_name'
      ])
      .where('recurring_transactions.user_id', '=', userId)
      .orderBy('start_date', 'desc')
      .execute();
    res.json(recurringTransactions);
  } catch (error) {
    console.error('Failed to fetch recurring transactions:', error);
    res.status(500).json({ message: 'Failed to fetch recurring transactions' });
  }
});

// Add a new recurring transaction for the logged-in user
router.post('/', protect, async (req, res) => {
  const userId = req.user!.id;
  const { type, amount, description, category, frequency, start_date, end_date, credit_card_id } = req.body;

  if (!type || !amount || !description || !category || !frequency || !start_date) {
    res.status(400).json({ message: 'Required fields are missing' });
    return;
  }

  try {
    const newRecurringTransaction = await db
      .insertInto('recurring_transactions')
      .values({
        user_id: userId,
        type,
        amount: parseFloat(amount),
        description,
        category,
        frequency,
        start_date,
        end_date: end_date || null,
        credit_card_id: type === 'expense' ? credit_card_id : null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    
    const result = await db
      .selectFrom('recurring_transactions')
      .leftJoin('credit_cards', 'credit_cards.id', 'recurring_transactions.credit_card_id')
      .select([
        'recurring_transactions.id',
        'recurring_transactions.type',
        'recurring_transactions.amount',
        'recurring_transactions.description',
        'recurring_transactions.category',
        'recurring_transactions.frequency',
        'recurring_transactions.start_date',
        'recurring_transactions.end_date',
        'recurring_transactions.credit_card_id',
        'credit_cards.name as credit_card_name'
      ])
      .where('recurring_transactions.id', '=', newRecurringTransaction.id)
      .executeTakeFirstOrThrow();

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to add recurring transaction:', error);
    res.status(500).json({ message: 'Failed to add recurring transaction' });
  }
});

// Update a recurring transaction for the logged-in user
router.put('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { type, amount, description, category, frequency, start_date, end_date, credit_card_id } = req.body;

    if (!type || !amount || !description || !category || !frequency || !start_date) {
        res.status(400).json({ message: 'Required fields are missing' });
        return;
    }

    try {
        const updated = await db
            .updateTable('recurring_transactions')
            .set({
                type,
                amount: parseFloat(amount),
                description,
                category,
                frequency,
                start_date,
                end_date: end_date || null,
                credit_card_id: type === 'expense' ? credit_card_id : null,
            })
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .returningAll()
            .executeTakeFirst();

        if (!updated) {
            res.status(404).json({ message: 'Recurring transaction not found' });
            return;
        }
        
        const result = await db
          .selectFrom('recurring_transactions')
          .leftJoin('credit_cards', 'credit_cards.id', 'recurring_transactions.credit_card_id')
          .select([
            'recurring_transactions.id',
            'recurring_transactions.type',
            'recurring_transactions.amount',
            'recurring_transactions.description',
            'recurring_transactions.category',
            'recurring_transactions.frequency',
            'recurring_transactions.start_date',
            'recurring_transactions.end_date',
            'recurring_transactions.credit_card_id',
            'credit_cards.name as credit_card_name'
          ])
          .where('recurring_transactions.id', '=', updated.id)
          .executeTakeFirstOrThrow();

        res.json(result);
    } catch (error) {
        console.error('Failed to update recurring transaction:', error);
        res.status(500).json({ message: 'Failed to update recurring transaction' });
    }
});

// Delete a recurring transaction for the logged-in user
router.delete('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    try {
        const result = await db
            .deleteFrom('recurring_transactions')
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .executeTakeFirst();

        if (result.numDeletedRows === 0n) {
            res.status(404).json({ message: 'Recurring transaction not found' });
            return;
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete recurring transaction:', error);
        res.status(500).json({ message: 'Failed to delete recurring transaction' });
    }
});

export default router;
