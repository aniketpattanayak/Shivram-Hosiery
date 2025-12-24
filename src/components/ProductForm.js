"use client";
import { useState, useEffect } from "react";
import {
  FiPlus, FiTrash2, FiLayers, FiTag, FiBox, FiX, FiSave, FiEdit3
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';

export default function ProductForm({ onClose, onSuccess, initialData = null }) {
  
  // --- STATE ---
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [availableSubCats, setAvailableSubCats] = useState([]);
  
  // 🟢 NEW: Quick Add States
  const [showModal, setShowModal] = useState(null); // 'CATEGORY', 'SUBCAT', 'FABRIC', 'COLOR'
  const [newItemValue, setNewItemValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    name: "", sku: "", category: "", subCategory: "", fabricType: "", color: "",
    costPerUnit: "", sellingPrice: "", 
    avgConsumption: "", leadTime: "", safetyStock: "",
    bom: [],
  });

  // --- FETCH DATA ---
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

        if (initialData) {
            const formattedBom = (initialData.bom || []).map(b => ({
                material: b.material?._id || b.material, 
                qtyRequired: b.qtyRequired
            }));

            setFormData({
                name: initialData.name || "",
                sku: initialData.idDisplay || initialData.sku || "",
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

            if (initialData.category) {
                const selectedCat = catRes.data.find(c => c.name === initialData.category);
                setAvailableSubCats(selectedCat ? selectedCat.subCategories : []);
            }
        }
      } catch (error) { console.error("Error loading master data", error); }
    };
    init();
  }, [initialData]);

  // --- HANDLERS ---
  const handleCategoryChange = (e) => {
    const catName = e.target.value;
    const selectedCat = categories.find((c) => c.name === catName);
    setFormData({ ...formData, category: catName, subCategory: "" });
    setAvailableSubCats(selectedCat ? selectedCat.subCategories : []);
  };

  const addBomItem = () => {
    if (materials.length === 0) return alert("No materials found!");
    setFormData({ ...formData, bom: [...formData.bom, { material: materials[0]?._id, qtyRequired: 1 }] });
  };

  const updateBom = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index][field] = value;
    setFormData({ ...formData, bom: newBom });
  };

  // 🟢 NEW: HANDLE DYNAMIC MASTER ADDITION
  const handleQuickAdd = async () => {
    if (!newItemValue.trim()) return;
    setIsAdding(true);

    try {
        let response;
        // 1. ADD NEW CATEGORY
        if (showModal === 'CATEGORY') {
            response = await api.post("/master/categories", { name: newItemValue, subCategories: [] });
            setCategories([...categories, response.data]); 
            setFormData(prev => ({ ...prev, category: newItemValue, subCategory: "" }));
            setAvailableSubCats([]);
        } 
        
        // 2. ADD NEW SUB-CATEGORY (Requires Category to be selected first)
        else if (showModal === 'SUBCAT') {
            const currentCat = categories.find(c => c.name === formData.category);
            if (!currentCat) throw new Error("Select a Category first.");
            
            // We assume backend has an endpoint to push subcategory, usually a PUT on the category
            const updatedSubs = [...currentCat.subCategories, newItemValue];
            await api.put(`/master/categories/${currentCat._id}`, { subCategories: updatedSubs });
            
            // Update local state
            const updatedCats = categories.map(c => c._id === currentCat._id ? { ...c, subCategories: updatedSubs } : c);
            setCategories(updatedCats);
            setAvailableSubCats(updatedSubs);
            setFormData(prev => ({ ...prev, subCategory: newItemValue }));
        } 
        
        // 3. ADD NEW FABRIC OR COLOR (Using Attributes Master)
        else if (showModal === 'FABRIC' || showModal === 'COLOR') {
            const type = showModal === 'FABRIC' ? 'fabric' : 'color';
            // Assuming endpoint accepts { type: 'fabric', value: 'Silk' }
            await api.post("/master/attributes", { type, value: newItemValue });
            
            if (type === 'fabric') {
                setFabrics([...fabrics, newItemValue]);
                setFormData(prev => ({ ...prev, fabricType: newItemValue }));
            } else {
                setColors([...colors, newItemValue]);
                setFormData(prev => ({ ...prev, color: newItemValue }));
            }
        }

        alert(`${showModal} Added Successfully!`);
        setShowModal(null);
        setNewItemValue("");

    } catch (error) {
        alert("Failed to add: " + (error.response?.data?.msg || error.message));
    } finally {
        setIsAdding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku) return alert("SKU is required");
    try {
      if (initialData) {
        await api.put(`/products/${initialData._id}`, formData);
        alert("Product Updated Successfully!");
      } else {
        await api.post("/products", formData);
        alert("Product Created Successfully!");
      }
      onSuccess(); 
    } catch (error) {
      alert(error.response?.data?.msg || error.message);
    }
  };

  const inputClass = "w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400";
  const labelClass = "text-xs font-bold text-slate-500 uppercase flex justify-between items-center";

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
            
            {/* Row 1: Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Product Name</label>
                <input type="text" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>SKU Code</label>
                <input type="text" className={inputClass} value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
              </div>
            </div>

            {/* Row 2: Dynamic Details with Quick Add */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
               
               {/* 🟢 CATEGORY */}
               <div className="space-y-2">
                <label className={labelClass}>
                    Category 
                    <button type="button" onClick={() => setShowModal('CATEGORY')} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><FiPlus/></button>
                </label>
                <select className={inputClass} value={formData.category} onChange={handleCategoryChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* 🟢 SUB-CATEGORY */}
              <div className="space-y-2">
                <label className={labelClass}>
                    Sub-Category
                    <button type="button" onClick={() => { 
                        if(!formData.category) return alert("Select Category First"); 
                        setShowModal('SUBCAT'); 
                    }} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><FiPlus/></button>
                </label>
                <select className={inputClass} value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} disabled={!formData.category}>
                  <option value="">Select Sub</option>
                  {availableSubCats.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              {/* 🟢 FABRIC */}
              <div className="space-y-2">
                <label className={labelClass}>
                    Fabric
                    <button type="button" onClick={() => setShowModal('FABRIC')} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><FiPlus/></button>
                </label>
                <select className={inputClass} value={formData.fabricType} onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}>
                  <option value="">Select Fabric</option>
                  {fabrics.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* 🟢 COLOR */}
              <div className="space-y-2">
                <label className={labelClass}>
                    Color
                    <button type="button" onClick={() => setShowModal('COLOR')} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><FiPlus/></button>
                </label>
                <select className={inputClass} value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}>
                  <option value="">Select Color</option>
                  {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Planning Metrics */}
            <div className="grid grid-cols-3 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-700 uppercase">Avg. Daily Consumption (ADC)</label>
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

            {/* 🟢 QUICK ADD MODAL */}
            {showModal && (
                <div className="absolute inset-0 bg-white/95 z-[70] flex items-center justify-center rounded-3xl animate-in zoom-in-95">
                    <div className="w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiPlus size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">
                            Add New {showModal === 'SUBCAT' ? 'Sub-Category' : showModal.charAt(0) + showModal.slice(1).toLowerCase()}
                        </h3>
                        {showModal === 'SUBCAT' && <p className="text-xs text-slate-500 mb-4">Adding to: <strong>{formData.category}</strong></p>}
                        
                        <input 
                            autoFocus 
                            className="w-full p-3 border border-slate-300 rounded-xl mb-4 font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder={`Enter Name...`}
                            value={newItemValue} 
                            onChange={(e) => setNewItemValue(e.target.value)} 
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => { setShowModal(null); setNewItemValue(""); }} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500 hover:bg-slate-200">Cancel</button>
                            <button type="button" disabled={isAdding} onClick={handleQuickAdd} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                                {isAdding ? "Saving..." : "Save & Select"}
                            </button>
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