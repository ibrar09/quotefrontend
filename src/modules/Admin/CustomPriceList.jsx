import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, X, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';

const CustomPriceList = () => {
    const { darkMode, themeStyles } = useTheme();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        type: 'Civil',
        description: '',
        unit: 'PCS',
        material_price: 0,
        labor_price: 0,
        total_price: 0,
        remarks: ''
    });

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = items.filter(item =>
            item.code?.toLowerCase().includes(lowerSearch) ||
            item.description?.toLowerCase().includes(lowerSearch)
        );
        setFilteredItems(filtered);
    }, [searchTerm, items]);

    // Auto-calculate total price
    useEffect(() => {
        const total = parseFloat(formData.material_price || 0) + parseFloat(formData.labor_price || 0);
        setFormData(prev => ({ ...prev, total_price: total }));
    }, [formData.material_price, formData.labor_price]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/custom-pricelist`);
            if (res.data.success) {
                setItems(res.data.data);
                setFilteredItems(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch custom price items", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API_BASE_URL}/api/custom-pricelist/${formData.code}`, formData);
                alert('Item Updated Successfully');
            } else {
                await axios.post(`${API_BASE_URL}/api/custom-pricelist`, formData);
                alert('Item Created Successfully');
            }
            setIsModalOpen(false);
            setEditingItem(null);
            resetForm();
            fetchItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving item');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/custom-pricelist/${id}`);
            fetchItems();
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingItem(null);
        resetForm();
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            type: 'Civil',
            description: '',
            unit: 'PCS',
            material_price: 0,
            labor_price: 0,
            total_price: 0,
            remarks: ''
        });
    };

    return (
        <div className={`p-6 min-h-screen transition-colors duration-300 ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold ${themeStyles.text}`}>Custom Price List</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            {/* Search Bar */}
            <div className={`flex items-center gap-2 p-3 mb-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <Search size={20} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by Item Code or Description..."
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
                                <th className="p-4">Item Code</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4 text-right">Mat. Price</th>
                                <th className="p-4 text-right">Lab. Price</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                            {loading ? (
                                <tr><td colSpan="8" className="p-6 text-center">Loading Items...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan="8" className="p-6 text-center text-gray-500">No items found.</td></tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.code} className={`hover:${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
                                    <td className="p-4 font-bold font-mono">{item.code}</td>
                                    <td className="p-4 max-w-xs truncate">{item.description}</td>
                                    <td className="p-4"><span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{item.type}</span></td>
                                    <td className="p-4">{item.unit}</td>
                                    <td className="p-4 text-right">{item.material_price}</td>
                                    <td className="p-4 text-right">{item.labor_price}</td>
                                    <td className="p-4 text-right font-bold text-green-600">{item.total_price}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEditModal(item)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.code)} className="p-1.5 hover:bg-red-100 text-red-600 rounded transition">
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
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit Item' : 'Add New Price Item'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Item Code *</label>
                                <input
                                    required
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    disabled={!!editingItem} // Primary Key
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Type</label>
                                <select
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Civil">Civil</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="HVAC">HVAC</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Description</label>
                                <textarea
                                    rows="2"
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Unit</label>
                                <input
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.unit}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Material Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.material_price}
                                    onChange={e => setFormData({ ...formData, material_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Labor Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`w-full p-2 rounded border focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                    value={formData.labor_price}
                                    onChange={e => setFormData({ ...formData, labor_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase opacity-70">Total Price (Auto)</label>
                                <input
                                    readOnly
                                    className={`w-full p-2 rounded border bg-gray-100 text-gray-500 cursor-not-allowed ${darkMode ? 'bg-gray-900 border-gray-800' : ''}`}
                                    value={formData.total_price}
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
                                    className="bg-purple-600 text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomPriceList;
