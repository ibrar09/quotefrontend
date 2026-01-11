import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Edit, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import API_BASE_URL from "../../config/api";

const IntakeList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [intakes, setIntakes] = useState([]);
    const { darkMode, colors, themeStyles } = useTheme();

    useEffect(() => {
        fetchIntakes();
    }, []);

    const fetchIntakes = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/quotations/intakes`);
            setIntakes(res.data.data || []);
        } catch (err) {
            console.error("Error fetching intakes:", err);
            setIntakes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this intake?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/quotations/${id}`);
            setIntakes(intakes.filter((i) => i.id !== id));
        } catch {
            alert("Failed to delete intake");
        }
    };

    const handleEdit = (row) => {
        navigate(`/intakes/edit/${row.id}`, { state: row });
    };

    const handleMakeQuotation = (row) => {
        navigate("/quotations/new-quotation", {
            state: {
                mrNo: row.mr_no,
                storeCcid: row.Store.oracle_ccid,
                workDescription: row.work_description,
                brand: row.Store.brand,
                city: row.Store.city,
                location: row.Store.mall,
                region: row.Store.region,
                supervisor: row.Store.fm_supervisor,
                manager: row.Store.fm_manager,
            },
        });
    };

    return (
        <div className={`p-6 min-h-screen ${themeStyles.container}`}>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight uppercase">
                        Intake Register
                    </h1>
                    <p className={`mt-1 text-xs font-medium tracking-wider ${colors.textSecondary}`}>
                        Pre-Quotation Master Sheet
                    </p>
                </div>

                <button
                    onClick={() => navigate("/quotations/new")}
                    className={`${themeStyles.button} text-sm px-4 py-2`}
                >
                    <Plus size={16} />
                    <span className="ml-2">New Intake</span>
                </button>
            </div>

            {/* TABLE */}
            <div
                className={`overflow-x-auto rounded-lg shadow-md border ${darkMode
                        ? "bg-gray-900 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
            >
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr
                            className={`text-[11px] font-semibold uppercase tracking-wider ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
                                }`}
                        >
                            <th className="p-3 border-r">Actions</th>
                            <th className="p-3 border-r">MR #</th>
                            <th className="p-3 border-r">MR Date</th>
                            <th className="p-3 border-r">CCID</th>
                            <th className="p-3 border-r">Brand</th>
                            <th className="p-3 border-r">Store</th>
                            <th className="p-3 border-r">Mall</th>
                            <th className="p-3 border-r">City</th>
                            <th className="p-3 border-r">Region</th>
                            <th className="p-3 border-r">Division</th>
                            <th className="p-3 border-r">Type</th>
                            <th className="p-3 border-r text-right">SQM</th>
                            <th className="p-3 border-r">Supervisor</th>
                            <th className="p-3 border-r">Manager</th>
                            <th className="p-3 border-r">Status</th>
                            <th className="p-3">Work Description</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="16"
                                    className="p-10 text-center text-sm font-semibold text-gray-400"
                                >
                                    Loading intake records…
                                </td>
                            </tr>
                        ) : (
                            intakes.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`border-t ${darkMode
                                            ? "hover:bg-gray-800"
                                            : "hover:bg-gray-50"
                                        } transition`}
                                >
                                    {/* ACTIONS */}
                                    <td className="p-2 border-r">
                                        <div className="flex gap-3 justify-center">
                                            <button
                                                onClick={() => handleMakeQuotation(row)}
                                                className="text-emerald-500 hover:scale-110 transition"
                                                title="Make Quotation"
                                            >
                                                <Play size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="text-blue-500 hover:scale-110 transition"
                                                title="Edit"
                                            >
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(row.id)}
                                                className="text-red-500 hover:scale-110 transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="p-2 border-r font-semibold">{row.mr_no}</td>
                                    <td className="p-2 border-r text-gray-500">{row.mr_date}</td>
                                    <td className="p-2 border-r font-mono text-xs">
                                        {row.Store.oracle_ccid}
                                    </td>
                                    <td className="p-2 border-r font-semibold">
                                        {row.Store.brand}
                                    </td>
                                    <td className="p-2 border-r">{row.Store.store_name}</td>
                                    <td className="p-2 border-r">{row.Store.mall}</td>
                                    <td className="p-2 border-r">{row.Store.city}</td>
                                    <td className="p-2 border-r">{row.Store.region}</td>
                                    <td className="p-2 border-r">{row.Store.division}</td>
                                    <td className="p-2 border-r">{row.Store.store_type}</td>
                                    <td className="p-2 border-r text-right font-medium">
                                        {row.Store.sqm}
                                    </td>
                                    <td className="p-2 border-r">
                                        {row.Store.fm_supervisor}
                                    </td>
                                    <td className="p-2 border-r">
                                        {row.Store.fm_manager}
                                    </td>
                                    <td className="p-2 border-r font-semibold">
                                        {row.Store.store_status}
                                    </td>
                                    <td
                                        className="p-2 max-w-[280px] truncate text-gray-600"
                                        title={row.work_description}
                                    >
                                        {row.work_description}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IntakeList;
