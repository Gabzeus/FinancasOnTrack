
import express from 'express';
import { db } from '../db/database';

const router = express.Router();

// Get all credit cards
router.get('/', async (req, res) => {
  try {
    const cards = await db.selectFrom('credit_cards').selectAll().orderBy('name', 'asc').execute();
    res.json(cards);
  } catch (error) {
    console.error('Failed to fetch credit cards:', error);
    res.status(500).json({ message: 'Failed to fetch credit cards' });
  }
});

// Add a new credit card
router.post('/', async (req, res) => {
  const { name, limit_amount, closing_day, due_day } = req.body;

  if (!name || limit_amount === undefined || !closing_day || !due_day) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  try {
    const newCard = await db
      .insertInto('credit_cards')
      .values({
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

// Update a credit card
router.put('/:id', async (req, res) => {
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

// Delete a credit card
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db
            .deleteFrom('credit_cards')
            .where('id', '=', parseInt(id, 10))
            .executeTakeFirst();

        if (result.numDeletedRows === 0n) {
            res.status(404).json({ message: 'Credit card not found' });
            return;
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete credit card:', error);
        res.status(500).json({ message: 'Failed to delete credit card' });
    }
});


export default router;
