import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // ✅ Note the .js extension

const Finance = sequelize.define('Finance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoice_no: {
    type: DataTypes.STRING,
    unique: true
  },
  // Links to the Purchase Order
  po_no: {
    type: DataTypes.STRING,
    references: {
      model: 'purchase_orders',
      key: 'po_no'
    }
  },
  invoice_date: { type: DataTypes.DATEONLY },
  invoice_status: {
    type: DataTypes.ENUM('NOT_SUBMITTED', 'SUBMITTED', 'PAID', 'PARTIAL', 'UNPAID', 'PENDING', 'CANCELLED', 'EW'),
    defaultValue: 'NOT_SUBMITTED'
  },

  // Payment Details
  received_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  payment_date: { type: DataTypes.DATEONLY },
  payment_month: { type: DataTypes.STRING },      // e.g., "September 2025"
  payment_ref: { type: DataTypes.STRING },        // From "PAYMENT REF#"
  hsbc_no: { type: DataTypes.STRING },            // From "HSBC #"

  // VAT Tracking
  vat_status: { type: DataTypes.STRING },
  vat_duration: { type: DataTypes.STRING },

  // Advance Payment
  advance_payment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },

  // New Fields requested by user
  our_bank_ref: { type: DataTypes.STRING },
  company_bank_ref: { type: DataTypes.STRING },
  payment_status: { type: DataTypes.STRING },
  bank_date: { type: DataTypes.DATEONLY },
  general_ref: { type: DataTypes.STRING },
  days_outstanding: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'finance_records',
  timestamps: true
});

export default Finance;
