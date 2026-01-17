import express from 'express';
import { uploadJobMedia, getJobMedia } from '../controllers/job.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Upload Media (Images, Video, Docs)
// Expects form-data: files[], type (BEFORE/AFTER)
router.post('/:jobId/upload-media', upload.array('files'), uploadJobMedia);

// Get All Media
router.get('/:jobId/media', getJobMedia);

export default router;
