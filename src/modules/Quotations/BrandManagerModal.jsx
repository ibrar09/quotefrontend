import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Save } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const BrandManagerModal = ({ isOpen, onClose, groupName, onUpdate }) => {
    const [brands, setBrands] = useState([]);
    const [newBrand, setNewBrand] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && groupName) {
            fetchBrands();
        }
    }, [isOpen, groupName]);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/client-groups/${groupName}/brands`);
            if (res.data.success) {
                setBrands(res.data.data);
            }
        } catch (err) {
            setError('Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newBrand.trim()) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/client-groups/${groupName}/brands`, {
                brand_name: newBrand
            });
            if (res.data.success) {
                setNewBrand('');
                fetchBrands();
                if (onUpdate) onUpdate(); // Refresh parent
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add brand');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this brand from the group?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/client-groups/${id}`);
            fetchBrands();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('Failed to delete brand');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-1">Manage Brands</h2>
                <p className="text-sm text-gray-500 mb-6">Group: <span className="font-semibold text-blue-600">{groupName}</span></p>

                {/* Add New */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Enter new brand name (e.g. Boots)"
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newBrand.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <p className="text-center text-gray-500 py-4">Loading...</p>
                    ) : brands.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No brands in this group yet.</p>
                    ) : (
                        brands.map((brand) => (
                            <div
                                key={brand.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                            >
                                <span className="font-medium">{brand.brand_name}</span>
                                <button
                                    onClick={() => handleDelete(brand.id)}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded-md transition"
                                    title="Remove Brand"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandManagerModal;
