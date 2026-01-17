import { Job, JobImage } from '../models/index.js';

// POST /api/jobs/:jobId/upload-media
export const uploadJobMedia = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type } = req.body; // 'BEFORE', 'AFTER'
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const job = await Job.findByPk(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const newImages = [];

        for (const file of files) {
            let fileType = 'IMAGE';
            if (file.mimetype.includes('video')) fileType = 'VIDEO';
            if (file.mimetype.includes('pdf') || file.mimetype.includes('application')) fileType = 'DOCUMENT';

            // Determine correct file path
            // Cloudinary: file.path is URL
            // Local: file.path is system path (backslashes on Windows). Convert to web path.
            let safeFilePath = file.path;
            if (!file.path.startsWith('http')) {
                // Force web-friendly relative path
                safeFilePath = `/uploads/quotations/${file.filename}`;
            }

            const newImage = await JobImage.create({
                job_id: jobId,
                file_path: safeFilePath,
                file_name: file.filename,
                original_name: file.originalname,
                type: type || 'BEFORE',
                file_type: fileType
            });
            newImages.push(newImage);
        }

        res.json({ success: true, count: newImages.length, data: newImages });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/jobs/:jobId/media
export const getJobMedia = async (req, res) => {
    try {
        const { jobId } = req.params;
        const media = await JobImage.findAll({ where: { job_id: jobId } });
        res.json({ success: true, data: media });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
