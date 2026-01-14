import React, { useState, useEffect } from 'react';
import { FileText, ArrowRightCircle, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import logoSrc from '../../assets/Maaj-Logo 04.png';
import API_BASE_URL from '../../config/api';

const QuotationIntake = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const { darkMode, themeStyles, colors } = useTheme();
    const [data, setData] = useState({
        id: null,
        mrNo: '',
        storeCcid: '',
        mrDesc: ''
    });
    const [mrStatus, setMrStatus] = useState(null); // 'checking', 'exists', 'available'

    useEffect(() => {
        if (location.state?.editIntake) {
            const intake = location.state.editIntake;
            setData({
                id: intake.id,
                mrNo: intake.mr_no || '',
                storeCcid: intake.oracle_ccid || '',
                mrDesc: intake.work_description || ''
            });
        }
    }, [location.state]);

    const handleNext = () => {
        if (!data.mrNo || !data.storeCcid) {
            alert("Please enter MR Number and Store CCID");
            return;
        }
        // Navigate to the main quotation page and pass the data as state
        // Ensure keys match what NewQuotation expects
        navigate('/quotations/new-quotation', {
            state: {
                mrNo: data.mrNo,
                storeCcid: data.storeCcid,
                mrDesc: data.mrDesc,
                workDescription: data.mrDesc // Support both for safety
            }
        });
    };

    const handleSaveIntake = async () => {
        if (!data.mrNo || !data.storeCcid) {
            alert("Please enter MR Number and Store CCID");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/quotations`, {
                mr_no: data.mrNo,
                oracle_ccid: data.storeCcid,
                work_description: data.mrDesc,
                quote_no: `INTAKE-${Date.now().toString().slice(-6)}`, // Temp ID
                quote_status: 'INTAKE'
            });
            alert("✅ Saved to Intake Tracker successfully!");
            // Optional: clear form or navigate to Dashboard
            setData({ mrNo: '', storeCcid: '', mrDesc: '' });
        } catch (error) {
            console.error("Intake Save Error:", error);
            alert("Failed to save intake.");
        } finally {
            setLoading(false);
        }
    };

    const checkMrExistence = async () => {
        const val = data.mrNo;
        if (!val) {
            setMrStatus(null);
            return;
        }
        setMrStatus('checking');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/quotations/check-mr?mrNo=${encodeURIComponent(val)}`);
            if (res.data.exists) {
                setMrStatus('exists');
                alert("⚠️ WARNING: This MR Number already exists in the system!");
            } else {
                setMrStatus('available');
            }
        } catch (err) {
            console.error("MR Check failed:", err);
            setMrStatus(null);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${themeStyles.container} bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]`}>
            <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border-2 animate-fadeIn transition-all duration-300 ${darkMode ? 'bg-[#1f1f2e] border-[#00a8aa]' : 'bg-white border-black'}`}>
                <div className={`p-6 text-white flex items-center gap-3 ${darkMode ? 'bg-[#00a8aa]' : 'bg-black'}`}>
                    <FileText size={24} className="text-blue-400" />
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase leading-none">New Quotation</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Intake Process</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className={`${colors.textSecondary} text-[11px] font-black uppercase mb-1 block tracking-wider`}>MR Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={`${themeStyles.input} ${mrStatus === 'exists' ? 'border-red-500 text-red-600' : ''}`}
                                placeholder="e.g. MR-2025-001"
                                value={data.mrNo}
                                onChange={e => {
                                    setData({ ...data, mrNo: e.target.value });
                                    if (mrStatus) setMrStatus(null);
                                }}
                                onBlur={checkMrExistence}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {mrStatus === 'checking' && <Loader2 size={16} className="animate-spin text-gray-400" />}
                                {mrStatus === 'exists' && (
                                    <div className="group relative">
                                        <AlertCircle size={16} className="text-red-600 cursor-help" />
                                        <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-red-600 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                                            MR Number already exists!
                                        </span>
                                    </div>
                                )}
                                {mrStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={`${colors.textSecondary} text-[11px] font-black uppercase mb-1 block tracking-wider`}>Store CCID</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={themeStyles.input}
                                placeholder="e.g. CCID001"
                                value={data.storeCcid}
                                onChange={e => setData({ ...data, storeCcid: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleNext()}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`${colors.textSecondary} text-[11px] font-black uppercase mb-1 block tracking-wider`}>Job Description</label>
                        <textarea
                            className={`${themeStyles.input} h-28 resize-none`}
                            placeholder="ENTER BRIEF SCOPE OF WORK..."
                            value={data.mrDesc}
                            onChange={e => setData({ ...data, mrDesc: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveIntake}
                            disabled={loading}
                            className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-[13px] border-2 transition-transform hover:scale-[1.02] ${darkMode ? 'bg-transparent border-[#00a8aa] text-[#00a8aa] hover:bg-[#00a8aa] hover:text-white' : 'bg-white border-black text-black hover:bg-black hover:text-white'}`}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {/* Assuming 'Save' is imported */}
                            Save to Tracker
                        </button>

                        <button
                            onClick={handleNext}
                            className={`flex-1 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-[13px] shadow-lg text-white transition-transform hover:scale-[1.02] ${darkMode ? 'bg-[#00a8aa]' : 'bg-black'}`}
                        >
                            Create Quote <ArrowRightCircle size={18} />
                        </button>
                    </div>
                </div>

                <div className={`p-4 border-t text-center grayscale opacity-60 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <img src={logoSrc} alt="Logo" className="h-10 mx-auto" />
                </div>
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default QuotationIntake;
