
import express from 'express';
import { db } from '../db/database';
import { protect, adminOnly } from '../middleware/auth';
import { z } from 'zod';
import { sendLicenseActivationEmail, sendLicenseDeactivationEmail } from '../services/emailService';

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

const userUpdateSchema = z.object({
    license_status: z.enum(['active', 'inactive', 'expired']),
    license_expiry_date: z.string().optional().nullable(),
    role: z.enum(['admin', 'user']),
});

// Update a user's license and role
router.put('/users/:id', async (req, res) => {
    const userIdToUpdate = parseInt(req.params.id, 10);
    const currentAdminId = req.user!.id;

    try {
        const { license_status, license_expiry_date, role } = userUpdateSchema.parse(req.body);

        // Prevent admin from changing their own role
        if (userIdToUpdate === currentAdminId && role !== 'admin') {
            res.status(403).json({ message: 'Administrators cannot change their own role.' });
            return;
        }

        const user = await db.selectFrom('users').where('id', '=', userIdToUpdate).select(['id', 'email', 'license_status']).executeTakeFirst();
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const updatedUser = await db
            .updateTable('users')
            .set({
                license_status,
                license_expiry_date: license_expiry_date || null,
                role,
            })
            .where('id', '=', userIdToUpdate)
            .returning(['id', 'email', 'role', 'license_status', 'license_expiry_date'])
            .executeTakeFirstOrThrow();
        
        // Send email notification based on license status change
        if (user.license_status !== 'active' && license_status === 'active') {
            sendLicenseActivationEmail(updatedUser.email, updatedUser.license_expiry_date);
        } else if (user.license_status === 'active' && license_status === 'inactive') {
            sendLicenseDeactivationEmail(updatedUser.email);
        }

        res.json(updatedUser);

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
            return;
        }
        console.error('Failed to update user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

export default router;
