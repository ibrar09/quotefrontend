import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Loader2, Package, FileText } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import API_BASE_URL from "../../config/api";

// Reusing Input Component logic
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

const WorkEditModal = ({ quotation, onClose, onUpdated }) => {
    const { darkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(null);
    const [activeTab, setActiveTab] = useState("execution");

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/quotations/${quotation.id}`);
                if (res.data.success) {
                    const data = res.data.data;
                    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
                    setFormData({
                        ...data,
                        sent_at: formatDate(data.sent_at),
                        completion_date: data.completion_date,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch details", err);
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
                if (i === keys.length - 1) ref[k] = value;
                else {
                    if (!ref[k]) ref[k] = (isNaN(keys[i + 1]) ? {} : []);
                    ref = ref[k];
                }
            });
            return updated;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                work_status: formData.work_status,
                completion_date: formData.completion_date,
                completed_by: formData.completed_by,
                supervisor: formData.supervisor,
                comments: formData.comments,
            };
            await axios.put(`${API_BASE_URL}/api/quotations/${quotation.id}`, payload);
            onUpdated();
            onClose();
        } catch (err) {
            alert("Update failed!");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !formData) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-white" /></div>;

    const tabs = [
        { id: "execution", label: "Work Execution", icon: <Package size={16} /> },
        { id: "general", label: "General Info", icon: <FileText size={16} /> }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className={`w-full max-w-4xl h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
                {/* Header */}
                <div className={`flex justify-between items-center px-8 py-6 border-b ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"}`}>
                    <div>
                        <h2 className={`text-xl font-black uppercase ${darkMode ? "text-white" : "text-gray-900"}`}>Update Work Order</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase">{formData.quote_no}</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                {/* Tabs */}
                <div className={`flex px-4 pt-4 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === "execution" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1 ml-1">Work Status</label>
                                <select
                                    value={formData.work_status || "NOT_STARTED"}
                                    onChange={e => handleChange("work_status", e.target.value)}
                                    className={`border-2 rounded-xl px-4 py-2.5 text-sm font-bold ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
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
                            <div className="col-span-full">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-1 ml-1">Comments</label>
                                <textarea
                                    value={formData.comments || ""}
                                    onChange={e => handleChange("comments", e.target.value)}
                                    rows={3}
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-bold ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "general" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Work Description" darkMode={darkMode} value={formData.work_description} onChange={v => handleChange("work_description", v)} />
                            <Input label="Brand / Company" darkMode={darkMode} value={formData.brand_name} onChange={v => handleChange("brand_name", v)} />
                            <Input label="Location" darkMode={darkMode} value={formData.location} onChange={v => handleChange("location", v)} />
                            <Input label="Region" darkMode={darkMode} value={formData.region} onChange={v => handleChange("region", v)} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-6 border-t flex justify-end gap-4 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"}`}>
                    <button onClick={onClose} disabled={saving} className="px-8 py-3 rounded-2xl font-black uppercase text-xs border-2 dark:border-gray-700">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className={`px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl ${darkMode ? "bg-cyan-500 text-black" : "bg-black text-white"}`}>
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? "Saving..." : "Update Work"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkEditModal;
