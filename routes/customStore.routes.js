import express from 'express';
import {
    createCustomStore,
    getAllCustomStores,
    getCustomStore,
    updateCustomStore,
    deleteCustomStore
} from '../controllers/customStore.controller.js';

const router = express.Router();

router.post('/', createCustomStore);
router.get('/', getAllCustomStores);
router.get('/:id', getCustomStore);
router.put('/:id', updateCustomStore);
router.delete('/:id', deleteCustomStore);

export default router;
