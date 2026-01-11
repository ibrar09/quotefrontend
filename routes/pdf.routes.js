import express from 'express';
import { generatePdf } from '../controllers/pdf.controller.js';

const router = express.Router();

router.post('/generate', generatePdf);
router.post('/preview-prepare', (req, res, next) => import('../controllers/pdf.controller.js').then(m => m.preparePreview(req, res, next)));
router.get('/preview-data/:id', (req, res, next) => import('../controllers/pdf.controller.js').then(m => m.getPreviewData(req, res, next)));

export default router;
