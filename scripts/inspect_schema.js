import sequelize from '../config/db.js';

const inspectColumns = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected');

        const [results] = await sequelize.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs';"
        );

        console.log('--- JOBS Columns ---');
        const deletedCols = results.filter(r => r.column_name.toLowerCase().includes('deleted'));
        console.log('Deleted-related columns:', deletedCols);

        if (deletedCols.length === 0) {
            console.log('⚠️ No deleted column found!');
        } else {
            console.log('Found:', deletedCols.map(c => c.column_name));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectColumns();
