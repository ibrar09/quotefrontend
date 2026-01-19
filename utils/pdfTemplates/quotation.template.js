
import fs from 'fs';
import path from 'path';

export const generateQuotationHTML = (data) => {
    // 1. Read Base64 Assets (Logo, Stamp, Signature)
    //    Ideally, these should be cached or read once. For now, read synchronously safe.
    let logoBase64 = '';
    let stampBase64 = '';
    let signatureBase64 = '';

    try {
        if (fs.existsSync('./logo_base64.txt')) logoBase64 = fs.readFileSync('./logo_base64.txt', 'utf-8').trim();
        // Assume stamp/signature might be stored similarly or passed in data. 
        // For this implementation, I will rely on the paths passed in data or generic placeholders if needed.
        // However, backend templates usually need absolute paths or base64.
        // Let's assume we can read them from assets if they exist locally.
    } catch (e) {
        console.warn('Error reading assets for PDF template', e);
    }

    // Helper to format currency
    const fmt = (num) => Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

    // Calculate Totals if not provided pre-calculated
    // (Though usually passed in `data`, recalculating ensures consistency)
    const items = data.items || [];
    const subTotalMaterial = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.material_price || 0)), 0);
    const subTotalLabor = items.reduce((acc, item) => acc + Number(item.labor_price || 0), 0);
    const initialScopeTotal = subTotalMaterial + subTotalLabor;
    const transport = Number(data.transportation || 0);
    const discount = Number(data.discount || 0);
    const totalWithAdj = initialScopeTotal + transport - discount;
    const vat = totalWithAdj * 0.15;
    const grandTotal = totalWithAdj + vat;

    // --- Pagination / Spacing Logic ---
    // Estimate content height to determine if we need filler rows to avoid gaps on Page 1
    // when the footer is pushed to Page 2.
    let estimatedTableHeight = 0;
    items.forEach(item => {
        const descLen = (item.description || '').length;
        // Approx chars per line: 80. Line height ~14px. Base padding ~12px.
        const lines = Math.floor(descLen / 80) + 1;
        // Estimate height per item: Base 30px + extra lines
        estimatedTableHeight += Math.max(35, lines * 14 + 16);
    });

    // Thresholds (in pixels approx)
    // If content > ~450px, the Footer (Images+Totals) usually jumps to Page 2.
    // If that happens, we want the Table to extend to ~850px to fill Page 1.
    const SINGLE_PAGE_THRESHOLD = 450;
    const PAGE_1_TARGET_HEIGHT = 850;

    let finalFillerCount = 0;
    let dynamicPadding = 6; // Default p-2 is approx 6px-8px. Let's start with base 6px.
    const MAX_PADDING = 16; // Don't let rows get too tall (looks weird)
    const MIN_ROWS = 10;

    // Logic: If footer pushed to Page 2 (estimated > 450), we want to fill Page 1 (target 850).
    // First, try to expand rows by identifying the "gap".
    if (estimatedTableHeight > SINGLE_PAGE_THRESHOLD && estimatedTableHeight < PAGE_1_TARGET_HEIGHT) {
        const gap = PAGE_1_TARGET_HEIGHT - estimatedTableHeight;
        // How much extra padding per row (top+bottom) can we add?
        // extra total padding per item = gap / items.length
        // extra one-side padding = (gap / items.length) / 2
        const extraPaddingPerSide = Math.floor((gap / items.length) / 2);

        // Apply, but cap at MAX_PADDING
        dynamicPadding = Math.min(6 + extraPaddingPerSide, MAX_PADDING);

        // Recalculate used height with new padding
        const addedHeight = (dynamicPadding - 6) * 2 * items.length;
        const newEstimatedHeight = estimatedTableHeight + addedHeight;

        // If there is STILL a gap, fill it with filler rows
        const remainingGap = PAGE_1_TARGET_HEIGHT - newEstimatedHeight;
        const calculatedFiller = Math.ceil(remainingGap / 35); // ~35px per expanded filler row
        finalFillerCount = Math.max(0, calculatedFiller);
    } else {
        // Standard small quote or huge quote
        finalFillerCount = Math.max(0, MIN_ROWS - items.length);
    }


    // --- Template String ---
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            
            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            body { 
                margin: 0; 
                padding: 0; 
                font-family: 'Outfit', sans-serif; 
                background: white; 
                color: black;
                font-size: 10px;
                line-height: 1.1;
                /* REVERTED: Standard Block Display */
                display: block;
            }

            /* REMOVED: Flex wrapper logic to restore standard flow */
            .content-wrapper {
                width: 100%;
            }

            .table-wrapper {
                width: 100%;
                /* Restoring standard table container */
                margin-bottom: 4px;
            }
            
            /* Keep utility classes */

            /* --- UTILITIES --- */
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .justify-end { justify-content: flex-end; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .whitespace-nowrap { white-space: nowrap; }
            
            /* Sizing matches Tailwind text-[8px] / text-[10px] */
            .text-xs { font-size: 8px; line-height: 10px; }
            .text-sm { font-size: 10px; line-height: 12px; }
            
            /* Colors */
            .bg-gray-200 { background-color: #e5e7eb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-theme { background-color: #e2d1a5; }
            
            /* Borders */
            .border { border: 1px solid black; }
            .border-r { border-right: 1px solid black; }
            .border-b { border-bottom: 1px solid black; }
            .border-t { border-top: 1px solid black; }
            .border-l { border-left: 1px solid black; }
            .border-none { border: none; }

            .p-1 { padding: 4px; }
            .p-2 { padding: 6px; } /* Increased padding for table rows */
            
            /* Table */
            table { width: 100%; border-collapse: collapse; page-break-inside: auto; table-layout: fixed; }
            tr { page-break-inside: avoid; }
            td, th { vertical-align: top; }

            /* GRID SYSTEM SIMULATION (To match frontend grid-cols-12 nested grid-cols-4) */
            .grid-row { display: flex; width: 100%; }
            .col-4 { width: 33.3333%; display: flex; } /* 4/12 */
            .col-8 { width: 66.6666%; display: flex; } /* 8/12 */
            .col-12 { width: 100%; display: flex; }    /* 12/12 */

            /* Inner Cell Widths based on grid-cols-4 inside col-span-4 */
            /* Label = 1/4 of 33% = 8.33% total width */
            /* Value = 3/4 of 33% = 25% total width */
            .label-cell { width: 25%; } 
            .value-cell { width: 75%; }
            
            /* Special case for "Quote Revised" (col-span-2 inside col-4) -> 50/50 split */
            .half-cell { width: 50%; }

            /* ITEMS TABLE COLUMN WIDTHS */
            /* ALIGNMENT FIX: */
            /* Top Table Label = 25% of 33.33% = 8.333% */
            /* Top Table Value = 75% of 33.33% = 25.000% */
            /* To align "CODE" line with "DATE" line, CODE must be 8.33% */
            
            .col-code { width: 8.333%; }   /* Aligns with top labels */
            .col-desc { width: 56.667%; } /* Remaining dynamic space */
            .col-unit { width: 5%; } 
            .col-qty  { width: 5%; }  
            .col-mat  { width: 8%; } 
            .col-lab  { width: 8%; } 
            .col-tot  { width: 9%; }
            
        </style>
    </head>
    <body>

        <!-- INFO GRID (First Page Details) -->
        <!-- Note: Borders handled on cells to match frontend 'border-r border-b' pattern -->
        <div style="border-top: 1px solid black; border-left: 1px solid black; margin-bottom: 4px;">
            
            <!-- ROW 1 -->
            <div class="grid-row">
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Date</div>
                    <div class="value-cell border-r border-b p-1 text-sm">${data.date || ''}</div>
                </div>
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Attention To</div>
                    <div class="value-cell border-r border-b p-1 text-sm" style="text-transform: uppercase;">${data.attentionTo || ''}</div>
                </div>
                <div class="col-4">
                    <div class="half-cell bg-theme border-r border-b p-1 text-xs font-bold uppercase">Quote Revised</div>
                    <div class="half-cell border-r border-b p-1 text-sm font-bold">V.${data.version || '1.0'}</div>
                </div>
            </div>

            <!-- ROW 2 -->
            <div class="grid-row">
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Brand</div>
                    <div class="value-cell border-r border-b p-1 text-sm" style="text-transform: uppercase;">${data.brand || ''}</div>
                </div>
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Quote #</div>
                    <div class="value-cell border-r border-b p-1 text-sm" style="text-transform: uppercase;">${data.quote_no || ''}</div>
                </div>
                <div class="col-4">
                    <div class="half-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Validity</div>
                    <div class="half-cell border-r border-b p-1 text-sm font-bold">${data.validity || '30 Days'}</div>
                </div>
            </div>

             <!-- ROW 3 -->
            <div class="grid-row">
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Location</div>
                    <div class="value-cell border-r border-b p-1 text-sm" style="text-transform: uppercase;">${data.location || '-'}</div>
                </div>
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">MR #</div>
                    <div class="value-cell border-r border-b p-1 text-sm" style="text-transform: uppercase;">${data.mr_no || ''}</div>
                </div>
                <div class="col-4">
                     <div class="half-cell bg-theme border-r border-b p-1 text-xs font-bold uppercase">MR Rec Date</div>
                    <div class="half-cell border-r border-b p-1 text-sm font-bold">${data.mr_date || ''}</div>
                </div>
            </div>

            <!-- ROW 4 -->
            <div class="grid-row">
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">City</div>
                    <div class="value-cell border-r border-b p-1 text-sm">${data.city || '-'}</div>
                </div>
                <div class="col-4">
                    <div class="label-cell bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase">Store CCID</div>
                    <div class="value-cell border-r border-b p-1 text-sm">${data.oracle_ccid || ''}</div>
                </div>
                <div class="col-4">
                    <div class="half-cell bg-theme border-r border-b p-1 text-xs font-bold uppercase">MR Priority</div>
                    <div class="half-cell border-r border-b p-1 text-sm font-bold">${data.mr_priority || 'Normal'}</div>
                </div>
            </div>

            <!-- ROW 5 -->
            <div class="grid-row">
                <div class="col-8">
                     <!-- 1/8 of 2/3 width = 12.5% label -->
                    <div class="bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase" style="width: 12.5%">MR Desc.</div>
                    <div class="border-r border-b p-1 text-sm" style="width: 87.5%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 18px;">${data.work_description || ''}</div>
                </div>
                <div class="col-4">
                    <div class="half-cell bg-theme border-r border-b p-1 text-xs font-bold uppercase">Store Opening</div>
                    <div class="half-cell border-r border-b p-1 text-sm font-bold">${data.store_opening_date || ''}</div>
                </div>
            </div>

            <!-- ROW 6 -->
             <div class="grid-row">
                <div class="col-12">
                     <!-- 1/12 = 8.33% -->
                    <div class="bg-gray-200 border-r border-b p-1 text-xs font-bold uppercase" style="width: 8.33%">Cont. Assess</div>
                    <div class="border-r border-b p-1 text-sm whitespace-pre-wrap" style="width: 91.67%">${data.continuous_assessment || ''}</div>
                </div>
            </div>

        </div>

        <!-- ITEMS TABLE -->
        <div class="table-wrapper">
        <table>
            <thead>
                <tr class="bg-gray-100 font-bold uppercase text-[9px]">
                    <th class="border p-1 text-center col-code">CODE</th>
                    <th class="border p-1 text-left col-desc">DESCRIPTION</th>
                    <th class="border p-1 text-center col-unit">UNIT</th>
                    <th class="border p-1 text-center col-qty">QTY</th>
                    <th class="border p-1 text-right col-mat">MAT.</th>
                    <th class="border p-1 text-right col-lab">LAB.</th>
                    <th class="border p-1 text-right col-tot">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr class="font-bold text-sm">
                    <td class="border text-center" style="padding: ${dynamicPadding}px;">${item.item_code}</td>
                    <td class="border whitespace-pre-wrap" style="padding: ${dynamicPadding}px; text-transform: uppercase;">${item.description}</td>
                    <td class="border text-center" style="padding: ${dynamicPadding}px;">${item.unit}</td>
                    <td class="border text-center" style="padding: ${dynamicPadding}px;">${item.quantity}</td>
                    <td class="border text-right" style="padding: ${dynamicPadding}px;">${fmt(item.material_price)}</td>
                    <td class="border text-right" style="padding: ${dynamicPadding}px;">${fmt(item.labor_price)}</td>
                    <td class="border text-right bg-gray-50" style="padding: ${dynamicPadding}px;">
                        ${fmt((Number(item.quantity) * Number(item.material_price)) + Number(item.labor_price))}
                    </td>
                </tr>
                `).join('')}

                <!-- FILLER ROWS (Dynamic Spacing) -->
                ${(() => {
            if (finalFillerCount <= 0) return '';
            return Array(finalFillerCount).fill(0).map(() => `
                        <tr>
                            <td class="col-code border-r border-l" style="height: 30px;">&nbsp;</td>
                            <td class="col-desc border-r">&nbsp;</td>
                            <td class="col-unit border-r">&nbsp;</td>
                            <td class="col-qty border-r">&nbsp;</td>
                            <td class="col-mat border-r">&nbsp;</td>
                            <td class="col-lab border-r">&nbsp;</td>
                            <td class="col-tot border-r">&nbsp;</td>
                        </tr>
                    `).join('');
        })()}
                
                <!-- TOTALS ROW FOR ITEMS -->
                 <tr class="font-bold bg-gray-100 uppercase text-sm">
                    <td colspan="4" class="border p-1 text-center"></td>
                    <td class="border p-1 text-right">${fmt(subTotalMaterial)}</td>
                    <td class="border p-1 text-right">${fmt(subTotalLabor)}</td>
                    <td class="border p-1 text-right">${fmt(initialScopeTotal)}</td>
                </tr>
            </tbody>
        </table>
        </div>

         <!-- WRAPPER FOR IMAGES AND TOTALS -->
         <div style="display: flex; margin-top: 4px; border: none; page-break-inside: avoid;">
            
            <!-- LEFT: IMAGES (50%) -->
            <div style="width: 50%; padding-right: 4px;">
                ${(() => {
            const imgList = (data.images || []).slice(0, 9);
            const count = imgList.length;

            if (count === 0) return '';

            // Adaptive Grid Logic
            let gridCols = '1fr';
            let gridRows = '1fr';
            let itemHeight = '100%';

            if (count === 1) {
                gridCols = '1fr';
                itemHeight = '260px'; // Full height
            } else if (count === 2) {
                gridCols = '1fr 1fr';
                itemHeight = '260px'; // Full height split
            } else if (count <= 4) {
                gridCols = '1fr 1fr';
                gridRows = '1fr 1fr';
                itemHeight = '125px'; // Half height
            } else if (count <= 6) {
                gridCols = 'repeat(3, 1fr)';
                gridRows = 'repeat(2, 1fr)';
                itemHeight = '125px'; // Half height
            } else {
                // 7-9 Images -> 3x3 Grid
                gridCols = 'repeat(3, 1fr)';
                gridRows = 'repeat(3, 1fr)';
                itemHeight = '85px'; // 1/3 height
            }

            const gridStyle = `display: grid; grid-template-columns: ${gridCols}; grid-template-rows: ${gridRows}; gap: 4px; border: 1px solid #d1d5db; background: #f9fafb; padding: 2px; height: 270px; overflow: hidden;`;

            return `
                   <div style="${gridStyle}">
                      ${imgList.map(img => {
                const src = img ? (img.file_path || img) : '';
                if (!src) return '';
                return `
                              <div style="height: ${itemHeight}; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #d1d5db; background: white;">
                                 <img src="${src}" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
                              </div>
                          `;
            }).join('')}
                   </div>
                   `;
        })()}
            </div>

            <!-- RIGHT: TOTALS & SIGNATURE (50%) -->
            <div style="width: 50%; padding-left: 4px;">
                <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-bottom: 4px;">
                     <tr class="bg-gray-50 font-bold text-sm">
                        <td class="border p-1 uppercase text-left" colspan="2">TRANSPORTATION</td>
                        <td class="border p-1 text-right">${fmt(transport)}</td>
                    </tr>
                    <tr class="bg-gray-50 font-bold text-sm">
                        <td class="border p-1 uppercase text-left" colspan="2">DISCOUNT</td>
                        <td class="border p-1 text-right">${fmt(discount)}</td>
                    </tr>
                    <tr class="bg-gray-100 font-bold italic text-sm">
                        <td class="border p-1 uppercase text-left" colspan="2">Sub-Total</td>
                        <td class="border p-1 text-right">${fmt(totalWithAdj)}</td>
                    </tr>
                     <tr class="bg-gray-50 font-bold text-sm">
                        <td class="border p-1 uppercase text-left" colspan="2">VAT 15%</td>
                        <td class="border p-1 text-right">${fmt(vat)}</td>
                    </tr>
                    <tr class="bg-theme text-sm font-bold">
                        <td class="border p-1 uppercase text-left tracking-wider" colspan="2">TOTAL SAR</td>
                        <td class="border p-1 text-right" style="font-size: 18px; background: white; border-left: 4px solid black;">${fmt(grandTotal)}</td>
                    </tr>
                </table>

                 <!-- STAMP & SIGNATURE BOX -->
                <div style="border: 1px solid black; height: 140px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; background: white; margin-top: 4px; position: relative;">
                     <!-- Stamp and Signature from Data -->
                     ${data.stampBase64 ? `<img src="${data.stampBase64}" style="height: 130px; width: auto; object-fit: contain; position: absolute; left: 20px;" />` : ''}
                     ${data.signatureBase64 ? `<img src="${data.signatureBase64}" style="height: 60px; width: auto; object-fit: contain; position: absolute; right: 40px; bottom: 50px;" />` : ''}
                </div>

                <!-- DATE OF COMPLETION -->
                <div style="display: flex; border: 1px solid black; background: #e5e7eb; font-weight: bold; font-size: 10px; margin-top: 4px;">
                    <div style="flex: 1; border-right: 1px solid black; padding: 4px; display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <span>Date of Completion:</span>
                        <span style="border-bottom: 1px solid black; flex: 1; min-height: 14px; text-align: center;">${data.completion_date || ''}</span>
                    </div>
                    <div style="flex: 1; padding: 4px; text-align: center; display: flex; align-items: center; justify-content: center;">
                        <span>7 days after PO issuance date</span>
                    </div>
                </div>
            </div>
         </div>

         <!-- FOOTER: TERMS -->
         <div style="margin-top: 8px; border-top: 2px solid black; padding-top: 8px;">
            <div class="bg-theme text-center font-bold p-1 mb-1 uppercase text-xs">TERMS AND CONDITIONS</div>
            <div style="display: flex; border: 1px solid black; min-height: 80px;">
                <div style="flex: 1; border-right: 1px solid black; padding: 8px; background: #f9fafb; display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-size: 8px; font-weight: bold; line-height: 1.2;">
                        1. Any Items / work needed to complete the job will be considered within the given total price if not mentioned in the below exclusion list.<br>
                        2. If completion of job exceeds the specified number of days, a deduction of 100 SR will be considered for every additional delayed day.<br>
                        3. Parts will be under warranty against manufacturer defects and quality.
                    </div>
                     <div style="margin-top: auto; display: flex; gap: 4px; font-size: 8px; font-weight: bold; align-items: center;">
                        <span class="uppercase">Parts Warranty Period:</span>
                        <span style="border-bottom: 1px solid black; flex: 1; min-height: 14px;">${data.warranty || ''}</span>
                    </div>
                </div>
                <div style="flex: 1; padding: 8px; background: #f9fafb;">
                     <div style="font-size: 8px; font-weight: bold; border-bottom: 1px solid black; margin-bottom: 4px; padding-bottom: 4px; text-transform: uppercase;">List of Exclusions</div>
                     <div style="font-size: 8px; font-bold">1. __________________</div>
                     <div style="font-size: 8px; font-bold">2. __________________</div>
                     <div style="font-size: 8px; font-bold">3. __________________</div>
                </div>
            </div>
         </div>
          <div class="bg-theme text-center font-bold p-1 border-y-2 border-black mt-4 uppercase text-[9px] tracking-[0.2em]">APPROVALS</div>

    <script>
        // Wait for all images to load before signaling ready
        window.addEventListener('load', async () => {
            const images = Array.from(document.images);
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if one fails
                });
            }));
            // Signal Puppeteer that we are ready
            document.body.classList.add('pdf-ready');
            const readyDiv = document.createElement('div');
            readyDiv.id = 'pdf-ready-signal';
            document.body.appendChild(readyDiv);
        });
    </script>
    </body>
    </html>
    `;
};