import { Job } from './models/index.js';
async function run() {
    const stats = await Job.findAll({
        attributes: ['quote_status', [Job.sequelize.fn('COUNT', '*'), 'n']],
        group: ['quote_status'], raw: true
    });
    console.log('STATS:', JSON.stringify(stats));
    process.exit();
}
run();
