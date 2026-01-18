import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { UserPlus, Edit, Trash2, CheckCircle, XCircle, Shield, Key } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { themeStyles, darkMode } = useTheme();

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        permissions: []
    });

    const ALL_PERMISSIONS = [
        'view_dashboard', 'view_quotations', 'create_quotation', 'delete_quotation',
        'view_finance', 'approve_finance', 'manage_master_data', 'manage_users'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/auth/users`);
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Edit
                await axios.put(`${API_BASE_URL}/api/auth/users/${editingUser.id}`, formData);
            } else {
                // Create
                await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
            }
            setShowModal(false);
            fetchUsers();
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/auth/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const togglePermission = (perm) => {
        const current = formData.permissions || [];
        if (current.includes(perm)) {
            setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
        } else {
            setFormData({ ...formData, permissions: [...current, perm] });
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role: 'USER', permissions: [] });
    };

    return (
        <div className={`p-6 min-h-screen ${themeStyles.container}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-blue-500" /> User Management
                    </h1>
                    <p className="text-gray-500">Manage system access and permissions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className={`${themeStyles.button} bg-blue-600 hover:bg-blue-700 text-white`}
                >
                    <UserPlus size={18} /> Add New User
                </button>
            </div>

            <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white uppercase text-xs font-bold">
                            <th className="p-4 border-b border-gray-700">User</th>
                            <th className="p-4 border-b border-gray-700">Role</th>
                            <th className="p-4 border-b border-gray-700">Permissions</th>
                            <th className="p-4 border-b border-gray-700">Status</th>
                            <th className="p-4 border-b border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold">{user.username}</div>
                                    <div className="text-xs text-gray-400">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.role === 'ADMIN' ? (
                                            <span className="text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded">ALL ACCESS</span>
                                        ) : (
                                            user.permissions?.map(p => (
                                                <span key={p} className="text-[10px] bg-gray-700 px-2 py-0.5 rounded border border-gray-600">
                                                    {p.replace(/_/g, ' ')}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.is_active ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setFormData({ ...user, password: '' });
                                                setShowModal(true);
                                            }}
                                            className="p-1 hover:bg-white/10 rounded text-blue-400"
                                            title="Edit User"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {user.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1 hover:bg-white/10 rounded text-red-400"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`${darkMode ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 shadow-2xl'} w-full max-w-2xl rounded-xl overflow-hidden transition-all transform scale-100`}>
                        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {editingUser ? <Edit size={20} /> : <UserPlus size={20} />}
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-red-500/10 hover:text-red-500 p-1 rounded-full"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Username</label>
                                    <input
                                        className={`w-full p-2.5 rounded-lg border outline-none transition-colors font-medium
                                            ${darkMode
                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100'}
                                        `}
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
                                    <input
                                        type="email"
                                        className={`w-full p-2.5 rounded-lg border outline-none transition-colors font-medium
                                            ${darkMode
                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100'}
                                        `}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="e.g. john@maaj.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Password {editingUser && <span className="text-xs font-normal opacity-70">(Leave blank to keep unchanged)</span>}
                                </label>
                                <div className="relative">
                                    <Key size={18} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <input
                                        type="password"
                                        className={`w-full pl-10 p-2.5 rounded-lg border outline-none transition-colors font-medium
                                            ${darkMode
                                                ? 'bg-gray-700 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100'}
                                        `}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        minLength={6}
                                        placeholder={editingUser ? "••••••••" : "Enter secure password"}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Permissions</label>
                                <div className={`grid grid-cols-2 gap-2 p-4 rounded-lg border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    {ALL_PERMISSIONS.map(perm => (
                                        <label key={perm} className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-white hover:shadow-sm'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                                checked={formData.permissions?.includes(perm)}
                                                onChange={() => togglePermission(perm)}
                                            />
                                            <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {perm.replace(/_/g, ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={`pt-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {editingUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
