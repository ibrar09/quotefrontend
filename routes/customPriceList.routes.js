import express from 'express';
import {
    createCustomPriceItem,
    getAllCustomPriceItems,
    updateCustomPriceItem,
    deleteCustomPriceItem
} from '../controllers/customPriceList.controller.js';

const router = express.Router();

router.post('/', createCustomPriceItem);
router.get('/', getAllCustomPriceItems);
router.put('/:id', updateCustomPriceItem);
router.delete('/:id', deleteCustomPriceItem);

export default router;
