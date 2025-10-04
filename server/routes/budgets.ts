
import express from 'express';
import { db } from '../db/database';
import { sql } from 'kysely';
import { protect } from '../middleware/auth';

const router = express.Router();

// Get budgets for a specific month with spent amount for the logged-in user
router.get('/:year/:month', protect, async (req, res) => {
  const userId = req.user!.id;
  const { year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).getDate();
  const fullEndDate = `${year}-${month.padStart(2, '0')}-${endDate}`;

  try {
    const budgets = await db.selectFrom('budgets')
      .where('month', '=', `${year}-${month.padStart(2, '0')}`)
      .where('user_id', '=', userId)
      .selectAll()
      .execute();

    const expenses = await db.selectFrom('transactions')
      .select(['category', sql<number>`sum(amount)`.as('spent')])
      .where('type', '=', 'expense')
      .where('user_id', '=', userId)
      .where('date', '>=', startDate)
      .where('date', '<=', fullEndDate)
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

// Add or update a budget for the logged-in user
router.post('/', protect, async (req, res) => {
  const userId = req.user!.id;
  const { category, amount, month } = req.body;

  if (!category || amount === undefined || !month) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const result = await db.insertInto('budgets')
      .values({
        user_id: userId,
        category,
        amount: parseFloat(amount),
        month,
      })
      .onConflict((oc) => oc
        .columns(['user_id', 'category', 'month'])
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

// Delete a budget for the logged-in user
router.delete('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    try {
        const result = await db.deleteFrom('budgets')
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
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
