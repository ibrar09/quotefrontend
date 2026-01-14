import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Link to the job/quotation
    job_id: {
        type: DataTypes.INTEGER,
        references: { model: 'jobs', key: 'id' }
    },

    // Notification details
    type: {
        type: DataTypes.ENUM(
            'APPROVAL_PENDING',
            'APPROVAL_OVERDUE',
            'WORK_COMPLETE',
            'PO_MISSING',
            'PAYMENT_DUE',
            'INCOMPLETE_DATA',
            'DRAFT_CLEANUP'
        ),
        allowNull: false
    },

    priority: {
        type: DataTypes.ENUM('HIGH', 'MEDIUM', 'LOW'),
        defaultValue: 'MEDIUM'
    },

    message: { type: DataTypes.TEXT, allowNull: false },

    // Metadata
    quote_no: { type: DataTypes.STRING }, // For quick reference
    days_elapsed: { type: DataTypes.INTEGER }, // How many days since trigger

    // Status
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE },

    // User (optional - for multi-user systems)
    user_id: { type: DataTypes.STRING }

}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['job_id'] },
        { fields: ['is_read'] },
        { fields: ['type'] },
        { fields: ['createdAt'] }
    ]
});

export default Notification;
