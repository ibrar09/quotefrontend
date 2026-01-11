import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, X, Save, ArrowRight, Search, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Printer, Download, Upload } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import logoSrc from '../../assets/Maaj-Logo 04.png';
import signature from '../../assets/signature.jpeg';
import stamp from '../../assets/stamp.jpeg';
import { useTheme } from '../../context/ThemeContext';
import API_BASE_URL from '../../config/api';

const NewQuotation = () => {
  const MAX_IMAGES = 9;
  const navigate = useNavigate();
  const location = useLocation();

  const { darkMode, colors, themeStyles } = useTheme();

  // --- States ---
  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    brand: '',
    location: '',
    city: '',
    quoteNo: `MAAJ-${Math.floor(1000 + Math.random() * 9000)}`,
    mrNo: location.state?.mrNo || '',
    storeCcid: location.state?.storeCcid || '',
    version: '1.0',
    validity: '30 Days',
    mrRecDate: new Date().toISOString().split('T')[0],
    mrPriority: 'Normal',
    mrDesc: location.state?.mrDesc || '',
    openingDate: '',
    mrType: 'Corrective',
    currency: 'SAR',
    attentionTo: '',
    description: ''
  });

  const [items, setItems] = useState([
    { id: crypto.randomUUID(), code: '', description: '', unit: 'PCS', qty: 1, material: 0, labor: 0 }
  ]);

  const [adj, setAdj] = useState({ transportation: 0, discount: 0 });
  const [images, setImages] = useState([]);
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeStatus, setStoreStatus] = useState(null);
  const [priceSuggestions, setPriceSuggestions] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [terms, setTerms] = useState(`1. Any Items / work needed to complete the job will be considered within the given total price if not mentioned in the below exclusion list.\n2. If completion of job exceeds the specified number of days, a deduction of 100 SR will be considered for every additional delayed day.\n3. Parts will be under warranty against manufacturer defects and quality.`);
  const [exclusions, setExclusions] = useState(['', '', '']);
  const [completionDate, setCompletionDate] = useState("");
  const [warranty, setWarranty] = useState("");
  const [approval, setApproval] = useState({ prepared: '', reviewed: '', approved: '' });

  // --- Store Auto-fill Logic ---
  const handleStoreLookup = async (val) => {
    const ccid = val || header.storeCcid;
    if (!ccid) return;

    setLoadingStore(true);
    setStoreStatus('searching');

    try {
      // First, try direct CCID lookup
      let res = await axios.get(`${API_BASE_URL}/api/stores/${ccid}`);

      // Fallback: If not found and has dashes, try without dashes
      if (!res.data.success && ccid.includes('-')) {
        res = await axios.get(`${API_BASE_URL}/api/stores/${ccid.replace(/-/g, '')}`);
      }

      if (res.data.success) {
        const store = res.data.data.store;
        const jobs = res.data.data.jobs || [];

        setHeader(prev => ({
          ...prev,
          brand: store.brand || prev.brand,
          city: store.city || prev.city,
          location: store.mall || prev.location,
          storeCcid: store.oracle_ccid,
          attentionTo: store.fm_manager || store.fm_supervisor || prev.attentionTo,
          region: store.region || prev.region,
          openingDate: store.opening_date || prev.openingDate,
          description: prev.mrDesc || prev.description || ''
        }));

        // Auto-fill items from latest job ONLY if current items are empty or just the default row
        if (jobs.length > 0 && items.length === 1 && !items[0].code && !items[0].description) {
          const latestJob = jobs[0];
          if (latestJob.JobItems && latestJob.JobItems.length > 0) {
            setItems(latestJob.JobItems.map(ji => {
              const material = Number(ji.material_price) || 0;
              const labor = Number(ji.labor_price) || 0;
              return {
                id: crypto.randomUUID(),
                code: ji.item_code || '',
                description: ji.description || '',
                unit: ji.unit || 'PCS',
                qty: ji.quantity || 1,
                material: material,
                labor: labor
              };
            }));
          }
        }
        setStoreStatus('success');
        return true;
      } else {
        setStoreStatus('manual'); // Change to 'manual' for non-blocking
        return false;
      }
    } catch (err) {
      console.error("Store lookup error:", err);
      // If it's a 404, we treat it as manual entry allowed
      if (err.response && err.response.status === 404) {
        setStoreStatus('manual');
      } else {
        setStoreStatus('error');
      }
      return false;
    } finally {
      setLoadingStore(false);
    }
  };

  // --- Initial Lookup and State Logic ---
  useEffect(() => {
    const state = location.state;
    if (state) {
      const { mrNo, storeCcid, workDescription, brand, city, location: mall, region } = state;

      setHeader(prev => ({
        ...prev,
        mrNo: mrNo || prev.mrNo,
        storeCcid: storeCcid || prev.storeCcid,
        mrDesc: workDescription || prev.mrDesc,
        description: workDescription || prev.description,
        brand: brand || prev.brand,
        city: city || prev.city,
        location: mall || prev.location,
        region: region || prev.region
      }));

      if (storeCcid) {
        handleStoreLookup(storeCcid);
      }
    }
  }, [location.state]);

  // --- Price List Lookup (Smart Suggestions) ---
  const handleItemSearch = async (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;
    setItems(newItems);

    if (val.length > 2) {
      setActiveRow(index);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/pricelist/search?q=${val}`);
        setPriceSuggestions(res.data.data || []);
      } catch (err) {
        console.error("Error fetching prices:", err);
      }
    } else {
      setPriceSuggestions([]);
      setActiveRow(null);
    }
  };

  const selectSuggestion = (index, item) => {
    const newItems = [...items];
    const material = Number(item.material_price) || 0;
    const labor = Number(item.labor_price) || 0;

    newItems[index] = {
      ...newItems[index],
      code: item.code,
      description: item.description,
      unit: item.unit || 'PCS',
      material,
      labor
    };
    setItems(newItems);
    setPriceSuggestions([]);
    setActiveRow(null);
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    const subTotalMaterial = items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.material || 0)), 0);
    const subTotalLabor = items.reduce((acc, item) => acc + Number(item.labor || 0), 0);
    const initialScopeTotal = subTotalMaterial + subTotalLabor;
    const totalWithAdj = initialScopeTotal + Number(adj.transportation || 0) - Number(adj.discount || 0);
    const vat = totalWithAdj * 0.15;
    const grandTotal = totalWithAdj + vat;

    return {
      subTotalMaterial,
      subTotalLabor,
      initialScopeTotal,
      transportation: Number(adj.transportation || 0),
      discount: Number(adj.discount || 0),
      vatAmount: vat,
      grandTotal
    };
  }, [items, adj]);

  const handleSave = async (status = 'DRAFT') => {
    if (!header.storeCcid) {
      alert('Please select a valid Store/CCID first.');
      return null;
    }
    try {
      const payload = {
        quote_no: header.quoteNo,
        mr_no: header.mrNo,
        mr_date: header.mrRecDate || null,
        oracle_ccid: header.storeCcid,
        work_description: header.mrDesc || header.description,
        brand: header.brand,
        city: header.city,
        location: header.location,
        region: header.region,
        store_opening_date: header.openingDate || null,
        continuous_assessment: header.continuous_assessment,
        quote_status: status,
        discount: Number(adj.discount) || 0,
        items: items.filter(i => i.code || i.description).map(item => ({
          item_code: item.code,
          description: item.description,
          unit: item.unit,
          quantity: Number(item.qty) || 0,
          material_price: Number(item.material) || 0,
          labor_price: Number(item.labor) || 0,
          unit_price: (Number(item.material) || 0) + (Number(item.labor) || 0),
          remarks: item.remarks
        })),
        images: images.filter(img => img !== null)
      };

      let res;
      if (header.id) {
        // Update existing (PUT)
        res = await axios.put(`${API_BASE_URL}/api/quotations/${header.id}`, payload);
      } else {
        // Create new (POST)
        res = await axios.post(`${API_BASE_URL}/api/quotations`, payload);
      }

      if (res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      console.error("Save failed:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save quotation';
      const details = err.response?.data?.details;
      alert(`Save failed: ${errorMsg}${details ? '\n\nDetails: ' + JSON.stringify(details) : ''}`);
      return null;
    }
  };

  const addRow = () => setItems([...items, { id: crypto.randomUUID(), code: '', description: '', unit: 'PCS', qty: 1, material: 0, labor: 0 }]);
  const removeRow = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...images];
        newImages[index] = reader.result;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFiles = (files) => {
    const validFiles = Array.from(files).slice(0, MAX_IMAGES - images.length);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };



  const handleHeaderChange = (field, value) => {
    const newHeader = { ...header, [field]: value };
    if (field === 'mrDesc') {
      newHeader.description = value;
    }
    setHeader(newHeader);
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };


  // --- PDF Download Function ---
  // --- PDF Download Function ---
  // --- PDF Download Function ---
  // --- PDF Download Function ---
  const handleDownloadPDF = async () => {
    let quoteId = location.state?.id || header.id;

    // If not saved yet, autosave as PREVIEW so we can generate PDF via proper route
    // This allows downloading without cluttering the main list ("Draft").
    if (!quoteId) {
      try {
        // Save as 'PREVIEW' (Hidden status)
        const savedData = await handleSave('PREVIEW');
        if (savedData) {
          quoteId = savedData.id;
          // Update header with new ID/Seq so subsequent saves work, 
          // but KEEP it as "unsaved" in user's mind if possible, or just treat as now tracked.
          // Actually, if we setHeader with new data, it becomes "edit mode".
          // That's acceptable. The user just sees the PDF.
          setHeader(prev => ({ ...prev, id: savedData.id, quoteNo: savedData.quote_no }));
        } else {
          return; // Save failed (validation etc)
        }
      } catch (error) {
        console.error("Preview save failed during PDF generation:", error);
        alert(`Failed to save for PDF preview: ${error.message || 'Unknown error'}`);
        return;
      }
    }

    try {
      const pdfUrl = `${window.location.origin}/quotations/print-view/${quoteId}`;

      const res = await axios.post(`${API_BASE_URL}/api/pdf/generate`, { url: pdfUrl }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation-${header.quoteNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("PDF Download Error:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to download PDF.';
      alert(`PDF Download Error: ${errorMsg}`);
    }
  };

  return (
    <div className={`min-h-screen md:py-8 py-2 overflow-x-hidden transition-colors duration-500 ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Google Fonts - Outfit */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Document Wrapper - This forces visibility regardless of theme */}
      <div
        id="quotation-content"
        className="max-w-[850px] mx-auto bg-white md:p-[40px] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col min-h-[1100px] gap-2 print:shadow-none print:p-0 print:border-none relative text-black"
        style={{ color: 'black' }}
      >

        {/* Top Header Section - Logo on Right */}
        <div className="flex justify-end items-center border-b-2 border-black pb-4">
          <img src={logoSrc} alt="MAAJ Logo" className="h-14 object-contain" />
        </div>

        {/* New Quotation Banner Section - Using standard yellow */}
        <div className="bg-[#e2d1a5] border-2 border-black py-1 text-center" style={{ backgroundColor: '#e2d1a5' }}>
          <h1 className="text-xl font-bold tracking-[0.4em] text-black uppercase">
            QUOTATION
          </h1>
        </div>
        {/* Header Grid Table */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-t border-l border-black text-[10px]">

          {/* ================= ROW 1 ================= */}
          <div className="col-span-full md:col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">
              Date
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                type="date"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black cursor-pointer"
                style={{ color: 'black' }}
                value={header.date}
                onChange={(e) => handleHeaderChange('date', e.target.value)}
              />
              <span className="print-only text-black">{header.date}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">
              Attention To
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.attentionTo}
                onChange={(e) => handleHeaderChange('attentionTo', e.target.value)}
              />
              <span className="print-only text-black">{header.attentionTo}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-[#e2d1a5] border-r border-b border-black p-1 text-[9px] font-bold uppercase" style={{ backgroundColor: '#e2d1a5' }}>
              Quote Revised
            </div>
            <div className="col-span-2 border-r border-b border-black p-1 font-bold">V.{header.version}</div>
          </div>

          {/* ================= ROW 2 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">
              Brand
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.brand}
                onChange={(e) => handleHeaderChange('brand', e.target.value)}
              />
              <span className="print-only text-black">{header.brand}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">
              Quote #
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5 text-black">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.quoteNo}
                onChange={(e) => handleHeaderChange('quoteNo', e.target.value)}
              />
              <span className="print-only text-black">{header.quoteNo}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase">Validity</div>
            <div className="col-span-2 border-r border-b border-black p-1.5 font-bold">{header.validity}</div>
          </div>

          {/* ================= ROW 3 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">Location</div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.location}
                onChange={(e) => handleHeaderChange('location', e.target.value)}
              />
              <span className="print-only text-black">{header.location}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase">MR #</div>
            <div className="col-span-3 border-r border-b border-black p-1.5 relative">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent pr-8 no-print"
                value={header.mrNo}
                onChange={(e) => handleHeaderChange('mrNo', e.target.value)}
              />
              <span className="print-only">{header.mrNo}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-[#e2d1a5] border-r border-b border-black p-1 text-[9px] font-bold uppercase" style={{ backgroundColor: '#e2d1a5' }}>MR Rec Date</div>
            <div className="col-span-2 border-r border-b border-black p-1">
              <input
                type="date"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print"
                value={header.mrRecDate}
                onChange={(e) => handleHeaderChange('mrRecDate', e.target.value)}
              />
              <span className="print-only">{header.mrRecDate}</span>
            </div>
          </div>

          {/* ================= ROW 4 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">City</div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.city}
                onChange={(e) => handleHeaderChange('city', e.target.value)}
              />
              <span className="print-only text-black">{header.city}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">Store CCID</div>
            <div className="col-span-3 border-r border-b border-black p-1.5 relative text-black">
              <input
                className={`w-full outline-none font-semibold uppercase bg-transparent pr-12 no-print text-black ${storeStatus === 'error' ? 'text-red-600' : storeStatus === 'manual' ? 'text-yellow-600' : ''}`}
                style={{ color: 'black' }}
                value={header.storeCcid}
                onChange={(e) => handleHeaderChange('storeCcid', e.target.value)}
                onBlur={() => handleStoreLookup()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStoreLookup(); }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 no-print">
                {loadingStore && <Loader2 size={16} className="animate-spin text-gray-400" />}
                {storeStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {storeStatus === 'manual' && (
                  <div className="flex items-center group relative">
                    <AlertCircle size={16} className="text-yellow-500" />
                    <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center">
                      Store not in database. You can manually enter details below.
                    </span>
                  </div>
                )}
                {storeStatus === 'error' && <AlertCircle size={16} className="text-red-500" />}
              </div>
              <span className="print-only text-black">{header.storeCcid}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-[#e2d1a5] border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black" style={{ backgroundColor: '#e2d1a5' }}>MR Priority</div>
            <div className="col-span-2 border-r border-b border-black p-1">
              <input
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.mrPriority}
                onChange={(e) => handleHeaderChange('mrPriority', e.target.value)}
              />
              <span className="print-only text-black">{header.mrPriority}</span>
            </div>
          </div>

          {/* ================= ROW 5 ================= */}
          <div className="col-span-full md:col-span-8 grid grid-cols-8">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase text-black">MR Desc.</div>
            <div className="col-span-7 border-r border-b border-black p-1.5">
              <textarea
                className="w-full outline-none font-semibold uppercase bg-transparent resize-none h-8 leading-tight no-print text-black"
                style={{ color: 'black' }}
                value={header.mrDesc || header.description}
                onChange={(e) => handleHeaderChange('mrDesc', e.target.value)}
                placeholder="ENTER WORK DESCRIPTION HERE..."
              />
              <div className="print-only h-8 leading-tight text-black">{header.mrDesc || header.description}</div>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-[#e2d1a5] border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black" style={{ backgroundColor: '#e2d1a5' }}>
              Store Opening Date
            </div>
            <div className="col-span-2 border-r border-b border-black p-1">
              <input
                type="date"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print"
                value={header.openingDate}
                onChange={(e) => handleHeaderChange('openingDate', e.target.value)}
              />
              <span className="print-only">{header.openingDate}</span>
            </div>
          </div>

          {/* ================= ROW 6 ================= */}
          <div className="col-span-full md:col-span-12 grid grid-cols-12">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1.5 text-[9px] font-bold uppercase">
              Cont. Assessment
            </div>
            <div className="col-span-11 border-r border-b border-black p-1.5">
              <textarea
                rows={3}
                className="w-full resize-none outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                placeholder="Continuous assessment notes..."
                value={header.continuous_assessment || ''}
                onChange={(e) => handleHeaderChange('continuous_assessment', e.target.value)}
              />
              <div className="print-only whitespace-pre-wrap">{header.continuous_assessment}</div>
            </div>
          </div>

        </div>



        {/* Items Table */}
        <div className="relative z-20">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 font-bold uppercase text-[9px]">
                  <th className="border border-black p-2 text-center w-20">CODE</th>
                  <th className="border border-black p-2 text-left w-[40%]">DESCRIPTION</th>
                  <th className="border border-black p-2 text-center w-12">UNIT</th>
                  <th className="border border-black p-2 text-center w-12">QTY</th>
                  <th className="border border-black p-2 text-right w-20">MAT.</th>
                  <th className="border border-black p-2 text-right w-20">LAB.</th>
                  <th className="border border-black p-2 text-right w-24">TOTAL</th>
                  <th className="border border-black w-8 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="align-top leading-tight uppercase font-semibold text-[10px]">
                    <td className="border border-black p-2 relative">
                      <input
                        className="w-full outline-none text-center bg-transparent no-print"
                        value={item.code}
                        onChange={(e) => handleItemSearch(index, 'code', e.target.value)}
                        onFocus={() => setActiveRow(index)}
                      />
                      <span className="print-only text-center block">{item.code}</span>
                    </td>
                    <td className="border border-black p-2 relative">
                      <textarea
                        className="w-full outline-none resize-none min-h-[40px] bg-transparent no-print text-black font-semibold overflow-hidden"
                        value={item.description}
                        rows={1}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        onChange={(e) => handleItemSearch(index, 'description', e.target.value)}
                        onFocus={() => setActiveRow(index)}
                      />
                      <div className="print-only min-h-[40px] text-black font-semibold whitespace-pre-wrap">{item.description}</div>
                    </td>
                    <td className="border border-black p-2">
                      <input
                        className="w-full outline-none text-center bg-transparent no-print"
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      />
                      <span className="print-only text-center block">{item.unit}</span>
                    </td>
                    <td className="border border-black p-2">
                      <input
                        type="number"
                        className="w-full outline-none text-center bg-transparent no-print text-black font-semibold"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      />
                      <span className="print-only text-center block text-black font-semibold">{item.qty}</span>
                    </td>
                    <td className="border border-black p-2">
                      <input
                        type="number"
                        className="w-full outline-none text-right bg-transparent no-print"
                        value={item.material}
                        onChange={(e) => handleItemChange(item.id, 'material', e.target.value)}
                      />
                      <span className="print-only text-right block">{Number(item.material || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="border border-black p-2">
                      <input
                        type="number"
                        className="w-full outline-none text-right bg-transparent no-print"
                        value={item.labor}
                        onChange={(e) => handleItemChange(item.id, 'labor', e.target.value)}
                      />
                      <span className="print-only text-right block">{Number(item.labor || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="border border-black p-2 bg-gray-50/30 text-right">
                      <span className="w-full block font-bold">
                        {((Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="border border-black text-center print:hidden">
                      <button
                        onClick={() => removeRow(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors no-print"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="font-bold text-[10px] bg-gray-100 uppercase">
                  <td colSpan={4} className="border border-black text-center"></td>
                  <td className="border border-black text-right p-2">
                    {items.reduce((sum, item) => sum + Number(item.material || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black text-right p-2">
                    {items.reduce((sum, item) => sum + Number(item.labor || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black text-right p-2">
                    {items.reduce((sum, item) => sum + ((Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-black print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Suggestions Box at the Bottom */}
          {activeRow !== null && priceSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 w-full max-w-full bg-white border border-black shadow-2xl z-50 max-h-60 overflow-y-auto no-print">
              {priceSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="p-2 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-none"
                  onClick={() => selectSuggestion(activeRow, s)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-[10px] text-cyan-600 shrink-0">{s.code}</span>
                    <span className="text-right text-[9px] font-bold text-gray-500">{Number(s.material_price) + Number(s.labor_price)} SAR</span>
                  </div>
                  <div className="text-[9px] text-gray-700 leading-tight mt-1">{s.description}</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addRow}
            className="w-full bg-gray-50 border-x border-b border-black p-1.5 text-[9px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors no-print print:hidden"
          >
            <Plus size={12} /> Add Row
          </button>
        </div>



        {/* Images & Totals */}
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <div
            className="w-full md:w-1/2 border border-gray-300 bg-gray-50 p-[1px] min-h-[150px]" // optional min-height
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div
              className={`w-full gap-2 p-1 min-h-[150px] flex flex-col ${images.length === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className={`grid w-full h-full gap-1 ${(images.length + (images.length < 9 ? 1 : 0)) === 1 ? 'grid-cols-1 grid-rows-1' :
                (images.length + (images.length < 9 ? 1 : 0)) === 2 ? 'grid-cols-2 grid-rows-1' :
                  'grid-cols-2 md:grid-cols-3'
                }`}>
                {images.map((imgData, i) => (
                  <div key={i} className="w-full h-full relative group border border-gray-300">
                    <img src={imgData} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      title="Remove Image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {/* Upload Placeholder */}
                {images.length < 9 && (
                  <div
                    className="w-full h-full min-h-[150px] bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors no-print"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('image-upload').click()}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Upload size={16} className="text-gray-400 mb-1" />
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Add Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>






          <div className="w-full md:w-1/2">
            <table className="w-full border-collapse border border-black text-[10px]">
              <tbody className="font-semibold">
                {/* TRANSPORTATION */}
                <tr className="bg-gray-50">
                  <td className="border border-black text-left p-1.5 uppercase" colSpan={2}>
                    TRANSPORTATION
                  </td>
                  <td className="border border-black p-0 bg-white">
                    <input
                      type="number"
                      className="w-full p-1.5 text-right outline-none font-bold bg-transparent no-print"
                      value={adj.transportation}
                      onChange={e => setAdj({ ...adj, transportation: e.target.value })}
                    />
                    <span className="print-only text-right block p-1.5">
                      {adj.transportation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>

                {/* DISCOUNT */}
                <tr className="bg-gray-50">
                  <td className="border border-black text-left p-1.5 uppercase" colSpan={2}>
                    DISCOUNT
                  </td>
                  <td className="border border-black p-0 bg-white">
                    <input
                      type="number"
                      className="w-full p-1.5 text-right outline-none font-bold bg-transparent no-print"
                      value={adj.discount}
                      onChange={e => setAdj({ ...adj, discount: e.target.value })}
                    />
                    <span className="print-only text-right block p-1.5">
                      {adj.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>

                {/* Sub-Total */}
                <tr className="bg-gray-100 italic">
                  <td className="border border-black text-left p-1.5 uppercase" colSpan={2}>
                    Sub-Total
                  </td>
                  <td className="border border-black text-right p-1.5 tabular-nums">
                    {totals.initialScopeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* VAT 15% */}
                <tr className="bg-gray-50">
                  <td className="border border-black text-left p-1.5 uppercase" colSpan={2}>
                    VAT 15%
                  </td>
                  <td className="border border-black text-right p-1.5 tabular-nums">
                    {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* GRAND TOTAL */}
                <tr className="bg-[#e2d1a5] text-black text-sm" style={{ backgroundColor: '#e2d1a5' }}>
                  <td
                    className="border border-black text-left p-1.5 uppercase tracking-wider font-bold text-black"
                    colSpan={2}
                  >
                    TOTAL {header.currency}
                  </td>
                  <td className="border border-black text-right p-1.5 text-lg font-bold bg-white text-black tabular-nums border-l-4 border-l-black ml-1">
                    {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>


            {/* Stamp & Signature Section */}
            <div className="border border-black h-24 mt-2 bg-white flex items-center justify-center">
              <div className="flex items-center justify-center gap-8 w-full h-full">
                <img src={stamp} alt="Stamp" className="w-20 h-20 object-contain" />
                <img src={signature} alt="Signature" className="w-20 h-20 object-contain" />
              </div>
            </div>

            {/* Date of Completion Row */}
            <div className="w-full mt-1 bg-gray-200 border border-black text-black text-[10px] font-bold flex">
              <div className="flex-1 flex items-center justify-center border-r border-black p-2 gap-2">
                <span>Date of Completion:</span>
                <input
                  type="date"
                  className="outline-none border-b border-black bg-gray-200 text-black text-[10px] w-32 no-print"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
                <span className="print-only">{completionDate}</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-2">
                <span>7 days after PO issuance date</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-1 border-t-2 border-black pt-1 flex flex-col gap-1">
          <h4 className="text-black font-bold text-[9px] uppercase bg-[#e2d1a5] text-center py-1 mb-1" style={{ backgroundColor: '#e2d1a5' }}>
            TERMS AND CONDITIONS
          </h4>

          <div className="flex border border-black min-h-[120px]">
            <div className="flex-1 border-r border-black bg-gray-50 flex flex-col gap-1 p-1">
              <textarea
                className="w-full h-24 outline-none bg-gray-50 text-[9px] font-bold resize-none p-1 no-print text-black"
                style={{ color: 'black' }}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter Terms and Conditions"
              />
              <div className="print-only text-[9px] font-semibold whitespace-pre-line p-2 text-black">{terms}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-36 text-[9px] font-bold uppercase text-black">
                  Parts Warranty Period:
                </span>
                <input
                  type="text"
                  className="flex-1 outline-none p-2 bg-gray-50 text-[9px] font-semibold no-print text-black"
                  style={{ color: 'black' }}
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
                <span className="print-only flex-1 p-2 text-black">{warranty}</span>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 flex flex-col p-2">
              <h5 className="text-[9px] font-bold uppercase border-b border-black pb-1 mb-1">
                List of Exclusions
              </h5>
              {exclusions.map((val, i) => (
                <div key={i} className="flex items-center mb-1">
                  <span className="w-4 text-[9px] font-bold">{i + 1}</span>
                  <input
                    className="flex-1 p-1.5 text-[9px] font-semibold bg-gray-50 uppercase focus:bg-white transition-colors no-print text-black"
                    style={{ color: 'black' }}
                    value={val}
                    onChange={(e) => {
                      const newExclusions = [...exclusions];
                      newExclusions[i] = e.target.value;
                      setExclusions(newExclusions);
                    }}
                  />
                  <span className="print-only flex-1 p-1.5 text-black">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[9px] font-bold uppercase bg-[#e2d1a5] text-center tracking-[0.2em] border-y-2 border-black py-1 mt-4" style={{ backgroundColor: '#e2d1a5' }}>
            APPROVALS
          </div>
        </div>

        <div className="flex gap-4 p-4 md:p-0 no-print">
          <button
            onClick={() => handleSave('DRAFT')}
            className="flex-1 bg-gray-500 text-white font-bold uppercase text-xs py-3 hover:bg-gray-600 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-blue-600 text-white font-bold uppercase text-xs py-3 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-black text-white font-bold uppercase text-xs py-3 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} /> Print / Save
          </button>
        </div>



        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-2 no-print mt-8 md:justify-end border-t border-gray-100 pt-6">
          <button
            onClick={() => navigate('/quotations/new')}
            className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold uppercase transition-all rounded-lg shadow-sm border ${darkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-black/10 text-black hover:bg-gray-50'}`}
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={async () => {
              const job = await handleSave('DRAFT');
              if (job) {
                alert('Draft Saved!');
                navigate('/quotations/list');
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold uppercase transition-all rounded-lg shadow-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
          >
            <Save size={14} /> Save Draft
          </button>
          <button
            onClick={async () => {
              const job = await handleSave('SENT');
              if (job) {
                alert('Quotation Saved and Sent!');
                navigate('/quotations/list');
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold uppercase transition-all rounded-lg shadow-lg border border-black ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-black hover:bg-zinc-800 text-white'}`}
          >
            Send Request <ArrowRight size={14} />
          </button>
        </div>

      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 print:hidden z-50">
        <button
          onClick={() => window.print()}
          className={`${darkMode ? 'bg-white text-black' : 'bg-black text-white'} p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95`}
          title="Print Document"
        >
          <Printer size={24} />
        </button>
        {/* <button
          onClick={downloadPDF}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
          title="Download PDF"
        >
          <Download size={24} />
        </button> */}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; margin: 0; padding: 0; font-family: 'Outfit', sans-serif !important; }
          #quotation-content { border: none !important; shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          .shadow-2xl, .shadow-lg, .shadow-sm { box-shadow: none !important; }
          .border-gray-200, .border-gray-100 { border: none !important; }
          .min-h-screen { min-height: 0 !important; height: auto !important; }
          .gap-1, .gap-2, .gap-4, .md\\:gap-4 { gap: 0 !important; }
          .md\\:p-\\[40px\\], .p-4 { padding: 0 !important; }
          .md\\:py-8, .py-2 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .mt-2, .mt-4, .mt-8, .mt-auto { margin-top: 0.25rem !important; }
          input, textarea, button { border: none !important; outline: none !important; appearance: none !important; }
          .bg-gray-200 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .bg-\\[\\#e2d1a5\\] { background-color: #e2d1a5 !important; -webkit-print-color-adjust: exact; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {
          -webkit-appearance: none; margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        .aspect-video {
          aspect-ratio: 4/3 !important;
        }
      `}</style>
    </div>
  );
};

export default NewQuotation;