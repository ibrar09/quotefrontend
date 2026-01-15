import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ClientGroup = sequelize.define('ClientGroup', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    group_name: { // Parent Group Name (e.g., 'Alshaya', 'Azadea')
        type: DataTypes.STRING,
        allowNull: false
    },
    brand_name: { // Child Brand Name (e.g., 'Starbucks', 'H&M')
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'client_groups',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['group_name', 'brand_name'] } // Prevent duplicates
    ]
});

export default ClientGroup;
