
import express from 'express';
import { db } from '../db/database';
import { sql } from 'kysely';

const router = express.Router();

// Get budgets for a specific month with spent amount
router.get('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const monthStr = `${year}-${month.padStart(2, '0')}`;

  try {
    const budgets = await db.selectFrom('budgets')
      .where('month', '=', monthStr)
      .selectAll()
      .execute();

    const expenses = await db.selectFrom('transactions')
      .select(['category', sql<number>`sum(amount)`.as('spent')])
      .where('type', '=', 'expense')
      .where(sql`strftime('%Y-%m', date)`, '=', monthStr)
      .groupBy('category')
      .execute();

    const expensesMap = new Map(expenses.map(e => [e.category, e.spent]));

    const results = budgets.map(budget => ({
      ...budget,
      spent: expensesMap.get(budget.category) || 0,
    }));

    res.json(results);
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    res.status(500).json({ message: 'Failed to fetch budgets' });
  }
});

// Add or update a budget
router.post('/', async (req, res) => {
  const { category, amount, month } = req.body;

  if (!category || amount === undefined || !month) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const result = await db.insertInto('budgets')
      .values({
        category,
        amount: parseFloat(amount),
        month,
      })
      .onConflict((oc) => oc
        .where('category', '=', category)
        .where('month', '=', month)
        .doUpdateSet({ amount: parseFloat(amount) })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
      
    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to save budget:', error);
    res.status(500).json({ message: 'Failed to save budget' });
  }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.deleteFrom('budgets')
            .where('id', '=', parseInt(id, 10))
            .executeTakeFirst();

        if (result.numDeletedRows === 0n) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete budget:', error);
        res.status(500).json({ message: 'Failed to delete budget' });
    }
});

export default router;
