import { CustomStore } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new Custom Store
export const createCustomStore = async (req, res) => {
    try {
        const { oracle_ccid } = req.body;

        // Check for duplicates
        const existing = await CustomStore.findByPk(oracle_ccid);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Store with this CCID already exists (Custom).' });
        }

        const store = await CustomStore.create(req.body);
        res.status(201).json({ success: true, data: store });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get All Custom Stores
export const getAllCustomStores = async (req, res) => {
    try {
        const stores = await CustomStore.findAll({ order: [['updatedAt', 'DESC']] });
        res.json({ success: true, data: stores });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Custom Store
export const getCustomStore = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await CustomStore.findByPk(id);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
        res.json({ success: true, data: store });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Custom Store
export const updateCustomStore = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await CustomStore.update(req.body, { where: { oracle_ccid: id } });
        if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });

        const store = await CustomStore.findByPk(id);
        res.json({ success: true, data: store });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete Custom Store
export const deleteCustomStore = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CustomStore.destroy({ where: { oracle_ccid: id } });
        if (!deleted) return res.status(404).json({ success: false, message: 'Store not found' });

        res.json({ success: true, message: 'Store deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
