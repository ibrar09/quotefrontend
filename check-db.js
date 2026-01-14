import { Job, Finance, Store } from './models/index.js';

async function checkData() {
    try {
        const jobCount = await Job.count();
        const latestJobCount = await Job.count({ where: { is_latest: true } });
        const financeCount = await Finance.count();

        const statuses = await Job.findAll({
            attributes: ['quote_status', [Job.sequelize.fn('COUNT', Job.sequelize.col('id')), 'count']],
            group: ['quote_status']
        });

        console.log('--- DB Data Check ---');
        console.log('Total Jobs:', jobCount);
        console.log('Latest Jobs:', latestJobCount);
        console.log('Finance Records:', financeCount);
        console.log('Status breakdown:');
        statuses.forEach(s => {
            console.log(` - ${s.quote_status}: ${s.get('count')}`);
        });

        const revenue = await Job.sum('grand_total', { where: { is_latest: true } });
        console.log('Total Grand Total (Latest):', revenue);

        const received = await Finance.sum('received_amount');
        const advance = await Finance.sum('advance_payment');
        console.log('Received:', received, 'Advance:', advance);

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        process.exit();
    }
}

checkData();
