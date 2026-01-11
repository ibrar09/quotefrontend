import React, { useState } from 'react';
import { FileText, ArrowRightCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import logoSrc from '../../assets/Maaj-Logo 04.png';

const QuotationIntake = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { darkMode, themeStyles, colors } = useTheme();
    const [data, setData] = useState({
        mrNo: '',
        storeCcid: '',
        mrDesc: ''
    });

    const handleNext = () => {
        if (!data.mrNo || !data.storeCcid) {
            alert("Please enter MR Number and Store CCID");
            return;
        }
        // Navigate to the main quotation page and pass the data as state
        navigate('/quotations/new-quotation', { state: data });
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
                        <input
                            type="text"
                            className={themeStyles.input}
                            placeholder="e.g. MR-2025-001"
                            value={data.mrNo}
                            onChange={e => setData({ ...data, mrNo: e.target.value })}
                        />
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

                    <button
                        onClick={handleNext}
                        className={themeStyles.button + " w-full p-4 rounded-xl flex items-center justify-center gap-2 group shadow-lg text-[14px]"}
                    >
                        Create Quotation <ArrowRightCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
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
