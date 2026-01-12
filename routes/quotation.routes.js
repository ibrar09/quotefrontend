import express from 'express';
import {
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getQuotationById,
  listQuotations,
  listIntakes,
  searchQuotations,
  uploadQuotationImages
} from '../controllers/quotation.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', createQuotation);
router.post('/:id/images', upload.array('images'), uploadQuotationImages);
router.get('/search', searchQuotations);
router.get('/intakes', listIntakes);
router.get('/', listQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
