
import express from 'express';
import { protect } from '../middleware/auth';
import {
  getSpendingSummary,
  createSpendingLimit,
  getUserSpendingLimits
} from '../services/financialAnalyticsService';
import { categorizeTransaction, saveCategoryFeedback, getStandardCategories } from '../services/categorizationService';

const router = express.Router();

/**
 * GET /api/analytics/summary?period=monthly
 * Get spending summary for a specific period
 */
router.get('/summary', protect, async (req, res) => {
  const userId = req.user!.id;
  const period = (req.query.period as string) || 'monthly';

  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    res.status(400).json({ message: 'Invalid period. Must be daily, weekly, or monthly' });
    return;
  }

  try {
    const summary = await getSpendingSummary(userId, period as any);
    res.json(summary);
  } catch (error) {
    console.error('[API] Error fetching spending summary:', error);
    res.status(500).json({ message: 'Failed to fetch spending summary' });
  }
});

/**
 * GET /api/analytics/categorize?description=pizza
 * Get AI category suggestion for a description
 */
router.get('/categorize', protect, async (req, res) => {
  const userId = req.user!.id;
  const description = req.query.description as string;

  if (!description || description.trim().length === 0) {
    res.status(400).json({ message: 'Description is required' });
    return;
  }

  try {
    const categorization = await categorizeTransaction(description, userId);
    res.json(categorization);
  } catch (error) {
    console.error('[API] Error categorizing transaction:', error);
    res.status(500).json({ message: 'Failed to categorize transaction' });
  }
});

/**
 * POST /api/analytics/category-feedback
 * Save user feedback for category correction (learning mechanism)
 */
router.post('/category-feedback', protect, async (req, res) => {
  const userId = req.user!.id;
  const { description, userCategory, aiSuggestedCategory } = req.body;

  if (!description || !userCategory) {
    res.status(400).json({ message: 'Description and userCategory are required' });
    return;
  }

  try {
    await saveCategoryFeedback(userId, description, userCategory, aiSuggestedCategory);
    res.json({ message: 'Feedback saved successfully' });
  } catch (error) {
    console.error('[API] Error saving category feedback:', error);
    res.status(500).json({ message: 'Failed to save feedback' });
  }
});

/**
 * GET /api/analytics/categories
 * Get all available standard categories
 */
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = getStandardCategories();
    res.json({ categories });
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/analytics/spending-limits
 * Get all spending limits for the user
 */
router.get('/spending-limits', protect, async (req, res) => {
  const userId = req.user!.id;

  try {
    const limits = await getUserSpendingLimits(userId);
    res.json(limits);
  } catch (error) {
    console.error('[API] Error fetching spending limits:', error);
    res.status(500).json({ message: 'Failed to fetch spending limits' });
  }
});

/**
 * POST /api/analytics/spending-limits
 * Create or update a spending limit
 */
router.post('/spending-limits', protect, async (req, res) => {
  const userId = req.user!.id;
  const { category, limitAmount, period } = req.body;

  if (!category || !limitAmount || !period) {
    res.status(400).json({ message: 'Category, limitAmount, and period are required' });
    return;
  }

  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    res.status(400).json({ message: 'Invalid period. Must be daily, weekly, or monthly' });
    return;
  }

  if (isNaN(limitAmount) || limitAmount <= 0) {
    res.status(400).json({ message: 'Limit amount must be a positive number' });
    return;
  }

  try {
    await createSpendingLimit(userId, category, parseFloat(limitAmount), period);
    res.status(201).json({ message: 'Spending limit created/updated successfully' });
  } catch (error) {
    console.error('[API] Error creating spending limit:', error);
    res.status(500).json({ message: 'Failed to create spending limit' });
  }
});

export default router;
