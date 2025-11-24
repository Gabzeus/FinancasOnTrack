
import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import authRouter from './routes/auth';
import transactionsRouter from './routes/transactions';
import creditCardsRouter from './routes/creditCards';
import goalsRouter from './routes/goals';
import recurringTransactionsRouter from './routes/recurringTransactions';
import settingsRouter from './routes/settings';
import adminRouter from './routes/admin';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';
import { processRecurringTransactions } from './services/recurringProcessor.js';
import { checkLicenseExpirations } from './services/licenseProcessor.js';

dotenv.config();

const app = express();
const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/credit-cards', creditCardsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/recurring-transactions', recurringTransactionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);

// Function to set up and run the recurring transaction processor
function setupRecurringProcessor() {
  processRecurringTransactions().catch(console.error);
  setInterval(() => {
    processRecurringTransactions().catch(console.error);
  }, twentyFourHoursInMs);
  console.log('Recurring transaction processor scheduled to run every 24 hours.');
}

// Function to set up and run the license expiration checker
function setupLicenseProcessor() {
  checkLicenseExpirations().catch(console.error);
  setInterval(() => {
    checkLicenseExpirations().catch(console.error);
  }, twentyFourHoursInMs);
  console.log('License expiration processor scheduled to run every 24 hours.');
}

// Export a function to start the server
export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
      // Setup scheduled jobs after the server starts
      setupRecurringProcessor();
      setupLicenseProcessor();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server directly if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting server...');
  startServer(process.env.PORT || 3001);
}
