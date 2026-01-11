import React, { useState } from 'react';
import { Upload, Database, DollarSign, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const DataSync = () => {
    const [uploading, setUploading] = useState({ stores: false, pricelist: false });
    const [status, setStatus] = useState({ stores: null, pricelist: null });
    const { darkMode, colors, themeStyles } = useTheme();

    const handleUpload = async (type, file) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [type]: true }));
        setStatus(prev => ({ ...prev, [type]: { type: 'loading', message: 'Processing CSV data...' } }));

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = `${API_BASE_URL}/api/master/${type === 'stores' ? 'upload-stores' : 'upload-pricelist'}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setStatus(prev => ({
                    ...prev,
                    [type]: { type: 'success', message: `Success! ${result.count || 0} records updated.` }
                }));
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            setStatus(prev => ({
                ...prev,
                [type]: { type: 'error', message: error.message }
            }));
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const SyncCard = ({ type, title, description, icon: Icon }) => (
        <div className={`${themeStyles.card} border-2 border-transparent hover:border-indigo-500/20 transition-all group p-8`}>
            <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} group-hover:scale-110 transition-transform`}>
                    <Icon size={32} />
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 ${colors.textSecondary}`}>
                        CSV Import
                    </span>
                </div>
            </div>

            <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${colors.text}`}>{title}</h3>
            <p className={`text-sm font-medium mb-8 leading-relaxed ${colors.textSecondary}`}>
                {description}
            </p>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="file"
                        accept=".csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => handleUpload(type, e.target.files[0])}
                        disabled={uploading[type]}
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${darkMode ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}>
                        {uploading[type] ? (
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        ) : (
                            <Upload className="text-gray-400" size={32} />
                        )}
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            {uploading[type] ? 'Uploading...' : 'Drop CSV or click to browse'}
                        </p>
                    </div>
                </div>

                {status[type] && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${status[type].type === 'success' ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') :
                            status[type].type === 'error' ? (darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700') :
                                (darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700')
                        }`}>
                        {status[type].type === 'success' ? <CheckCircle2 size={18} /> :
                            status[type].type === 'error' ? <AlertCircle size={18} /> :
                                <RefreshCw size={18} className="animate-spin" />}
                        <span className="text-xs font-bold uppercase tracking-tight">{status[type].message}</span>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Supported Format: CSV Only</span>
                <span className="flex items-center gap-1 text-indigo-500 cursor-help hover:underline">
                    Structure Guide <ArrowRight size={10} />
                </span>
            </div>
        </div>
    );

    return (
        <div className={`p-4 md:p-8 space-y-8 min-h-screen ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                        <RefreshCw size={32} className={Object.values(uploading).some(v => v) ? 'animate-spin' : ''} />
                    </div>
                    <div>
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${colors.text}`}>Bulk Data Sync</h1>
                        <p className={`${colors.textSecondary} font-medium`}>Instantly update your master archives via CSV mass-upload.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SyncCard
                    type="stores"
                    title="Master Store Data"
                    description="Update Oracle CCIDs, store names, regions, cities, and mall details. Use this to maintain your global AOR records."
                    icon={Database}
                />
                <SyncCard
                    type="pricelist"
                    title="Price List / Rate Card"
                    description="Upload new material and labor rates. This will refresh the defaults used globally across all new quotations."
                    icon={DollarSign}
                />
            </div>

            {/* Critical Note */}
            <div className={`p-8 rounded-3xl border flex flex-col md:flex-row gap-6 items-center ${darkMode ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'
                }`}>
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertCircle size={32} />
                </div>
                <div>
                    <h4 className={`text-lg font-black uppercase tracking-tight mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-900'}`}>Sync Policy & Data Integrity</h4>
                    <p className={`text-sm font-medium leading-relaxed max-w-3xl ${darkMode ? 'text-amber-500/70' : 'text-amber-800'}`}>
                        Uploading a CSV will perform an <strong>UPSERT</strong>. This means it will update existing records if the Primary Key (CCID or Item Code) exists, and create new ones if they don't. Historical quotations will not be altered.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DataSync;
