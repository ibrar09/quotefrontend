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
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
    }
    console.error('Request body:', JSON.stringify(req.body, null, 2));
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
    const quotations = await quotationService.listQuotations();

    res.status(200).json({
      success: true,
      data: quotations
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
