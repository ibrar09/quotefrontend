import sequelize from '../config/db.js';

const removeUniqueConstraint = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        const queryInterface = sequelize.getQueryInterface();

        // 1. Inspect Indexes
        const indexes = await queryInterface.showIndex('purchase_orders');
        console.log('Current Indexes:', indexes);

        // 2. Find and Remove Unique Index on po_no
        const uniqueIndex = indexes.find(idx =>
            idx.unique === true &&
            idx.fields.some(f => f.attribute === 'po_no')
        );

        if (uniqueIndex) {
            console.log(`⚠️ Found Unique Index: ${uniqueIndex.name}. Removing it...`);
            await queryInterface.removeIndex('purchase_orders', uniqueIndex.name);
            console.log('✅ Unique Constraint Removed Successfully!');
        } else {
            console.log('ℹ️ No Unique Constraint found on po_no. It might be already removed.');
        }

    } catch (error) {
        console.error('❌ Error executing script:', error);
    } finally {
        await sequelize.close();
    }
};

removeUniqueConstraint();
