import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const suggestionContainerRef = useRef(null);

  const { darkMode, colors, themeStyles } = useTheme();

  // --- States ---
  const [header, setHeader] = useState({
    date: new Date().toISOString().split('T')[0],
    brand: '',
    location: '',
    city: '',
    quoteNo: `MAAJ - ${Math.floor(1000 + Math.random() * 9000)}`,
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
  const [rawFiles, setRawFiles] = useState([]); // Track actual File objects for upload
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeStatus, setStoreStatus] = useState(null);
  const [mrStatus, setMrStatus] = useState(null); // 'checking', 'exists', 'available'
  const [priceSuggestions, setPriceSuggestions] = useState([]);
  const [activeRow, setActiveRow] = useState(null); // { index: number, field: 'code' | 'description' }
  const [activeField, setActiveField] = useState(null);
  const [terms, setTerms] = useState(`1. Any Items/work needed to complete the job will be considered within the given total price if not mentioned in the below exclusion list.\n2.If completion of job exceeds the specified number of days, a deduction of 100 SR will be considered for every additional delayed day.\n3.Parts will be under warranty against manufacturer defects and quality.`);
  const [exclusions, setExclusions] = useState(['', '', '']);
  const [completionDate, setCompletionDate] = useState("");
  const [warranty, setWarranty] = useState("");
  const [approval, setApproval] = useState({ prepared: '', reviewed: '', approved: '' });
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);
  const suggestionItemRefs = useRef([]);
  // [NEW] Portal Positioning State
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const updateDropdownPosition = (element) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Close/Update on scroll to avoid floating issues
  useEffect(() => {
    const handleScroll = () => { if (priceSuggestions.length > 0) setPriceSuggestions([]); };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [priceSuggestions]);

  // Auto-scroll logic for suggestions
  useEffect(() => {
    if (priceSuggestions.length > 0 && suggestionItemRefs.current[highlightedSuggestion]) {
      suggestionItemRefs.current[highlightedSuggestion].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedSuggestion, priceSuggestions]);

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

  // --- MR Validation Logic ---
  // --- MR Validation Logic ---
  const checkMrExistence = async () => {
    const val = header.mrNo;
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

  // --- Initial Lookup and State Logic ---
  useEffect(() => {
    const state = location.state;
    if (state) {
      // CASE 1: Load Full Quotation for Revision
      if (state.loadFromQuotation) {
        const initialQ = state.loadFromQuotation;
        console.log("Loading quotation for revision (fetching details):", initialQ.id);

        // Fetch full details to get Items and Images which are not in the list view
        setLoadingStore(true);
        axios.get(`${API_BASE_URL}/api/quotations/${initialQ.id}`)
          .then(res => {
            if (res.data.success) {
              const q = res.data.data;
              console.log("Full quotation details loaded:", q);

              setHeader(prev => ({
                ...prev,
                id: q.id,
                date: q.createdAt ? q.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                brand: q.brand || q.Store?.brand || '',
                location: q.location || q.Store?.mall || '',
                city: q.city || q.Store?.city || '',
                quoteNo: q.quote_no || prev.quoteNo,
                mrNo: q.mr_no || '',
                storeCcid: q.oracle_ccid || '',
                version: q.version || '1.0',
                validity: q.validity || '30 Days',
                mrRecDate: q.mr_date || '',
                mrPriority: q.mr_priority || 'Normal',
                mrDesc: q.work_description || '',
                openingDate: q.store_opening_date || '',
                currency: q.currency || 'SAR',
                attentionTo: q.Store?.fm_manager || q.Store?.fm_supervisor || q.attentionTo || '',
                description: q.work_description || '',
                continuous_assessment: q.continuous_assessment || '',
                region: q.region || ''
              }));

              // Items
              if (q.JobItems && q.JobItems.length > 0) {
                setItems(q.JobItems.map(ji => ({
                  id: crypto.randomUUID(),
                  code: ji.item_code || '',
                  description: ji.description || '',
                  unit: ji.unit || 'PCS',
                  qty: ji.quantity || 1,
                  material: Number(ji.material_price) || 0,
                  labor: Number(ji.labor_price) || 0
                })));
              }

              // Images
              if (q.JobImages && q.JobImages.length > 0) {
                setImages(q.JobImages.map(img => img.file_path || img.image_data));
              }

              // Adjustments
              setAdj({
                transportation: Number(q.transportation || 0),
                discount: Number(q.discount || 0)
              });
            }
          })
          .catch(err => {
            console.error("Failed to load revision details:", err);
            alert("Failed to load full details for revision. Please try again.");
          })
          .finally(() => {
            setLoadingStore(false);
          });

      }
      // CASE 2: Create New from Store/MR Data (Existing Logic)
      else {
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
    }
  }, [location.state]);

  // --- Click Outside to close suggestions ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionContainerRef.current && !suggestionContainerRef.current.contains(event.target)) {
        setPriceSuggestions([]);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPriceSuggestions([]);
        setActiveRow(null);
        setActiveField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- Price List Lookup (Smart Suggestions) ---
  const handleItemSearch = async (index, field, val) => {
    const newItems = [...items];
    newItems[index][field] = val;
    setItems(newItems);

    setActiveRow(index);
    setActiveField(field);

    console.log(`[SUGGEST] Searching for: "${val}" in field: ${field}`);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pricelist/search?q=${val || ''}`);
      console.log(`[SUGGEST] Found ${res.data.data?.length || 0} items`);
      setPriceSuggestions(res.data.data || []);
      setHighlightedSuggestion(0);
      suggestionItemRefs.current = []; // Reset refs
    } catch (err) {
      console.error("Error fetching prices:", err);
    }
  };

  const handleFocus = (index, field, val) => {
    handleItemSearch(index, field, val || '');
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
    setActiveField(null);

    // After selecting, move focus to the description field of the same row (or material)
    setTimeout(() => {
      const nextInput = document.querySelector(`[data-row="${index}"][data-col="qty"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }, 10);
  };

  // --- Excel-like Navigation & Paste ---
  const handleHeaderKeyDown = (e, field) => {
    const rowMappings = {
      date: { down: 'brand', right: 'attentionTo' },
      attentionTo: { down: 'quoteNo', left: 'date', right: 'version' },
      brand: { up: 'date', down: 'location', right: 'quoteNo' },
      quoteNo: { up: 'attentionTo', down: 'mrNo', left: 'brand', right: 'validity' },
      location: { up: 'brand', down: 'city', right: 'mrNo' },
      mrNo: { up: 'quoteNo', down: 'storeCcid', left: 'location', right: 'mrRecDate' },
      mrRecDate: { up: 'validity', down: 'mrPriority', left: 'mrNo' },
      city: { up: 'location', down: 'mrDesc', right: 'storeCcid' },
      storeCcid: { up: 'mrNo', down: 'mrDesc', left: 'city', right: 'mrPriority' },
      mrPriority: { up: 'mrRecDate', down: 'openingDate', left: 'storeCcid' },
      mrDesc: { up: 'city', down: 'continuous_assessment', right: 'openingDate' },
      openingDate: { up: 'mrPriority', down: 'continuous_assessment', left: 'mrDesc' },
      continuous_assessment: { up: 'mrDesc', down: 'grid_start' }
    };

    const map = rowMappings[field];
    if (!map) return;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (map.down === 'grid_start') {
        const firstInput = document.querySelector(`[data-row="0"][data-col="code"]`);
        firstInput?.focus();
        if (firstInput?.select) firstInput.select();
      } else {
        const next = document.querySelector(`[data-row="header"][data-col="${map.down}"]`);
        next?.focus();
        if (next?.select) next.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.querySelector(`[data-row="header"][data-col="${map.up}"]`);
      prev?.focus();
      if (prev?.select) prev.select();
    } else if (e.key === 'ArrowRight' && (e.target.selectionEnd === e.target.value.length || e.target.type === 'date')) {
      if (map.right) {
        e.preventDefault();
        const next = document.querySelector(`[data-row="header"][data-col="${map.right}"]`);
        next?.focus();
        if (next?.select) next.select();
      }
    } else if (e.key === 'ArrowLeft' && (e.target.selectionStart === 0 || e.target.type === 'date')) {
      if (map.left) {
        e.preventDefault();
        const prev = document.querySelector(`[data-row="header"][data-col="${map.left}"]`);
        prev?.focus();
        if (prev?.select) prev.select();
      }
    }
  };

  const handleGridKeyDown = (e, index, field) => {
    const fields = ['code', 'description', 'unit', 'qty', 'material', 'labor', 'total'];
    const fieldIdx = fields.indexOf(field);

    // Handle Suggestions Navigation if open
    if (priceSuggestions.length > 0 && (field === 'code' || field === 'description')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedSuggestion(prev => (prev + 1) % priceSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedSuggestion(prev => (prev - 1 + priceSuggestions.length) % priceSuggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectSuggestion(index, priceSuggestions[highlightedSuggestion]);
        return;
      }
    }

    const isBoundaryDown = e.target.tagName !== 'TEXTAREA' || e.target.selectionEnd === e.target.value.length;
    const isBoundaryUp = e.target.tagName !== 'TEXTAREA' || e.target.selectionStart === 0;

    if ((e.key === 'ArrowDown' && isBoundaryDown) || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      if (index === items.length - 1) {
        const nextInput = document.querySelector(`[data-row="adj"][data-col="transportation"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        } else {
          addRow();
          setTimeout(() => {
            const nextInput = document.querySelector(`[data-row="${index + 1}"][data-col="${field}"]`);
            nextInput?.focus();
          }, 50);
        }
      } else {
        const nextInput = document.querySelector(`[data-row="${index + 1}"][data-col="${field}"]`);
        nextInput?.focus();
      }
    } else if ((e.key === 'ArrowUp' && isBoundaryUp) || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      if (index === 0) {
        // Move back to header (continuous assessment)
        const headerEnd = document.querySelector(`[data-row="header"][data-col="continuous_assessment"]`);
        headerEnd?.focus();
        headerEnd?.select();
      } else {
        const prevInput = document.querySelector(`[data-row="${index - 1}"][data-col="${field}"]`);
        prevInput?.focus();
      }
    } else if (e.key === 'ArrowRight' && (e.target.selectionEnd === e.target.value.length || e.target.type === 'number')) {
      if (fieldIdx < fields.length - 1) {
        e.preventDefault();
        const nextInput = document.querySelector(`[data-row="${index}"][data-col="${fields[fieldIdx + 1]}"]`);
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowLeft' && (e.target.selectionStart === 0 || e.target.type === 'number')) {
      if (fieldIdx > 0) {
        e.preventDefault();
        const prevInput = document.querySelector(`[data-row="${index}"][data-col="${fields[fieldIdx - 1]}"]`);
        prevInput?.focus();
      }
    } else if (e.key === 'Tab') {
      if (index === items.length - 1 && field === 'total') {
        e.preventDefault();
        addRow();
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-row="${index + 1}"][data-col="code"]`);
          nextInput?.focus();
        }, 50);
      }
    }
  };

  const handleFooterKeyDown = (e, field, index) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'transportation') {
        const lastInput = document.querySelector(`[data-row="${items.length - 1}"][data-col="total"]`);
        lastInput?.focus();
        if (lastInput?.select) lastInput.select();
      } else if (field === 'discount') {
        document.querySelector(`[data-row="adj"][data-col="transportation"]`)?.focus();
      } else if (field === 'completionDate') {
        document.querySelector(`[data-row="adj"][data-col="discount"]`)?.focus();
      } else if (field === 'warranty') {
        document.querySelector(`[data-row="footer"][data-col="completionDate"]`)?.focus();
      } else if (field === 'exclusion') {
        if (index === 0) {
          document.querySelector(`[data-row="footer"][data-col="warranty"]`)?.focus();
        } else {
          document.querySelector(`[data-row="exclusion"][data-col="${index - 1}"]`)?.focus();
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (field === 'transportation') {
        const next = document.querySelector(`[data-row="adj"][data-col="discount"]`);
        next?.focus();
        if (next?.select) next.select();
      } else if (field === 'discount') {
        const next = document.querySelector(`[data-row="footer"][data-col="completionDate"]`);
        next?.focus();
        if (next?.select) next.select();
      } else if (field === 'completionDate') {
        const next = document.querySelector(`[data-row="footer"][data-col="warranty"]`);
        next?.focus();
        if (next?.select) next.select();
      } else if (field === 'warranty') {
        document.querySelector(`[data-row="exclusion"][data-col="0"]`)?.focus();
      } else if (field === 'exclusion') {
        if (index < exclusions.length - 1) {
          document.querySelector(`[data-row="exclusion"][data-col="${index + 1}"]`)?.focus();
        }
      }
    }
  };

  const handleGridPaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData.includes('\t') && !pasteData.includes('\n')) return; // Regular paste

    e.preventDefault();
    const rows = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');
    const newItemsData = rows.map(row => {
      const cols = row.split('\t');
      return {
        id: crypto.randomUUID(),
        code: cols[0] || '',
        description: cols[1] || '',
        unit: cols[2] || 'PCS',
        qty: Number(cols[3]) || 1,
        material: Number(cols[4]) || 0,
        labor: Number(cols[5]) || 0
      };
    });

    if (newItemsData.length > 0) {
      // If we only have one empty row, replace it. Otherwise append.
      if (items.length === 1 && !items[0].code && !items[0].description) {
        setItems(newItemsData);
      } else {
        setItems([...items, ...newItemsData]);
      }
    }
  };

  const handleCellClick = (e, rowIdx, colName) => {
    // Force focus on the input if user clicks the TD background
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      const input = e.currentTarget.querySelector('input, textarea');
      input?.focus();
    }
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
      subtotalWithAdjustments: totalWithAdj,
      transportation: Number(adj.transportation || 0),
      discount: Number(adj.discount || 0),
      vatAmount: vat,
      grandTotal
    };
  }, [items, adj]);

  const handleSave = async (status = 'DRAFT') => {
    // REMOVED (User Request): Validation for Store/CCID is now optional
    // if (!header.storeCcid) {
    //   alert('Please select a valid Store/CCID first.');
    //   return null;
    // }
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
        // Only send existing image paths/legacy data to the main update
        // New files will be uploaded separately via FormData
        images: images.filter(img => typeof img === 'string' && !img.startsWith('data:'))
      };

      let res;
      if (header.id) {
        res = await axios.put(`${API_BASE_URL}/api/quotations/${header.id}`, payload);
      } else {
        res = await axios.post(`${API_BASE_URL}/api/quotations`, payload);
      }

      if (res.data.success) {
        const savedJob = res.data.data;

        // NOW: Upload New Files if any
        if (rawFiles.length > 0) {
          const formData = new FormData();
          rawFiles.forEach(file => {
            formData.append('images', file);
          });

          await axios.post(`${API_BASE_URL}/api/quotations/${savedJob.id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          // Clear raw files after successful upload
          setRawFiles([]);
        }

        return savedJob;
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

    // Maintain raw files for upload
    setRawFiles(prev => [...prev, ...validFiles]);

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
    setRawFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleTotalChange = (id, newTotal) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const qty = Number(item.qty) || 0;
        const mat = Number(item.material) || 0;
        const totalValue = Number(newTotal) || 0;
        // Logic: Total = (Qty * Material) + Labor  => Labor = Total - (Qty * Material)
        const adjustedLabor = totalValue - (qty * mat);
        return { ...item, labor: adjustedLabor };
      }
      return item;
    }));
  };


  // --- PDF Download Function ---
  // --- PDF Download Function ---
  // --- PDF Download Function ---
  // --- PDF Download Function ---
  // --- PDF Download Function ---
  const handleDownloadPDF = async () => {
    let quoteId = location.state?.id || header.id;

    // 1. If not saved yet, we use the PREVIEW API (no database save)
    if (!quoteId) {
      try {
        setLoadingStore(true);
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
          attentionTo: header.attentionTo,
          version: header.version,
          validity: header.validity,
          mr_priority: header.mrPriority,
          currency: header.currency,
          continuous_assessment: header.continuous_assessment,
          completion_date: completionDate,
          items: items.filter(i => i.code || i.description).map(item => ({
            item_code: item.code,
            description: item.description,
            unit: item.unit,
            quantity: Number(item.qty) || 0,
            material_price: Number(item.material) || 0,
            labor_price: Number(item.labor) || 0,
            unit_price: (Number(item.material) || 0) + (Number(item.labor) || 0),
          })),
          images: images.filter(img => img !== null)
        };

        const previewRes = await axios.post(`${API_BASE_URL}/api/pdf/preview-prepare`, payload);
        if (previewRes.data.success) {
          quoteId = `preview-${previewRes.data.previewId}`;
        } else {
          setLoadingStore(false);
          alert("Failed to prepare preview.");
          return;
        }
      } catch (error) {
        console.error("Preview preparation failed:", error);
        alert("Failed to prepare PDF preview.");
        setLoadingStore(false);
        return;
      } finally {
        setLoadingStore(false);
      }
    }

    // 2. Generate PDF using the ID (BACKEND GENERATION)
    try {
      console.log("Requesting Backend PDF for ID:", quoteId);

      const payload = {
        title: "QUOTATION"
      };

      // Determine if it's a preview or real ID
      if (typeof quoteId === 'string' && quoteId.startsWith('preview-')) {
        payload.previewId = quoteId.replace('preview-', '');
      } else {
        payload.quotationId = quoteId;
      }

      const res = await axios.post(`${API_BASE_URL}/api/pdf/generate`, payload, {
        responseType: 'blob'
      });

      // 3. Trigger Download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation - ${header.quoteNo || 'Draft'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error("PDF Download Error:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to download PDF.';
      // Helper: If backend sends JSON error in Blob, try to read it
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(`PDF Error: ${json.details || json.error || text}`);
        } catch (e) {
          alert(`PDF Error: ${errorMsg}`);
        }
      } else {
        alert(`PDF Download Error: ${errorMsg}`);
      }
    }
  };

  return (
    <div className={`min-h-screen md:py-8 py-2 overflow-x-hidden transition-colors duration-500 ${themeStyles.container}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Google Fonts-Outfit */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Document Wrapper-This forces visibility regardless of theme */}
      <div
        id="quotation-content"
        className="max-w-[850px] mx-auto bg-white md:p-[40px] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col min-h-[1100px] gap-2 print:shadow-none print:p-0 print:border-none relative text-black"
        style={{ color: 'black' }}
      >

        {/* Top Header Section-Logo on Right */}
        <div className="flex justify-end items-center border-b-2 border-black pb-4">
          <img src={logoSrc} alt="MAAJ Logo" className="h-14 object-contain" />
        </div>

        {/* New Quotation Banner Section-Using standard yellow */}
        <div className="bg-[#e2d1a5] border-2 border-black py-1 text-center" style={{ backgroundColor: '#e2d1a5' }}>
          <h1 className="text-xl font-bold tracking-[0.4em] text-black uppercase">
            QUOTATION
          </h1>
        </div>
        {/* Header Grid Table */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-t border-l border-black text-[10px]">

          {/* ================= ROW 1 ================= */}
          <div className="col-span-full md:col-span-6 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">
              Date
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                data-row="header"
                data-col="date"
                type="date"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black cursor-pointer"
                style={{ color: 'black' }}
                value={header.date}
                onChange={(e) => handleHeaderChange('date', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'date')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.date}</span>
            </div>
          </div>

          <div className="col-span-full md:col-span-6 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[8px] font-bold uppercase text-black leading-tight">
              Attention To
            </div>
            <div className="col-span-3 border-r border-b border-black p-1">
              <input
                data-row="header"
                data-col="attentionTo"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.attentionTo}
                onChange={(e) => handleHeaderChange('attentionTo', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'attentionTo')}
                onFocus={(e) => e.target.select()}
                spellCheck={true}
                lang="en"
              />
              <span className="print-only text-black">{header.attentionTo}</span>
            </div>
          </div>

          {/* ================= ROW 2 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">
              Brand
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                data-row="header"
                data-col="brand"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.brand}
                onChange={(e) => handleHeaderChange('brand', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'brand')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.brand}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">
              Quote #
            </div>
            <div className="col-span-3 border-r border-b border-black p-1.5 text-black">
              <input
                data-row="header"
                data-col="quoteNo"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.quoteNo}
                onChange={(e) => handleHeaderChange('quoteNo', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'quoteNo')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.quoteNo}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase">Validity</div>
            <div className="col-span-2 border-r border-b border-black p-1.5 font-bold">{header.validity}</div>
          </div>

          {/* ================= ROW 3 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">Location</div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                data-row="header"
                data-col="location"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.location}
                onChange={(e) => handleHeaderChange('location', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'location')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.location}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase">MR #</div>
            <div className="col-span-3 border-r border-b border-black p-1.5 relative">
              <input
                data-row="header"
                data-col="mrNo"
                className={`w-full outline-none font-semibold uppercase bg-transparent pr-8 no-print ${mrStatus === 'exists' ? 'text-red-600' : ''}`}
                value={header.mrNo}
                onChange={(e) => handleHeaderChange('mrNo', e.target.value)}
                onBlur={checkMrExistence}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') checkMrExistence();
                  handleHeaderKeyDown(e, 'mrNo');
                }}
                onFocus={(e) => e.target.select()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 no-print">
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
              <span className="print-only">{header.mrNo}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-2 bg-[#e2d1a5] border-r border-b border-black p-1 text-[9px] font-bold uppercase" style={{ backgroundColor: '#e2d1a5' }}>MR Rec Date</div>
            <div className="col-span-2 border-r border-b border-black p-1">
              <input
                data-row="header"
                data-col="mrRecDate"
                type="date"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print"
                value={header.mrRecDate}
                onChange={(e) => handleHeaderChange('mrRecDate', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'mrRecDate')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only">{header.mrRecDate}</span>
            </div>
          </div>

          {/* ================= ROW 4 ================= */}
          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">City</div>
            <div className="col-span-3 border-r border-b border-black p-1.5">
              <input
                data-row="header"
                data-col="city"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.city}
                onChange={(e) => handleHeaderChange('city', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'city')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.city}</span>
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-4">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">Store CCID</div>
            <div className="col-span-3 border-r border-b border-black p-1.5 relative text-black">
              <input
                data-row="header"
                data-col="storeCcid"
                className={`w-full outline-none font-semibold uppercase bg-transparent pr-12 no-print text-black ${storeStatus === 'error' ? 'text-red-600' : storeStatus === 'manual' ? 'text-yellow-600' : ''}`}
                style={{ color: 'black' }}
                value={header.storeCcid}
                onChange={(e) => handleHeaderChange('storeCcid', e.target.value)}
                onBlur={() => handleStoreLookup()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !header.storeCcid) handleStoreLookup();
                  handleHeaderKeyDown(e, 'storeCcid');
                }}
                onFocus={(e) => e.target.select()}
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
                data-row="header"
                data-col="mrPriority"
                className="w-full outline-none font-semibold uppercase bg-transparent no-print text-black"
                style={{ color: 'black' }}
                value={header.mrPriority}
                onChange={(e) => handleHeaderChange('mrPriority', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'mrPriority')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only text-black">{header.mrPriority}</span>
            </div>
          </div>

          {/* ================= ROW 5 ================= */}
          <div className="col-span-full md:col-span-8 grid grid-cols-8">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase text-black">MR Desc.</div>
            <div className="col-span-7 border-r border-b border-black p-1.5">
              <textarea
                name="description"
                data-row="header"
                data-col="mrDesc"
                className="w-full outline-none font-semibold bg-transparent resize-none h-24 leading-tight no-print text-black"
                style={{ color: 'black' }}
                value={header.description}
                onChange={(e) => handleHeaderChange('description', e.target.value)}
                placeholder="Enter final comments..."
                spellCheck={true}
                lang="en-US"
                onKeyDown={(e) => handleHeaderKeyDown(e, 'mrDesc')}
                onFocus={(e) => e.target.select()}
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
                data-row="header"
                data-col="openingDate"
                type="date"
                className="w-full outline-none font-semibold bg-transparent no-print"
                value={header.openingDate}
                onChange={(e) => handleHeaderChange('openingDate', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'openingDate')}
                onFocus={(e) => e.target.select()}
              />
              <span className="print-only">{header.openingDate}</span>
            </div>
          </div>

          {/* ================= ROW 6 ================= */}
          <div className="col-span-full md:col-span-12 grid grid-cols-12">
            <div className="col-span-1 bg-gray-200 border-r border-b border-black p-1 text-[9px] font-bold uppercase">
              Cont. Assessment
            </div>
            <div className="col-span-11 border-r border-b border-black p-1.5">
              <textarea
                data-row="header"
                data-col="continuous_assessment"
                rows={3}
                className="w-full resize-none outline-none font-semibold bg-transparent no-print text-black"
                style={{ color: 'black' }}
                placeholder="Continuous assessment notes..."
                value={header.continuous_assessment || ''}
                onChange={(e) => handleHeaderChange('continuous_assessment', e.target.value)}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'continuous_assessment')}
                onFocus={(e) => e.target.select()}
              />
              <div className="print-only whitespace-pre-wrap">{header.continuous_assessment}</div>
            </div>
          </div>

        </div>



        {/* Items Table-Using relative and overflow-visible for suggestions */}
        <div className="relative z-30" onPaste={handleGridPaste}>
          <div className="overflow-x-auto overflow-y-visible">
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
              <tbody className="relative">
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className={`align-top leading-tight uppercase font-semibold text-[10px] group/row ${activeRow === index ? 'bg-blue-50/20' : ''}`}
                      style={{ zIndex: activeRow === index ? 50 : 1, position: 'relative' }}
                    >
                      <td
                        className={`border border-black p-2 relative cursor-text transition-colors ${activeRow === index && activeField === 'code' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => {
                          handleCellClick(e, index, 'code');
                          updateDropdownPosition(e.currentTarget); // Capture position of cell
                        }}
                      >
                        <input
                          data-row={index}
                          data-col="code"
                          className="w-full outline-none text-center bg-transparent no-print placeholder:opacity-30"
                          placeholder="Code"
                          value={item.code}
                          onChange={(e) => handleItemSearch(index, 'code', e.target.value)}
                          onFocus={(e) => {
                            handleFocus(index, 'code', e.target.value);
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'code')}
                        />
                        <span className="print-only text-center block">{item.code}</span>

                        {activeRow === index && activeField === 'code' && priceSuggestions.length > 0 && (
                          <div
                            ref={suggestionContainerRef}
                            className="absolute left-0 right-[-200px] mt-1 bg-white border border-black shadow-2xl z-50 max-h-60 overflow-y-auto no-print scroll-smooth"
                          >
                            {priceSuggestions.map((s, i) => (
                              <div
                                key={i}
                                ref={el => suggestionItemRefs.current[i] = el}
                                className={`p-2 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-none ${highlightedSuggestion === i ? 'bg-yellow-100 ring-2 ring-inset ring-yellow-400' : ''}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectSuggestion(index, s);
                                }}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-[10px] text-cyan-600 shrink-0">{s.code}</span>
                                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-blue-50 text-blue-500 uppercase">{s.type || 'Standard'}</span>
                                  <span className="text-right text-[9px] font-bold text-gray-500 ml-auto">{Number(s.material_price) + Number(s.labor_price)} SAR</span>
                                </div>
                                <div className="text-[9px] text-gray-700 leading-tight mt-1 truncate">{s.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td
                        className={`border border-black p-2 relative cursor-text transition-colors ${activeRow === index && activeField === 'description' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => {
                          handleCellClick(e, index, 'description');
                          updateDropdownPosition(e.currentTarget);
                        }}
                      >
                        <textarea
                          data-row={index}
                          data-col="description"
                          className="w-full outline-none resize-none min-h-[40px] bg-transparent no-print text-black font-semibold overflow-hidden placeholder:opacity-30"
                          placeholder="Item Description..."
                          value={item.description}
                          rows={1}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                          spellCheck={true}
                          lang="en-US"
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = el.scrollHeight + 'px';
                            }
                          }}
                          onChange={(e) => handleItemSearch(index, 'description', e.target.value)}
                          onFocus={(e) => {
                            handleFocus(index, 'description', e.target.value);
                            e.target.select();
                            updateDropdownPosition(e.target.closest('td'));
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'description')}
                        />
                        <div className="print-only min-h-[40px] text-black font-semibold whitespace-pre-wrap">{item.description}</div>
                        {/* Suggestions moved to Portal */}
                      </td>
                      <td
                        className={`border border-black p-2 cursor-text transition-colors ${activeRow === index && activeField === 'unit' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => handleCellClick(e, index, 'unit')}
                      >
                        <input
                          data-row={index}
                          data-col="unit"
                          className="w-full outline-none text-center bg-transparent no-print font-bold"
                          value={item.unit}
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          onFocus={(e) => {
                            setActiveRow(index);
                            setActiveField('unit');
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'unit')}
                        />
                        <span className="print-only text-center block">{item.unit}</span>
                      </td>
                      <td
                        className={`border border-black p-2 cursor-text transition-colors ${activeRow === index && activeField === 'qty' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => handleCellClick(e, index, 'qty')}
                      >
                        <input
                          data-row={index}
                          data-col="qty"
                          type="number"
                          className="w-full outline-none text-center bg-transparent no-print text-black font-bold"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          onFocus={(e) => {
                            setActiveRow(index);
                            setActiveField('qty');
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'qty')}
                        />
                        <span className="print-only text-center block text-black font-semibold">{item.qty}</span>
                      </td>
                      <td
                        className={`border border-black p-2 cursor-text transition-colors ${activeRow === index && activeField === 'material' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => handleCellClick(e, index, 'material')}
                      >
                        <input
                          data-row={index}
                          data-col="material"
                          type="number"
                          className="w-full outline-none text-right bg-transparent no-print font-bold"
                          value={item.material}
                          onChange={(e) => handleItemChange(item.id, 'material', e.target.value)}
                          onFocus={(e) => {
                            setActiveRow(index);
                            setActiveField('material');
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'material')}
                        />
                        <span className="print-only text-right block">{Number(item.material || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td
                        className={`border border-black p-2 cursor-text transition-colors ${activeRow === index && activeField === 'labor' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : ''}`}
                        onClick={(e) => handleCellClick(e, index, 'labor')}
                      >
                        <input
                          data-row={index}
                          data-col="labor"
                          type="number"
                          className="w-full outline-none text-right bg-transparent no-print font-bold"
                          value={item.labor}
                          onChange={(e) => handleItemChange(item.id, 'labor', e.target.value)}
                          onFocus={(e) => {
                            setActiveRow(index);
                            setActiveField('labor');
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'labor')}
                        />
                        <span className="print-only text-right block">{Number(item.labor || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td
                        className={`border border-black p-2 cursor-text transition-colors text-right tabular-nums ${activeRow === index && activeField === 'total' ? 'bg-blue-50 ring-1 ring-inset ring-blue-400' : 'bg-gray-50/20'}`}
                        onClick={(e) => handleCellClick(e, index, 'total')}
                      >
                        <input
                          data-row={index}
                          data-col="total"
                          type="number"
                          className="w-full outline-none text-right bg-transparent no-print font-bold text-black"
                          value={(Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)}
                          onChange={(e) => handleTotalChange(item.id, e.target.value)}
                          onFocus={(e) => {
                            setActiveRow(index);
                            setActiveField('total');
                            e.target.select();
                          }}
                          onKeyDown={(e) => handleGridKeyDown(e, index, 'total')}
                        />
                        <span className="print-only text-right block font-bold text-black">
                          {((Number(item.qty || 0) * Number(item.material || 0)) + Number(item.labor || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="border border-black text-center print:hidden">
                        <button
                          onClick={() => removeRow(item.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors no-print"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {/* Totals Row */}
                <tr className="font-bold text-[10px] bg-gray-100 uppercase">
                  <td colSpan={4} className="border border-black text-center"></td>
                  <td className="border border-black text-right p-2">
                    {items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.material || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

          {/* Suggestions placeholder removed from global bottom */}

          <button
            onClick={addRow}
            className="w-full bg-gray-50 border-x border-b border-black p-1 text-[9px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors no-print print:hidden"
          >
            <Plus size={12} /> Add Row
          </button>
        </div>

        {createPortal(
          <AnimatePresence>
            {activeRow !== null && (activeField === 'code' || activeField === 'description') && priceSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bg-white border border-black shadow-2xl z-[9999] max-h-60 overflow-y-auto no-print scroll-smooth rounded-lg"
                style={{
                  top: dropdownPos.top - window.scrollY,
                  left: dropdownPos.left,
                  width: activeField === 'description' ? 400 : 300, // Wider for description
                  maxHeight: '300px'
                }}
              >
                <div className="p-1 bg-gray-50 border-b flex justify-between items-center text-[10px] text-gray-500 sticky top-0 z-10">
                  <span>Found {priceSuggestions.length} items</span>
                  <button onClick={() => setPriceSuggestions([])}><X size={12} /></button>
                </div>
                {priceSuggestions.map((s, i) => (
                  <div
                    key={i}
                    ref={el => suggestionItemRefs.current[i] = el}
                    className={`p-2 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-none ${highlightedSuggestion === i ? 'bg-yellow-100 ring-2 ring-inset ring-yellow-400' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(activeRow, s);
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-[10px] text-cyan-600 shrink-0">{s.code}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-blue-50 text-blue-500 uppercase">{s.type || 'Standard'}</span>
                      <span className="text-right text-[9px] font-bold text-gray-500 ml-auto">{Number(s.material_price) + Number(s.labor_price)} SAR</span>
                    </div>
                    <div className="text-[9px] text-gray-700 leading-tight mt-1 truncate">{s.description}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}



        {/* Images & Totals */}
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <div
            className="w-full md:w-1/2 border border-gray-300 bg-gray-50 p-[1px] min-h-[150px]" // optional min-height
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div
              className={`w-full gap-2 p-1 min-h - [150px] flex flex-col ${images.length === 0 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className={`grid w-full gap-1 max-h-[400px] overflow-auto ${(images.length + (images.length < 9 ? 1 : 0)) === 1 ? 'grid-cols-1 grid-rows-1' :
                (images.length + (images.length < 9 ? 1 : 0)) === 2 ? 'grid-cols-2 grid-rows-1' :
                  'grid-cols-2 md:grid-cols-3'}`}>
                {images.map((imgData, i) => (
                  <div key={i} className="w-full aspect-square relative group border border-gray-300">
                    <img
                      src={imgData && imgData.startsWith('/uploads') ? `${API_BASE_URL}${imgData}` : imgData}
                      alt={`Evidence ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
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
                      data-row="adj"
                      data-col="transportation"
                      type="number"
                      className="w-full p-1.5 text-right outline-none font-bold bg-transparent no-print"
                      value={adj.transportation}
                      onChange={e => setAdj({ ...adj, transportation: e.target.value })}
                      onKeyDown={(e) => handleFooterKeyDown(e, 'transportation')}
                      onFocus={(e) => e.target.select()}
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
                      data-row="adj"
                      data-col="discount"
                      type="number"
                      className="w-full p-1.5 text-right outline-none font-bold bg-transparent no-print text-red-600"
                      value={adj.discount}
                      onChange={e => setAdj({ ...adj, discount: e.target.value })}
                      onKeyDown={(e) => handleFooterKeyDown(e, 'discount')}
                      onFocus={(e) => e.target.select()}
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
                    {totals.subtotalWithAdjustments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            <div className="border border-black h-50 mt-2 bg-white flex items-center justify-center">
              <div className="flex items-center justify-center gap-8 w-full h-full">
                <img src={stamp} alt="Stamp" className="w-50 h-50 object-contain" />
                <img src={signature} alt="Signature" className="w-20 h-20 object-contain" />
              </div>
            </div>

            {/* Date of Completion Row */}
            <div className="w-full mt-1 bg-gray-200 border border-black text-black text-[10px] font-bold flex">
              <div className="flex-1 flex items-center justify-center border-r border-black p-2 gap-2">
                <span>Date of Completion:</span>
                <input
                  data-row="footer"
                  data-col="completionDate"
                  type="date"
                  className="outline-none border-b border-black bg-gray-200 text-black text-[10px] w-32 no-print"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  onKeyDown={(e) => handleFooterKeyDown(e, 'completionDate')}
                  onFocus={(e) => e.target.select()}
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
                  data-row="footer"
                  data-col="warranty"
                  type="text"
                  className="flex-1 outline-none p-2 bg-gray-50 text-[9px] font-semibold no-print text-black"
                  style={{ color: 'black' }}
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  onKeyDown={(e) => handleFooterKeyDown(e, 'warranty')}
                  onFocus={(e) => e.target.select()}
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
                    data-row="exclusion"
                    data-col={i}
                    className="flex-1 p-1.5 text-[9px] font-semibold bg-gray-50 uppercase focus:bg-white transition-colors no-print text-black outline-none"
                    style={{ color: 'black' }}
                    value={val}
                    onChange={(e) => {
                      const newExclusions = [...exclusions];
                      newExclusions[i] = e.target.value;
                      setExclusions(newExclusions);
                    }}
                    onKeyDown={(e) => handleFooterKeyDown(e, 'exclusion', i)}
                    onFocus={(e) => e.target.select()}
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
            <Printer size={16} /> Print/Save
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
          className={`${darkMode ? 'bg-white text-black' : 'bg-black text-white'} p-4 rounded-full shadow-2xl hover: scale-110 transition-transform active: scale-95`}
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
          .no-print { display: none!important; }
          .print\\:hidden { display: none!important; }
          .print-only { display: block!important; }
          body { background: white!important; margin: 0; padding: 0; font-family: 'Outfit', sans-serif!important; }
  #quotation-content { border: none!important; shadow: none!important; margin: 0!important; width: 100 % !important; max-width: none!important; }
          .shadow-2xl, .shadow-lg, .shadow-sm { box-shadow: none!important; }
          .border-gray-200, .border-gray-100 { border: none!important; }
          .min-h-screen { min-height: 0!important; height: auto!important; }
          .gap-1, .gap-2, .gap-4, .md\\: gap-4 { gap: 0!important; }
          .md\\: p -\\[40px\\], .p-4 { padding: 0!important; }
          .md\\: py-8, .py-2 { padding-top: 0!important; padding-bottom: 0!important; }
          .mt-2, .mt-4, .mt-8, .mt-auto { margin-top: 0.25rem!important; }
  input, textarea, button { border: none!important; outline: none!important; appearance: none!important; }
          .bg-gray-200 { background-color: #f3f4f6!important; -webkit-print-color-adjust: exact; }
          .bg -\\[\\#e2d1a5\\] { background-color: #e2d1a5!important; -webkit-print-color-adjust: exact; }
}
@media screen {
          .print-only { display: none!important; }
}
input:: -webkit-outer-spin-button, input:: -webkit-inner-spin-button {
  -webkit-appearance: none; margin: 0;
}
input[type = "number"] {
  -moz-appearance: textfield;
}
        .aspect-video {
  aspect-ratio: 4/3!important;
}
`}</style>
    </div>
  );
};

export default NewQuotation;
