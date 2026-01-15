import { Job, PurchaseOrder, Finance, Store, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Get Quotation Status Counts
        const statusCounts = await Job.findAll({
            attributes: [
                'quote_status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { is_latest: true },
            group: ['quote_status']
        });

        const statusMap = {};
        // Initialize all main keys to 0
        ['DRAFT', 'READY_TO_SEND', 'SENT', 'PO_RECEIVED', 'APPROVED', 'PAID', 'CANCELLED'].forEach(k => statusMap[k] = 0);

        console.log('📊 [DASHBOARD] Raw DB Counts:', statusCounts.map(s => `${s.quote_status}: ${s.getDataValue('count')}`).join(', '));

        statusCounts.forEach(s => {
            const status = s.quote_status;
            if (status) {
                statusMap[status] = parseInt(s.get('count')) || 0;
            }
        });

        // 2. Financial Calculations
        // Total Potential Revenue (from Approved or Completed jobs)
        const totalRevenue = await Job.sum('grand_total', {
            where: {
                quote_status: { [Op.in]: ['APPROVED', 'COMPLETED'] },
                is_latest: true
            }
        }) || 0;

        // Total Received (Sum of received_amount AND advance_payment)
        const totalReceived = await Finance.sum('received_amount') || 0;
        const totalAdvance = await Finance.sum('advance_payment') || 0;
        const totalPaid = Number(totalReceived) + Number(totalAdvance);

        // Count of Paid Invoices
        const paidCount = await Finance.count({ where: { invoice_status: 'PAID' } });

        // 3. Recent Activities (Last 10 job updates)
        const recentActivities = await Job.findAll({
            where: { is_latest: true },
            limit: 10,
            order: [['updatedAt', 'DESC']],
            include: [{ model: Store, attributes: ['brand', 'mall'] }]
        });

        console.log(`📊 [DASHBOARD STATS] Revenue: ${totalRevenue}, Total Paid: ${totalPaid}, Activities: ${recentActivities.length}`);

        const stats = {
            counts: {
                need_to_send: (statusMap['DRAFT'] || 0) + (statusMap['READY_TO_SEND'] || 0),
                sent: (statusMap['SENT'] || 0),
                approved: (statusMap['APPROVED'] || 0),
                completed: statusMap['PO_RECEIVED'] || 0,
                rejected: statusMap['CANCELLED'] || 0,
                intake: statusMap['INTAKE'] || 0,
                paid_count: (statusMap['PAID'] || 0) + paidCount,
                // [NEW] Raw Breakdown for detailed graph
                raw: statusMap
            },
            financials: {
                total_paid: totalPaid,
                total_approved: totalRevenue,
                remaining: Math.max(0, Number(totalRevenue) - totalPaid)
            },
            recent: recentActivities.map(j => ({
                id: j.id,
                quote_no: j.quote_no,
                mr_no: j.mr_no || 'N/A',
                grand_total: j.grand_total || 0,
                work_description: j.work_description || '',
                brand: j.brand_name || j.brand || j.Store?.brand || 'N/A',
                updatedAt: j.updatedAt,
                status: j.quote_status
            })),
            timestamp: new Date().toISOString()
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('❌ [DASHBOARD] Critical failure:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
