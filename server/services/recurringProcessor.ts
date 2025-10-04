
import { db } from '../db/database';

// Function to calculate the next date based on frequency
const getNextDate = (currentDate: Date, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date => {
    const nextDate = new Date(currentDate);
    // Use UTC methods to avoid timezone issues
    switch (frequency) {
        case 'daily':
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            break;
        case 'weekly':
            nextDate.setUTCDate(nextDate.getUTCDate() + 7);
            break;
        case 'monthly':
            nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
            break;
        case 'yearly':
            nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
            break;
    }
    return nextDate;
};

export const processRecurringTransactions = async () => {
    console.log('Checking for recurring transactions to process...');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to the start of the day in UTC

    try {
        // Fetch all recurring transactions whose start_date is today or in the past
        const dueTransactions = await db
            .selectFrom('recurring_transactions')
            .selectAll()
            .where('start_date', '<=', today.toISOString().split('T')[0])
            .execute();

        for (const recurring of dueTransactions) {
            const startDate = new Date(recurring.start_date);
            startDate.setUTCHours(12, 0, 0, 0); // Use midday to avoid timezone shifts across midnight

            const endDate = recurring.end_date ? new Date(recurring.end_date) : null;
            if (endDate) {
                endDate.setUTCHours(12, 0, 0, 0);
            }

            // If there's an end date and the start date has passed it, we can consider this recurring transaction finished.
            if (endDate && startDate > endDate) {
                console.log(`Recurring transaction ID ${recurring.id} (${recurring.description}) has expired. Skipping.`);
                continue;
            }

            // Insert the new transaction into the main transactions table
            await db
                .insertInto('transactions')
                .values({
                    user_id: recurring.user_id,
                    type: recurring.type,
                    amount: recurring.amount,
                    description: recurring.description,
                    category: recurring.category,
                    date: recurring.start_date, // The date of the transaction is the due start_date
                    credit_card_id: recurring.credit_card_id,
                    goal_id: null, // Recurring transactions don't automatically allocate to goals
                })
                .execute();
            
            console.log(`Processed recurring transaction ID ${recurring.id} for user ${recurring.user_id}: "${recurring.description}"`);

            // Calculate the next occurrence date
            const nextDate = getNextDate(startDate, recurring.frequency);
            const nextDateString = nextDate.toISOString().split('T')[0];

            // Update the recurring transaction with the new start_date
            await db
                .updateTable('recurring_transactions')
                .set({ start_date: nextDateString })
                .where('id', '=', recurring.id)
                .execute();
            
            console.log(`Updated next occurrence for recurring transaction ID ${recurring.id} to ${nextDateString}`);
        }
    } catch (error) {
        console.error('Error processing recurring transactions:', error);
    }
};
