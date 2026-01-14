import cron from 'node-cron';
import { generateNotifications } from '../services/notification.service.js';

/**
 * Cron job to generate notifications automatically
 * Runs every hour at minute 0
 */
export const startNotificationCron = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🔔 [CRON] Running hourly notification check...');
        try {
            await generateNotifications();
        } catch (error) {
            console.error('❌ [CRON] Notification generation failed:', error);
        }
    });

    console.log('✅ [CRON] Notification scheduler started (runs every hour)');

    // Optional: Run once on startup
    setTimeout(async () => {
        console.log('🔔 [CRON] Running initial notification check...');
        try {
            await generateNotifications();
        } catch (error) {
            console.error('❌ [CRON] Initial notification check failed:', error);
        }
    }, 5000); // Wait 5 seconds after server start
};
