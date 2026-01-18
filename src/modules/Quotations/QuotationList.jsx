import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit, Download, Search, RefreshCw, MapPin, Trash2, Upload, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../../assets/Maaj-Logo 04.png';
import QuotationEditModal from './QuotationEditModal';
import BrandManagerModal from './BrandManagerModal';
import JobCompletionModal from './JobCompletionModal';

const QuotationList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [regionFilter, setRegionFilter] = useState(searchParams.get('region') || 'ALL');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status')?.toUpperCase() || 'ALL');
    const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || 'ALL');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [importing, setImporting] = useState(false);
    const [highlightedRow, setHighlightedRow] = useState(null);
    const [groupBrands, setGroupBrands] = useState([]); // [NEW] Stores brands for current group filter
    const [showBrandManager, setShowBrandManager] = useState(false); // [NEW] Toggle for Brand Manager
    const [selectedJobCompletion, setSelectedJobCompletion] = useState(null); // [NEW] Toggle for Job Completion Modal
    const [selectionMode, setSelectionMode] = useState(false); // [NEW] Toggle selection mode
    const [selectedIds, setSelectedIds] = useState([]); // [NEW] Selected IDs for bulk actions
    const navigate = useNavigate();
    const { darkMode, colors, themeStyles } = useTheme();
    const rowRefs = useRef({});

    // Define all available filters
    const regions = ['ALL', 'CP', 'CPR', 'EP', 'WP', 'WPR'];
    // Status definitions moved to line 191 for consistency

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 100; // Frontend limit per page

    useEffect(() => {
        const urlRegion = searchParams.get('region');
        const urlStatus = searchParams.get('status');
        const urlBrand = searchParams.get('brand');
        const urlSearch = searchParams.get('search');
        const urlMode = searchParams.get('mode');

        setRegionFilter(urlRegion || 'ALL');
        setStatusFilter(urlStatus ? urlStatus.toUpperCase() : 'ALL');
        setBrandFilter(urlBrand || 'ALL');

        if (urlMode === 'selection') {
            setSelectionMode(true);
        } else {
            setSelectionMode(false);
            setSelectedIds([]); // Clear selection when exiting mode
        }

        if (urlSearch) {
            setSearchTerm(urlSearch);
            setHighlightedRow(urlSearch);
            setTimeout(() => setHighlightedRow(null), 3000);
        } else {
            setSearchTerm('');
        }

        // Reset page when filters change
        setPage(1);
        fetchQuotations(1);
    }, [searchParams]);

    // [NEW] Fetch Brand Group members whenever brandFilter changes
    // ... (keep fetchGroupBrands logic) ...

    useEffect(() => {
        fetchGroupBrands();
    }, [brandFilter]);

    // ... (keep drag scoll logic) ...

    // Auto-scroll to highlighted row
    useEffect(() => {
        if (highlightedRow && quotations.length > 0) {
            // Find the matching quotation and scroll to it
            const matchingQuote = quotations.find(q => q.quote_no === highlightedRow);
            if (matchingQuote && rowRefs.current[matchingQuote.id]) {
                setTimeout(() => {
                    rowRefs.current[matchingQuote.id]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 300); // Small delay to ensure table is rendered
            }
        }
    }, [highlightedRow, quotations]);

    const fetchQuotations = async (pageNum = 1) => {
        setLoading(true);
        try {
            // Passing pagination params
            const res = await axios.get(`${API_BASE_URL}/api/quotations?page=${pageNum}&limit=${LIMIT}`);
            if (res.data.success) {
                setQuotations(res.data.data || []);
                // If we get less than LIMIT, we reached the end
                setHasMore(res.data.data.length === LIMIT);
            }
        } catch (err) {
            console.error(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchQuotations(nextPage);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const prevPage = page - 1;
            setPage(prevPage);
            fetchQuotations(prevPage);
        }
    };

    // ... (keep handleDelete and handleFileImport) ...

    // [OPTIMIZATION] Memoize filtering to prevent re-calc on every render
    const filteredQuotations = React.useMemo(() => {
        return quotations.filter(q => {
            // Region Filter: Check q.region or q.Store.region
            const qRegion = (q.region || q.Store?.region || '').toUpperCase();
            const matchesRegion = regionFilter === 'ALL' ? true : qRegion === regionFilter;

            // Status Filter
            const matchesStatus = statusFilter === 'ALL' ? true : q.quote_status === statusFilter;

            // [NEW] Brand Filter with Group Support
            let matchesBrand = true;
            if (brandFilter !== 'ALL') {
                const qBrand = (q.brand || q.brand_name || q.Store?.brand || '').toUpperCase();

                if (groupBrands.length > 0) {
                    matchesBrand = groupBrands.some(gb => qBrand.includes(gb) || gb.includes(qBrand));
                } else {
                    matchesBrand = qBrand.includes(brandFilter.toUpperCase());
                }
            }

            const s = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (q.quote_no && q.quote_no.toLowerCase().includes(s)) ||
                (q.mr_no && q.mr_no.toLowerCase().includes(s)) ||
                (q.pr_no && q.pr_no.toLowerCase().includes(s)) ||
                (q.PurchaseOrders?.[0]?.po_no && q.PurchaseOrders[0].po_no.toLowerCase().includes(s)) ||
                (q.oracle_ccid && q.oracle_ccid.toString().includes(s)) ||
                (q.work_description && q.work_description.toLowerCase().includes(s)) ||
                (q.brand && q.brand.toLowerCase().includes(s)) ||
                (q.Store?.brand && q.Store.brand.toLowerCase().includes(s));

            return matchesRegion && matchesStatus && matchesSearch && matchesBrand;
        });
    }, [quotations, regionFilter, statusFilter, brandFilter, groupBrands, searchTerm]);

    // Updated Statuses as per Step 2461
    const statuses = ['ALL', 'DRAFT', 'READY_TO_SEND', 'SENT', 'PO_RECEIVED', 'APPROVED', 'PAID', 'CANCELLED'];

    // Helper to style different statuses
    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'text-green-700 font-extrabold';
            case 'APPROVED': return 'text-green-600';
            case 'PO_RECEIVED': return 'text-cyan-600';
            case 'SENT': return 'text-blue-500';
            case 'READY_TO_SEND': return 'text-indigo-500';
            case 'CANCELLED': return 'text-red-500';
            case 'DRAFT': return 'text-orange-500';
            default: return darkMode ? 'text-gray-300' : 'text-black';
        }
    };

    const getExportData = () => {
        return filteredQuotations.map((q, index) => {
            const po = q.PurchaseOrders?.[0] || {};
            const fin = po.Finance || {};

            return {
                'SR#': index + 1,
                'Company': q.brand_name || q.Store?.brand || 'N/A',
                'Quote Date': q.sent_at || q.createdAt?.split('T')[0] || 'N/A',
                'Status': q.quote_status || 'DRAFT',
                'Quote #': q.quote_no || 'N/A',
                'MR Date': q.mr_date || 'N/A',
                'MR #': q.mr_no || 'N/A',
                'PR #': q.pr_no || 'N/A',
                'Brand': q.brand || q.Store?.brand || 'N/A',
                'Location': q.location || 'N/A',
                'City': q.city || 'N/A',
                'Region': q.region || 'N/A',
                'Work Desc': q.work_description || 'N/A',
                'Work Status': q.work_status || 'N/A',
                'Comp Date': q.completion_date || 'N/A',
                'Completed By': q.completed_by || 'N/A',
                'PO #': po.po_no || 'N/A',
                'PO Date': po.po_date || 'N/A',
                'ETA': po.eta || 'N/A',
                'Update': po.update_notes || 'N/A',
                'Amt Ex VAT': (po.amount_ex_vat || q.subtotal || 0).toLocaleString(),
                'VAT': (po.vat_15 || q.vat_amount || 0).toLocaleString(),
                'Total': (po.total_inc_vat || q.grand_total || 0).toLocaleString(),
                'Inv Status': fin.invoice_status || 'N/A',
                'Inv #': fin.invoice_no || 'N/A',
                'Inv Date': fin.invoice_date || 'N/A',
                'Supervisor': q.supervisor || 'N/A',
                'Comments': q.comments || 'N/A',
                'Store ID': q.oracle_ccid || 'N/A',
                'Adv Pay': (fin.advance_payment || 0).toLocaleString(),
                'Pay Ref': fin.payment_ref || 'N/A',
                'Recv Amt': (fin.received_amount || 0).toLocaleString(),
                'Pay Date': fin.payment_date || 'N/A',
                'Pay Month': fin.payment_month || 'N/A',
                'Ref #': fin.general_ref || 'N/A',
                'Bank Date': fin.bank_date || 'N/A',
                'HSBC #': fin.hsbc_no || 'N/A',
                'Our Bank Ref': fin.our_bank_ref || 'N/A',
                'Comp Bank Ref': fin.company_bank_ref || 'N/A',
                'VAT Status': fin.vat_status || 'N/A',
                'VAT Duration': fin.vat_duration || 'N/A',
                'Days': fin.days_outstanding || 0
            };
        });
    };

    const exportToExcel = () => {
        const exportData = getExportData();
        const ws = XLSX.utils.json_to_sheet(exportData);

        const colWidths = [
            { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
            { wch: 15 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
            { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
            { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 8 }
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
        const filename = `Quotations_${regionFilter}_${statusFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const exportToPDF = () => {
        const exportData = getExportData();
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4

        // Add Header
        doc.addImage(logoSrc, 'PNG', 14, 10, 30, 15);

        doc.setFontSize(22);
        doc.setTextColor(0, 168, 170); // Theme Teal
        doc.text('QUOTATION TRACKER', 50, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Region: ${regionFilter} | Status: ${statusFilter}`, 50, 26);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 230, 26);

        // Draw Line
        doc.setDrawColor(0, 168, 170);
        doc.setLineWidth(0.5);
        doc.line(14, 32, 283, 32);

        // Transform data into a multi-row structure for each record
        // Record 1 (3 rows): 
        // 1. SR, QUOTE#, BRAND, LOCATION, STATUS
        // 2. [Grey bg] WORK DESC, COMMENTS, SUPERVISOR
        // 3. PO#, INV#, TOTAL, RECV AMT, STATUS (FIN)

        const rows = [];
        exportData.forEach((q) => {
            // Row 1: Primary identifiers
            rows.push([
                { content: `SR: ${q['SR#']}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `QUOTE: ${q['Quote #']}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `BRAND: ${q['Brand']}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `LOCATION: ${q['Location']} (${q['City']})`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: `STATUS: ${q['Status']}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: q['Status'] === 'APPROVED' ? [0, 128, 0] : [0, 0, 0] } }
            ]);

            // Row 2: Secondary info / Details
            rows.push([
                { content: `MR#: ${q['MR #']} | Date: ${q['MR Date']} | Date: ${q['Quote Date']}`, colSpan: 2 },
                { content: `WORK: ${q['Work Desc']}`, colSpan: 3, styles: { halign: 'left' } }
            ]);

            // Row 3: Financial & Financial References
            rows.push([
                { content: `TOTAL (SAR): ${q['Total']}`, styles: { fontStyle: 'bold', textColor: [0, 168, 170] } },
                { content: `PO#: ${q['PO #']} | INV#: ${q['Inv #']}` },
                { content: `RECV: ${q['Recv Amt']} | ADV: ${q['Adv Pay']}` },
                { content: `INV STATUS: ${q['Inv Status']}` },
                { content: `SUPERVISOR: ${q['Supervisor']}` }
            ]);

            // Spacer
            rows.push([{ content: '', colSpan: 5, styles: { cellPadding: 1, fillColor: [255, 255, 255] } }]);
        });

        autoTable(doc, {
            body: rows,
            startY: 40,
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                lineColor: [220, 220, 220],
                lineWidth: 0.1,
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' },
                4: { halign: 'right' }
            },
            margin: { left: 14, right: 14 },
            didParseCell: function (data) {
                // Remove borders for spacer rows
                if (data.row.raw[0].content === '') {
                    data.cell.styles.lineWidth = 0;
                }
            }
        });

        const filename = `MAAJ_Tracker_${regionFilter}_${statusFilter}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    };

    // [NEW] Generate Worker Report PDF
    const generateWorkerReportPDF = () => {
        if (selectedIds.length === 0) return;

        // Get selected Data
        const reportData = quotations.filter(q => selectedIds.includes(q.id));
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        // Determine Report Type based on status filter (or current selection context)
        // Default to "WORKER REPORT" if mixed
        let reportTitle = "WORKER REPORT";
        let reportColor = [0, 168, 170]; // Default Teal
        let titleBgColor = [255, 255, 0]; // Default Yellow (from image)

        // Dynamic Title Logic based on Status
        // Phase 1: READY_TO_SEND -> "NEED TO SEND QUOTATIONS"
        if (statusFilter === 'READY_TO_SEND') {
            reportTitle = "NEED TO SEND QUOTATIONS";
            titleBgColor = [255, 255, 0]; // Yellow
        }
        // Phase 2: APPROVED -> "PENDING WORKS"
        else if (statusFilter === 'APPROVED') {
            reportTitle = "PENDING WORKS";
            titleBgColor = [0, 255, 0]; // Green (from image 2)
        }
        // Phase 3: PO_RECEIVED -> "NEED COMPLETIONS"
        else if (statusFilter === 'PO_RECEIVED') {
            reportTitle = "NEED COMPLETIONS";
            titleBgColor = [255, 165, 0]; // Orange (from image 3)
        }

        // Append Region if available
        if (regionFilter !== 'ALL') {
            reportTitle += ` - ${regionFilter}`;
        }

        // Define Columns based on Report Type
        let columns = [
            { header: 'SN#', dataKey: 'sn' },
        ];

        // ADD Q# if NOT "Need to Send" (Phase 1 usually doesn't emphasize Q#, but others do)
        // Actually images show:
        // Phase 1: SN, MR DATE, MR#, PR#, BRAND... (No Quote# in first col?)
        // Phase 2: SN, Q#, MR#, PR#...
        // Phase 3: SN, Q#, MR#, PR#...

        if (statusFilter !== 'READY_TO_SEND') {
            columns.push({ header: 'Q #', dataKey: 'quote_no' });
        }

        columns.push(
            { header: 'MR DATE', dataKey: 'mr_date' },
            { header: 'MR #', dataKey: 'mr_no' },
            { header: 'PR #', dataKey: 'pr_no' },
            { header: 'BRAND', dataKey: 'brand' },
            { header: 'LOCATION', dataKey: 'location' },
            { header: 'CITY', dataKey: 'city' },
            { header: 'WORK DESCRIPTION', dataKey: 'desc' }
        );

        // Conditional Columns
        // Phase 2 (Pending Works) or Phase 3 (Need Completions) -> Show PO Info
        if (statusFilter !== 'READY_TO_SEND') {
            // For Phase 3: Add "Completed By" BEFORE PO info?
            if (statusFilter === 'PO_RECEIVED') {
                columns.push({ header: 'COMPLETED BY', dataKey: 'completed_by' }); // Empty column for filling
            }

            columns.push(
                { header: 'PO #', dataKey: 'po_no' },
                { header: 'PO DATE', dataKey: 'po_date' },
                { header: 'ETA', dataKey: 'eta' }
            );
        }

        // Prepare Data Rows
        const rows = reportData.map((q, i) => {
            const po = q.PurchaseOrders?.[0] || {};
            return {
                sn: i + 1,
                quote_no: q.quote_no,
                mr_date: q.mr_date || '-',
                mr_no: q.mr_no || '-',
                pr_no: q.pr_no || '-',
                brand: q.brand || q.Store?.brand || '-',
                location: q.location || q.Store?.mall || '-',
                city: q.city || q.Store?.city || '-',
                desc: q.work_description || '',
                po_no: po.po_no || '',
                po_date: po.po_date || '',
                eta: po.eta || '',
                completed_by: '' // Always empty for printing
            };
        });

        // DRAW HEADER (Centered with Background)
        // Calculate text width for centering background? AutoTable doesn't do "Header outside table" easily.
        // We render a single cell table for the title? Or just Draw Rect + Text.

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const textWidth = doc.getTextWidth(reportTitle) + 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textX = (pageWidth - textWidth) / 2;

        // Draw Header Background
        doc.setFillColor(...titleBgColor);
        doc.rect(textX, 10, textWidth, 10, 'F');

        // Draw Header Text
        doc.setTextColor(0, 0, 0);
        doc.text(reportTitle, pageWidth / 2, 17, { align: 'center' });

        // Generate Table
        autoTable(doc, {
            columns: columns,
            body: rows,
            startY: 25,
            theme: 'grid',
            headStyles: {
                fillColor: [66, 103, 178], // Blue Header (matches images roughly)
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 8
            },
            styles: {
                fontSize: 7,
                cellPadding: 1, // Tight padding like excel
                valign: 'middle',
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                sn: { cellWidth: 8, halign: 'center' },
                mr_date: { cellWidth: 15, halign: 'center' },
                mr_no: { cellWidth: 20 },
                pr_no: { cellWidth: 10, halign: 'center' },
                brand: { cellWidth: 20 },
                location: { cellWidth: 35 },
                city: { cellWidth: 15, halign: 'center' },
                desc: { cellWidth: 'auto' }, // Takes remaining space
                po_no: { cellWidth: 15 },
                po_date: { cellWidth: 15 },
                eta: { cellWidth: 15 },
                completed_by: { cellWidth: 30 }
            },
            didParseCell: function (data) {
                // Apply specific styling if needed
            }
        });

        const filename = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    };

    return (
        <div className={`p-4 md:p-6 min-h-screen text-[10px] ${themeStyles.container}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">
                        {brandFilter !== 'ALL' ? `${brandFilter} ` : ''}{regionFilter !== 'ALL' ? `${regionFilter} ` : ''}Quotation Tracker
                    </h1>
                    <p className={colors.textSecondary}>
                        Viewing quotations for {brandFilter !== 'ALL' ? `${brandFilter}` : 'All Brands'} {regionFilter !== 'ALL' ? `in ${regionFilter} region` : ''}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    {/* [NEW] Brand Manager Button */}
                    {brandFilter !== 'ALL' && (
                        <button
                            onClick={() => setShowBrandManager(true)}
                            className={`${themeStyles.button} bg-purple-600 hover:bg-purple-700 text-white justify-center`}
                        >
                            <Edit size={16} /> Manage {brandFilter}
                        </button>
                    )}
                    <button
                        onClick={exportToPDF}
                        className={`${themeStyles.button} ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white justify-center`}
                    >
                        <Download size={16} /> Download PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className={`${themeStyles.button} ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white justify-center`}
                    >
                        <Download size={16} /> Download Excel
                    </button>

                    {/* CSV Import Section */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            id="csv-import-input"
                            className="hidden"
                            onChange={handleFileImport}
                            disabled={importing}
                        />
                        <button
                            onClick={() => document.getElementById('csv-import-input').click()}
                            disabled={importing}
                            className={`${themeStyles.button} ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white justify-center w-full md:w-auto`}
                        >
                            {importing ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <Upload size={16} />
                            )}
                            {importing ? 'Importing...' : 'Import CSV'}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/quotations/new')}
                        className={`${themeStyles.button} w-full md:w-auto justify-center`}
                    >
                        <Plus size={16} /> Create New Quotation
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex gap-4 items-center">
                {/* Selection Mode Toggle */}
                <button
                    onClick={() => {
                        const newMode = !selectionMode;
                        setSelectionMode(newMode);
                        if (!newMode) setSelectedIds([]);
                    }}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all border-2
                    ${selectionMode
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : `${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-500'} hover:border-blue-500`
                        }`}
                >
                    <CheckCircle size={16} />
                    {selectionMode ? `Selection Mode ON (${selectedIds.length})` : 'Select Items'}
                </button>

                {/* Bulk Action Bar - Show only when items selected */}
                {selectionMode && selectedIds.length > 0 && (
                    <button
                        onClick={generateWorkerReportPDF}
                        className={`${themeStyles.button} bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-lg ring-2 ring-rose-400`}
                    >
                        <Download size={16} /> Download Worker Report ({selectedIds.length})
                    </button>
                )}

                <div className="relative max-w-md w-full ml-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Quote #, MR #, Brand or Description..."
                        className={`block w-full pl-10 pr-3 py-2 border rounded-lg leading-5 transition duration-150 ease-in-out sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00a8aa] ${darkMode
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Nested Filters: Region and Status */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Region Filter Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest min-w-[60px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Region:</span>
                    <div className="flex gap-2">
                        {regions.map(reg => (
                            <button
                                key={reg}
                                onClick={() => setRegionFilter(reg)}
                                className={`px-4 py-1.5 rounded-full font-black uppercase text-[9px] transition-all border-2 flex items-center gap-1
                                ${regionFilter === reg
                                        ? `bg-[#00a8aa] text-white border-[#00a8aa] shadow-lg scale-105`
                                        : `${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-500'} hover:border-[#00a8aa]`
                                    }`}
                            >
                                <MapPin size={10} /> {reg === 'ALL' ? 'All Regions' : reg}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Filter Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest min-w-[60px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
                    <div className="flex gap-2">
                        {statuses.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-full font-black uppercase text-[9px] transition-all border-2
                                ${statusFilter === status
                                        ? `bg-black text-white border-black shadow-lg scale-105`
                                        : `${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-300 text-gray-500'} hover:border-black`
                                    }`}
                            >
                                {status === 'ALL' ? 'All Statuses' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* [NEW] Pagination Controls */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border dark:border-gray-700">
                    <button
                        onClick={handlePrevPage}
                        disabled={page === 1 || loading}
                        className={`px-3 py-1 rounded text-xs font-bold ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'}`}
                    >
                        Previous
                    </button>
                    <span className="text-xs font-mono text-gray-500">
                        Page {page} {loading && '...'}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={!hasMore || loading}
                        className={`px-3 py-1 rounded text-xs font-bold ${!hasMore ? 'text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'}`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Table Container with Drag-to-Scroll */}
            <div
                ref={tableContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`overflow-x-auto shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} active:cursor-grabbing`}
            >
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className={themeStyles.tableHeader}>
                            {selectionMode && (
                                <th className="p-2 border-r w-10 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                        checked={filteredQuotations.length > 0 && selectedIds.length === filteredQuotations.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(filteredQuotations.map(q => q.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                    />
                                </th>
                            )}
                            <th className="p-2 border-r">Actions</th>
                            <th className="p-2 border-r">SR#</th>
                            <th className="p-2 border-r">Quote Date</th>
                            <th className="p-2 border-r text-center">Status</th>
                            <th className="p-2 border-r">Quote #</th>
                            <th className="p-2 border-r">MR Date</th>
                            <th className="p-2 border-r">MR #</th>
                            <th className="p-2 border-r">PR #</th>
                            <th className="p-2 border-r">Brand</th>
                            <th className="p-2 border-r">Location</th>
                            <th className="p-2 border-r">City</th>
                            <th className="p-2 border-r">Region</th>
                            <th className="p-2 border-r">Work Desc</th>
                            <th className="p-2 border-r">Work Status</th>
                            <th className="p-2 border-r">Comp Date</th>
                            <th className="p-2 border-r">Completed By</th>
                            <th className="p-2 border-r text-center">Check-In</th>
                            <th className="p-2 border-r">Notes (CP)</th>
                            <th className="p-2 border-r">PO #</th>
                            <th className="p-2 border-r">PO Date</th>
                            <th className="p-2 border-r">ETA</th>
                            <th className="p-2 border-r">Update</th>
                            <th className="p-2 border-r text-right">Amt Ex VAT</th>
                            <th className="p-2 border-r text-right">Discount</th>
                            <th className="p-2 border-r text-right">VAT</th>
                            <th className="p-2 border-r text-right">Total</th>
                            <th className="p-2 border-r">Inv Status</th>
                            <th className="p-2 border-r">Inv #</th>
                            <th className="p-2 border-r">Inv Date</th>
                            <th className="p-2 border-r">Supervisor</th>
                            <th className="p-2 border-r">Comments</th>
                            <th className="p-2 border-r">Store ID</th>
                            <th className="p-2 border-r text-right">Adv Pay</th>
                            <th className="p-2 border-r">Pay Ref</th>
                            <th className="p-2 border-r text-right">Recv Amt</th>
                            <th className="p-2 border-r">Pay Date</th>
                            <th className="p-2 border-r">Pay Month</th>
                            <th className="p-2 border-r">Ref #</th>
                            <th className="p-2 border-r">Bank Date</th>
                            <th className="p-2 border-r">HSBC #</th>
                            <th className="p-2 border-r">Our Bank Ref</th>
                            <th className="p-2 border-r">Comp Bank Ref</th>
                            <th className="p-2 border-r">VAT Status</th>
                            <th className="p-2 border-r">VAT Duration</th>
                            <th className="p-2 border-r text-center">Days</th>
                        </tr>
                    </thead>

                    <tbody className={darkMode ? 'text-gray-300' : 'text-black'}>
                        {loading ? (
                            <tr>
                                <td colSpan="40" className="p-8 text-center font-bold">Loading...</td>
                            </tr>
                        ) : filteredQuotations.length === 0 ? (
                            <tr>
                                <td colSpan="40" className="p-8 text-center opacity-50 font-bold uppercase tracking-widest">
                                    No records found for {regionFilter !== 'ALL' ? `${regionFilter} Region` : 'Any Region'}
                                    {statusFilter !== 'ALL' ? ` with ${statusFilter} Status.` : '.'}
                                </td>
                            </tr>
                        ) : filteredQuotations.map((q, i) => {
                            const po = q.PurchaseOrders?.[0] || {};
                            const fin = po.Finance || {};
                            const isHighlighted = highlightedRow && q.quote_no === highlightedRow;

                            return (
                                <tr
                                    key={q.id}
                                    ref={el => rowRefs.current[q.id] = el}
                                    onClick={() => {
                                        if (selectionMode) {
                                            // Toggle selection
                                            if (selectedIds.includes(q.id)) {
                                                setSelectedIds(selectedIds.filter(id => id !== q.id));
                                            } else {
                                                setSelectedIds([...selectedIds, q.id]);
                                            }
                                        }
                                    }}
                                    className={`${themeStyles.tableRow} transition-all duration-300 ${isHighlighted ? 'ring-2 ring-blue-500' : ''} ${selectedIds.includes(q.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                    style={{
                                        backgroundColor: isHighlighted
                                            ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                                            : undefined
                                    }}
                                >
                                    {selectionMode && (
                                        <td className="p-2 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                                                checked={selectedIds.includes(q.id)}
                                                onChange={(e) => {
                                                    // Handled by Row Click, but this prevents double drill
                                                }}
                                            />
                                        </td>
                                    )}
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedJobCompletion(q)}
                                                className="hover:scale-110 transition-transform p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md text-green-600"
                                                title="Job Completion & Attachments"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                            <button
                                                onClick={() => navigate('/quotations/new-quotation', { state: { loadFromQuotation: q } })}
                                                className="hover:scale-110 transition-transform p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-amber-500"
                                                title="Revise Quotation (Full Editor)"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedQuotation(q)}
                                                className="hover:scale-110 transition-transform p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-cyan-500"
                                                title="Quick Update (PO/Finance/Status)"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="hover:scale-110 transition-transform p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500"
                                                title="Delete Quotation"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center opacity-60">{i + 1}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.sent_at, 'Date')} className="p-2 cursor-copy hover:bg-black/5" title="Double-click to copy">{q.sent_at || '-'}</td>

                                    {/* Quotation Status Column */}
                                    <td className={`p-2 font-bold text-center border-r ${getStatusColor(q.quote_status)}`}>
                                        {q.quote_status || 'DRAFT'}
                                    </td>

                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.quote_no, 'Quote No')} className="p-2 font-bold cursor-copy hover:bg-black/5" title="Double-click to copy">{q.quote_no}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.mr_date, 'MR Date')} className="p-2 cursor-copy hover:bg-black/5" title="Double-click to copy">{q.mr_date || '-'}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.mr_no, 'MR No')} className="p-2 cursor-copy hover:bg-black/5" title="Double-click to copy">{q.mr_no || '-'}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.pr_no, 'PR No')} className="p-2 cursor-copy hover:bg-black/5" title="Double-click to copy">{q.pr_no || '-'}</td>
                                    <td className="p-2">{q.brand || q.brand_name || q.Store?.brand || '-'}</td>
                                    <td className="p-2">{q.location || q.Store?.mall || '-'}</td>
                                    <td className="p-2">{q.city || q.Store?.city || '-'}</td>
                                    <td className="p-2">{q.region || q.Store?.region || '-'}</td>
                                    <td className="p-2 truncate max-w-[120px]">{q.work_description}</td>
                                    <td className="p-2 font-bold text-green-600">{q.work_status || '-'}</td>
                                    <td className="p-2">{q.completion_date || '-'}</td>
                                    <td className="p-2">{q.completed_by || '-'}</td>
                                    <td className="p-2 text-center text-[8px] leading-tight">
                                        {q.check_in_date || '-'}<br />{q.check_in_time || ''}
                                    </td>
                                    <td className="p-2 truncate max-w-[100px]" title={q.craftsperson_notes}>
                                        {q.craftsperson_notes || '-'}
                                    </td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, po.po_no, 'PO No')} className="p-2 font-bold text-green-600 cursor-copy hover:bg-black/5" title="Double-click to copy">{po.po_no || '-'}</td>
                                    <td className="p-2">{po.po_date || '-'}</td>
                                    <td className="p-2">{po.eta || '-'}</td>
                                    <td className="p-2">{po.update_notes || '-'}</td>
                                    <td className="p-2 text-right">{po.amount_ex_vat || q.subtotal || '0.00'}</td>
                                    <td className="p-2 text-right text-red-500">-{q.discount || '0.00'}</td>
                                    <td className="p-2 text-right">{po.vat_15 || q.vat_amount || '0.00'}</td>
                                    <td className="p-2 text-right font-bold">{po.total_inc_vat || q.grand_total || '0.00'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.invoice_status || '-'}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, fin.invoice_no, 'Invoice No')} className="p-2 font-bold text-green-600 cursor-copy hover:bg-black/5" title="Double-click to copy">{fin.invoice_no || '-'}</td>
                                    <td className="p-2">{fin.invoice_date || '-'}</td>
                                    <td className="p-2">{q.supervisor || '-'}</td>
                                    <td className="p-2 truncate max-w-[150px]" title={q.comments}>{q.comments || '-'}</td>
                                    <td onDoubleClick={(e) => handleCellDoubleClick(e, q.oracle_ccid, 'Store CCID')} className="p-2 cursor-copy hover:bg-black/5" title="Double-click to copy">{q.oracle_ccid || '-'}</td>
                                    <td className="p-2 text-right">{fin.advance_payment || '0.00'}</td>
                                    <td className="p-2">{fin.payment_ref || '-'}</td>
                                    <td className="p-2 text-right font-bold text-green-700">{fin.received_amount || '0.00'}</td>
                                    <td className="p-2">{fin.payment_date || '-'}</td>
                                    <td className="p-2">{fin.payment_month || '-'}</td>
                                    <td className="p-2">{fin.general_ref || '-'}</td>
                                    <td className="p-2">{fin.bank_date || '-'}</td>
                                    <td className="p-2">{fin.hsbc_no || '-'}</td>
                                    <td className="p-2">{fin.our_bank_ref || '-'}</td>
                                    <td className="p-2">{fin.company_bank_ref || '-'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.vat_status || '-'}</td>
                                    <td className="p-2">{fin.vat_duration || '-'}</td>
                                    <td className="p-2 text-center font-bold">{fin.days_outstanding || '0'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {
                selectedQuotation && (
                    <QuotationEditModal
                        isOpen={!!selectedQuotation}
                        onClose={() => setSelectedQuotation(null)}
                        quotation={selectedQuotation}
                        isDarkMode={darkMode}
                        onUpdate={fetchQuotations}
                    />
                )
            }

            {/* [NEW] Brand Manager Modal */}
            <BrandManagerModal
                isOpen={showBrandManager}
                onClose={() => setShowBrandManager(false)}
                groupName={brandFilter}
                onUpdate={fetchGroupBrands}
            />

            {/* [NEW] Job Completion Modal */}
            {selectedJobCompletion && (
                <JobCompletionModal
                    quotation={selectedJobCompletion}
                    onClose={() => setSelectedJobCompletion(null)}
                    onUpdate={fetchQuotations}
                />
            )}
        </div >
    );
};

export default QuotationList;