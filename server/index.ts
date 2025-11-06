
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
import { processRecurringTransactions } from './services/recurringProcessor.js';

dotenv.config();

const app = express();

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

// Function to set up and run the recurring transaction processor
function setupRecurringProcessor() {
  // Run once on startup
  processRecurringTransactions().catch(console.error);

  // Then run every 24 hours
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
  setInterval(() => {
    processRecurringTransactions().catch(console.error);
  }, twentyFourHoursInMs);

  console.log('Recurring transaction processor scheduled to run every 24 hours.');
}

// Export a function to start the server
export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
      // Setup the recurring processor after the server starts
      setupRecurringProcessor();
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
