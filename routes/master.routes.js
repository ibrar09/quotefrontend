import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import stream from 'stream';
import moment from 'moment';
import db from '../models/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { Store, PriceList, Job, PurchaseOrder, Finance, sequelize } = db;

// Helper to clean price strings (e.g., "$1,200.50" -> 1200.50)
const parsePrice = (val) => {
    if (val === null || val === undefined || val === '' || val === '#N/A') return 0;
    const cleaned = String(val).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleaned) || 0;
};

const parseDate = (val) => {
    if (!val || val === '#N/A' || String(val).trim() === '') return null;
    const m = moment(val, ['MM/DD/YYYY', 'M/D/YYYY', 'DD-MMM-YYYY', 'YYYY-MM-DD'], true);
    return m.isValid() ? m.format('YYYY-MM-DD') : null;
};

// --- UNIVERSAL HEADER MAPPER ---
const cleanHeader = (h) => {
    if (!h) return '';
    return String(h)
        .replace(/^\ufeff/, '') // Remove BOM
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

const matchHeader = (headers, aliases) => {
    const cleanedHeaders = headers.map(cleanHeader);
    // 1. Exact Match
    for (const alias of aliases) {
        const cleanedAlias = cleanHeader(alias);
        const idx = cleanedHeaders.indexOf(cleanedAlias);
        if (idx !== -1) return idx;
    }
    // 2. Partial Match Fallback
    for (const alias of aliases) {
        const cleanedAlias = cleanHeader(alias);
        const idx = cleanedHeaders.findIndex(h => h && (h.includes(cleanedAlias) || cleanedAlias.includes(h)));
        if (idx !== -1 && cleanedHeaders[idx].length > 2) return idx;
    }
    return -1;
};

const getRowValue = (row, headers, aliases) => {
    const idx = matchHeader(headers, aliases);
    return (idx !== -1 && row[idx]) ? String(row[idx]).trim() : null;
};

// Robust CSV Parsing helper
const parseCSVBuffer = (buffer) => {
    return new Promise((resolve) => {
        const results = [];
        const content = buffer.toString('utf8');

        // Simple Delimiter Detection
        let delimiter = ',';
        const firstLine = content.split('\n')[0];
        if (!firstLine.includes(',') && firstLine.includes(';')) delimiter = ';';
        if (!firstLine.includes(',') && !firstLine.includes(';') && firstLine.includes('\t')) delimiter = '\t';

        console.log(`📡 [CSV] Detected delimiter: "${delimiter}"`);

        const streamRes = stream.Readable.from(buffer);
        streamRes
            .pipe(csv({ headers: false, separator: delimiter }))
            .on('data', (data) => results.push(Object.values(data)))
            .on('end', () => resolve(results));
    });
};


// 1. UPLOAD MASTER STORES
router.post('/upload-stores', upload.single('file'), async (req, res) => {
    console.log('🚀 [STORES] Upload request received');
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const results = await parseCSVBuffer(req.file.buffer);
        console.log(`📊 [STORES] Received CSV: ${results.length} rows.`);

        if (results.length === 0) return res.json({ message: 'CSV is empty' });

        // Find the header row
        let headerIndex = -1;
        const storeSeed = {
            ccid: ['oracle_ccid', 'ccid', 'store_id'],
            brand: ['brand', 'label']
        };

        for (let i = 0; i < Math.min(results.length, 30); i++) {
            const row = results[i].map(v => cleanHeader(v));
            const hasCCID = storeSeed.ccid.some(a => row.includes(cleanHeader(a)));
            const hasBrand = storeSeed.brand.some(a => row.includes(cleanHeader(a)));
            if (hasCCID || (hasBrand && row.length > 5)) {
                headerIndex = i;
                console.log(`🎯 [STORES] Found headers at row ${i}:`, results[i]);
                break;
            }
        }

        if (headerIndex === -1) {
            console.log('❌ [STORES] Header row not found. First 3 rows:', results.slice(0, 3));
            return res.status(400).json({ error: 'Could not find header row (Oracle CCID, Brand) in CSV' });
        }

        const headers = results[headerIndex].map(h => String(h).trim());
        const dataRows = results.slice(headerIndex + 1);

        const aliases = {
            oracle_ccid: ['oracle_ccid', 'ccid', 'store_ccid', 'oracle_id', 'id', 'store_id', 'ccid_number'],
            region: ['region', 'area', 'zone'],
            city: ['city', 'location', 'town'],
            mall: ['mall', 'site', 'centre', 'center', 'complex', 'site_name'],
            division: ['division', 'business_unit', 'bu', 'sector'],
            brand: ['brand', 'label', 'concept'],
            store_name: ['store_name', 'name', 'shop_name', 'branch'],
            fm_supervisor: ['fm_supervisor', 'supervisor', 'fs', 'fs_new', 'area_supervisor'],
            fm_manager: ['fm_manager', 'manager', 'fm', 'area_manager'],
            sqm: ['sqm', 'size', 'area', 'sqm_area', 'space'],
            store_status: ['store_status', 'status', 'state'],
            store_type: ['store_type', 'type', 'format'],
            opening_date: ['opening_date', 'open_date', 'opened']
        };

        const formatted = dataRows.map(row => {
            const ccid = getRowValue(row, headers, aliases.oracle_ccid);
            if (!ccid) return null;

            return {
                oracle_ccid: ccid,
                region: getRowValue(row, headers, aliases.region),
                city: getRowValue(row, headers, aliases.city),
                mall: getRowValue(row, headers, aliases.mall),
                division: getRowValue(row, headers, aliases.division),
                brand: getRowValue(row, headers, aliases.brand),
                store_name: getRowValue(row, headers, aliases.store_name),
                fm_supervisor: getRowValue(row, headers, aliases.fm_supervisor),
                fm_manager: getRowValue(row, headers, aliases.fm_manager),
                sqm: parsePrice(getRowValue(row, headers, aliases.sqm)),
                store_status: getRowValue(row, headers, aliases.store_status) || 'ACTIVE',
                store_type: getRowValue(row, headers, aliases.store_type),
                opening_date: parseDate(getRowValue(row, headers, aliases.opening_date))
            };
        }).filter(Boolean);

        console.log(`🧹 [STORES] Formatted ${formatted.length} valid rows.`);
        if (formatted.length > 0) {
            console.log('📝 [STORES] Row 1 Sample:', formatted[0]);
        }

        const transaction = await sequelize.transaction();
        try {
            await Store.bulkCreate(formatted, {
                updateOnDuplicate: ['region', 'city', 'mall', 'division', 'brand', 'store_name', 'fm_supervisor', 'fm_manager', 'sqm', 'store_status', 'store_type', 'opening_date'],
                transaction
            });
            await transaction.commit();
            res.json({ message: `Successfully synced ${formatted.length} stores.`, count: formatted.length });
        } catch (dbErr) {
            await transaction.rollback();
            throw dbErr;
        }

    } catch (error) {
        console.error('❌ [STORES] Sync Error:', error);
        res.status(500).json({ error: 'Sync failed: ' + error.message });
    }
});

// 2. UPLOAD PRICE LIST
router.post('/upload-pricelist', upload.single('file'), async (req, res) => {
    console.log('🚀 [PRICELIST] Upload request received');
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const results = await parseCSVBuffer(req.file.buffer);
        console.log(`📊 [PRICELIST] Received CSV: ${results.length} rows.`);

        if (results.length === 0) return res.json({ message: 'CSV is empty' });

        const aliases = {
            code: ['code', 'item_code', 'part_number', 'sku', 'id', 'item_id', 'service_code', 'serial_no', 'sr_no', 'sl_no'],
            type: ['type', 'category', 'group', 'class', 'item_type', 'service_type'],
            description: ['description', 'decription', 'details', 'item_description', 'specification', 'item_name', 'item', 'name', 'work_description', 'task_description', 'scope_of_work', 'service_description', 'material_description'],
            unit: ['unit', 'uom', 'measure', 'qty_unit'],
            material_price: ['material_price', 'material', 'materials', 'mat_price', 'supply', 'unit_price', 'rate', 'unit_rate'],
            labor_price: ['labor_price', 'labor', 'labour', 'lab_price', 'installation', 'fitting'],
            total_price: ['total_price', 'total', 'grand_total', 'total_amount', 'sum'],
            remarks: ['remarks', 'remark', 'note', 'notes'],
            comments: ['comments', 'comment', 'internal_notes']
        };

        let headerIndex = -1;
        for (let i = 0; i < Math.min(results.length, 30); i++) {
            const row = results[i].map(v => cleanHeader(v));
            const hasCode = aliases.code.some(a => row.includes(cleanHeader(a)));
            const hasDesc = aliases.description.some(a => row.includes(cleanHeader(a)));
            if (hasCode && hasDesc) {
                headerIndex = i;
                console.log(`🎯 [PRICELIST] Found headers at row ${i}:`, results[i]);
                break;
            }
        }

        if (headerIndex === -1) {
            console.log('❌ [PRICELIST] Header row not found. First 3 rows:', results.slice(0, 3));
            return res.status(400).json({ error: 'Could not find header row (Item Code, Description) in CSV' });
        }

        const headers = results[headerIndex].map(h => String(h).trim());
        const dataRows = results.slice(headerIndex + 1);

        const formatted = dataRows.map(row => {
            const code = getRowValue(row, headers, aliases.code);
            if (!code) return null;

            const matPrice = parsePrice(getRowValue(row, headers, aliases.material_price));
            const labPrice = parsePrice(getRowValue(row, headers, aliases.labor_price));
            const total = parsePrice(getRowValue(row, headers, aliases.total_price)) || (matPrice + labPrice);

            return {
                code,
                type: getRowValue(row, headers, aliases.type),
                description: getRowValue(row, headers, aliases.description),
                unit: getRowValue(row, headers, aliases.unit),
                material_price: matPrice,
                labor_price: labPrice,
                total_price: total,
                remarks: getRowValue(row, headers, aliases.remarks),
                comments: getRowValue(row, headers, aliases.comments)
            };
        }).filter(Boolean);

        console.log(`🧹 [PRICELIST] Formatted ${formatted.length} valid rows.`);
        if (formatted.length > 0) {
            console.log('📝 [PRICELIST] Row 1 Sample:', formatted[0]);
        }

        const transaction = await sequelize.transaction();
        try {
            await PriceList.bulkCreate(formatted, {
                updateOnDuplicate: ['type', 'description', 'unit', 'material_price', 'labor_price', 'total_price', 'remarks', 'comments'],
                transaction
            });
            await transaction.commit();
            res.json({ message: `Successfully synced ${formatted.length} price items.`, count: formatted.length });
        } catch (dbErr) {
            await transaction.rollback();
            throw dbErr;
        }

    } catch (error) {
        console.error('❌ [PRICELIST] Sync Error:', error);
        res.status(500).json({ error: 'Sync failed: ' + error.message });
    }
});

// 3. UPLOAD HISTORICAL QUOTATIONS
router.post('/upload-quotations', upload.single('file'), async (req, res) => {
    console.log('🚀 [QUOTATIONS] Bulk upload request received');
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const results = await parseCSVBuffer(req.file.buffer);
        console.log(`📊 [QUOTATIONS] Received CSV: ${results.length} rows.`);

        if (results.length === 0) return res.json({ message: 'CSV is empty' });

        const aliases = {
            quote_no: ['q_#', 'quote_no', 'quotation_no', 'quote_#'],
            sent_at: ['q_date', 'quotation_date', 'sent_date', 'date'],
            mr_date: ['mr_date', 'mr_date'],
            mr_no: ['mr_#', 'mr_no'],
            pr_no: ['pr_#', 'pr_no'],
            brand_name: ['brand', 'company', 'brand_name'],
            location: ['location', 'mall', 'site'],
            city: ['city'],
            region: ['region'],
            work_description: ['work_description', 'description', 'work_desc'],
            work_status: ['work_status', 'status'],
            completion_date: ['completion_date', 'comp_date'],
            completed_by: ['completed_by', 'by'],
            po_no: ['po_#', 'po_no', 'po_number'],
            po_date: ['po_date'],
            eta: ['eta'],
            update_notes: ['update'],
            craftsperson_notes: ['craftsperson_notes', 'craft_person_notes'],
            subtotal: ['amount_before_discount', 'amount_ex_vat', 'subtotal'],
            discount: ['discount'],
            vat_amount: ['vat_15', 'vat_amount', 'vat'],
            grand_total: ['amount_inc_vat', 'grand_total', 'total'],
            check_in_date: ['date_of_check_in', 'check_in_date'],
            check_in_time: ['time_of_check_in', 'check_in_time'],
            supervisor: ['supervisor'],
            oracle_ccid: ['ccid', 'oracle_ccid', 'store_id'],
            store_opening_date: ['store_opening_date'],
            comments: ['comments', 'comment'],
            invoice_no: ['invoice_no', 'invoice_#'],
            payment_month: ['month', 'payment_month'],
            received_amount: ['received_amount', 'recv_amt'],
            payment_date: ['payment_date'],
            general_ref: ['ref_#', 'reference']
        };

        let headerIndex = -1;
        for (let i = 0; i < Math.min(results.length, 30); i++) {
            const row = results[i].map(v => cleanHeader(v));
            if (aliases.quote_no.some(a => row.includes(cleanHeader(a)))) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            return res.status(400).json({ error: 'Could not find header row (Q #) in CSV' });
        }

        const headers = results[headerIndex].map(h => String(h).trim());
        const dataRows = results.slice(headerIndex + 1);

        let successCount = 0;
        const transaction = await sequelize.transaction();

        try {
            for (const row of dataRows) {
                const quote_no = getRowValue(row, headers, aliases.quote_no);
                if (!quote_no) continue;

                // 1. UPSERT JOB (Quotation)
                const [job] = await Job.upsert({
                    quote_no,
                    sent_at: parseDate(getRowValue(row, headers, aliases.sent_at)),
                    mr_date: parseDate(getRowValue(row, headers, aliases.mr_date)),
                    mr_no: getRowValue(row, headers, aliases.mr_no),
                    pr_no: getRowValue(row, headers, aliases.pr_no),
                    oracle_ccid: getRowValue(row, headers, aliases.oracle_ccid),
                    brand_name: getRowValue(row, headers, aliases.brand_name),
                    brand: getRowValue(row, headers, aliases.brand_name),
                    location: getRowValue(row, headers, aliases.location),
                    city: getRowValue(row, headers, aliases.city),
                    region: getRowValue(row, headers, aliases.region),
                    work_description: getRowValue(row, headers, aliases.work_description),
                    work_status: 'DONE', // default for historical
                    quote_status: 'APPROVED', // default for historical
                    completion_date: parseDate(getRowValue(row, headers, aliases.completion_date)),
                    completed_by: getRowValue(row, headers, aliases.completed_by),
                    supervisor: getRowValue(row, headers, aliases.supervisor),
                    subtotal: parsePrice(getRowValue(row, headers, aliases.subtotal)),
                    discount: parsePrice(getRowValue(row, headers, aliases.discount)),
                    vat_amount: parsePrice(getRowValue(row, headers, aliases.vat_amount)),
                    grand_total: parsePrice(getRowValue(row, headers, aliases.grand_total)),
                    craftsperson_notes: getRowValue(row, headers, aliases.craftsperson_notes),
                    check_in_date: parseDate(getRowValue(row, headers, aliases.check_in_date)),
                    check_in_time: getRowValue(row, headers, aliases.check_in_time),
                    store_opening_date: parseDate(getRowValue(row, headers, aliases.store_opening_date)),
                    comments: getRowValue(row, headers, aliases.comments)
                }, { transaction });

                // 2. UPSERT PO
                const po_no = getRowValue(row, headers, aliases.po_no);
                if (po_no) {
                    await PurchaseOrder.upsert({
                        po_no,
                        job_id: job.id,
                        po_date: parseDate(getRowValue(row, headers, aliases.po_date)),
                        eta: parseDate(getRowValue(row, headers, aliases.eta)),
                        update_notes: getRowValue(row, headers, aliases.update_notes),
                        amount_ex_vat: parsePrice(getRowValue(row, headers, aliases.subtotal)),
                        vat_15: parsePrice(getRowValue(row, headers, aliases.vat_amount)),
                        total_inc_vat: parsePrice(getRowValue(row, headers, aliases.grand_total))
                    }, { transaction });

                    // 3. UPSERT FINANCE
                    const invoice_no = getRowValue(row, headers, aliases.invoice_no);
                    if (invoice_no) {
                        await Finance.upsert({
                            invoice_no,
                            po_no,
                            payment_month: getRowValue(row, headers, aliases.payment_month),
                            received_amount: parsePrice(getRowValue(row, headers, aliases.received_amount)),
                            payment_date: parseDate(getRowValue(row, headers, aliases.payment_date)),
                            general_ref: getRowValue(row, headers, aliases.general_ref),
                            invoice_status: 'PAID'
                        }, { transaction });
                    }
                }
                successCount++;
            }

            await transaction.commit();
            res.json({ message: `Successfully imported ${successCount} quotations.`, count: successCount });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('❌ [QUOTATIONS] Bulk Upload Error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

export default router;
