import express from 'express';
import {
    getDeletedQuotations,
    restoreQuotation,
    permanentlyDeleteQuotation
} from '../controllers/bin.controller.js';

const router = express.Router();

router.get('/quotations', getDeletedQuotations);
router.put('/quotations/:id/restore', restoreQuotation);
router.delete('/quotations/:id', permanentlyDeleteQuotation);

export default router;
