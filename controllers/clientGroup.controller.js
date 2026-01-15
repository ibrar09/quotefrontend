import { ClientGroup } from '../models/index.js';

// GET /api/client-groups/:groupName/brands
export const getGroupBrands = async (req, res) => {
    try {
        const { groupName } = req.params;
        const brands = await ClientGroup.findAll({
            where: { group_name: groupName },
            attributes: ['id', 'brand_name', 'group_name'],
            order: [['brand_name', 'ASC']]
        });
        res.json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/client-groups/:groupName/brands
export const addBrandToGroup = async (req, res) => {
    try {
        const { groupName } = req.params;
        const { brand_name } = req.body;

        if (!brand_name) return res.status(400).json({ success: false, message: 'Brand Name is required' });

        const newBrand = await ClientGroup.create({
            group_name: groupName,
            brand_name: brand_name.trim()
        });

        res.json({ success: true, data: newBrand, message: 'Brand added successfully' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'Brand already exists in this group' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/client-groups/:id
export const removeBrandFromGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await ClientGroup.destroy({ where: { id } });
        res.json({ success: true, message: 'Brand removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
