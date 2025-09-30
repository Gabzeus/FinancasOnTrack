
import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await db.selectFrom('transactions').selectAll().orderBy('date', 'desc').execute();
    res.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// Add a new transaction
router.post('/', async (req, res) => {
  const { type, amount, description, category, date } = req.body;

  if (!type || !amount || !description || !category || !date) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const newTransaction = await db
      .insertInto('transactions')
      .values({
        type,
        amount: parseFloat(amount),
        description,
        category,
        date,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ message: 'Failed to add transaction' });
  }
});

// Update a transaction
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { type, amount, description, category, date } = req.body;

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
            })
            .where('id', '=', parseInt(id, 10))
            .returningAll()
            .executeTakeFirst();

        if (!updatedTransaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }
        res.json(updatedTransaction);
    } catch (error) {
        console.error('Failed to update transaction:', error);
        res.status(500).json({ message: 'Failed to update transaction' });
    }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db
            .deleteFrom('transactions')
            .where('id', '=', parseInt(id, 10))
            .executeTakeFirst();

        if (result.numDeletedRows === 0n) {
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
