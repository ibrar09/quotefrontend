import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Search, Filter, ArrowUpRight, Store, MapPin, Users, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const MasterData = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { darkMode, colors, themeStyles } = useTheme();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/stores`);
            setStores(res.data.data || []);
        } catch (err) {
            console.error('Error fetching stores:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(s =>
        s.oracle_ccid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Stores', value: stores.length, icon: Store, color: 'blue' },
        { label: 'Cities', value: [...new Set(stores.map(s => s.city))].length, icon: MapPin, color: 'purple' },
        { label: 'Supervisors', value: [...new Set(stores.map(s => s.fm_supervisor))].length, icon: Users, color: 'emerald' },
    ];

    return (
        <div className={`p-4 md:p-8 space-y-8 min-h-screen ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black uppercase tracking-tight ${colors.text}`}>Master Data (AOR)</h1>
                    <p className={`${colors.textSecondary} font-medium`}>Manage store locations, Oracle CCIDs, and management personnel.</p>
                </div>
                <button
                    onClick={fetchStores}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className={`${themeStyles.card} flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${colors.text}`}>{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
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
                        placeholder="SEARCH BY CCID, NAME, BRAND OR CITY..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={themeStyles.input + " !pl-12 !py-3 !text-xs !font-bold !uppercase !tracking-wider"}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className={`rounded-2xl shadow-xl overflow-hidden border ${colors.borderColor} ${darkMode ? 'bg-[#1f1f2e]' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={themeStyles.tableHeader}>
                                <th className="p-4 border-r border-white/5 tracking-widest">CCID</th>
                                <th className="p-4 border-r border-white/5 tracking-widest">Brand / Name</th>
                                <th className="p-4 border-r border-white/5 tracking-widest">Location</th>
                                <th className="p-4 border-r border-white/5 tracking-widest">Management</th>
                                <th className="p-4 border-r border-white/5 tracking-widest">Status</th>
                                <th className="p-4 text-right tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="p-4"><div className={`h-12 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}></div></td>
                                    </tr>
                                ))
                            ) : filteredStores.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="opacity-20 mb-2 flex justify-center"><Database size={48} /></div>
                                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No matching records found</p>
                                    </td>
                                </tr>
                            ) : filteredStores.map((store) => (
                                <tr key={store.oracle_ccid} className={themeStyles.tableRow}>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 font-mono text-sm font-bold rounded-lg border ${darkMode ? 'bg-gray-900 text-indigo-400 border-gray-700' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                            {store.oracle_ccid}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className={`text-sm font-black uppercase leading-none mb-1 ${colors.text}`}>{store.brand}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-tight ${colors.textSecondary}`}>{store.store_name}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{store.region}</span>
                                            <span className="text-xs font-medium">{store.city} • {store.mall}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">FM: {store.fm_manager}</span>
                                            <span className={`text-[10px] uppercase font-medium ${colors.textSecondary}`}>SUP: {store.fm_supervisor}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${store.store_status === 'ACTIVE' || store.store_status === 'LFL'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : darkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                            {store.store_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className={`p-2 rounded-lg transition-all active:scale-90 ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex justify-between items-center text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'bg-black/20 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <span>Showing {filteredStores.length} stores</span>
                    <div className="flex gap-2">
                        <button className={`px-3 py-1 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'} disabled:opacity-50`}>Prev</button>
                        <button className={`px-3 py-1 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'} disabled:opacity-50`}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterData;
