"use client";
import { useEffect, useState, useMemo } from "react";
import { FiPlus, FiBox, FiLayers, FiX, FiClipboard, FiEdit3 } from "react-icons/fi"; // 🟢 Added FiEdit3
import AddMaterialModal from "./AddMaterialModal";
import ProductForm from "@/components/ProductForm";
import ViewRecipeModal from "./ViewRecipeModal";
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  
  const [modalMode, setModalMode] = useState('NONE'); 
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState(null);
  
  // 🟢 NEW: State for Edit Mode
  const [editingProduct, setEditingProduct] = useState(null);

  // ... (State and fetchStock remain same) ...
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterHealth, setFilterHealth] = useState("ALL");

  useEffect(() => { fetchStock(); }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const [matRes, prodRes] = await Promise.all([
        api.get("/inventory/stock"),
        api.get("/products")
      ]);
      setRawMaterials(matRes.data);
      setProducts(prodRes.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // ... (unifiedData logic remains same) ...
  const unifiedData = useMemo(() => {
    const formattedRM = rawMaterials.map(m => ({ ...m, type: 'Raw Material', status: m.status || 'UNKNOWN' }));
    const formattedFG = products.map(p => ({ ...p, type: 'Finished Good', status: p.status || 'UNKNOWN', bom: p.bom }));
    
    let combined = [...formattedRM, ...formattedFG];
    combined = combined.map(i => ({
        _id: i._id,
        idDisplay: i.materialId || i.sku,
        name: i.name,
        type: i.type,
        unit: i.unit || 'PCS',
        current: (i.stock?.current || i.stock?.warehouse) || 0,
        reserved: i.stock?.reserved || 0,
        avg: i.avgConsumption || 0,
        lead: i.leadTime || 0,
        safety: i.safetyStock || 0,
        status: i.status,
        bom: i.bom,
        // Pass original object for editing
        original: i 
    }));

    if (filterType !== 'ALL') combined = combined.filter(i => (filterType === 'RM' ? i.type === 'Raw Material' : i.type === 'Finished Good'));
    if (filterHealth !== 'ALL') combined = combined.filter(i => i.status === filterHealth);
    return combined;
  }, [rawMaterials, products, filterType, filterHealth]);

  const getStatusBadge = (status) => { /* ... same ... */ 
    const s = status ? status.toUpperCase() : "UNKNOWN";
    if (s === "CRITICAL") return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">CRITICAL</span>;
    if (s === "MEDIUM") return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">MEDIUM</span>;
    if (s === "OPTIMAL") return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">OPTIMAL</span>;
    if (s === "EXCESS") return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">EXCESS</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">{s}</span>;
  };

  // 🟢 NEW: Handler to start editing
  const handleEditProduct = (product) => {
      setEditingProduct(product.original); // Pass the raw data object
      setModalMode('ADD_FG'); // Re-use the Product Form modal
  };

  return (
    <AuthGuard requiredPermission="inventory">
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Filters (Same as before) */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Master Inventory</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Unified view of Raw Materials & Finished Goods.</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setModalMode('SELECTION'); }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <FiPlus /> Add Item
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-end gap-6">
        {/* ... (Keep Filter Bar code exactly as it was) ... */}
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Item Type</label>
            <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden w-fit">
                <button onClick={() => setFilterType('ALL')} className={`px-5 py-2.5 text-sm font-bold border-r ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>All</button>
                <button onClick={() => setFilterType('RM')} className={`px-5 py-2.5 text-sm font-bold border-r ${filterType === 'RM' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>Raw</button>
                <button onClick={() => setFilterType('FG')} className={`px-5 py-2.5 text-sm font-bold ${filterType === 'FG' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'}`}>FG</button>
            </div>
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Health Status</label>
            <div className="flex rounded-lg overflow-hidden w-fit shadow-sm">
                <button onClick={() => setFilterHealth('ALL')} className={`px-4 py-2 text-xs font-bold text-white ${filterHealth === 'ALL' ? 'bg-slate-600' : 'bg-slate-400'}`}>All</button>
                <button onClick={() => setFilterHealth('CRITICAL')} className={`px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 ${filterHealth === 'CRITICAL' ? 'ring-2 ring-red-300' : ''}`}>Critical</button>
                <button onClick={() => setFilterHealth('MEDIUM')} className={`px-4 py-2 text-xs font-bold text-white bg-amber-400 hover:bg-amber-500 ${filterHealth === 'MEDIUM' ? 'ring-2 ring-amber-300' : ''}`}>Medium</button>
                <button onClick={() => setFilterHealth('OPTIMAL')} className={`px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 ${filterHealth === 'OPTIMAL' ? 'ring-2 ring-emerald-300' : ''}`}>Optimal</button>
                <button onClick={() => setFilterHealth('EXCESS')} className={`px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 ${filterHealth === 'EXCESS' ? 'ring-2 ring-purple-300' : ''}`}>Excess</button>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Physical</th>
              <th className="px-6 py-4">Reserved</th>
              <th className="px-6 py-4">Net</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unifiedData.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        {/* 🟢 EDIT BUTTON (Only for FG for now) */}
                        {item.type === 'Finished Good' && (
                            <button 
                                onClick={() => handleEditProduct(item)} 
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                                title="Edit Product"
                            >
                                <FiEdit3 size={14} />
                            </button>
                        )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{item.idDisplay}</div>
                    
                    {item.type === 'Finished Good' && (
                        <button onClick={() => setSelectedRecipeProduct(item)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            <FiClipboard size={10} /> View BOM
                        </button>
                    )}
                  </td>
                  
                  {/* ... (Rest of columns remain same) ... */}
                  <td className="px-6 py-4">{item.type === 'Raw Material' ? <span className="text-xs font-bold text-slate-500 flex gap-1"><FiBox/> RM</span> : <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex gap-1 w-fit"><FiLayers/> FG</span>}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{Number(item.current).toFixed(2)} {item.unit}</td>
                  <td className="px-6 py-4 font-mono font-bold text-amber-600 bg-amber-50/10">{Number(item.reserved).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono font-black text-slate-800">{Number(item.current - item.reserved).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">{Number(item.avg * item.lead * (item.safety || 1)).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(item.status)}</td>
                </tr>
            ))}
          </tbody>
        </table>
        {unifiedData.length === 0 && !loading && <div className="p-12 text-center text-slate-400 font-medium">Inventory is empty.</div>}
      </div>

      {/* Modals */}
      {modalMode === 'SELECTION' && (
        /* ... (Selection Modal Code Same) ... */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in zoom-in-95">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
                <button onClick={() => setModalMode('NONE')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FiX size={24}/></button>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Add New Item</h3>
                <p className="text-slate-500 mb-8">What type of item are you adding to inventory?</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setModalMode('ADD_RM')} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FiBox size={24} /></div>
                        <h4 className="font-bold text-slate-900 text-lg">Raw Material</h4>
                        <p className="text-xs text-slate-500 mt-1">Fabric, buttons, thread, ink, etc.</p>
                    </button>
                    <button onClick={() => setModalMode('ADD_FG')} className="p-6 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FiLayers size={24} /></div>
                        <h4 className="font-bold text-slate-900 text-lg">Finished Good</h4>
                        <p className="text-xs text-slate-500 mt-1">Products, garments, complete sets.</p>
                    </button>
                </div>
            </div>
        </div>
      )}

      {modalMode === 'ADD_RM' && <AddMaterialModal onClose={() => setModalMode('NONE')} onSuccess={() => { setModalMode('NONE'); fetchStock(); }} />}
      
      {/* 🟢 PASSED editingProduct into the Form */}
      {modalMode === 'ADD_FG' && (
        <ProductForm 
            initialData={editingProduct} 
            onClose={() => { setModalMode('NONE'); setEditingProduct(null); }} 
            onSuccess={() => { setModalMode('NONE'); setEditingProduct(null); fetchStock(); }} 
        />
      )}
      
      {selectedRecipeProduct && <ViewRecipeModal product={selectedRecipeProduct} onClose={() => setSelectedRecipeProduct(null)} />}

    </div>
    </AuthGuard>
  );
}