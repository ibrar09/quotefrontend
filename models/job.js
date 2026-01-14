import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // ✅ note the .js extension

const Job = sequelize.define('Job', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // 🔹 Quotation Identity
  quote_no: { type: DataTypes.STRING, allowNull: false },
  revision_no: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_latest: { type: DataTypes.BOOLEAN, defaultValue: true },

  // 🔹 MR & Store
  mr_no: { type: DataTypes.STRING },
  mr_date: { type: DataTypes.DATEONLY },
  oracle_ccid: {
    type: DataTypes.STRING
    // references: { model: 'master_stores', key: 'oracle_ccid' } // Loose reference to allow manual entries
  },

  // 🔹 Description
  work_description: { type: DataTypes.TEXT },
  brand_name: { type: DataTypes.STRING }, // Manually entered brand/company name
  pr_no: { type: DataTypes.STRING },      // Purchase Requisition Number

  // 🔹 STORE SNAPSHOT (Data at time of quote)
  brand: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING }, // Maps to store.mall
  city: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },

  // 🔹 Additional Quote Details
  store_opening_date: { type: DataTypes.DATEONLY },
  continuous_assessment: { type: DataTypes.TEXT },

  // 🔹 QUOTATION STATUS (Lifecycle)
  quote_status: {
    type: DataTypes.ENUM(
      'INTAKE',
      'PREVIEW',
      'DRAFT',
      'SENT',
      'REVISED',
      'APPROVED',
      'REJECTED',
      'COMPLETED'
    ),
    defaultValue: 'INTAKE'
  },

  // 🔹 WORK STATUS (Execution)
  work_status: {
    type: DataTypes.ENUM(
      'NOT_STARTED',
      'IN_PROGRESS',
      'DONE',
      'CANCELLED'
    ),
    defaultValue: 'NOT_STARTED'
  },

  // 🔹 FINANCIAL SUMMARY (Calculated)
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  vat_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  grand_total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },

  // 🔹 Audit / Timeline
  sent_at: { type: DataTypes.DATE },
  approved_at: { type: DataTypes.DATE },
  approved_by: { type: DataTypes.STRING },

  // 🔹 Work Completion
  completion_date: { type: DataTypes.DATEONLY },
  completed_by: { type: DataTypes.STRING },
  supervisor: { type: DataTypes.STRING },
  comments: { type: DataTypes.TEXT },
  craftsperson_notes: { type: DataTypes.TEXT },
  check_in_date: { type: DataTypes.DATEONLY },
  check_in_time: { type: DataTypes.STRING },

}, {
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['quote_no', 'revision_no']
    }
  ]
});

export default Job;
