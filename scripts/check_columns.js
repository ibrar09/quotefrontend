import sequelize from '../config/db.js';

const checkColumns = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('jobs'); // or 'Jobs' check case

        if (tableInfo.deletedAt) {
            console.log('✅ deletedAt column EXISTS in jobs table');
            console.log('Type:', tableInfo.deletedAt.type);
        } else {
            console.error('❌ deletedAt column MISSING in jobs table');
        }

        const imgTableInfo = await queryInterface.describeTable('job_images');
        if (imgTableInfo.deletedAt) {
            console.log('✅ deletedAt column EXISTS in job_images table');
        } else {
            console.error('❌ deletedAt column MISSING in job_images table');
        }

        process.exit(0);
    } catch (error) {
        console.error('Check Error:', error);
        process.exit(1);
    }
};

checkColumns();
