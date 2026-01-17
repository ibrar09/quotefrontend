import express from 'express';
import quotationRoutes from './quotation.routes.js';
import jobItemRoutes from './jobitem.routes.js';
import priceListRoutes from './pricelist.routes.js'; // ✅ import the price list routes
import financeRoutes from './finance.routes.js';     // ✅ optional: add finance routes if you create them
import purchaseOrderRoutes from './purchaseorder.routes.js';
import storeRoutes from './storeRoutes.js';
import customStoreRoutes from './customStore.routes.js'; // New Route
import customPriceListRoutes from './customPriceList.routes.js'; // New Route
import pdfRoutes from './pdf.routes.js';
import masterRoutes from './master.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import clientGroupRoutes from './clientGroup.routes.js'; // [NEW]
import jobRoutes from './job.routes.js'; // [NEW]
import binRoutes from './bin.routes.js'; // [NEW] Recycling Bin

const router = express.Router();

// 🔹 Mount all routes
router.use('/notifications', notificationRoutes);
router.use('/client-groups', clientGroupRoutes);
router.use('/jobs', jobRoutes);
router.use('/bin', binRoutes); // [NEW]
router.use('/dashboard', dashboardRoutes);
router.use('/quotations', quotationRoutes);
router.use('/jobitems', jobItemRoutes);
router.use('/pricelist', priceListRoutes);
router.use('/custom-pricelist', customPriceListRoutes); // New Endpoint
router.use('/pdf', pdfRoutes);
router.use('/finance', financeRoutes); // optional
router.use('/purchaseorders', purchaseOrderRoutes);
router.use('/stores', storeRoutes);
router.use('/custom-stores', customStoreRoutes); // New Endpoint
router.use('/master', masterRoutes);
// 🔹 Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API running' });
});

export default router;
