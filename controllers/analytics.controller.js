import { Op, Sequelize } from 'sequelize';
import { Job, JobItem, PriceList, Finance } from '../models/index.js'; // Added Finance
import sequelize from '../config/db.js';

export const getDashboardAnalytics = async (req, res) => {
    try {
        // 1. KPI Cards
        // Revenue is Approved + Paid jobs
        const totalRevenue = await Job.sum('grand_total', {
            where: { quote_status: { [Op.in]: ['APPROVED', 'PAID'] } }
        }) || 0;

        const totalQuotes = await Job.count();
        const approvedQuotes = await Job.count({ where: { quote_status: { [Op.in]: ['APPROVED', 'PAID'] } } });
        const activeJobs = await Job.count({ where: { work_status: 'IN_PROGRESS' } });

        const winRate = totalQuotes > 0 ? ((approvedQuotes / totalQuotes) * 100).toFixed(1) : 0;

        // 2. Financial Calculations (Source of Truth: Finance Table)
        const totalReceived = await Finance.sum('received_amount') || 0;
        const totalAdvance = await Finance.sum('advance_payment') || 0;
        const totalPaid = Number(totalReceived) + Number(totalAdvance);

        // Outstanding = Revenue - Paid
        const outstandingAmount = Math.max(0, Number(totalRevenue) - totalPaid);

        // 3. Status Distribution (Pie Chart)
        const statusDistribution = await Job.findAll({
            attributes: ['quote_status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['quote_status'],
            raw: true
        });

        // 3. Revenue Trend (Line Chart - Last 6 Months)
        // Group by Month (SQLite/Postgres specific syntax - assume SQLite for local dev or general date_trunc)
        // Using generic JS processing for DB independency if dataset is small, but let's try Sequelize logic
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueRaw = await Job.findAll({
            attributes: ['createdAt', 'grand_total'],
            where: {
                quote_status: ['APPROVED', 'PAID'], // Only count real revenue
                createdAt: { [Op.gte]: sixMonthsAgo }
            },
            order: [['createdAt', 'ASC']],
            raw: true
        });

        // Process in JS to ensure clean monthly buckets
        const revenueTrend = revenueRaw.reduce((acc, job) => {
            const date = new Date(job.createdAt);
            const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!acc[month]) acc[month] = 0;
            acc[month] += Number(job.grand_total || 0);
            return acc;
        }, {});

        const revenueLabels = Object.keys(revenueTrend);
        const revenueData = Object.values(revenueTrend);


        // 4. Brand Performance (Horizontal Bar)
        const brandPerformance = await Job.findAll({
            attributes: ['brand', [Sequelize.fn('SUM', Sequelize.col('grand_total')), 'total']],
            where: { quote_status: { [Op.in]: ['APPROVED', 'PAID'] } }, // Only won deals
            group: ['brand'],
            order: [[Sequelize.literal('total'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 5. Regional Performance (Bar Chart)
        const regionPerformance = await Job.findAll({
            attributes: ['region', [Sequelize.fn('SUM', Sequelize.col('grand_total')), 'total']],
            where: { quote_status: { [Op.in]: ['APPROVED', 'PAID'] } },
            group: ['region'],
            order: [[Sequelize.literal('total'), 'DESC']],
            raw: true
        });

        // 6. Work Type Distribution - Group by PriceList Type or Job Description
        const workTypeDistribution = await JobItem.findAll({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.col('PriceList.type'), Sequelize.col('Job.work_description'), 'Other'), 'type'],
                [Sequelize.fn('SUM', Sequelize.literal('quantity * unit_price')), 'total'],
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'volume']
            ],
            include: [
                {
                    model: PriceList,
                    attributes: [],
                    required: false
                },
                {
                    model: Job,
                    attributes: [],
                    required: true
                }
            ],
            group: [Sequelize.fn('COALESCE', Sequelize.col('PriceList.type'), Sequelize.col('Job.work_description'), 'Other')],
            order: [[Sequelize.literal('total'), 'DESC']],
            raw: true
        });

        // 7. Employee Performance (Completed By)
        const employeePerformance = await Job.findAll({
            attributes: ['completed_by', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            where: {
                work_status: 'DONE',
                completed_by: { [Op.not]: null }
            },
            group: ['completed_by'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 8. Sales/Approval Performance (Approved By)
        const salesPerformance = await Job.findAll({
            attributes: ['approved_by', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            where: {
                quote_status: 'APPROVED',
                approved_by: { [Op.not]: null }
            },
            group: ['approved_by'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        // 9. City Performance (Where most work is done)
        const cityPerformance = await Job.findAll({
            attributes: ['city', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            where: {
                quote_status: { [Op.in]: ['APPROVED', 'PAID'] },
                city: { [Op.not]: null }
            },
            group: ['city'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5,
            raw: true
        });

        res.json({
            success: true,
            kpis: {
                totalRevenue: totalRevenue || 0,
                totalQuotes,
                winRate,
                activeJobs
            },
            financials: {
                totalVAT: await Job.sum('vat_amount', { where: { quote_status: ['APPROVED', 'PAID'] } }) || 0,
                totalDiscount: await Job.sum('discount', { where: { quote_status: ['APPROVED', 'PAID'] } }) || 0,
                avgJobValue: approvedQuotes > 0 ? (totalRevenue / approvedQuotes).toFixed(0) : 0,
                pendingRevenue: await Job.sum('grand_total', { where: { quote_status: ['SENT', 'PO_RECEIVED'] } }) || 0,
                totalPaid: totalPaid || 0,
                outstandingAmount: outstandingAmount || 0
            },
            charts: {
                statusDistribution: statusDistribution.map(s => ({
                    name: s.quote_status.replace(/_/g, ' '), // Convert PO_RECEIVED -> PO RECEIVED
                    count: s.count
                })),
                revenueTrend: { labels: revenueLabels, data: revenueData },
                brandPerformance,
                regionPerformance,
                workTypeDistribution,
                employeePerformance,
                salesPerformance,
                cityPerformance
            }
        });

    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
