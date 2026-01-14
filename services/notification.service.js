import { Job, PurchaseOrder, Finance, Notification, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Check for quotations awaiting approval for too long
 */
export const checkApprovalDelays = async () => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        // Find SENT quotations older than 1 day
        const pendingJobs = await Job.findAll({
            where: {
                quote_status: 'SENT',
                sent_at: { [Op.lt]: oneDayAgo },
                is_latest: true
            }
        });

        for (const job of pendingJobs) {
            const daysElapsed = Math.floor((Date.now() - new Date(job.sent_at)) / (24 * 60 * 60 * 1000));

            // Check if notification already exists
            const existing = await Notification.findOne({
                where: {
                    job_id: job.id,
                    type: { [Op.in]: ['APPROVAL_PENDING', 'APPROVAL_OVERDUE'] },
                    is_read: false
                }
            });

            if (!existing) {
                const isOverdue = new Date(job.sent_at) < threeDaysAgo;
                await Notification.create({
                    job_id: job.id,
                    quote_no: job.quote_no,
                    type: isOverdue ? 'APPROVAL_OVERDUE' : 'APPROVAL_PENDING',
                    priority: isOverdue ? 'HIGH' : 'MEDIUM',
                    message: isOverdue
                        ? `⚠️ Quotation ${job.quote_no} overdue for approval (${daysElapsed} days)`
                        : `Quotation ${job.quote_no} awaiting approval for ${daysElapsed} day(s)`,
                    days_elapsed: daysElapsed
                });
                console.log(`✅ Created notification for ${job.quote_no} (${daysElapsed} days pending)`);
            }
        }

        return pendingJobs.length;
    } catch (error) {
        console.error('❌ Error checking approval delays:', error);
        return 0;
    }
};

/**
 * Check for workflow gaps (completed work without PO, approved without PO, etc.)
 */
export const checkWorkflowGaps = async () => {
    try {
        let count = 0;

        // 1. Work completed but quotation not marked as COMPLETED
        const completedWork = await Job.findAll({
            where: {
                work_status: 'DONE',
                quote_status: { [Op.notIn]: ['COMPLETED', 'REJECTED'] },
                is_latest: true
            }
        });

        for (const job of completedWork) {
            const existing = await Notification.findOne({
                where: { job_id: job.id, type: 'WORK_COMPLETE', is_read: false }
            });

            if (!existing) {
                await Notification.create({
                    job_id: job.id,
                    quote_no: job.quote_no,
                    type: 'WORK_COMPLETE',
                    priority: 'HIGH',
                    message: `Work completed for ${job.quote_no}, update quotation status`
                });
                count++;
            }
        }

        // 2. Approved quotations without PO
        const approvedNoPO = await Job.findAll({
            where: {
                quote_status: 'APPROVED',
                is_latest: true
            },
            include: [{ model: PurchaseOrder, required: false }]
        });

        for (const job of approvedNoPO) {
            if (!job.PurchaseOrders || job.PurchaseOrders.length === 0) {
                const existing = await Notification.findOne({
                    where: { job_id: job.id, type: 'PO_MISSING', is_read: false }
                });

                if (!existing) {
                    await Notification.create({
                        job_id: job.id,
                        quote_no: job.quote_no,
                        type: 'PO_MISSING',
                        priority: 'MEDIUM',
                        message: `Quotation ${job.quote_no} approved, create Purchase Order`
                    });
                    count++;
                }
            }
        }

        console.log(`✅ Created ${count} workflow gap notifications`);
        return count;
    } catch (error) {
        console.error('❌ Error checking workflow gaps:', error);
        return 0;
    }
};

/**
 * Check for incomplete data (silent reminders)
 */
export const checkIncompleteData = async () => {
    try {
        let count = 0;

        // Find quotations with missing item details
        const incompleteJobs = await Job.findAll({
            where: {
                quote_status: { [Op.in]: ['DRAFT', 'INTAKE'] },
                is_latest: true,
                [Op.or]: [
                    { work_description: { [Op.or]: [null, ''] } },
                    { brand_name: { [Op.or]: [null, ''] } }
                ]
            }
        });

        for (const job of incompleteJobs) {
            const existing = await Notification.findOne({
                where: { job_id: job.id, type: 'INCOMPLETE_DATA', is_read: false }
            });

            if (!existing) {
                await Notification.create({
                    job_id: job.id,
                    quote_no: job.quote_no,
                    type: 'INCOMPLETE_DATA',
                    priority: 'LOW',
                    message: `💡 Complete details for quotation ${job.quote_no}`
                });
                count++;
            }
        }

        console.log(`✅ Created ${count} incomplete data notifications`);
        return count;
    } catch (error) {
        console.error('❌ Error checking incomplete data:', error);
        return 0;
    }
};

/**
 * Run all notification checks
 */
export const generateNotifications = async () => {
    console.log('🔔 [NOTIFICATIONS] Running notification checks...');

    const approvalCount = await checkApprovalDelays();
    const workflowCount = await checkWorkflowGaps();
    const incompleteCount = await checkIncompleteData();

    const total = approvalCount + workflowCount + incompleteCount;
    console.log(`🔔 [NOTIFICATIONS] Generated ${total} new notifications`);

    return { approvalCount, workflowCount, incompleteCount, total };
};

/**
 * Get all notifications
 */
export const getNotifications = async (limit = 50, unreadOnly = false) => {
    const where = unreadOnly ? { is_read: false } : {};

    return await Notification.findAll({
        where,
        include: [{ model: Job, attributes: ['quote_no', 'brand_name', 'quote_status'] }],
        order: [['createdAt', 'DESC']],
        limit
    });
};

/**
 * Get unread count
 */
export const getUnreadCount = async () => {
    return await Notification.count({ where: { is_read: false } });
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id) => {
    return await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { id } }
    );
};

/**
 * Delete notification
 */
export const deleteNotification = async (id) => {
    return await Notification.destroy({ where: { id } });
};
