import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Plus, Trash2, Loader2, Package, CreditCard, ShoppingCart, FileText } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import API_BASE_URL from "../../config/api";

// --- MOVED OUTSIDE TO PREVENT FOCUS LOSS ---
const Input = ({ label, value, onChange, type = "text", placeholder = "", darkMode }) => (
    <div className="flex flex-col">
        <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">{label}</label>
        <input
            type={type}
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`border-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:ring-cyan-500/20 focus:border-cyan-500"
                : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-yellow-500/20 focus:border-yellow-500"
                }`}
        />
    </div>
);

const QuotationEditModal = ({ quotation, onClose, onUpdate }) => {
    const { darkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(null);
    const [activeTab, setActiveTab] = useState("general");
    const [priceSuggestions, setPriceSuggestions] = useState([]);
    const [activeRow, setActiveRow] = useState(null);

    // Fetch full quotation details on mount
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/quotations/${quotation.id}`);
                if (res.data.success) {
                    const data = res.data.data;
                    const po = data.PurchaseOrders?.[0] || {};
                    const fin = po.Finance || {};

                    // Pre-fill PO totals from Job totals if PO totals are empty/zero
                    const amount_ex_vat = Number(po.amount_ex_vat) || Number(data.subtotal) || 0;
                    const vat_15 = Number(po.vat_15) || Number(data.vat_amount) || 0;
                    const total_inc_vat = Number(po.total_inc_vat) || Number(data.grand_total) || 0;

                    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';

                    setFormData({
                        ...data,
                        sent_at: formatDate(data.sent_at), // Fix Quote Date format
                        mr_date: data.mr_date, // DATEONLY usually OK, but could wrap if needed
                        completion_date: data.completion_date,
                        JobItems: data.JobItems || [],
                        PurchaseOrders: data.PurchaseOrders?.length ?
                            [{
                                ...po,
                                po_date: po.po_date,
                                eta: po.eta,
                                amount_ex_vat, vat_15, total_inc_vat
                            }] :
                            [{ po_no: '', po_date: '', eta: '', update_notes: '', amount_ex_vat, vat_15, total_inc_vat }],
                        Finance: {
                            invoice_status: fin.invoice_status || '',
                            invoice_no: fin.invoice_no || '',
                            invoice_date: fin.invoice_date || '',
                            advance_payment: fin.advance_payment || 0,
                            received_amount: fin.received_amount || 0,
                            payment_date: fin.payment_date || '',
                            payment_month: fin.payment_month || '',
                            bank_date: fin.bank_date || '',
                            hsbc_no: fin.hsbc_no || '',
                            vat_status: fin.vat_status || '',
                            vat_duration: fin.vat_duration || '',
                            days_outstanding: fin.days_outstanding || 0,
                            our_bank_ref: fin.our_bank_ref || '',
                            company_bank_ref: fin.company_bank_ref || '',
                            payment_status: fin.payment_status || '',
                            payment_ref: fin.payment_ref || '',
                            general_ref: fin.general_ref || ''
                        },
                    });
                }
            } catch (err) {
                console.error("Failed to fetch quotation details", err);
                alert("Failed to load full quotation details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [quotation.id]);

    const handleChange = (path, value) => {
        const keys = path.split(".");
        setFormData(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            let ref = updated;
            keys.forEach((k, i) => {
                if (i === keys.length - 1) {
                    ref[k] = value;

                    // Logic: Auto-update payment_status if invoice_status is updated
                    if (path === "Finance.invoice_status" && (value === "Paid" || value === "PAID")) {
                        updated.Finance.payment_status = "PAID";
                    }
                } else {
                    if (!ref[k]) ref[k] = (isNaN(keys[i + 1]) ? {} : []);
                    ref = ref[k];
                }
            });
            return updated;
        });
    };

    const handleItemChange = (itemId, field, value) => {
        setFormData(prev => ({
            ...prev,
            JobItems: prev.JobItems.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleItemSearch = async (index, field, val) => {
        const newItems = [...formData.JobItems];
        newItems[index][field] = val;
        setFormData(prev => ({ ...prev, JobItems: newItems }));

        if (val.length > 2) {
            setActiveRow(index);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/pricelist/search?q=${val}`);
                setPriceSuggestions(res.data.data || []);
            } catch (err) {
                console.error("Error fetching prices:", err);
            }
        } else {
            setPriceSuggestions([]);
        }
    };

    const selectSuggestion = (index, item) => {
        const newItems = [...formData.JobItems];
        // Use total_price from price list as the base unit_price
        const material = Number(item.material_price) || 0;
        const labor = Number(item.labor_price) || 0;
        const total = Number(item.total_price) || (material + labor);

        newItems[index] = {
            ...newItems[index],
            item_code: item.code,
            description: item.description,
            unit: item.unit || 'PCS',
            material_price: material,
            labor_price: labor,
            unit_price: total
        };
        setFormData(prev => ({ ...prev, JobItems: newItems }));
        setPriceSuggestions([]);
        setActiveRow(null);
    };

    const addRow = () => {
        const newItem = { id: `new-${Date.now()}`, item_code: '', description: '', unit: 'PCS', quantity: 1, material_price: 0, labor_price: 0 };
        setFormData(prev => ({ ...prev, JobItems: [...prev.JobItems, newItem] }));
    };

    const removeRow = (id) => {
        setFormData(prev => ({
            ...prev,
            JobItems: prev.JobItems.filter(i => i.id !== id)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send fields that the backend expects, not associated data
            const payload = {
                quote_no: formData.quote_no,
                sent_at: formData.sent_at || null,
                mr_no: formData.mr_no || null,
                mr_date: formData.mr_date || null,
                oracle_ccid: formData.oracle_ccid,
                work_description: formData.work_description || '',
                quote_status: formData.quote_status || 'DRAFT',
                work_status: formData.work_status || 'NOT_STARTED',
                completion_date: formData.completion_date || null,
                completed_by: formData.completed_by || '',
                supervisor: formData.supervisor || '',
                comments: formData.comments || '',
                brand_name: formData.brand_name,
                pr_no: formData.pr_no,
                brand: formData.brand,
                location: formData.location,
                city: formData.city,
                region: formData.region,
                discount: Number(formData.discount) || 0,
                subtotal: Number(formData.subtotal) || 0,
                vat_amount: Number(formData.vat_amount) || 0,
                grand_total: Number(formData.grand_total) || 0,
                craftsperson_notes: formData.craftsperson_notes || '',
                check_in_date: formData.check_in_date || null,
                check_in_time: formData.check_in_time || '',
                items: formData.JobItems.map(item => ({
                    item_code: item.item_code,
                    description: item.description,
                    quantity: Number(item.quantity) || 1,
                    material_price: Number(item.material_price) || 0,
                    labor_price: Number(item.labor_price) || 0,
                    remarks: item.remarks || ''
                })),
                PurchaseOrders: formData.PurchaseOrders.map(po => {
                    // FORCE UNIQUE PO NUMBER if it is generic
                    let finalPoNo = po.po_no || null;
                    if (finalPoNo === 'PO-EMAIL' || finalPoNo === 'PO-PHONE') {
                        finalPoNo = `${finalPoNo}-${formData.quote_no}`;
                    }
                    return {
                        po_no: finalPoNo,
                        po_date: po.po_date || null,
                        eta: po.eta || null,
                        update_notes: po.update_notes || '',
                        amount_ex_vat: Number(po.amount_ex_vat) || 0,
                        vat_15: Number(po.vat_15) || 0,
                        total_inc_vat: Number(po.total_inc_vat) || 0
                    };
                }),
                Finance: {
                    // FORCE UPPERCASE INVOICE STATUS AND PROVIDE DEFAULT IF EMPTY
                    invoice_status: (formData.Finance.invoice_status || 'NOT_SUBMITTED').toUpperCase(),
                    invoice_no: formData.Finance.invoice_no || '',
                    invoice_date: formData.Finance.invoice_date || null,
                    advance_payment: Number(formData.Finance.advance_payment) || 0,
                    received_amount: Number(formData.Finance.received_amount) || 0,
                    payment_date: formData.Finance.payment_date || null,
                    payment_month: formData.Finance.payment_month || '',
                    bank_date: formData.Finance.bank_date || null,
                    hsbc_no: formData.Finance.hsbc_no || '',
                    vat_status: formData.Finance.vat_status || '',
                    vat_duration: formData.Finance.vat_duration || '',
                    days_outstanding: Number(formData.Finance.days_outstanding) || 0,
                    our_bank_ref: formData.Finance.our_bank_ref || '',
                    company_bank_ref: formData.Finance.company_bank_ref || '',
                    payment_status: (formData.Finance.payment_status || '').toUpperCase(),
                    payment_ref: formData.Finance.payment_ref || '',
                    general_ref: formData.Finance.general_ref || ''
                }
            };

            console.log('Saving payload:', payload);
            await axios.put(`${API_BASE_URL}/api/quotations/${quotation.id}`, payload);
            if (onUpdate) onUpdate();
            onClose();
        } catch (err) {
            console.error("Update failed", err);
            console.error("Error response:", err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Update failed! ${errorMsg}\n\nCheck console for details.`);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !formData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                    <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-300 font-bold">Loading Quotation...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "general", label: "General", icon: <FileText size={16} /> },
        { id: "items", label: "Line Items", icon: <Package size={16} /> },
        { id: "purchase", label: "Purchase Order", icon: <ShoppingCart size={16} /> },
        { id: "execution", label: "Work & Status", icon: <Package size={16} /> },
        { id: "finance", label: "Finance & VAT", icon: <CreditCard size={16} /> }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md md:p-4 overflow-hidden">
            <div className={`w-full h-full md:h-[90vh] md:max-w-6xl flex flex-col md:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>

                {/* Header */}
                <div className={`flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"}`}>
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <div className="bg-yellow-400 p-1.5 md:p-2 rounded-xl"><FileText size={16} className="text-black md:w-5 md:h-5" /></div>
                            <h2 className={`text-lg md:text-xl font-black uppercase ${darkMode ? "text-white" : "text-gray-900"}`}>Edit Quotation</h2>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase">{formData.quote_no} — {formData.brand_name || formData.brand || 'No Name'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 md:p-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"><X size={20} className="md:w-6 md:h-6" /></button>
                </div>

                {/* Tab Navigation */}
                <div className={`flex overflow-x-auto px-2 md:px-4 pt-4 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase rounded-t-2xl transition-all border-b-4 ${activeTab === tab.id
                                ? (darkMode ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-yellow-400/10 border-yellow-400 text-yellow-600")
                                : "border-transparent text-gray-400"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === "general" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Input label="Company Name" darkMode={darkMode} value={formData.brand_name} onChange={v => handleChange("brand_name", v)} />
                            <Input label="Quote Date" darkMode={darkMode} value={formData.sent_at} onChange={v => handleChange("sent_at", v)} type="date" />
                            <Input label="Quote Number" darkMode={darkMode} value={formData.quote_no} onChange={v => handleChange("quote_no", v)} />
                            <Input label="MR Date" darkMode={darkMode} value={formData.mr_date} onChange={v => handleChange("mr_date", v)} type="date" />
                            <Input label="MR Number" darkMode={darkMode} value={formData.mr_no} onChange={v => handleChange("mr_no", v)} />
                            <Input label="PR Number" darkMode={darkMode} value={formData.pr_no} onChange={v => handleChange("pr_no", v)} />
                            <Input label="Brand" darkMode={darkMode} value={formData.brand} onChange={v => handleChange("brand", v)} />
                            <Input label="Location" darkMode={darkMode} value={formData.location} onChange={v => handleChange("location", v)} />
                            <Input label="City" darkMode={darkMode} value={formData.city} onChange={v => handleChange("city", v)} />
                            <Input label="Region" darkMode={darkMode} value={formData.region} onChange={v => handleChange("region", v)} />
                            <Input label="Store ID (Oracle CCID)" darkMode={darkMode} value={formData.oracle_ccid} onChange={v => handleChange("oracle_ccid", v)} />
                            <Input label="Supervisor" darkMode={darkMode} value={formData.supervisor} onChange={v => handleChange("supervisor", v)} />

                            {/* Quote Status Dropdown */}
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Quotation Status</label>
                                <select
                                    value={formData.quote_status || "DRAFT"}
                                    onChange={e => handleChange("quote_status", e.target.value)}
                                    className={`border-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${darkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:ring-cyan-500/20 focus:border-cyan-500"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-yellow-500/20 focus:border-yellow-500"
                                        }`}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="READY_TO_SEND">Ready to Send</option>
                                    <option value="SENT">Sent</option>
                                    <option value="PO_RECEIVED">PO Received</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="PAID">Paid</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="col-span-full">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Comments</label>
                                <textarea
                                    value={formData.comments || ""}
                                    onChange={e => handleChange("comments", e.target.value)}
                                    rows={2}
                                    placeholder="Add comments here..."
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-bold ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}
                                />
                            </div>
                            <div className="col-span-full">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Work Description</label>
                                <textarea
                                    value={formData.work_description || ""}
                                    onChange={e => handleChange("work_description", e.target.value)}
                                    rows={3}
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-bold ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "items" && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto rounded-2xl border dark:border-gray-800">
                                <table className="w-full text-xs">
                                    <thead className={darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}>
                                        <tr className="uppercase font-black">
                                            <th className="p-4 text-center w-32">Code</th>
                                            <th className="p-4 text-left">Description</th>
                                            <th className="p-4 text-center w-20">Unit</th>
                                            <th className="p-4 text-center w-20">Qty</th>
                                            <th className="p-4 text-right w-24">Mat.</th>
                                            <th className="p-4 text-right w-24">Lab.</th>
                                            <th className="p-4 text-right w-24">Row Total</th>
                                            <th className="p-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold">
                                        {formData.JobItems.map((item, index) => (
                                            <tr key={item.id} className="border-t dark:border-gray-800">
                                                <td className="p-2 relative">
                                                    <input
                                                        className="w-full bg-transparent outline-none text-center p-2 rounded focus:bg-gray-500/10"
                                                        value={item.item_code || ""}
                                                        onChange={(e) => handleItemSearch(index, 'item_code', e.target.value)}
                                                        onFocus={() => setActiveRow(index)}
                                                    />
                                                    {activeRow === index && priceSuggestions.length > 0 && (
                                                        <div className="absolute left-0 top-full mt-1 w-80 bg-white shadow-2xl z-50 max-h-60 overflow-y-auto text-black border">
                                                            {priceSuggestions.map((s, i) => (
                                                                <div key={i} className="p-3 hover:bg-yellow-50 cursor-pointer border-b" onClick={() => selectSuggestion(index, s)}>
                                                                    <div className="flex justify-between font-black text-[10px]">
                                                                        <span className="text-cyan-600">{s.code}</span>
                                                                        <span>{(Number(s.material_price) + Number(s.labor_price)).toFixed(2)} SAR</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-600">{s.description}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <textarea
                                                        className="w-full bg-transparent outline-none p-2 rounded resize-none"
                                                        value={item.description || ""}
                                                        onChange={(e) => handleItemSearch(index, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input className="w-full bg-transparent text-center" value={item.unit || ""} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} />
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" className="w-full bg-transparent text-center" value={item.quantity || 0} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" className="w-full bg-transparent text-right opacity-60" value={item.material_price || 0} onChange={(e) => handleItemChange(item.id, 'material_price', e.target.value)} />
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" className="w-full bg-transparent text-right font-black" value={item.labor_price || 0} onChange={(e) => handleItemChange(item.id, 'labor_price', e.target.value)} />
                                                </td>
                                                <td className="p-2 text-right font-black bg-gray-500/5 rounded-xl">
                                                    {((Number(item.quantity || 0) * Number(item.material_price || 0)) + Number(item.labor_price || 0)).toFixed(2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => removeRow(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addRow} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed font-black uppercase hover:bg-cyan-500/5">
                                <Plus size={18} /> Add New Item
                            </button>
                        </div>
                    )}

                    {activeTab === "purchase" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">PO Number</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Enter PO Number manually"
                                        value={formData.PurchaseOrders[0].po_no || ""}
                                        onChange={e => handleChange("PurchaseOrders.0.po_no", e.target.value)}
                                        className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-sm font-bold ${darkMode
                                            ? "bg-gray-800 border-gray-700 text-white"
                                            : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    />
                                    <select
                                        value=""
                                        onChange={e => {
                                            if (e.target.value === "Email") handleChange("PurchaseOrders.0.po_no", `PO-EMAIL-${formData.quote_no}`);
                                            if (e.target.value === "Phone") handleChange("PurchaseOrders.0.po_no", `PO-PHONE-${formData.quote_no}`);
                                            e.target.value = ""; // reset dropdown after selection
                                        }}
                                        className={`border-2 rounded-xl px-3 py-2 text-sm font-bold ${darkMode
                                            ? "bg-gray-800 border-gray-700 text-white"
                                            : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="Email">By Email</option>
                                        <option value="Phone">By Phone</option>
                                    </select>
                                </div>
                            </div>
                            <Input label="PO Date" darkMode={darkMode} value={formData.PurchaseOrders[0].po_date} onChange={v => handleChange("PurchaseOrders.0.po_date", v)} type="date" />
                            <Input label="ETA" darkMode={darkMode} value={formData.PurchaseOrders[0].eta} onChange={v => handleChange("PurchaseOrders.0.eta", v)} type="date" />
                            <div className="col-span-full">
                                <Input label="Update Notes" darkMode={darkMode} value={formData.PurchaseOrders[0].update_notes} onChange={v => handleChange("PurchaseOrders.0.update_notes", v)} />
                            </div>
                            <Input label="Amount Ex VAT" darkMode={darkMode} value={formData.PurchaseOrders[0].amount_ex_vat} onChange={v => handleChange("PurchaseOrders.0.amount_ex_vat", v)} type="number" />
                            <Input label="VAT Amount (15%)" darkMode={darkMode} value={formData.PurchaseOrders[0].vat_15} onChange={v => handleChange("PurchaseOrders.0.vat_15", v)} type="number" />
                            <Input label="Total Incl. VAT" darkMode={darkMode} value={formData.PurchaseOrders[0].total_inc_vat} onChange={v => handleChange("PurchaseOrders.0.total_inc_vat", v)} type="number" />
                        </div>
                    )}



                    {activeTab === "execution" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Work Status</label>
                                <select
                                    value={formData.work_status || "NOT_STARTED"}
                                    onChange={e => handleChange("work_status", e.target.value)}
                                    className={`border-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${darkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:ring-cyan-500/20 focus:border-cyan-500"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-yellow-500/20 focus:border-yellow-500"
                                        }`}
                                >
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <Input label="Completion Date" darkMode={darkMode} value={formData.completion_date} onChange={v => handleChange("completion_date", v)} type="date" />
                            <Input label="Completed By" darkMode={darkMode} value={formData.completed_by} onChange={v => handleChange("completed_by", v)} />
                            <Input label="Supervisor" darkMode={darkMode} value={formData.supervisor} onChange={v => handleChange("supervisor", v)} />
                            <Input label="Check-In Date" darkMode={darkMode} value={formData.check_in_date} onChange={v => handleChange("check_in_date", v)} type="date" />
                            <Input label="Check-In Time" darkMode={darkMode} value={formData.check_in_time} onChange={v => handleChange("check_in_time", v)} />
                            <div className="col-span-full">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Craftsperson Notes</label>
                                <textarea
                                    value={formData.craftsperson_notes || ""}
                                    onChange={e => handleChange("craftsperson_notes", e.target.value)}
                                    rows={3}
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-bold ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "finance" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Invoice Status</label>
                                <select
                                    value={formData.Finance.invoice_status || "NOT_SUBMITTED"}
                                    onChange={e => handleChange("Finance.invoice_status", e.target.value)}
                                    className={`border-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 ${darkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:ring-cyan-500/20 focus:border-cyan-500"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-yellow-500/20 focus:border-yellow-500"
                                        }`}
                                >
                                    <option value="NOT_SUBMITTED">Not Submitted</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="EW">Extra Works (EW)</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PARTIAL">Partial Payment</option>
                                    <option value="UNPAID">Unpaid</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <Input label="Invoice Number" darkMode={darkMode} value={formData.Finance.invoice_no} onChange={v => handleChange("Finance.invoice_no", v)} />
                            <Input label="Invoice Date" darkMode={darkMode} value={formData.Finance.invoice_date} onChange={v => handleChange("Finance.invoice_date", v)} type="date" />
                            <Input label="Discount Amount" darkMode={darkMode} value={formData.discount} onChange={v => handleChange("discount", v)} type="number" />
                            <Input label="Advance Payment" darkMode={darkMode} value={formData.Finance.advance_payment} onChange={v => handleChange("Finance.advance_payment", v)} type="number" />
                            <Input label="Received Amount" darkMode={darkMode} value={formData.Finance.received_amount} onChange={v => handleChange("Finance.received_amount", v)} type="number" />
                            <Input label="Payment Date" darkMode={darkMode} value={formData.Finance.payment_date} onChange={v => handleChange("Finance.payment_date", v)} type="date" />
                            <Input
                                label="Payment Month"
                                darkMode={darkMode}
                                value={formData.Finance.payment_month}
                                onChange={v => handleChange("Finance.payment_month", v)}
                                type="month"
                            />
                            <Input label="Bank Date" darkMode={darkMode} value={formData.Finance.bank_date} onChange={v => handleChange("Finance.bank_date", v)} type="date" />
                            <Input label="HSBC Number" darkMode={darkMode} value={formData.Finance.hsbc_no} onChange={v => handleChange("Finance.hsbc_no", v)} />
                            <Input label="VAT Status" darkMode={darkMode} value={formData.Finance.vat_status} onChange={v => handleChange("Finance.vat_status", v)} />
                            <Input label="VAT Duration" darkMode={darkMode} value={formData.Finance.vat_duration} onChange={v => handleChange("Finance.vat_duration", v)} />
                            <Input label="Days Outstanding" darkMode={darkMode} value={formData.Finance.days_outstanding} onChange={v => handleChange("Finance.days_outstanding", v)} type="number" />
                            <Input label="Our Bank Reference" darkMode={darkMode} value={formData.Finance.our_bank_ref} onChange={v => handleChange("Finance.our_bank_ref", v)} />
                            <Input label="Company Bank Reference" darkMode={darkMode} value={formData.Finance.company_bank_ref} onChange={v => handleChange("Finance.company_bank_ref", v)} />
                            <Input label="Payment Status" darkMode={darkMode} value={formData.Finance.payment_status} onChange={v => handleChange("Finance.payment_status", v)} />
                            <Input label="Payment Reference" darkMode={darkMode} value={formData.Finance.payment_ref} onChange={v => handleChange("Finance.payment_ref", v)} />
                            <Input label="General Ref #" darkMode={darkMode} value={formData.Finance.general_ref} onChange={v => handleChange("Finance.general_ref", v)} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-6 border-t flex justify-end gap-4 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"}`}>
                    <button onClick={onClose} disabled={saving} className="px-8 py-3 rounded-2xl font-black uppercase text-xs border-2 dark:border-gray-700">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl ${darkMode ? "bg-cyan-500 text-black" : "bg-black text-white"} disabled:opacity-50`}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? "Saving..." : "Update Quotation"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuotationEditModal;