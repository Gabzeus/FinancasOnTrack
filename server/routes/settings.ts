
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
    const settingsPromise = db.selectFrom('settings')
      .where('user_id', '=', userId)
      .selectAll()
      .execute();
      
    const userPromise = db.selectFrom('users')
        .where('id', '=', userId)
        .select('whatsapp_number')
        .executeTakeFirst();

    const [settings, user] = await Promise.all([settingsPromise, userPromise]);

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    settingsObj.whatsapp_number = user?.whatsapp_number || '';

    res.json(settingsObj);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update settings for the logged-in user
router.put('/', async (req, res) => {
  const userId = req.user!.id;
  const { whatsapp_number, ...settingsToUpdate } = req.body;

  if (!settingsToUpdate && whatsapp_number === undefined) {
    res.status(400).json({ message: 'No settings to update provided' });
    return;
  }

  try {
    await db.transaction().execute(async (trx) => {
      // Update user-specific fields like whatsapp_number
      if (whatsapp_number !== undefined) {
        await trx.updateTable('users')
          .set({ whatsapp_number: whatsapp_number || null })
          .where('id', '=', userId)
          .execute();
      }

      // Update key-value settings
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
