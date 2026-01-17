import { Job } from '../models/index.js';
import { Op } from 'sequelize';

// Get Deleted Quotations
export const getDeletedQuotations = async (req, res) => {
    try {
        const deletedJobs = await Job.findAll({
            where: {
                deletedAt: {
                    [Op.not]: null
                }
            },
            paranoid: false,
            order: [['deletedAt', 'DESC']]
        });

        res.json({ success: true, data: deletedJobs });
    } catch (error) {
        console.error("Error fetching bin:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Restore Quotation
export const restoreQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Job.restore({ where: { id } });

        if (!result) return res.status(404).json({ success: false, message: "Job not found in bin" });

        res.json({ success: true, message: "Quotation restored successfully" });
    } catch (error) {
        console.error("Error restoring quotation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Permanently Delete
export const permanentlyDeleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Job.destroy({
            where: { id },
            force: true // Hard Delete
        });

        if (!result) return res.status(404).json({ success: false, message: "Job not found" });

        res.json({ success: true, message: "Quotation permanently deleted" });
    } catch (error) {
        console.error("Error deleting quotation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
