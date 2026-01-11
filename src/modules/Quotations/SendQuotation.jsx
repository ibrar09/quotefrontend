import React, { useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const dummyStores = [
  { oracle_ccid: 'ST-101', city: 'Riyadh', brand: 'Starbucks', store_name: 'Riyadh Mall' },
  { oracle_ccid: 'ST-102', city: 'Jeddah', brand: 'H&M', store_name: 'Red Sea Mall' },
];

const SendQuotationFull = () => {
  // 🔹 Job / Header Info
  const [job, setJob] = useState({
    quote_no: 'Q-1001',
    revision_no: 0,
    oracle_ccid: 'ST-101',
    mr_no: 'MR-505',
    mr_date: '2026-01-01',
    work_description: 'Interior Renovation',
    subtotal: 0,
    discount: 50,
    vat_amount: 0,
    grand_total: 0,
  });

  // 🔹 Purchase Order Info
  const [po, setPo] = useState({
    po_no: 'PO-Q-1001',
    po_date: '2026-01-04',
    amount_ex_vat: 0,
    vat_15: 0,
    total_inc_vat: 0,
    eta: '2026-01-10',
    update_notes: ''
  });

  // 🔹 PriceList Items
  const [items, setItems] = useState([
    { id: 1, code: 'A101', type: 'Service', description: 'Install Shelves', unit: 'pcs', material_price: 500, labor_price: 200, total_price: 0, remarks: '', comments: '' },
    { id: 2, code: 'B202', type: 'Service', description: 'Paint Walls', unit: 'sqm', material_price: 30, labor_price: 20, total_price: 0, remarks: '', comments: '' },
    { id: 3, code: 'C303', type: 'Material', description: 'Lighting Fixtures', unit: 'pcs', material_price: 100, labor_price: 50, total_price: 0, remarks: '', comments: '' },
    { id: 4, code: 'D404', type: 'Material', description: 'Floor Tiles', unit: 'sqm', material_price: 80, labor_price: 40, total_price: 0, remarks: '', comments: '' },
  ]);

  // Helper to update items
  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total_price = (Number(updated.material_price) + Number(updated.labor_price)) * Number(updated.unit === 'pcs' ? 1 : 1); // simple calc
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), code: '', type: 'Service', description: '', unit: '', material_price: 0, labor_price: 0, total_price: 0, remarks: '', comments: '' }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // 🔹 Calculations
  const subtotal = items.reduce((acc, i) => acc + Number(i.total_price), 0);
  const vat = (subtotal - job.discount) * 0.15;
  const grandTotal = subtotal - job.discount + vat;

  // Update totals in state
  React.useEffect(() => {
    setJob(prev => ({ ...prev, subtotal, vat_amount: vat, grand_total: grandTotal }));
    setPo(prev => ({ ...prev, amount_ex_vat: subtotal, vat_15: vat, total_inc_vat: grandTotal }));
  }, [items, job.discount]);

  // 🔹 Send to backend
  const handleSend = async () => {
    try {
      const payload = {
        job,
        items,
        purchase_order: po,
        finance: {} // can fill later
      };
      const res = await axios.post(`${API_BASE_URL}/api/quotations`, payload);
      console.log('Saved:', res.data);
      alert('Quotation sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Error sending quotation.');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-black-100">
      <h1 className="text-2xl font-bold mb-4">Full Quotation Builder</h1>

      {/* Job Header */}
      <div className="mb-4 p-4 bg-white shadow rounded space-y-2">
        <label>
          Quote No: <input value={job.quote_no} onChange={e => setJob({ ...job, quote_no: e.target.value })} className="border px-2 py-1" />
        </label>
        <label>
          MR No: <input value={job.mr_no} onChange={e => setJob({ ...job, mr_no: e.target.value })} className="border px-2 py-1" />
        </label>
        <label>
          Store:
          <select value={job.oracle_ccid} onChange={e => setJob({ ...job, oracle_ccid: e.target.value })} className="border px-2 py-1">
            {dummyStores.map(s => <option key={s.oracle_ccid} value={s.oracle_ccid}>{s.store_name} ({s.oracle_ccid})</option>)}
          </select>
        </label>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Code</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Unit</th>
            <th className="border p-2">Material</th>
            <th className="border p-2">Labor</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.id}>
              <td className="border p-1"><input value={i.code} onChange={e => updateItem(i.id, 'code', e.target.value)} className="w-full" /></td>
              <td className="border p-1"><input value={i.type} onChange={e => updateItem(i.id, 'type', e.target.value)} className="w-full" /></td>
              <td className="border p-1"><input value={i.description} onChange={e => updateItem(i.id, 'description', e.target.value)} className="w-full" /></td>
              <td className="border p-1"><input value={i.unit} onChange={e => updateItem(i.id, 'unit', e.target.value)} className="w-full" /></td>
              <td className="border p-1"><input type="number" value={i.material_price} onChange={e => updateItem(i.id, 'material_price', e.target.value)} className="w-full text-right" /></td>
              <td className="border p-1"><input type="number" value={i.labor_price} onChange={e => updateItem(i.id, 'labor_price', e.target.value)} className="w-full text-right" /></td>
              <td className="border p-1 text-right font-bold">{i.total_price}</td>
              <td className="border p-1 text-center"><button onClick={() => removeItem(i.id)}><Trash2 size={14} /></button></td>
            </tr>
          ))}
          <tr>
            <td colSpan={8} className="border p-2 text-left">
              <button onClick={addItem} className="flex items-center gap-2 text-blue-700 font-bold"><Plus size={12} /> Add Row</button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary */}
      <div className="p-4 bg-white shadow rounded space-y-2">
        <p>Subtotal: {subtotal.toFixed(2)} SAR</p>
        <p>Discount: {job.discount} SAR</p>
        <p>VAT 15%: {vat.toFixed(2)} SAR</p>
        <p className="font-bold">Grand Total: {grandTotal.toFixed(2)} SAR</p>
      </div>

      {/* Send Button */}
      <div className="mt-4">
        <button onClick={handleSend} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded">
          <Send size={18} /> Send / Save Quotation
        </button>
      </div>
    </div>
  );
};

export default SendQuotationFull;
