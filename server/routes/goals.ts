
import express from 'express';
import { db } from '../db/database';
import { protect } from '../middleware/auth';

const router = express.Router();

// Get all goals for the logged-in user
router.get('/', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    const goals = await db.selectFrom('goals')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('target_date', 'asc')
      .execute();
    res.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

// Add a new goal for the logged-in user
router.post('/', protect, async (req, res) => {
  const userId = req.user!.id;
  const { name, target_amount, current_amount, target_date } = req.body;

  if (!name || target_amount === undefined) {
    res.status(400).json({ message: 'Name and target amount are required' });
    return;
  }

  try {
    const newGoal = await db
      .insertInto('goals')
      .values({
        user_id: userId,
        name,
        target_amount: parseFloat(target_amount),
        current_amount: current_amount ? parseFloat(current_amount) : 0,
        target_date: target_date || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Failed to add goal:', error);
    res.status(500).json({ message: 'Failed to add goal' });
  }
});

// Update a goal for the logged-in user
router.put('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, target_amount, current_amount, target_date } = req.body;

    if (!name || target_amount === undefined || current_amount === undefined) {
        res.status(400).json({ message: 'All fields are required' });
        return;
    }

    try {
        const updatedGoal = await db
            .updateTable('goals')
            .set({
                name,
                target_amount: parseFloat(target_amount),
                current_amount: parseFloat(current_amount),
                target_date: target_date || null,
            })
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .returningAll()
            .executeTakeFirst();

        if (!updatedGoal) {
            res.status(404).json({ message: 'Goal not found' });
            return;
        }
        res.json(updatedGoal);
    } catch (error) {
        console.error('Failed to update goal:', error);
        res.status(500).json({ message: 'Failed to update goal' });
    }
});

// Delete a goal for the logged-in user
router.delete('/:id', protect, async (req, res) => {
    const userId = req.user!.id;
    const { id } = req.params;

    try {
        const result = await db
            .deleteFrom('goals')
            .where('id', '=', parseInt(id, 10))
            .where('user_id', '=', userId)
            .executeTakeFirst();

        if (result.numDeletedRows === 0n) {
            res.status(404).json({ message: 'Goal not found' });
            return;
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete goal:', error);
        res.status(500).json({ message: 'Failed to delete goal' });
    }
});

export default router;
