
import express from 'express';
import { db } from '../db/database';
import { sql } from 'kysely';
import { protect } from '../middleware/auth';

const router = express.Router();

// Get all transactions for the logged-in user
router.get('/', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    const transactions = await db
      .selectFrom('transactions')
      .leftJoin('credit_cards', 'credit_cards.id', 'transactions.credit_card_id')
      .select([
        'transactions.id',
        'transactions.type',
        'transactions.amount',
        'transactions.description',
        'transactions.category',
        'transactions.date',
        'transactions.credit_card_id',
        'credit_cards.name as credit_card_name'
      ])
      .where('transactions.user_id', '=', userId)
      .orderBy('date', 'desc')
      .orderBy('transactions.id', 'desc')
      .execute();
    res.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Add a new transaction for the logged-in user
router.post('/', protect, async (req, res) => {
  const userId = req.user!.id;
  const { type, amount, description, category, date, credit_card_id, goal_id } = req.body;

  if (!type || !amount || !description || !category || !date) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const result = await db.transaction().execute(async (trx) => {
      const newTransaction = await trx
        .insertInto('transactions')
        .values({
          user_id: userId,
          type,
          amount: parseFloat(amount),
          description,
          category,
          date,
          credit_card_id: type === 'expense' ? credit_card_id : null,
          goal_id: type === 'income' ? goal_id : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      
      if (type === 'income' && goal_id) {
        await trx
          .updateTable('goals')
          .set({
            current_amount: sql`current_amount + ${parseFloat(amount)}`
          })
          .where('id', '=', parseInt(goal_id, 10))
          .where('user_id', '=', userId)
          .execute();
      }

      // Fetch the full transaction with card name to return to client
      return await trx
        .selectFrom('transactions')
        .leftJoin('credit_cards', 'credit_cards.id', 'transactions.credit_card_id')
        .select([
          'transactions.id',
          'transactions.type',
          'transactions.amount',
          'transactions.description',
          'transactions.category',
          'transactions.date',
          'transactions.credit_card_id',
          'credit_cards.name as credit_card_name'
        ])
        .where('transactions.id', '=', newTransaction.id)
        .executeTakeFirstOrThrow();
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// Update a transaction for the logged-in user
router.put('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { type, amount, description, category, date, credit_card_id } = req.body;

    if (!type || !amount || !description || !category || !date) {
        res.status(400).json({ message: 'All fields are required' });
        return;
    }

    try {
        const updatedTransaction = await db
            .updateTable('transactions')
            .set({
                type,
                amount: parseFloat(amount),
                description,
                category,
                date,
                credit_card_id: type === 'expense' ? credit_card_id : null,
            })
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .returningAll()
            .executeTakeFirst();

        if (!updatedTransaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        
        const result = await db
          .selectFrom('transactions')
          .leftJoin('credit_cards', 'credit_cards.id', 'transactions.credit_card_id')
          .select([
            'transactions.id',
            'transactions.type',
            'transactions.amount',
            'transactions.description',
            'transactions.category',
            'transactions.date',
            'transactions.credit_card_id',
            'credit_cards.name as credit_card_name'
          ])
          .where('transactions.id', '=', updatedTransaction.id)
          .executeTakeFirstOrThrow();
        
        res.json(result);
    } catch (error) {
        console.error('Failed to update transaction:', error);
        res.status(500).json({ message: 'Failed to update transaction' });
    }
});

// Delete a transaction for the logged-in user
router.delete('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    try {
        const deletedTransaction = await db
            .deleteFrom('transactions')
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .returningAll()
            .executeTakeFirst();

        if (!deletedTransaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        res.status(500).json({ message: 'Failed to delete transaction' });
    }
});

export default router;
