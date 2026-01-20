import { Op } from 'sequelize';
import { Job, JobItem, Store, PriceList, PurchaseOrder, Finance, JobImage } from '../models/index.js';

/**
 * 🔹 Helper: Calculate totals safely
 */
const calculateTotals = async (jobId, discount = 0) => {
  const items = await JobItem.findAll({ where: { job_id: jobId } });

  let subtotal = 0;
  for (const item of items) {
    // Qty only applies to material, labor is flat rate
    const materialTotal = Number(item.quantity || 0) * Number(item.material_price || 0);
    const laborTotal = Number(item.labor_price || 0);
    subtotal += materialTotal + laborTotal;
  }

  const vat_amount = subtotal * 0.15;
  const grand_total = subtotal - discount + vat_amount;

  await Job.update(
    { subtotal, discount, vat_amount, grand_total },
    { where: { id: jobId } }
  );

  return { subtotal, vat_amount, grand_total };
};

/**
 * 🔹 CREATE QUOTATION
 */
export const createQuotation = async (data) => {
  const { quote_no, mr_no, mr_date, oracle_ccid, work_description, items = [], discount = 0, images = [], store_opening_date, continuous_assessment } = data;

  if (!quote_no) throw new Error('Quotation Number is required');
  // if (!oracle_ccid) throw new Error('Store CCID is required'); // OPTIONAL NOW

  // 1. Check if Quote No already exists
  const existingJob = await Job.findOne({ where: { quote_no } });
  if (existingJob) {
    throw new Error(`Quotation #${quote_no} already exists in the system. Please use a unique number or refresh the page.`);
  }

  // 2. Validate Store (Optional - Custom CCID allowed)
  const store = oracle_ccid ? await Store.findByPk(oracle_ccid) : null;

  // 3. Create Job
  const job = await Job.create({
    quote_no,
    mr_no,
    mr_date,
    oracle_ccid: oracle_ccid || null, // Ensure empty string becomes NULL
    work_description,
    discount,
    quote_status: data.quote_status || 'DRAFT',
    brand: store?.brand || data.brand || '',
    brand_name: store?.brand || data.brand_name || '',
    location: store?.mall || data.location || '',
    city: store?.city || data.city || '',
    region: store?.region || data.region || '',
    store_opening_date,
    continuous_assessment
  });

  // 🔹 Create Items
  for (const item of items) {
    let material_price = 0;
    let labor_price = 0;

    let unit_price = 0;

    // 1. Prefer USER provided price (from frontend) - prioritize unit_price
    if (item.unit_price !== undefined) {
      material_price = Number(item.material_price) || 0;
      labor_price = Number(item.labor_price) || 0;
      unit_price = Number(item.unit_price);
    }
    else if (item.material_price !== undefined && item.labor_price !== undefined) {
      material_price = Number(item.material_price);
      labor_price = Number(item.labor_price);
      unit_price = material_price + labor_price;
    }
    // 2. Fallback to PriceList IF user sent code but NO price (rare, but safety net)
    else if (item.item_code) {
      const price = await PriceList.findByPk(item.item_code);
      if (price) {
        material_price = Number(price.material_price) || 0;
        labor_price = Number(price.labor_price) || 0;
        unit_price = Number(price.total_price) || (material_price + labor_price);
      }
    }

    await JobItem.create({
      job_id: job.id,
      item_code: item.item_code || null,
      description: item.description,
      unit: item.unit || 'PCS',
      quantity: item.quantity || 1,
      material_price,
      labor_price,
      unit_price,
      remarks: item.remarks
    });
  }

  // 🔹 Create Images
  if (images && images.length > 0) {
    for (const imgData of images) {
      if (imgData) {
        const isPath = typeof imgData === 'string' && (imgData.startsWith('/uploads') || imgData.startsWith('http'));
        await JobImage.create({
          job_id: job.id,
          image_data: isPath ? null : imgData,
          file_path: isPath ? imgData : null
        });
      }
    }
  }

  // 🔹 Recalculate totals
  await calculateTotals(job.id, discount);

  return job;
};

/**
 * 🔹 UPDATE QUOTATION (ANY STAGE)
 */
export const updateQuotation = async (jobId, data) => {
  const job = await Job.findByPk(jobId);
  if (!job) throw new Error('Quotation not found');

  // 🔹 Sanitize data for Job.update (remove nested associations)
  const { JobItems, Store, PurchaseOrders, Finance: financeInput, items, ...jobData } = data;

  // Update Job main fields
  if (jobData.oracle_ccid === '') jobData.oracle_ccid = null; // Sanitize empty string
  await job.update(jobData);

  // 🔹 Update Nested PurchaseOrder & Finance
  if (PurchaseOrders && PurchaseOrders.length > 0) {
    const poData = PurchaseOrders[0];
    let po = await PurchaseOrder.findOne({ where: { job_id: jobId } });

    if (po) {
      // ✅ Use instance update to safely handle PK changes and avoid updating unintended records
      await po.update(poData);
    } else {
      po = await PurchaseOrder.create({ ...poData, job_id: jobId });
    }

    // Update Finance linked to this PO
    if (financeInput) {
      // Ensure we don't pass nested things into Finance update
      const { ...finData } = financeInput;

      // Provide valid defaults for ENUM fields to prevent DB errors
      if (finData.invoice_status === "" || !finData.invoice_status) {
        finData.invoice_status = 'NOT_SUBMITTED';
      }

      // Check if PO number is valid before trying to link finance
      if (po.po_no) {
        let fin = await Finance.findOne({ where: { po_no: po.po_no } });
        if (fin) {
          await fin.update(finData);
        } else {
          await Finance.create({ ...finData, po_no: po.po_no });
        }
      }
    }
  }

  // 🔹 Handle Items
  if (items) {
    await JobItem.destroy({ where: { job_id: jobId } });
    for (const item of items) {
      let material_price = Number(item.material_price) || 0;
      let labor_price = Number(item.labor_price) || 0;
      // Prioritize unit_price if sent by frontend, else material + labor
      const unit_price = Number(item.unit_price) || (material_price + labor_price);

      await JobItem.create({
        job_id: jobId,
        item_code: item.item_code || null,
        description: item.description,
        quantity: item.quantity || 1,
        material_price,
        labor_price,
        unit_price,
        remarks: item.remarks
      });
    }
  }

  // 🔹 Handle Images (Replace All)
  if (data.images) {
    await JobImage.destroy({ where: { job_id: jobId } });
    for (const imgData of data.images) {
      if (imgData) {
        const isPath = typeof imgData === 'string' && (imgData.startsWith('/uploads') || imgData.startsWith('http'));
        await JobImage.create({
          job_id: jobId,
          image_data: isPath ? null : imgData,
          file_path: isPath ? imgData : null
        });
      }
    }
  }

  await calculateTotals(jobId, jobData.discount || job.discount);
  return job;
};

/**
 * 🔹 DELETE QUOTATION
 */
export const deleteQuotation = async (jobId) => {
  const job = await Job.findByPk(jobId);
  if (!job) throw new Error('Quotation not found');

  await Job.destroy({ where: { id: jobId } });
  return true;
};

/**
 * 🔹 GET SINGLE QUOTATION (FULL DETAILS)
 */
export const getQuotationById = async (jobId) => {
  return Job.findByPk(jobId, {
    include: [
      { model: JobItem },
      { model: Store },
      { model: JobImage }, // Include Images
      {
        model: PurchaseOrder,
        include: [{ model: Finance }]
      }
    ]
  });
};

/**
 * 🔹 LIST ALL QUOTATIONS (Excludes Intakes)
 */
/**
 * 🔹 LIST ALL QUOTATIONS (Excludes Intakes)
 * Supports pagination params but defaults to recent 300 for speed
 */
export const listQuotations = async (page = 1, limit = 300, filters = {}) => {
  const offset = (page - 1) * limit;

  const where = {
    is_latest: true,
    quote_status: { [Op.notIn]: ['INTAKE', 'PREVIEW'] }
  };

  // [NEW] Add City Filter
  if (filters.city) {
    where.city = { [Op.iLike]: `%${filters.city}%` };
  }

  // [NEW] Add Date Filter (createdAt)
  if (filters.date) {
    // Assuming filters.date is "YYYY-MM-DD"
    // We need to match the whole day.
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    where.createdAt = {
      [Op.between]: [startOfDay, endOfDay]
    };
  }

  // [NEW] Add Month Filter (YYYY-MM)
  if (filters.month) {
    const [year, month] = filters.month.split('-');
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    where.createdAt = {
      [Op.between]: [startOfMonth, endOfMonth]
    };
  }

  // [NEW] Add Year Filter (YYYY)
  if (filters.year) {
    const year = parseInt(filters.year);
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    where.createdAt = {
      [Op.between]: [startOfYear, endOfYear]
    };
  }

  return Job.findAll({
    attributes: [
      'id', 'quote_no', 'mr_no', 'mr_date', 'pr_no', 'brand', 'brand_name',
      'location', 'city', 'region', 'quote_status', 'work_status',
      'work_description', 'grand_total', 'createdAt', 'oracle_ccid',
      'subtotal', 'vat_amount', 'discount', 'transportation', 'sent_at', 'completion_date',
      'completed_by', 'supervisor', 'comments', 'craftsperson_notes',
      'check_in_date', 'check_in_time', 'mr_priority', 'currency', 'version'
    ],
    where,
    include: [
      {
        model: Store,
        attributes: ['mall', 'city', 'region', 'brand']
      },
      {
        model: PurchaseOrder,
        attributes: ['po_no', 'po_date', 'amount_ex_vat', 'total_inc_vat', 'eta', 'update_notes'],
        include: [{
          model: Finance,
          attributes: [
            'invoice_no', 'invoice_status', 'received_amount', 'invoice_date',
            'payment_date', 'payment_month', 'hsbc_no', 'vat_status', 'vat_duration',
            'days_outstanding', 'our_bank_ref', 'company_bank_ref', 'payment_status',
            'payment_ref', 'general_ref', 'bank_date', 'advance_payment'
          ]
        }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset,
    // [Performance] Subqueries can be slow, but needed for includes with limits in 1:M specific cases.
    // However, Job is 1:1 with Store (mostly) and 1:M with PO but we only take first usually.
    // subQuery: false // Try toggle if issues arise
  });
};

/**
 * 🔹 LIST ALL INTAKES
 */
export const listIntakes = async () => {
  return Job.findAll({
    where: { quote_status: 'INTAKE' },
    include: [{ model: Store }],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * 🔹 CHECK IF MR EXISTS
 */
export const checkMrExists = async (mrNo) => {
  if (!mrNo) return false;
  const existingJob = await Job.findOne({ where: { mr_no: mrNo } });
  return !!existingJob;
};

/**
 * 🔹 ADVANCED SEARCH (ANY FIELD)
 */
export const searchQuotations = async (filters) => {
  const where = {};

  if (filters.quote_no)
    where.quote_no = { [Op.iLike]: `%${filters.quote_no}%` };

  if (filters.mr_no)
    where.mr_no = { [Op.iLike]: `%${filters.mr_no}%` };

  if (filters.oracle_ccid)
    where.oracle_ccid = filters.oracle_ccid;

  if (filters.quote_status)
    where.quote_status = filters.quote_status;

  if (filters.work_status)
    where.work_status = filters.work_status;

  if (filters.from_date && filters.to_date)
    where.createdAt = { [Op.between]: [filters.from_date, filters.to_date] };

  return Job.findAll({
    where,
    include: [{ model: Store }],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * 🔹 UPLOAD IMAGES SERVICE
 */
export const uploadImages = async (jobId, files) => {
  const images = [];
  for (const file of files) {
    console.log('🖼️ [SERVICE] Processing uploaded file:', {
      original: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });

    // Determine path based on storage type
    let filePath;
    if (process.env.STORAGE_TYPE === 'CLOUDINARY') {
      // Cloudinary returns the full URL in `file.path`
      filePath = file.path;
    } else {
      // Local storage: construct relative path for frontend
      filePath = `/uploads/quotations/${file.filename}`;
    }

    const img = await JobImage.create({
      job_id: jobId,
      file_path: filePath,
      file_name: file.filename || file.originalname, // Cloudinary might not give filename in the same way
      original_name: file.originalname
    });
    images.push(img);
  }
  return images;
};
