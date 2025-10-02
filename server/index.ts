
import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import transactionsRouter from './routes/transactions';
import creditCardsRouter from './routes/creditCards';
import budgetsRouter from './routes/budgets';
import goalsRouter from './routes/goals';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/credit-cards', creditCardsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/goals', goalsRouter);

// Export a function to start the server
export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
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
