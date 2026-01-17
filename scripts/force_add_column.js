import sequelize from '../config/db.js';

const forceAddColumn = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        const [dbName] = await sequelize.query("SELECT current_database();");
        console.log('Using DB:', dbName[0].current_database);

        // JOB Table
        try {
            await sequelize.query(`
                ALTER TABLE jobs 
                ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
            `);
            console.log('✅ Executed ADD COLUMN "deletedAt" on jobs');
        } catch (e) {
            console.error('Failed to alter jobs:', e.message);
        }

        // JobImages Table
        try {
            await sequelize.query(`
                ALTER TABLE job_images 
                ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
            `);
            console.log('✅ Executed ADD COLUMN "deletedAt" on job_images');
        } catch (e) {
            console.error('Failed to alter job_images:', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        process.exit(1);
    }
};

forceAddColumn();
