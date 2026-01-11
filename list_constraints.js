import db from './models/index.js';

setTimeout(async () => {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connected.');

        // Find constraints on 'jobs' table
        const [results] = await db.sequelize.query(`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'jobs'::regclass 
            AND contype = 'f';
        `);

        console.log('🔍 Foreign Key Constraints on JOBS table:', results);

    } catch (e) {
        console.error('❌ ERROR:', e);
    }
    process.exit(0);
}, 1000);
