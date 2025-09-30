
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

export default router;
