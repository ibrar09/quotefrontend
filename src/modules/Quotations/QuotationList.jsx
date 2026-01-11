import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import QuotationEditModal from './QuotationEditModal';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../../assets/Maaj-Logo 04.png';

const QuotationList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const navigate = useNavigate();
    const { darkMode, colors, themeStyles } = useTheme();

    // Define all available statuses for the filter bar
    const statuses = ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REVISED', 'CANCELLED'];

    useEffect(() => {
        fetchQuotations();
    }, []);

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

    const filteredQuotations = quotations.filter(q =>
        filter === 'ALL' ? true : q.quote_status === filter
    );

    // Helper to style different statuses
    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-600';
            case 'SENT': return 'text-blue-500';
            case 'Approved': return 'text-blue-500';
            case 'REVISED': return 'text-orange-500';
            case 'CANCELLED': return 'text-red-500';
            case 'DRAFT': return 'text-gray-500';
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
        const filename = `Quotations_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        doc.text(`Status Filter: ${filter}`, 50, 26);
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

        const filename = `MAAJ_Tracker_${filter}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    };

    return (
        <div className={`p-4 md:p-6 min-h-screen text-[10px] ${themeStyles.container}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">Main Tracking Sheet</h1>
                    <p className={colors.textSecondary}>Excel Sync: All Companies Sheet 2025</p>
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
                    <button
                        onClick={() => navigate('/quotations/new')}
                        className={`${themeStyles.button} w-full md:w-auto justify-center`}
                    >
                        <Plus size={16} /> Create New Quotation
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            <div className={`flex overflow-x-auto gap-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} mb-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0`}>
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`pb-2 px-4 font-bold uppercase transition-colors ${filter === status
                            ? `border-b-4 ${darkMode ? 'border-[#00a8aa] text-[#00a8aa]' : 'border-black text-black'}`
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className={`overflow-x-auto shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className={themeStyles.tableHeader}>
                            <th className="p-2 border-r">Actions</th>
                            <th className="p-2 border-r">SR#</th>
                            <th className="p-2 border-r">Company</th>
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
                            <th className="p-2 border-r">PO #</th>
                            <th className="p-2 border-r">PO Date</th>
                            <th className="p-2 border-r">ETA</th>
                            <th className="p-2 border-r">Update</th>
                            <th className="p-2 border-r text-right">Amt Ex VAT</th>
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
                                <td colSpan="41" className="p-8 text-center font-bold">Loading...</td>
                            </tr>
                        ) : filteredQuotations.length === 0 ? (
                            <tr>
                                <td colSpan="41" className="p-8 text-center opacity-50">No quotations found for this status.</td>
                            </tr>
                        ) : filteredQuotations.map((q, i) => {
                            const po = q.PurchaseOrders?.[0] || {};
                            const fin = po.Finance || {};

                            return (
                                <tr key={q.id} className={themeStyles.tableRow}>
                                    <td className="p-2 text-center">
                                        <button onClick={() => setSelectedQuotation(q)} className="hover:scale-110 transition-transform">
                                            <Edit size={12} className={darkMode ? "text-cyan-400" : "text-blue-600"} />
                                        </button>
                                    </td>
                                    <td className="p-2 text-center opacity-60">{i + 1}</td>
                                    <td className="p-2">{q.brand_name || q.Store?.brand || '-'}</td>
                                    <td className="p-2">{q.sent_at || '-'}</td>

                                    {/* Quotation Status Column */}
                                    <td className={`p-2 font-bold text-center border-r ${getStatusColor(q.quote_status)}`}>
                                        {q.quote_status || 'DRAFT'}
                                    </td>

                                    <td className="p-2 font-bold">{q.quote_no}</td>
                                    <td className="p-2">{q.mr_date || '-'}</td>
                                    <td className="p-2">{q.mr_no || '-'}</td>
                                    <td className="p-2">{q.pr_no || '-'}</td>
                                    <td className="p-2">{q.brand || q.Store?.brand || '-'}</td>
                                    <td className="p-2">{q.location || '-'}</td>
                                    <td className="p-2">{q.city || '-'}</td>
                                    <td className="p-2">{q.region || '-'}</td>
                                    <td className="p-2 truncate max-w-[120px]">{q.work_description}</td>
                                    <td className="p-2 font-bold text-green-600">{q.work_status || '-'}</td>
                                    <td className="p-2">{q.completion_date || '-'}</td>
                                    <td className="p-2">{q.completed_by || '-'}</td>
                                    <td className="p-2 font-bold text-green-600">{po.po_no || '-'}</td>
                                    <td className="p-2">{po.po_date || '-'}</td>
                                    <td className="p-2">{po.eta || '-'}</td>
                                    <td className="p-2">{po.update_notes || '-'}</td>
                                    <td className="p-2 text-right">{po.amount_ex_vat || q.subtotal || '0.00'}</td>
                                    <td className="p-2 text-right">{po.vat_15 || q.vat_amount || '0.00'}</td>
                                    <td className="p-2 text-right font-bold">{po.total_inc_vat || q.grand_total || '0.00'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.invoice_status || '-'}</td>
                                    <td className="p-2 font-bold text-green-600">{fin.invoice_no || '-'}</td>
                                    <td className="p-2">{fin.invoice_date || '-'}</td>
                                    <td className="p-2">{q.supervisor || '-'}</td>
                                    <td className="p-2">{q.comments || '-'}</td>
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