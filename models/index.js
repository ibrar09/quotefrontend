import PriceList from './pricelists.js';
import Job from './job.js';
import JobItem from './jobitem.js';
import PurchaseOrder from './purchaseorder.js';
import Finance from './finance.js';
import Store from './store.js';
import sequelize from '../config/db.js'; // Add Sequelize instance here

import JobImage from './jobImage.js';

// Relations
Store.hasMany(Job, { foreignKey: 'oracle_ccid', constraints: false });
Job.belongsTo(Store, { foreignKey: 'oracle_ccid', constraints: false });

Job.hasMany(JobItem, { foreignKey: 'job_id' });
JobItem.belongsTo(Job, { foreignKey: 'job_id' });

Job.hasMany(JobImage, { foreignKey: 'job_id', onDelete: 'CASCADE' });
JobImage.belongsTo(Job, { foreignKey: 'job_id' });

Job.hasMany(PurchaseOrder, { foreignKey: 'job_id' });
PurchaseOrder.belongsTo(Job, { foreignKey: 'job_id' });

PurchaseOrder.hasOne(Finance, { foreignKey: 'po_no', sourceKey: 'po_no', onUpdate: 'CASCADE', onDelete: 'SET NULL' });
Finance.belongsTo(PurchaseOrder, { foreignKey: 'po_no', targetKey: 'po_no', onUpdate: 'CASCADE', onDelete: 'SET NULL' });

// Named exports (optional)
export { PriceList, Job, JobItem, PurchaseOrder, Finance, Store, JobImage, sequelize };

// ✅ Default export (so your seed scripts can import db)
const db = { PriceList, Job, JobItem, PurchaseOrder, Finance, Store, JobImage, sequelize };
export default db;
