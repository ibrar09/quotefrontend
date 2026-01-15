import express from 'express';
import { getGroupBrands, addBrandToGroup, removeBrandFromGroup } from '../controllers/clientGroup.controller.js';

const router = express.Router();

router.get('/:groupName/brands', getGroupBrands);
router.post('/:groupName/brands', addBrandToGroup);
router.delete('/:id', removeBrandFromGroup);

export default router;
