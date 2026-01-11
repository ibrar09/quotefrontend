import db from './models/index.js';

setTimeout(async () => {
    try {
        console.log('🔄 Authenticating...');
        await db.sequelize.authenticate();
        console.log('✅ Connected.');

        // 1. Manually Drop the Constraint if it exists
        // We know the name `jobs_oracle_ccid_fkey` from the previous step
        try {
            console.log('🔄 Attempting to drop constraint "jobs_oracle_ccid_fkey"...');
            await db.sequelize.query(`ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_oracle_ccid_fkey";`);
            console.log('✅ Constraint dropped (or did not exist).');
        } catch (e) {
            console.log('⚠️ Warning dropping constraint:', e.message);
        }

        // 2. Sync
        console.log('🔄 Syncing models...');
        await db.sequelize.sync({ alter: true, logging: false });
        console.log('✅ Models Synced Successfully.');

        process.exit(0);

    } catch (e) {
        console.error('❌ FATAL ERROR:', e);
        process.exit(1);
    }
}, 1000);
