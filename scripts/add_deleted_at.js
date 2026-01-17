import sequelize from '../config/db.js';

const addDeletedAtParams = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queryInterface = sequelize.getQueryInterface();

        // Check and Add to Jobs
        try {
            await queryInterface.addColumn('jobs', 'deletedAt', {
                type: sequelize.Sequelize.DATE,
                allowNull: true
            });
            console.log('✅ Added deletedAt to jobs');
        } catch (e) {
            console.log('ℹ️ Job deletedAt might already exist:', e.message);
        }

        // Check and Add to JobImages
        try {
            await queryInterface.addColumn('job_images', 'deletedAt', {
                type: sequelize.Sequelize.DATE,
                allowNull: true
            });
            console.log('✅ Added deletedAt to job_images');
        } catch (e) {
            console.log('ℹ️ JobImage deletedAt might already exist:', e.message);
        }

        console.log('Done');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addDeletedAtParams();
