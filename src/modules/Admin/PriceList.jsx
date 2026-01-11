import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Search, Filter, RefreshCw, Layers, Tag, ArrowUpRight, ChevronRight, PackageCheck } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const PriceList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { darkMode, colors, themeStyles } = useTheme();

    useEffect(() => {
        fetchPriceList();
    }, []);

    const fetchPriceList = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/pricelist`);
            setItems(res.data.data || []);
        } catch (err) {
            console.error('Error fetching price list:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Standard Items', value: items.length, icon: PackageCheck, color: 'emerald' },
        { label: 'Avg Material Price', value: `SAR ${(items.reduce((acc, curr) => acc + Number(curr.material_price || 0), 0) / (items.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Tag, color: 'blue' },
        { label: 'Categories', value: [...new Set(items.map(i => i.type))].length || 1, icon: Layers, color: 'amber' },
    ];

    return (
        <div className={`p-4 md:p-8 space-y-8 min-h-screen ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black uppercase tracking-tight ${colors.text}`}>Price List / Rate Card</h1>
                    <p className={`${colors.textSecondary} font-medium`}>Standardized material prices and labor rates for quotations.</p>
                </div>
                <button
                    onClick={fetchPriceList}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Rate Card
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className={`${themeStyles.card} flex items-center justify-between overflow-hidden relative`}>
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${colors.text}`}>{stat.value}</p>
                        </div>
                        <div className={`relative z-10 p-3 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Controls */}
            <div className={`${themeStyles.card} flex flex-col md:flex-row gap-4 items-center !p-4`}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH ITEMS BY CODE OR DESCRIPTION..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={themeStyles.input + " !pl-12 !py-3 !text-xs !font-bold !uppercase !tracking-wider"}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        <Filter size={14} /> Category
                    </button>
                </div>
            </div>

            {/* Price Table */}
            <div className={`rounded-3xl shadow-xl overflow-hidden border ${colors.borderColor} ${darkMode ? 'bg-[#1f1f2e]' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className={themeStyles.tableHeader}>
                                <th className="p-5 border-r border-white/5 tracking-widest">Item Details</th>
                                <th className="p-5 border-r border-white/5 tracking-widest">Unit</th>
                                <th className="p-5 border-r border-white/5 tracking-widest text-right">Material</th>
                                <th className="p-5 border-r border-white/5 text-right tracking-widest">Labor</th>
                                <th className="p-5 border-r border-white/5 text-right tracking-widest">Total (SAR)</th>
                                <th className="p-5 text-right tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="p-5"><div className={`h-14 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div></td>
                                    </tr>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <div className="opacity-10 mb-4 flex justify-center"><DollarSign size={64} /></div>
                                        <p className="text-gray-400 font-black uppercase text-sm tracking-widest">No catalogue items found</p>
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.code} className={themeStyles.tableRow}>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter mb-1 select-all ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.code}</span>
                                            <span className={`text-sm font-black uppercase leading-tight ${colors.text}`}>{item.description}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.unit}
                                        </span>
                                    </td>
                                    <td className={`p-5 text-right font-bold text-sm ${colors.textSecondary}`}>
                                        {Number(item.material_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-5 text-right font-bold text-sm ${colors.textSecondary}`}>
                                        {Number(item.labor_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className={`text-md font-black ${colors.text}`}>
                                            {(Number(item.material_price || 0) + Number(item.labor_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right text-gray-400">
                                        <button className={`p-2 rounded-lg transition-all transform hover:rotate-45 active:scale-95 ${darkMode ? 'hover:text-white hover:bg-white/10' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}>
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Visual Accent */}
                <div className="h-1 bg-gradient-to-r from-emerald-500/50 to-teal-600/50" />
            </div>

            {/* Quick Tips */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex gap-4">
                    <div className={`p-2 rounded-lg h-fit ${darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Tag size={20} />
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tight mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>Price Control Policy</h4>
                        <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-emerald-500/70' : 'text-emerald-700'}`}>
                            All prices listed here are used as the default base for new quotations. Manual overrides in the <strong>New Quotation</strong> form will not affect these master rates. To update these globally, use the Sync Tool.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceList;
