import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CustomPriceList = sequelize.define('CustomPriceList', {
    code: { type: DataTypes.STRING, primaryKey: true },
    type: { type: DataTypes.STRING }, // e.g. "Civil", "Electrical"
    description: { type: DataTypes.TEXT },
    unit: { type: DataTypes.STRING }, // e.g. PCS, M2
    material_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    labor_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_price: { type: DataTypes.DECIMAL(10, 2) },
    remarks: { type: DataTypes.TEXT },
    // Optional: Link to a specific store? For now, keeping it simple as per "same thing" request
    store_location: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'custom_price_lists',
    timestamps: true
});

export default CustomPriceList;
