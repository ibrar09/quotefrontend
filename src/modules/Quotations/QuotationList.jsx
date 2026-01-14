import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit, Download, Search, RefreshCw, MapPin, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../../assets/Maaj-Logo 04.png';
import QuotationEditModal from './QuotationEditModal';

const QuotationList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [regionFilter, setRegionFilter] = useState(searchParams.get('region') || 'ALL');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status')?.toUpperCase() || 'ALL');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [importing, setImporting] = useState(false);
    const [highlightedRow, setHighlightedRow] = useState(null);
    const navigate = useNavigate();
    const { darkMode, colors, themeStyles } = useTheme();
    const rowRefs = useRef({});

    // Define all available filters
    const regions = ['ALL', 'CP', 'CPR', 'EP', 'WP', 'WPR'];
    const statuses = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REVISED', 'COMPLETED', 'CANCELLED'];

    useEffect(() => {
        const urlRegion = searchParams.get('region');
        const urlStatus = searchParams.get('status');
        const urlSearch = searchParams.get('search');

        if (urlRegion) setRegionFilter(urlRegion);
        if (urlStatus) setStatusFilter(urlStatus.toUpperCase());
        if (urlSearch) {
            setSearchTerm(urlSearch);
            // Highlight the row briefly
            setHighlightedRow(urlSearch);
            setTimeout(() => setHighlightedRow(null), 3000); // Remove highlight after 3s
        }

        fetchQuotations();
    }, [searchParams]);

    // Drag-to-Scroll State
    const tableContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - tableContainerRef.current.offsetLeft);
        setScrollLeft(tableContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - tableContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll multiplier (speed)
        tableContainerRef.current.scrollLeft = scrollLeft - walk;
    };

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

    const fetchQuotations = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/quotations`);
            setQuotations(res.data.data || []);
        } catch (err) {
            console.error(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) return;

        try {
            const res = await axios.delete(`${API_BASE_URL}/api/quotations/${id}`);
            if (res.data.success) {
                alert('Quotation deleted successfully');
                fetchQuotations(); // Refresh list
            } else {
                throw new Error(res.data.message || 'Failed to delete');
            }
        } catch (err) {
            console.error(err);
            alert(`Error deleting quotation: ${err.message}`);
        }
    };

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/master/upload-quotations`, formData);
            if (res.data.count > 0) {
                alert(`Successfully imported ${res.data.count} quotations!`);
                fetchQuotations(); // Reload the list
            } else {
                alert('No new quotations were imported. Please check your CSV format.');
            }
        } catch (err) {
            console.error('Import Error:', err);
            alert(`Import failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setImporting(false);
            e.target.value = null; // Reset input
        }
    };

    const filteredQuotations = quotations.filter(q => {
        // Region Filter: Check q.region or q.Store.region
        const qRegion = (q.region || q.Store?.region || '').toUpperCase();
        const matchesRegion = regionFilter === 'ALL' ? true : qRegion === regionFilter;

        // Status Filter
        const matchesStatus = statusFilter === 'ALL' ? true : q.quote_status === statusFilter;

        const s = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ||
            (q.quote_no && q.quote_no.toLowerCase().includes(s)) ||
            (q.mr_no && q.mr_no.toLowerCase().includes(s)) ||
            (q.work_description && q.work_description.toLowerCase().includes(s)) ||
            (q.brand && q.brand.toLowerCase().includes(s)) ||
            (q.Store?.brand && q.Store.brand.toLowerCase().includes(s));

        return matchesRegion && matchesStatus && matchesSearch;
    });

    // Helper to style different statuses
    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-600';
            case 'APPROVED': return 'text-green-600';
            case 'SENT': return 'text-blue-500';
            case 'REVISED': return 'text-blue-500';
            case 'REJECTED': return 'text-red-500';
            case 'CANCELLED': return 'text-red-500';
            case 'DRAFT': return 'text-orange-500';
            case 'INTAKE': return 'text-purple-500';
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

    return (
        <div className={`p-4 md:p-6 min-h-screen text-[10px] ${themeStyles.container}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">
                        {regionFilter !== 'ALL' ? `${regionFilter} ` : ''}Quotation Tracker
                    </h1>
                    <p className={colors.textSecondary}>
                        {regionFilter !== 'ALL' ? `Viewing quotations for ${regionFilter} region` : 'Excel Sync: All Companies Sheet 2025'}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
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
            <div className="mb-6">
                <div className="relative max-w-md w-full">
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
                                    className={`${themeStyles.tableRow} transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-500' : ''}`}
                                    style={{
                                        backgroundColor: isHighlighted
                                            ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                                            : undefined
                                    }}
                                >
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
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
                                    <td className="p-2">{q.sent_at || '-'}</td>

                                    {/* Quotation Status Column */}
                                    <td className={`p-2 font-bold text-center border-r ${getStatusColor(q.quote_status)}`}>
                                        {q.quote_status || 'DRAFT'}
                                    </td>

                                    <td className="p-2 font-bold">{q.quote_no}</td>
                                    <td className="p-2">{q.mr_date || '-'}</td>
                                    <td className="p-2">{q.mr_no || '-'}</td>
                                    <td className="p-2">{q.pr_no || '-'}</td>
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
                                    <td className="p-2 font-bold text-green-600">{po.po_no || '-'}</td>
                                    <td className="p-2">{po.po_date || '-'}</td>
                                    <td className="p-2">{po.eta || '-'}</td>
                                    <td className="p-2">{po.update_notes || '-'}</td>
                                    <td className="p-2 text-right">{po.amount_ex_vat || q.subtotal || '0.00'}</td>
                                    <td className="p-2 text-right text-red-500">-{q.discount || '0.00'}</td>
                                    <td className="p-2 text-right">{po.vat_15 || q.vat_amount || '0.00'}</td>
                                    <td className="p-2 text-right font-bold">{po.total_inc_vat || q.grand_total || '0.00'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.invoice_status || '-'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.invoice_no || '-'}</td>
                                    <td className="p-2">{fin.invoice_date || '-'}</td>
                                    <td className="p-2">{q.supervisor || '-'}</td>
                                    <td className="p-2 truncate max-w-[150px]" title={q.comments}>{q.comments || '-'}</td>
                                    <td className="p-2">{q.oracle_ccid || '-'}</td>
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

            {selectedQuotation && (
                <QuotationEditModal
                    quotation={selectedQuotation}
                    onClose={() => setSelectedQuotation(null)}
                    onUpdated={fetchQuotations}
                />
            )}
        </div>
    );
};

export default QuotationList;