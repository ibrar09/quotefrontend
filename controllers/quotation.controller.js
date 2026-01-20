// controllers/quotation.controller.js
import * as quotationService from '../services/quotation.service.js';

/**
 * 🔹 CREATE QUOTATION
 * POST /api/quotations
 */
export const createQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.createQuotation(req.body);
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Create Quotation Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      details: error.errors || error.stack
    });
  }
};

/**
 * 🔹 UPDATE QUOTATION (ANY STAGE)
 * PUT /api/quotations/:id
 */
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.updateQuotation(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Update quotation error:', error);

    // Check for Unique Constraint Error (e.g. Duplicate PO or Invoice)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      const value = error.errors[0]?.value || '';
      return res.status(400).json({
        success: false,
        message: `Duplicate entry error: The ${field} '${value}' is already used by another record.`
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
      details: error.errors || error.stack
    });
  }
};

/**
 * 🔹 DELETE QUOTATION
 * DELETE /api/quotations/:id
 */
export const deleteQuotation = async (req, res) => {
  try {
    await quotationService.deleteQuotation(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 GET SINGLE QUOTATION (FULL DETAILS)
 * GET /api/quotations/:id
 */
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 LIST ALL QUOTATIONS
 * GET /api/quotations
 */
export const listQuotations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 300;

    // [NEW] Extract filters
    const filters = {
      city: req.query.city,
      date: req.query.date,
      month: req.query.month, // [NEW]
      year: req.query.year    // [NEW]
    };

    const quotations = await quotationService.listQuotations(page, limit, filters);

    res.status(200).json({
      success: true,
      data: quotations,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 CHECK IF MR EXISTS
 * GET /api/quotations/check-mr?mrNo=...
 */
export const checkMrExists = async (req, res) => {
  try {
    const { mrNo } = req.query;
    if (!mrNo) {
      return res.status(400).json({ success: false, message: 'MR Number is required' });
    }

    const exists = await quotationService.checkMrExists(mrNo);

    res.status(200).json({
      success: true,
      exists,
      message: exists ? 'MR Number already exists' : 'MR Number is available'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 SEARCH QUOTATIONS (ADVANCED FILTERING)
 * GET /api/quotations/search
 */
export const searchQuotations = async (req, res) => {
  try {
    const results = await quotationService.searchQuotations(req.query);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 LIST ALL INTAKES
 * GET /api/quotations/intakes
 */
export const listIntakes = async (req, res) => {
  try {
    const intakes = await quotationService.listIntakes();
    res.status(200).json({
      success: true,
      data: intakes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🔹 UPLOAD IMAGES FOR QUOTATION
 * POST /api/quotations/:id/images
 */
export const uploadQuotationImages = async (req, res) => {
  try {
    const jobId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const images = await quotationService.uploadImages(jobId, files);

    res.status(200).json({
      success: true,
      message: `${files.length} images uploaded successfully`,
      data: images
    });
  } catch (error) {
    console.error('Upload Images Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
