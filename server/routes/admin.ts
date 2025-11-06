
import express from 'express';
import { db } from '../db/database';
import { protect, adminOnly } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// All routes in this file are protected and for admins only
router.use(protect, adminOnly);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await db
      .selectFrom('users')
      .select(['id', 'email', 'role', 'license_status', 'license_expiry_date', 'created_at'])
      .orderBy('created_at', 'desc')
      .execute();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

const licenseUpdateSchema = z.object({
    license_status: z.enum(['active', 'inactive']),
    license_expiry_date: z.string().optional().nullable(),
});

// Update a user's license
router.put('/users/:id/license', async (req, res) => {
    const userIdToUpdate = parseInt(req.params.id, 10);

    try {
        const { license_status, license_expiry_date } = licenseUpdateSchema.parse(req.body);

        const user = await db.selectFrom('users').where('id', '=', userIdToUpdate).select('id').executeTakeFirst();
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const updatedUser = await db
            .updateTable('users')
            .set({
                license_status,
                license_expiry_date: license_expiry_date || null,
            })
            .where('id', '=', userIdToUpdate)
            .returning(['id', 'email', 'role', 'license_status', 'license_expiry_date'])
            .executeTakeFirstOrThrow();

        res.json(updatedUser);

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
            return;
        }
        console.error('Failed to update user license:', error);
        res.status(500).json({ message: 'Failed to update user license' });
    }
});

export default router;
