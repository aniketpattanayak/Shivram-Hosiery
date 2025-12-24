"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import { 
    FiPlus, FiTrash2, FiSave, FiClock, FiSearch, FiArrowLeft, FiFilter, FiBox
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function DirectStockEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [vendors, setVendors] = useState([]);
  const [allItems, setAllItems] = useState([]); 
  const [history, setHistory] = useState([]);
  
  // Form State
  const [selectedVendor, setSelectedVendor] = useState("");
  // 🟢 Added 'batch' field here
  const [rows, setRows] = useState([
      { itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vRes, mRes, pRes, hRes] = await Promise.all([
        api.get("/vendors"),
        api.get("/inventory/stock"),
        api.get("/products"),
        api.get("/procurement/direct-entry")
      ]);

      setVendors(vRes.data);
      setHistory(hRes.data);

      const materials = mRes.data.map(m => ({ ...m, type: 'Raw Material', label: `(RM) ${m.name}` }));
      const products = pRes.data.map(p => ({ ...p, type: 'Finished Good', label: `(FG) ${p.name}` }));
      setAllItems([...materials, ...products]);

    } catch (e) {
      console.error(e);
    }
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;

    if (field === 'itemId') {
        const selected = allItems.find(i => i._id === value);
        if (selected) {
            newRows[index].itemType = selected.type;
            newRows[index].rate = selected.costPerUnit || selected.sellingPrice || 0;
        }
    }
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "" }]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
      return rows.reduce((acc, row) => acc + (Number(row.qty) * Number(row.rate)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return alert("Please select a vendor");
    
    setLoading(true);
    try {
        await api.post("/procurement/direct-entry", {
            vendorId: selectedVendor,
            items: rows
        });
        alert("✅ Stock & Batches Added Successfully!");
        
        // Reset
        setRows([{ itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "" }]);
        setSelectedVendor("");
        fetchInitialData(); 
    } catch (error) {
        alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
        setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
      if (!searchTerm) return history;
      return history.filter(h => 
          h.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.vendor_id?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [history, searchTerm]);

  return (
    <AuthGuard requiredPermission="procurement">
      <div className="space-y-8 animate-in fade-in pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><FiArrowLeft size={24}/></button>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Direct Stock Entry</h1>
                    <p className="text-slate-500 text-sm">Add stock instantly (Updates Inventory & creates Lots).</p>
                </div>
            </div>
        </div>

        {/* ENTRY FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div> New Entry
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vendor Select */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vendor</label>
                    <select 
                        className="w-full md:w-1/3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        required
                    >
                        <option value="">-- Select Vendor --</option>
                        {vendors.map(v => (
                            <option key={v._id} value={v._id}>
                                {v.name} ({v.category})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dynamic Rows */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-4 w-[35%]">Item Name</th>
                                <th className="p-4 w-[15%]">Type</th>
                                <th className="p-4 w-[20%]">Batch / Lot No. <span className="text-[9px] lowercase font-normal">(optional)</span></th>
                                <th className="p-4 w-[10%]">Qty</th>
                                <th className="p-4 w-[10%]">Per Qty (₹)</th>
                                <th className="p-4 w-[10%]">Total</th>
                                <th className="p-4 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td className="p-2 pl-4">
                                        <select 
                                            className="w-full p-2 border border-slate-200 rounded-lg font-medium outline-none focus:border-blue-500"
                                            value={row.itemId}
                                            onChange={(e) => handleRowChange(index, 'itemId', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Item...</option>
                                            {allItems.map(i => (
                                                <option key={i._id} value={i._id}>{i.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.itemType === 'Raw Material' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                            {row.itemType === 'Raw Material' ? 'RM' : 'FG'}
                                        </span>
                                    </td>
                                    
                                    {/* 🟢 BATCH INPUT */}
                                    <td className="p-2">
                                        <div className="relative">
                                            <FiBox className="absolute left-2 top-2.5 text-slate-300"/>
                                            <input 
                                                type="text"
                                                className="w-full pl-7 p-2 border border-slate-200 rounded-lg font-mono text-xs outline-none focus:border-blue-500 placeholder-slate-300"
                                                placeholder="Auto-Gen"
                                                value={row.batch}
                                                onChange={(e) => handleRowChange(index, 'batch', e.target.value)}
                                            />
                                        </div>
                                    </td>

                                    <td className="p-2">
                                        <input 
                                            type="number" min="1"
                                            className="w-full p-2 border border-slate-200 rounded-lg font-bold text-center outline-none focus:border-blue-500"
                                            value={row.qty}
                                            onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                                            required
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number" min="0"
                                            className="w-full p-2 border border-slate-200 rounded-lg font-bold text-right outline-none focus:border-blue-500"
                                            value={row.rate}
                                            onChange={(e) => handleRowChange(index, 'rate', e.target.value)}
                                            required
                                        />
                                    </td>
                                    <td className="p-2 font-mono font-bold text-slate-700 text-right">
                                        ₹{(row.qty * row.rate).toLocaleString()}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button type="button" onClick={() => removeRow(index)} className="text-slate-400 hover:text-red-500"><FiTrash2/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="p-2 bg-slate-50 border-t border-slate-200">
                        <button type="button" onClick={addRow} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                            <FiPlus /> Add Another Item
                        </button>
                    </div>
                </div>

                {/* Footer Total & Save */}
                <div className="flex justify-end items-center gap-6 pt-2">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-bold uppercase">Grand Total</p>
                        <p className="text-2xl font-black text-slate-900">₹{calculateTotal().toLocaleString()}</p>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><FiSave /> Confirm Entry</>}
                    </button>
                </div>
            </form>
        </div>

        {/* HISTORY TABLE */}
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <FiClock /> Entry History
                </h3>
                <div className="relative w-64">
                    <FiSearch className="absolute left-3 top-3 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Filter by Item or Vendor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-100 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-h-[500px] overflow-y-auto relative">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 border-b border-slate-200 bg-slate-50">Date</th>
                            <th className="p-4 border-b border-slate-200 bg-slate-50">Item Name</th>
                            <th className="p-4 border-b border-slate-200 bg-slate-50">Vendor</th>
                            <th className="p-4 border-b border-slate-200 bg-slate-50 text-right">Qty</th>
                            <th className="p-4 border-b border-slate-200 bg-slate-50 text-right">Rate</th>
                            <th className="p-4 border-b border-slate-200 bg-slate-50 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((h) => (
                                <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 font-mono text-xs">
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 font-bold text-slate-800">
                                        {h.itemName} 
                                        <span className="text-[10px] font-normal text-slate-400 ml-1">({h.itemType === 'Raw Material' ? 'RM' : 'FG'})</span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-xs">
                                        {h.vendor_id?.name || 'Unknown'}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-blue-600">
                                        +{h.receivedQty}
                                    </td>
                                    <td className="p-4 text-right text-slate-500">
                                        ₹{h.unitPrice}
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-900">
                                        ₹{h.totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-400 italic">No history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </AuthGuard>
  );
}