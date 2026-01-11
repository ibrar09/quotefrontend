import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import WorkEditModal from './WorkEditModal';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';

const WorkList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedWork, setSelectedWork] = useState(null);
    const navigate = useNavigate();
    const { darkMode, colors, themeStyles } = useTheme();

    // Work Statuses
    const statuses = ['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/quotations`);
            // Filter out only APPROVED/SENT if needed? Or show all?
            // Usually work starts after approval. For now show all to be safe, filter by Work Status.
            setQuotations(res.data.data || []);
        } catch (err) {
            console.error(err);
            setQuotations([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredQuotations = quotations.filter(q =>
        filter === 'ALL' ? true : q.work_status === filter
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'DONE': return 'text-green-600';
            case 'IN_PROGRESS': return 'text-blue-500';
            case 'NOT_STARTED': return 'text-orange-500';
            case 'CANCELLED': return 'text-red-500';
            default: return darkMode ? 'text-gray-300' : 'text-black';
        }
    };

    return (
        <div className={`p-6 min-h-screen text-[10px] ${themeStyles.container}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Work Order Tracking</h1>
                    <p className={colors.textSecondary}>Execution & Completion Status</p>
                </div>
                {/* No Create Button - Work originates from Quote */}
            </div>

            {/* Filters */}
            <div className={`flex flex-wrap gap-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} mb-6`}>
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`pb-2 px-4 font-bold uppercase transition-colors ${filter === status
                            ? `border-b-4 ${darkMode ? 'border-[#00a8aa] text-[#00a8aa]' : 'border-black text-black'}`
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className={`overflow-x-auto shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className={themeStyles.tableHeader}>
                            <th className="p-2 border-r">Actions</th>
                            <th className="p-2 border-r">SR#</th>
                            {/* Prioritize Work Columns */}
                            <th className="p-2 border-r text-center">Work Status</th>
                            <th className="p-2 border-r">Work Desc</th>
                            <th className="p-2 border-r">Completion Date</th>
                            <th className="p-2 border-r">Completed By</th>
                            <th className="p-2 border-r">Supervisor</th>
                            <th className="p-2 border-r">Brand</th>
                            <th className="p-2 border-r">Location</th>
                            <th className="p-2 border-r">Quote #</th>
                            <th className="p-2 border-r">Company</th>
                            <th className="p-2 border-r">Comments</th>
                        </tr>
                    </thead>

                    <tbody className={darkMode ? 'text-gray-300' : 'text-black'}>
                        {loading ? (
                            <tr><td colSpan="12" className="p-8 text-center font-bold">Loading...</td></tr>
                        ) : filteredQuotations.length === 0 ? (
                            <tr><td colSpan="12" className="p-8 text-center opacity-50">No work orders found.</td></tr>
                        ) : filteredQuotations.map((q, i) => (
                            <tr key={q.id} className={themeStyles.tableRow}>
                                <td className="p-2 text-center">
                                    <button onClick={() => setSelectedWork(q)} className="hover:scale-110 transition-transform">
                                        <Edit size={12} className={darkMode ? "text-cyan-400" : "text-blue-600"} />
                                    </button>
                                </td>
                                <td className="p-2 text-center opacity-60">{i + 1}</td>
                                <td className={`p-2 font-bold text-center border-r ${getStatusColor(q.work_status)}`}>
                                    {q.work_status || 'NOT_STARTED'}
                                </td>
                                <td className="p-2 truncate max-w-[200px]">{q.work_description}</td>
                                <td className="p-2">{q.completion_date || '-'}</td>
                                <td className="p-2">{q.completed_by || '-'}</td>
                                <td className="p-2">{q.supervisor || '-'}</td>
                                <td className="p-2">{q.brand || '-'}</td>
                                <td className="p-2">{q.location || '-'}</td>
                                <td className="p-2">{q.quote_no}</td>
                                <td className="p-2">{q.brand_name || '-'}</td>
                                <td className="p-2">{q.comments || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedWork && (
                <WorkEditModal
                    quotation={selectedWork} // Reusing prop name for compatibility or refactoring
                    onClose={() => setSelectedWork(null)}
                    onUpdated={fetchQuotations}
                />
            )}
        </div>
    );
};

export default WorkList;
