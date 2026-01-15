import { ClientGroup, sequelize } from './models/index.js';

const ALSHAYA_BRANDS = [
    'RAISING CANES', 'COMMON AREA', 'H&M', 'REG.ADMIN OFFICE', 'P.F CHANGS',
    'STARBUCKS', 'STARBUCKS 2', 'CHEESECAKE FACTORY', 'AMERICAN EAGLE',
    'CLAIRES', 'BBW', 'NEXT', 'SHAKE SHACK', 'FOOT LOCKER',
    'TEXAS ROAD HOUSE', 'CHARLOTTE TILBURY', 'MILANO', 'PINKBERRY'
];

const seedGroups = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Sync table first
        await ClientGroup.sync({ alter: true });

        console.log('🧹 Clearing existing Alshaya brands...');
        await ClientGroup.destroy({ where: { group_name: 'Alshaya' } });

        console.log('🌱 Seeding Brands...');
        const payload = ALSHAYA_BRANDS.map(brand => ({
            group_name: 'Alshaya',
            brand_name: brand
        }));

        await ClientGroup.bulkCreate(payload);
        console.log(`✅ Successfully seeded ${payload.length} brands for Alshaya!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    }
};

seedGroups();
