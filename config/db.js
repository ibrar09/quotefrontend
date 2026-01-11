// config/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const isProduction = process.env.NODE_ENV === 'production';

// Check all possible Railway/Cloud connection keys
const dbUrl = process.env.DATABASE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_INTERNAL_URL ||
  process.env.PGURL;

console.log('--- Database Diagnostics ---');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`DB_URL status: ${dbUrl ? 'Present' : 'MISSING'}`);
if (!dbUrl) {
  console.log(`Fallback check: DB_NAME:${process.env.DB_NAME ? 'Y' : 'N'}, DB_HOST:${process.env.DB_HOST ? 'Y' : 'N'}`);
}
console.log('---------------------------');

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
    }
  );

// Export as default for ES6 import
export default sequelize;
