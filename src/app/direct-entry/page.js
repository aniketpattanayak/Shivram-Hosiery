"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import { 
    FiPlus, FiTrash2, FiSave, FiClock, FiSearch, FiArrowLeft, FiFilter, FiBox, FiPercent
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
  const [rows, setRows] = useState([
      { itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "", gstEnabled: false, gstPercent: 18 }
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

  // 🟢 LOGIC: Identify selected vendor's category to filter items
  const vendorCategory = useMemo(() => {
    const found = vendors.find(v => v._id === selectedVendor);
    return found ? found.category : null;
  }, [selectedVendor, vendors]);

  // 🟢 LOGIC: Filtered item list based on Vendor Type
  const availableItemsForVendor = useMemo(() => {
    if (!vendorCategory) return [];
    if (vendorCategory === "Material Supplier") {
        return allItems.filter(item => item.type === "Raw Material");
    } 
    if (vendorCategory === "Trading" || vendorCategory === "Full Service Factory") {
        return allItems.filter(item => item.type === "Finished Good");
    }
    return allItems;
  }, [vendorCategory, allItems]);

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    if (field === 'gstEnabled') {
        newRows[index].gstEnabled = !newRows[index].gstEnabled;
    } else {
        newRows[index][field] = value;
    }

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
    setRows([...rows, { itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "", gstEnabled: false, gstPercent: 18 }]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const getLineTotal = (row) => {
      const subtotal = Number(row.qty) * Number(row.rate);
      if (row.gstEnabled) {
          return subtotal + (subtotal * (Number(row.gstPercent) / 100));
      }
      return subtotal;
  };

  const calculateTotal = () => {
      return rows.reduce((acc, row) => acc + getLineTotal(row), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return alert("Please select a vendor");
    
    setLoading(true);
    try {
        const payload = rows.map(row => ({
            ...row,
            totalAmount: getLineTotal(row) // 🟢 Ensures backend receives the GST-inclusive total
        }));

        await api.post("/procurement/direct-entry", {
            vendorId: selectedVendor,
            items: payload
        });
        alert("✅ Stock Entry recorded with GST successfully!");
        setRows([{ itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "", gstEnabled: false, gstPercent: 18 }]);
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
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Direct Stock Entry</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage Inward Stock with dynamic GST calculations.</p>
                </div>
            </div>
        </div>

        {/* ENTRY FORM */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                    <div className="w-2 h-4 bg-blue-500 rounded-full"></div> New Entry
                </h3>
                {vendorCategory && (
                    <span className="text-[10px] font-black bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 uppercase">
                        Mode: {vendorCategory === 'Material Supplier' ? 'Raw Materials' : 'Finished Goods'}
                    </span>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Vendor Select */}
                <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Vendor Partner</label>
                    <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-50"
                        value={selectedVendor}
                        onChange={(e) => {
                            setSelectedVendor(e.target.value);
                            setRows([{ itemId: "", itemType: "Raw Material", qty: 1, rate: 0, batch: "", gstEnabled: false, gstPercent: 18 }]);
                        }}
                        required
                    >
                        <option value="">-- Choose Vendor --</option>
                        {vendors.map(v => (
                            <option key={v._id} value={v._id}>{v.name} ({v.category})</option>
                        ))}
                    </select>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                            <tr>
                                <th className="p-5 w-[25%]">Item Name</th>
                                <th className="p-5 w-[12%] text-center">Batch ID</th>
                                <th className="p-5 w-[8%] text-center">Qty</th>
                                <th className="p-5 w-[12%] text-right">Net Rate (₹)</th>
                                <th className="p-5 w-[15%] text-center">Tax (GST)</th>
                                <th className="p-5 w-[18%] text-right">Gross Total</th>
                                <th className="p-5 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {rows.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <select 
                                            className={`w-full p-2 border-0 bg-transparent font-black text-slate-900 outline-none ${!selectedVendor ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            value={row.itemId}
                                            onChange={(e) => handleRowChange(index, 'itemId', e.target.value)}
                                            required
                                            disabled={!selectedVendor}
                                        >
                                            <option value="">{selectedVendor ? 'Select Item...' : 'Choose Vendor First'}</option>
                                            {availableItemsForVendor.map(i => (
                                                <option key={i._id} value={i._id}>{i.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    
                                    <td className="p-4">
                                        <input type="text" className="w-full p-2 bg-slate-50 rounded-lg font-mono text-[10px] outline-none text-center border border-transparent focus:border-blue-200" placeholder="BATCH" value={row.batch} onChange={(e) => handleRowChange(index, 'batch', e.target.value)}/>
                                    </td>

                                    <td className="p-4">
                                        <input type="number" className="w-full p-2 bg-slate-50 rounded-lg font-black text-center outline-none border border-transparent focus:border-blue-200" value={row.qty} onChange={(e) => handleRowChange(index, 'qty', e.target.value)} required/>
                                    </td>
                                    <td className="p-4">
                                        <input type="number" className="w-full p-2 bg-slate-50 rounded-lg font-black text-right outline-none border border-transparent focus:border-blue-200" value={row.rate} onChange={(e) => handleRowChange(index, 'rate', e.target.value)} required/>
                                    </td>

                                    {/* 🟢 GST UI SECTION */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer" checked={row.gstEnabled} onChange={() => handleRowChange(index, 'gstEnabled')}/>
                                            {row.gstEnabled && (
                                                <div className="flex items-center bg-blue-50 border border-blue-100 rounded-lg px-2">
                                                    <input type="number" className="w-8 p-1 bg-transparent font-black text-blue-700 text-xs outline-none text-center" value={row.gstPercent} onChange={(e) => handleRowChange(index, 'gstPercent', e.target.value)}/>
                                                    <span className="text-[10px] font-black text-blue-400">%</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="font-mono font-black text-slate-900">₹{getLineTotal(row).toLocaleString()}</div>
                                        {row.gstEnabled && <div className="text-[9px] font-bold text-emerald-600 uppercase">Incl. Tax</div>}
                                    </td>
                                    
                                    <td className="p-4 text-center">
                                        <button type="button" onClick={() => removeRow(index)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><FiTrash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <button type="button" onClick={addRow} disabled={!selectedVendor} className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white">
                            <FiPlus /> Add Line Item
                        </button>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex justify-end items-center gap-10 pt-6">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Grand Total (Payable)</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{calculateTotal().toLocaleString()}</p>
                    </div>
                    <button type="submit" disabled={loading || !selectedVendor} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all">
                        {loading ? 'Processing...' : 'Confirm Entry'}
                    </button>
                </div>
            </form>
        </div>

        {/* 🟢 UPDATED HISTORY TABLE: Showing GST Inclusive Values */}
        <div className="space-y-4 pt-10 border-t border-slate-100">
            <div className="flex justify-between items-end">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <FiClock className="text-blue-500" /> Recent Direct Entries
                </h3>
                <div className="relative w-80">
                    <FiSearch className="absolute left-4 top-3.5 text-slate-400"/>
                    <input type="text" placeholder="Search History..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none"/>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden overflow-y-auto max-h-[400px]">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest sticky top-0 z-10 border-b">
                        <tr>
                            <th className="p-5">Inward Date</th>
                            <th className="p-5">Specification</th>
                            <th className="p-5">Vendor Source</th>
                            <th className="p-5 text-right">Inward Qty</th>
                            <th className="p-5 text-right">Unit Rate (Incl. GST)</th>
                            <th className="p-5 text-right">Total Amount (Gross)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredHistory.map((h) => {
                            // 🟢 Logic: Calculate true gross unit rate from total amount
                            const grossRate = h.receivedQty > 0 ? (h.totalAmount / h.receivedQty) : 0;
                            return (
                                <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5 text-slate-400 font-mono text-[10px]">
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-5">
                                        <div className="font-black text-slate-800 text-xs">{h.itemName}</div>
                                        <div className="text-[9px] font-bold text-blue-500 uppercase mt-1">{h.itemType}</div>
                                    </td>
                                    <td className="p-5 text-slate-600 font-bold text-xs uppercase">
                                        {h.vendor_id?.name || 'Manual Entry'}
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono font-black text-xs">+{h.receivedQty}</span>
                                    </td>
                                    {/* 🟢 Showing Gross Rate in History */}
                                    <td className="p-5 text-right text-emerald-600 font-black text-xs">
                                        ₹{grossRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    {/* 🟢 Showing Gross Total in History */}
                                    <td className="p-5 text-right font-black text-slate-900 text-sm">
                                        ₹{h.totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </AuthGuard>
  );
}