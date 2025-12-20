"use client";
import { useState, useEffect } from "react";
import {
  FiPlus, FiTrash2, FiLayers, FiTag, FiBox, FiX, FiSave, FiEdit3
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';

// 🟢 ACCEPT 'initialData' PROP
export default function ProductForm({ onClose, onSuccess, initialData = null }) {
  
  // --- STATE ---
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [availableSubCats, setAvailableSubCats] = useState([]);
  
  const [showModal, setShowModal] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");

  const [formData, setFormData] = useState({
    name: "", sku: "", category: "", subCategory: "", fabricType: "", color: "",
    costPerUnit: "", sellingPrice: "", 
    avgConsumption: "", leadTime: "", safetyStock: "",
    bom: [],
  });

  // --- FETCH DATA & PRE-FILL ---
  useEffect(() => {
    const init = async () => {
      try {
        const [matRes, catRes, attrRes] = await Promise.all([
          api.get("/inventory/stock"),
          api.get("/master/categories"),
          api.get("/master/attributes"),
        ]);
        setMaterials(matRes.data);
        setCategories(catRes.data);
        setFabrics(attrRes.data.fabric || []);
        setColors(attrRes.data.color || []);

        // 🟢 PRE-FILL LOGIC IF EDITING
        if (initialData) {
            // Transform BOM: Backend sends populated objects, we need IDs for the Select inputs
            const formattedBom = (initialData.bom || []).map(b => ({
                material: b.material._id || b.material, // Handle if populated or not
                qtyRequired: b.qtyRequired
            }));

            setFormData({
                name: initialData.name || "",
                sku: initialData.idDisplay || initialData.sku || "", // Handle mapped vs raw
                category: initialData.category || "",
                subCategory: initialData.subCategory || "",
                fabricType: initialData.fabricType || "",
                color: initialData.color || "",
                costPerUnit: initialData.costPerUnit || 0,
                sellingPrice: initialData.sellingPrice || 0,
                avgConsumption: initialData.avg || initialData.avgConsumption || 0,
                leadTime: initialData.lead || initialData.leadTime || 0,
                safetyStock: initialData.safety || initialData.safetyStock || 0,
                bom: formattedBom
            });

            // Trigger SubCat population if category exists
            if (initialData.category) {
                const selectedCat = catRes.data.find(c => c.name === initialData.category);
                setAvailableSubCats(selectedCat ? selectedCat.subCategories : []);
            }
        }

      } catch (error) {
        console.error("Error loading master data", error);
      }
    };
    init();
  }, [initialData]);

  // --- HANDLERS (Keep existing logic) ---
  const handleCategoryChange = (e) => {
    const catName = e.target.value;
    const selectedCat = categories.find((c) => c.name === catName);
    setFormData({ ...formData, category: catName, subCategory: "" });
    setAvailableSubCats(selectedCat ? selectedCat.subCategories : []);
  };

  // ... (Keep handleQuickAdd, addBomItem, updateBom exactly same as before) ...
  const handleQuickAdd = async () => { /* ... existing logic ... */ setShowModal(null); };
  
  const addBomItem = () => {
    if (materials.length === 0) return alert("No materials found!");
    setFormData({ ...formData, bom: [...formData.bom, { material: materials[0]?._id, qtyRequired: 1 }] });
  };

  const updateBom = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index][field] = value;
    setFormData({ ...formData, bom: newBom });
  };

  // 🟢 UPDATED SUBMIT LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku) return alert("SKU is required");
    try {
      if (initialData) {
        // UPDATE MODE
        await api.put(`/products/${initialData._id}`, formData);
        alert("Product Updated Successfully!");
      } else {
        // CREATE MODE
        await api.post("/products", formData);
        alert("Product Created Successfully!");
      }
      onSuccess(); 
    } catch (error) {
      alert(error.response?.data?.msg || error.message);
    }
  };

  const inputClass = "w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <div>
            <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                {initialData ? <><FiEdit3 className="text-blue-600"/> Edit Product</> : <><FiPlus className="text-emerald-600"/> Define New Product</>}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
                {initialData ? `Updating Master: ${initialData.name}` : 'Add Finished Goods to Master'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><FiX size={20} /></button>
        </div>

        {/* Scrollable Form */}
        <div className="p-8 overflow-y-auto custom-scrollbar relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ... (KEEP ALL FORM FIELDS EXACTLY AS THEY WERE IN PREVIOUS STEP) ... */}
            {/* Just pasting the rows structure here for clarity - no changes needed to inputs */}
            
            {/* Row 1: Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                <input type="text" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">SKU Code</label>
                <input type="text" className={inputClass} value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
              </div>
            </div>

            {/* Row 2: Dynamic Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
               {/* ... Keep Category, SubCat, Fabric, Color Inputs same as before ... */}
               <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select className={inputClass} value={formData.category} onChange={handleCategoryChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Sub-Category</label>
                <select className={inputClass} value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} disabled={!formData.category}>
                  <option value="">Select Sub</option>
                  {availableSubCats.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Fabric</label>
                <select className={inputClass} value={formData.fabricType} onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}>
                  <option value="">Select Fabric</option>
                  {fabrics.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                <select className={inputClass} value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}>
                  <option value="">Select Color</option>
                  {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Planning Metrics */}
            <div className="grid grid-cols-3 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-700 uppercase">Daily Demand</label>
                    <input type="number" className={inputClass} value={formData.avgConsumption} onChange={(e) => setFormData({ ...formData, avgConsumption: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-700 uppercase">Lead Time</label>
                    <input type="number" className={inputClass} value={formData.leadTime} onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-700 uppercase">Safety Stock</label>
                    <input type="number" className={inputClass} value={formData.safetyStock} onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })} />
                </div>
            </div>

            {/* Row 4: Pricing */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mfg Cost</label>
                    <input type="number" className={inputClass} value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><FaRupeeSign /> Selling Price</label>
                    <input type="number" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-bold text-emerald-900 outline-none" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} required />
                </div>
            </div>

            {/* BOM */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between mb-4">
                    <label className="font-bold text-slate-700 flex items-center gap-2"><FiLayers /> Recipe (Bill of Materials)</label>
                    <button type="button" onClick={addBomItem} className="text-sm font-bold text-blue-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">+ Add Material</button>
                </div>
                {formData.bom.map((item, index) => (
                    <div key={index} className="flex gap-4 mb-3 items-center">
                        <select className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900" value={item.material} onChange={(e) => updateBom(index, "material", e.target.value)}>
                            {materials.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                        </select>
                        <input type="number" placeholder="Qty" className="w-32 bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 text-center" value={item.qtyRequired} onChange={(e) => updateBom(index, "qtyRequired", e.target.value)} />
                        <button type="button" onClick={() => { const newBom = formData.bom.filter((_, i) => i !== index); setFormData({ ...formData, bom: newBom }); }} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><FiTrash2 /></button>
                    </div>
                ))}
            </div>

            <button className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                <FiSave /> {initialData ? 'Update Product' : 'Save Product Master'}
            </button>

            {/* Quick Add Modal (Nested) */}
            {showModal && (
                /* ... (Keep existing Quick Add Modal code) ... */
                <div className="absolute inset-0 bg-white/95 z-[70] flex items-center justify-center rounded-3xl">
                    <div className="w-full max-w-sm p-6 text-center">
                        <h3 className="font-bold text-lg mb-4">Add New {showModal}</h3>
                        <input autoFocus className="w-full p-3 border rounded-xl mb-4" value={newItemValue} onChange={(e) => setNewItemValue(e.target.value)} />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                            <button type="button" onClick={handleQuickAdd} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Add</button>
                        </div>
                    </div>
                </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}