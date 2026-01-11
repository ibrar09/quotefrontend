import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import logoSrc from '../../assets/Maaj-Logo 04.png';
import API_BASE_URL from '../../config/api';
import signature from '../../assets/signature.jpeg';
import stamp from '../../assets/stamp.jpeg';
import { Loader2, AlertCircle } from 'lucide-react';

// Use origin if API_BASE_URL is relative or missing
const FINAL_API_URL = (API_BASE_URL && API_BASE_URL !== '') ? API_BASE_URL : window.location.origin;

const QuotationPrintView = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [header, setHeader] = useState(null);
    const [items, setItems] = useState([]);
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                console.log(`Fetching quote from: ${FINAL_API_URL}/api/quotations/${id}`);
                const res = await axios.get(`${FINAL_API_URL}/api/quotations/${id}`);
                if (res.data.success) {
                    const q = res.data.data;
                    setHeader({
                        date: q.createdAt ? q.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                        attentionTo: q.Store?.fm_manager || q.Store?.fm_supervisor || '',
                        version: '1.0',
                        brand: q.brand || q.Store?.brand || '',
                        quoteNo: q.quote_no || '',
                        validity: '30 Days',
                        location: q.location || q.Store?.mall || '',
                        mrNo: q.mr_no || '',
                        mrRecDate: q.mr_date || '',
                        city: q.city || q.Store?.city || '',
                        storeCcid: q.oracle_ccid || '',
                        mrPriority: 'Normal',
                        mrDesc: q.work_description || '',
                        openingDate: q.store_opening_date || '',
                        currency: 'SAR',
                        description: q.work_description || '',
                        continuous_assessment: q.continuous_assessment || '',
                        completionDate: q.completion_date || ''
                    });

                    if (q.JobImages && q.JobImages.length > 0) {
                        setImages(q.JobImages.map(img => img.image_data));
                    }

                    const itemsSource = q.JobItems || q.QuoteItems || [];
                    setItems(itemsSource.map(i => ({
                        id: i.id,
                        code: i.item_code || '',
                        description: i.description || '',
                        unit: i.unit || 'PCS',
                        qty: Number(i.quantity || 0),
                        material: Number(i.material_price || 0),
                        labor: Number(i.labor_price || 0)
                    })));
                } else {
                    setError('Quotation not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load quotation');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchQuote();
    }, [id]);

    const totals = useMemo(() => {
        if (!items.length) return { subTotalMaterial: 0, subTotalLabor: 0, initialScopeTotal: 0, vatAmount: 0, grandTotal: 0 };
        const subTotalMaterial = items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.material || 0)), 0);
        const subTotalLabor = items.reduce((acc, item) => acc + Number(item.labor || 0), 0);
        const initialScopeTotal = subTotalMaterial + subTotalLabor;
        const transport = 0; // TODO: Fetch from DB if needed
        const discount = 0;  // TODO: Fetch from DB if needed
        const totalWithAdj = initialScopeTotal + transport - discount;
        const vat = totalWithAdj * 0.15;
        const grandTotal = totalWithAdj + vat;

        return {
            subTotalMaterial,
            subTotalLabor,
            initialScopeTotal,
            transportation: transport,
            discount: discount,
            vatAmount: vat,
            grandTotal
        };
    }, [items]);

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /> Loading PDF View...</div>;

    if (error || !header) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-red-500 font-bold gap-2">
            <div id="pdf-ready" className="hidden"></div>
            <div>Failed to load PDF Content</div>
            <div className="text-sm text-gray-500">{error || "No header data found for this quotation ID."}</div>
            <div className="text-xs text-gray-400">ID: {id}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex justify-center p-0 m-0 font-sans text-black">

            <div id="pdf-ready" className="hidden"></div>

            <div
                id="quotation-content"
                className="w-[210mm] max-w-[210mm] min-h-[297mm] p-[10mm] border-none shadow-none flex flex-col gap-1 relative text-black font-bold box-border"
                style={{ color: 'black' }}
            >
                <style>{`
                input, textarea { background: transparent; border: none; resize: none; font-weight: 600; color: black; width: 100%; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
                ::-webkit-scrollbar { display: none; }
                body { background: white; margin: 0; font-family: 'Outfit', sans-serif; }
                .text-[8px] { font-size: 8px; line-height: 10px; }
                .text-[10px] { font-size: 10px; line-height: 1.1; }
                .font-bold { font-weight: 600; } 
                .bg-theme { background-color: #e2d1a5 !important; }
             `}</style>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />

                {/* ============ HEADER ============ */}
                <div className="flex justify-end items-center border-b-2 border-black pb-2 mb-1">
                    <img src={logoSrc} alt="MAAJ Logo" className="h-12 object-contain" />
                </div>

                <div className="bg-theme border-2 border-black py-1 text-center">
                    <h1 className="text-lg font-bold tracking-[0.3em] text-black uppercase">QUOTATION</h1>
                </div>

                {/* Grid Table */}
                <div className="grid grid-cols-12 border-t border-l border-black text-[10px]">
                    {/* Row 1 */}
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Date</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.date}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Attention To</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.attentionTo}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-2 bg-theme border-r border-b border-black p-1 text-[8px] font-bold uppercase">Quote Revised</div>
                        <div className="col-span-2 border-r border-b border-black p-1 font-bold">V.{header.version}</div>
                    </div>

                    {/* Row 2 */}
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Brand</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.brand}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Quote #</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.quoteNo}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-2 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Validity</div>
                        <div className="col-span-2 border-r border-b border-black p-1 font-bold">{header.validity}</div>
                    </div>

                    {/* Row 3 */}
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Location</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.location}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">MR #</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.mrNo}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-2 bg-theme border-r border-b border-black p-1 text-[8px] font-bold uppercase">MR Rec Date</div>
                        <div className="col-span-2 border-r border-b border-black p-1 font-bold">{header.mrRecDate}</div>
                    </div>

                    {/* Row 4 */}
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">City</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.city}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Store CCID</div>
                        <div className="col-span-3 border-r border-b border-black p-1">{header.storeCcid}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-2 bg-theme border-r border-b border-black p-1 text-[8px] font-bold uppercase">MR Priority</div>
                        <div className="col-span-2 border-r border-b border-black p-1 font-bold">{header.mrPriority}</div>
                    </div>

                    {/* Row 5 */}
                    <div className="col-span-8 grid grid-cols-8">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">MR Desc.</div>
                        <div className="col-span-7 border-r border-b border-black p-1 h-7 overflow-hidden whitespace-nowrap text-ellipsis">{header.mrDesc}</div>
                    </div>
                    <div className="col-span-4 grid grid-cols-4">
                        <div className="col-span-2 bg-theme border-r border-b border-black p-1 text-[8px] font-bold uppercase">Store Opening</div>
                        <div className="col-span-2 border-r border-b border-black p-1 font-bold">{header.openingDate}</div>
                    </div>

                    {/* Row 6 */}
                    <div className="col-span-12 grid grid-cols-12">
                        <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase">Cont. Assess</div>
                        <div className="col-span-11 border-r border-b border-black p-1 min-h-[16px] whitespace-pre-wrap text-[10px]">{header.continuous_assessment}</div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="relative overflow-x-auto w-full mt-1">
                    <table className="w-full border-collapse border border-black text-[10px] table-fixed">
                        <thead>
                            <tr className="bg-gray-100 font-bold uppercase text-[9px]">
                                <th className="border border-black p-1 text-center w-16">CODE</th>
                                <th className="border border-black p-1 text-left w-[40%]">DESCRIPTION</th>
                                <th className="border border-black p-1 text-center w-10">UNIT</th>
                                <th className="border border-black p-1 text-center w-10">QTY</th>
                                <th className="border border-black p-1 text-right w-16">MAT.</th>
                                <th className="border border-black p-1 text-right w-16">LAB.</th>
                                <th className="border border-black p-1 text-right w-20">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="align-top leading-tight uppercase font-bold text-[10px]">
                                    <td className="border border-black p-1 text-center">{item.code}</td>
                                    <td className="border border-black p-1 whitespace-pre-wrap break-words">{item.description}</td>
                                    <td className="border border-black p-1 text-center">{item.unit}</td>
                                    <td className="border border-black p-1 text-center">{(item.qty || 0)}</td>
                                    <td className="border border-black p-1 text-right">{(item.material || 0).toLocaleString()}</td>
                                    <td className="border border-black p-1 text-right">{(item.labor || 0).toLocaleString()}</td>
                                    <td className="border border-black p-1 text-right bg-gray-50/30">
                                        {((Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-bold text-[10px] bg-gray-100 uppercase">
                                <td colSpan={4} className="border border-black text-center p-1"></td>
                                <td className="border border-black text-right p-1">
                                    {(items.reduce((sum, item) => sum + Number(item.material || 0), 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black text-right p-1">
                                    {items.reduce((sum, item) => sum + Number(item.labor || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black text-right p-1">
                                    {items.reduce((sum, item) => sum + ((Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Images and Totals */}
                <div className="flex gap-2 mt-1">
                    <div className="w-1/2 flex flex-col gap-1">
                        <div className={`grid w-full h-full gap-1 border border-gray-300 bg-gray-50 p-[1px] ${images.length === 1 ? 'grid-cols-1 grid-rows-1' :
                            images.length === 2 ? 'grid-cols-1 grid-rows-2' :
                                'grid-cols-3'
                            }`}>
                            {images.map((imgData, i) => (
                                <div key={i} className="w-full h-full flex items-center justify-center overflow-hidden border border-gray-300 relative">
                                    <img src={imgData} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-1/2">
                        <table className="w-full border-collapse border border-black text-[10px]">
                            <tbody className="font-bold">
                                <tr className="bg-gray-50">
                                    <td className="border border-black text-left p-1 uppercase" colSpan={2}>TRANSPORTATION</td>
                                    <td className="border border-black text-right p-1">{(totals.transportation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-black text-left p-1 uppercase" colSpan={2}>DISCOUNT</td>
                                    <td className="border border-black text-right p-1">{(totals.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-gray-100 italic">
                                    <td className="border border-black text-left p-1 uppercase" colSpan={2}>Sub-Total</td>
                                    <td className="border border-black text-right p-1">{(totals.initialScopeTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-black text-left p-1 uppercase" colSpan={2}>VAT 15%</td>
                                    <td className="border border-black text-right p-1">{(totals.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-theme text-black text-sm">
                                    <td className="border border-black text-left p-1 uppercase tracking-wider font-bold text-black" colSpan={2}>TOTAL {header.currency}</td>
                                    <td className="border border-black text-right p-1 text-lg font-bold bg-white text-black tabular-nums border-l-4 border-l-black ml-1">
                                        {(totals.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="border border-black h-20 mt-1 bg-white flex items-center justify-center">
                            <div className="flex items-center justify-center gap-8 w-full h-full">
                                <img src={stamp} alt="Stamp" className="w-16 h-16 object-contain" />
                                <img src={signature} alt="Signature" className="w-16 h-16 object-contain" />
                            </div>
                        </div>

                        <div className="w-full mt-1 bg-gray-200 border border-black text-black text-[10px] font-bold flex">
                            <div className="flex-1 flex items-center justify-center border-r border-black p-1 gap-2">
                                <span>Date of Completion:</span>
                                <span className="border-b border-black w-24 text-center min-h-[14px]">{header.completionDate}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-1">
                                <span>7 days after PO issuance date</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-2 border-t-2 border-black pt-2 flex flex-col gap-1">
                    <h4 className="text-black font-bold text-[8px] uppercase bg-theme text-center py-1 mb-1">
                        TERMS AND CONDITIONS
                    </h4>
                    <div className="flex border border-black min-h-[80px]">
                        <div className="flex-1 border-r border-black bg-gray-50 p-2 text-[8px] font-bold">
                            1. Any Items / work needed to complete the job will be considered within the given total price if not mentioned in the below exclusion list.<br />
                            2. If completion of job exceeds the specified number of days, a deduction of 100 SR will be considered for every additional delayed day.<br />
                            3. Parts will be under warranty against manufacturer defects and quality.
                        </div>
                        <div className="flex-1 bg-gray-50 p-2">
                            <h5 className="text-[8px] font-bold uppercase border-b border-black pb-1 mb-1">List of Exclusions</h5>
                            <div className="text-[8px] font-bold">1. __________________</div>
                            <div className="text-[8px] font-bold">2. __________________</div>
                        </div>
                    </div>
                </div>

                <div className="text-[9px] font-bold uppercase bg-theme text-center tracking-[0.2em] border-y-2 border-black py-1 mt-4">
                    APPROVALS
                </div>
            </div>
        </div>
    );
};

export default QuotationPrintView;

