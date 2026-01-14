import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CustomStore = sequelize.define('CustomStore', {
    // Primary Key (CCID)
    oracle_ccid: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    // Standard Store Fields
    region: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    mall: { type: DataTypes.STRING },
    division: { type: DataTypes.STRING },
    brand: { type: DataTypes.STRING },
    store_name: { type: DataTypes.STRING },
    store_type: { type: DataTypes.STRING },
    opening_date: { type: DataTypes.DATEONLY },
    sqm: { type: DataTypes.DECIMAL(10, 2) },

    // Personnel
    fm_supervisor: { type: DataTypes.STRING },
    fm_manager: { type: DataTypes.STRING },

    // Status
    store_status: { type: DataTypes.STRING },

    // Requested Extra Fields
    map_location: { type: DataTypes.TEXT } // For Google Maps Link or similar
}, {
    tableName: 'custom_stores',
    timestamps: true
});

export default CustomStore;
