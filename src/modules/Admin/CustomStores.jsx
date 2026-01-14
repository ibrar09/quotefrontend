import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, MapPin, X, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';

const CustomStores = () => {
    const { darkMode, themeStyles } = useTheme();
    const [stores, setStores] = useState([]);
    const [filteredStores, setFilteredStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        oracle_ccid: '',
        brand: '',
        store_name: '',
        city: '',
        mall: '',
        region: '',
        map_location: '',
        fm_manager: '',
        fm_supervisor: ''
    });

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = stores.filter(store =>
            store.oracle_ccid?.toLowerCase().includes(lowerSearch) ||
            store.brand?.toLowerCase().includes(lowerSearch) ||
            store.store_name?.toLowerCase().includes(lowerSearch) ||
            store.city?.toLowerCase().includes(lowerSearch) ||
            store.mall?.toLowerCase().includes(lowerSearch)
        );
        setFilteredStores(filtered);
    }, [searchTerm, stores]);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/custom-stores`);
            if (res.data.success) {
                setStores(res.data.data);
                setFilteredStores(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch stores", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingStore) {
                await axios.put(`${API_BASE_URL}/api/custom-stores/${formData.oracle_ccid}`, formData);
                alert('Store Updated Successfully');
            } else {
                await axios.post(`${API_BASE_URL}/api/custom-stores`, formData);
                alert('Store Created Successfully');
            }
            setIsModalOpen(false);
            setEditingStore(null);
            resetForm();
            fetchStores();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving store');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/custom-stores/${id}`);
            fetchStores();
        } catch (err) {
            alert('Failed to delete store');
        }
    };

    const openEditModal = (store) => {
        setEditingStore(store);
        setFormData(store);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingStore(null);
        resetForm();
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            oracle_ccid: '',
            brand: '',
            store_name: '',
            city: '',
            mall: '',
            region: '',
            map_location: '',
            fm_manager: '',
            fm_supervisor: ''
        });
    };

    return (
        <div className={`p-6 min-h-screen transition-colors duration-300 ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold ${themeStyles.text}`}>Custom Store Manager</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add New Store
                </button>
            </div>

            {/* Search Bar */}
            <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <Search size={20} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by CCID, Brand, City, Mall..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`flex-1 outline-none bg-transparent ${themeStyles.text}`}
                />
            </div>

            {/* Table */}
            <div className={`rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-md`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className={`uppercase text-xs font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            <tr>
                                <th className="p-4">CCID</th>
                                <th className="p-4">Brand</th>
                                <th className="p-4">Store Name</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Region</th>
                                <th className="p-4">Map</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                            {loading ? (
                                <tr><td colSpan="7" className="p-6 text-center">Loading Stores...</td></tr>
                            ) : filteredStores.length === 0 ? (
                                <tr><td colSpan="7" className="p-6 text-center text-gray-500">No stores found.</td></tr>
                            ) : filteredStores.map((store) => (
                                <tr key={store.oracle_ccid} className={`hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
                                    <td className="p-4 font-medium">{store.oracle_ccid}</td>
                                    <td className="p-4">{store.brand}</td>
                                    <td className="p-4">{store.store_name}</td>
                                    <td className="p-4">{store.mall}, {store.city}</td>
                                    <td className="p-4">{store.region}</td>
                                    <td className="p-4">
                                        {store.map_location ? (
                                            <a href={store.map_location} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                                <MapPin size={14} /> View
                                            </a>
                                        ) : <span className="text-gray-400">-</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEditModal(store)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(store.oracle_ccid)} className="p-1.5 hover:bg-red-100 text-red-600 rounded transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-700/10">
                            <h2 className="text-xl font-bold">{editingStore ? 'Edit Store' : 'Add New Custom Store'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">App ID / CCID *</label>
                                <input
                                    required
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.oracle_ccid}
                                    onChange={e => setFormData({ ...formData, oracle_ccid: e.target.value })}
                                    disabled={!!editingStore} // Prevent editing Primary Key
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Brand</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Store Name</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.store_name}
                                    onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">City</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Mall / Location</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.mall}
                                    onChange={e => setFormData({ ...formData, mall: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Region</label>
                                <select
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.region}
                                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                                >
                                    <option value="">Select Region</option>
                                    <option value="CP">Central (CP)</option>
                                    <option value="WP">Western (WP)</option>
                                    <option value="EP">Eastern (EP)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Map Location (URL)</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    placeholder="https://goo.gl/maps/..."
                                    value={formData.map_location}
                                    onChange={e => setFormData({ ...formData, map_location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">FM Manager</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.fm_manager}
                                    onChange={e => setFormData({ ...formData, fm_manager: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">FM Supervisor</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.fm_supervisor}
                                    onChange={e => setFormData({ ...formData, fm_supervisor: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={`px-4 py-2 rounded font-bold uppercase text-xs ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Store
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomStores;
