
import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { protect } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// All routes here are protected
router.use(protect);

// Get all settings for the logged-in user
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  try {
    const settings = await db.selectFrom('settings')
      .where('user_id', '=', userId)
      .selectAll()
      .execute();
      
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update settings for the logged-in user
router.put('/', async (req, res) => {
  const userId = req.user!.id;
  const settingsToUpdate: Record<string, string> = req.body;

  if (!settingsToUpdate || Object.keys(settingsToUpdate).length === 0) {
    res.status(400).json({ message: 'No settings to update provided' });
    return;
  }

  try {
    await db.transaction().execute(async (trx) => {
      for (const key in settingsToUpdate) {
        const value = String(settingsToUpdate[key]);
        await trx
          .insertInto('settings')
          .values({ user_id: userId, key, value })
          .onConflict((oc) => oc.columns(['user_id', 'key']).doUpdateSet({ value }))
          .execute();
      }
    });
    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

const changePasswordSchema = z.object({
    currentPassword: z.string().nonempty(),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
});

// Change user password
router.put('/change-password', async (req, res) => {
    const userId = req.user!.id;
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const user = await db.selectFrom('users')
            .where('id', '=', userId)
            .select('password_hash')
            .executeTakeFirst();

        if (!user) {
            res.status(404).json({ message: 'Usuário não encontrado.' });
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordCorrect) {
            res.status(403).json({ message: 'A senha atual está incorreta.' });
            return;
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await db.updateTable('users')
            .set({ password_hash: newPasswordHash })
            .where('id', '=', userId)
            .execute();

        res.status(200).json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
            return;
        }
        console.error('Failed to change password:', error);
        res.status(500).json({ message: 'Falha ao alterar a senha.' });
    }
});


export default router;
