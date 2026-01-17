import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import StatusCard from '../components/Statuscard'; // Reusing simple card style if suitable, or just custom

const RecycleBin = () => {
    const { darkMode } = useTheme();
    const [deletedItems, setDeletedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchBin();
    }, []);

    const fetchBin = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/bin/quotations`);
            if (res.data.success) {
                setDeletedItems(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch bin:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm("Are you sure you want to restore this item?")) return;

        setActionLoading(id);
        try {
            const res = await axios.put(`${API_BASE_URL}/api/bin/quotations/${id}/restore`);
            if (res.data.success) {
                alert("Restored successfully!");
                fetchBin();
            }
        } catch (error) {
            alert("Failed to restore: " + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteForever = async (id) => {
        if (!window.confirm("⚠️ WARNING: This will PERMANENTLY delete this item. This action cannot be undone. Proceed?")) return;

        setActionLoading(id);
        try {
            const res = await axios.delete(`${API_BASE_URL}/api/bin/quotations/${id}`);
            if (res.data.success) {
                alert("Permanently deleted.");
                fetchBin();
            }
        } catch (error) {
            alert("Failed to delete: " + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-500" /> Recycle Bin
            </h1>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
                </div>
            ) : deletedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <Trash2 className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Bin is empty</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-sm">
                        <thead className={`border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                            <tr>
                                <th className="p-4">Quote No</th>
                                <th className="p-4">Job / Brand</th>
                                <th className="p-4">Deleted At</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedItems.map((item) => (
                                <tr key={item.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                                    <td className="p-4 font-mono font-medium">{item.quote_no}</td>
                                    <td className="p-4">
                                        <div className="font-bold">{item.brand || 'No Brand'}</div>
                                        <div className="text-xs text-gray-500">{item.mr_no} • {item.location}</div>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {new Date(item.deletedAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleRestore(item.id)}
                                            disabled={actionLoading === item.id}
                                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg flex items-center gap-1 transition-colors"
                                            title="Restore"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Restore
                                        </button>
                                        <button
                                            onClick={() => handleDeleteForever(item.id)}
                                            disabled={actionLoading === item.id}
                                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg flex items-center gap-1 transition-colors"
                                            title="Delete Forever"
                                        >
                                            <Trash2 className="w-4 h-4" /> Permanent
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecycleBin;
