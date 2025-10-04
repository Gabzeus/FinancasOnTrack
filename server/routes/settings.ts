
import express from 'express';
import { db } from '../db/database';
import { protect } from '../middleware/auth';

const router = express.Router();

// Get all settings for the logged-in user
router.get('/', protect, async (req, res) => {
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
router.put('/', protect, async (req, res) => {
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

export default router;
