
import { db } from '../db/database';
import { sendLicenseExpirationWarningEmail } from './emailService';
import { sql } from 'kysely';

/**
 * Checks for licenses that are about to expire and updates statuses for those already expired.
 */
export const checkLicenseExpirations = async () => {
    console.log('Checking for license expirations...');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setUTCDate(today.getUTCDate() + 7);
    const warningDateString = sevenDaysFromNow.toISOString().split('T')[0];

    try {
        // 1. Find users whose license expires in exactly 7 days and send a warning
        const usersToWarn = await db
            .selectFrom('users')
            .select(['email', 'license_expiry_date'])
            .where('license_expiry_date', '=', warningDateString)
            .where('license_status', '=', 'active')
            .execute();

        for (const user of usersToWarn) {
            if (user.license_expiry_date) {
                console.log(`Sending expiration warning to ${user.email}`);
                sendLicenseExpirationWarningEmail(user.email, user.license_expiry_date);
            }
        }

        // 2. Find users whose license has expired (is in the past) and update their status
        const todayString = today.toISOString().split('T')[0];
        const expiredUsers = await db
            .selectFrom('users')
            .select('id')
            .where('license_expiry_date', '<', todayString)
            .where('license_status', '=', 'active')
            .execute();

        if (expiredUsers.length > 0) {
            const userIds = expiredUsers.map(u => u.id);
            console.log(`Found ${userIds.length} expired licenses. Updating status to 'expired'.`);
            
            await db
                .updateTable('users')
                .set({ license_status: 'expired' })
                .where('id', 'in', userIds)
                .execute();
        }

        console.log('License expiration check complete.');

    } catch (error) {
        console.error('Error processing license expirations:', error);
    }
};
