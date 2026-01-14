import { CustomPriceList } from '../models/index.js';
import { Op } from 'sequelize';

// Create
export const createCustomPriceItem = async (req, res) => {
    try {
        const { code } = req.body;
        const existing = await CustomPriceList.findByPk(code);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Item Code already exists in Custom Price List.' });
        }
        const item = await CustomPriceList.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GetAll
export const getAllCustomPriceItems = async (req, res) => {
    try {
        const items = await CustomPriceList.findAll({ order: [['updatedAt', 'DESC']] });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update
export const updateCustomPriceItem = async (req, res) => {
    try {
        const { id } = req.params; // Using 'id' param but mapping to 'code' PK
        const [updated] = await CustomPriceList.update(req.body, { where: { code: id } });
        if (!updated) return res.status(404).json({ success: false, message: 'Item not found' });

        const item = await CustomPriceList.findByPk(id);
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete
export const deleteCustomPriceItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CustomPriceList.destroy({ where: { code: id } });
        if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });

        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
