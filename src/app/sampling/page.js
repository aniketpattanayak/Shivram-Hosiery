'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/utils/api';
import { 
  FiScissors, FiCheckCircle, FiPlus, FiBox, FiArrowRight, FiTag, FiLayers 
} from 'react-icons/fi';

// --- SUB-COMPONENT: CREATE SAMPLE MODAL ---
const CreateSampleModal = ({ onClose, onSuccess, products, materials }) => {
  const [type, setType] = useState('New Design'); 
  const [formData, setFormData] = useState({
    name: '', 
    client: '', 
    description: '', 
    originalProductId: '',
    // NEW FIELDS
    category: 'Men',
    subCategory: '',
    fabricType: '',
    color: ''
  });
  
  const [manualBom, setManualBom] = useState([{ material: '', qtyRequired: '' }]);

  const addRow = () => setManualBom([...manualBom, { material: '', qtyRequired: '' }]);
  
  const handleBomChange = (index, field, value) => {
      const newBom = [...manualBom];
      newBom[index][field] = value;
      setManualBom(newBom);
  };

  const handleSubmit = async () => {
    if(!formData.name) return alert("Name is required");
    
    // Prepare data payload
    const payload = {
        ...formData,
        type,
        manualBom: type === 'New Design' ? manualBom : [] 
    };

    // 🚨 FIX: Remove originalProductId if it's empty
    if (payload.originalProductId === "") {
        delete payload.originalProductId;
    }

    try {
        await api.post('/sampling', payload);
        alert("Sample Created! 🧪");
        onSuccess();
    } catch (error) {
        alert("Error: " + (error.response?.data?.msg || error.message));
    }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Create New Sample</h3>
            <button onClick={onClose}><FiPlus className="rotate-45 text-slate-400"/></button>
        </div>
        
        <div className="p-6 space-y-4">
            {/* Type Toggle */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setType('New Design')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${type === 'New Design' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>New Design (R&D)</button>
                <button onClick={() => setType('Existing Product')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${type === 'Existing Product' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}>Modify Existing</button>
            </div>

            {/* --- COMMON FIELDS --- */}
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sample Name</label>
                <input className="w-full border border-slate-200 p-2.5 rounded-lg font-bold mt-1 text-sm outline-none focus:border-blue-500" placeholder="e.g. Summer Floral Dress V1" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            </div>

            {/* --- MODIFY EXISTING SPECIFIC --- */}
            {type === 'Existing Product' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
                     <div>
                        <label className="text-xs font-bold text-purple-700 uppercase">Select Base Product</label>
                        <select 
                            className="w-full border border-purple-200 p-2.5 rounded-lg mt-1 text-sm bg-white font-medium" 
                            value={formData.originalProductId} 
                            onChange={e=>setFormData({...formData, originalProductId: e.target.value})}
                        >
                            <option value="">-- Choose Master Product --</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} — (SKU: {p.sku || 'N/A'})
                                </option>
                            ))}
                        </select>
                     </div>
                     
                     {/* Allow changing color for modification */}
                     <div>
                        <label className="text-xs font-bold text-purple-700 uppercase">New Variant Color</label>
                        <input className="w-full border border-purple-200 p-2.5 rounded-lg mt-1 text-sm" placeholder="e.g. Red (Original was Blue)" value={formData.color} onChange={e=>setFormData({...formData, color: e.target.value})} />
                    </div>
                </div>
            )}

            {/* --- NEW DESIGN SPECIFIC FIELDS --- */}
            {type === 'New Design' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                        <select className="w-full border p-2 rounded-lg mt-1 text-sm" value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})}>
                            <option>Men</option>
                            <option>Women</option>
                            <option>Kids</option>
                            <option>Unisex</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Sub-Category</label>
                        <input className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="e.g. Shirt / Pant" value={formData.subCategory} onChange={e=>setFormData({...formData, subCategory: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Fabric Type</label>
                        <input className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="e.g. Cotton 60s" value={formData.fabricType} onChange={e=>setFormData({...formData, fabricType: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                        <input className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="e.g. Navy Blue" value={formData.color} onChange={e=>setFormData({...formData, color: e.target.value})} />
                    </div>
                </div>
            )}

            {/* --- BOM BUILDER (Only for New Design) --- */}
            {type === 'New Design' && (
                <div className="bg-white border border-slate-200 p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Rough Bill of Materials</label>
                        <button onClick={addRow} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">+ Add Material</button>
                    </div>
                    <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {manualBom.map((row, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select className="flex-1 border p-1.5 rounded-lg text-xs bg-slate-50" value={row.material} onChange={e => handleBomChange(idx, 'material', e.target.value)}>
                                    <option value="">- Material -</option>
                                    {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                </select>
                                <input type="number" className="w-20 border p-1.5 rounded-lg text-xs bg-slate-50" placeholder="Qty" value={row.qtyRequired} onChange={e => handleBomChange(idx, 'qtyRequired', e.target.value)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- GENERIC INFO --- */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Client (Optional)</label>
                    <input className="w-full border border-slate-200 p-2.5 rounded-lg mt-1 text-sm" placeholder="e.g. Zara" value={formData.client} onChange={e=>setFormData({...formData, client: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Notes / Desc</label>
                    <input className="w-full border border-slate-200 p-2.5 rounded-lg mt-1 text-sm" placeholder="Details..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
                </div>
            </div>

            <button onClick={handleSubmit} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-transform active:scale-[0.98]">
                Create Sample
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function SamplingPage() {
  const [samples, setSamples] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const stages = ['Design', 'Pattern', 'Cutting', 'Stitching', 'Finishing', 'Review', 'Approved'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [sRes, pRes, mRes] = await Promise.all([
            api.get('/sampling'),
            api.get('/products'),
            api.get('/inventory/stock') 
        ]);
        setSamples(sRes.data);
        setProducts(pRes.data);
        setMaterials(mRes.data);
    } catch (e) { console.error(e); }
  };

  const handleNextStage = async (sample) => {
      const currentIndex = stages.indexOf(sample.status);
      if (currentIndex >= stages.length - 1) return;
      const nextStage = stages[currentIndex + 1];
      
      if (sample.status === 'Pattern' && !sample.materialsIssued) {
          return alert("⚠️ You must ISSUE MATERIALS before moving to Cutting.");
      }

      try {
          await api.put('/sampling/status', { sampleId: sample._id, status: nextStage });
          fetchData();
      } catch (e) { alert("Error moving stage"); }
  };

  const handleIssueMaterial = async (sampleId) => {
      if(!confirm("Deduct materials from Main Inventory?")) return;
      try {
          await api.post('/sampling/issue', { sampleId });
          alert("Materials Issued! Stock Deducted.");
          fetchData();
      } catch (e) { alert("Stock Error: " + e.response?.data?.msg); }
  };

  const handleConvert = async (sampleId) => {
      const price = prompt("Enter Final Selling Price for this new Product:");
      if(!price) return;
      
      try {
          await api.post('/sampling/convert', { sampleId, finalPrice: price });
          alert("🎉 Success! Sample converted to Product Master.");
          fetchData();
      } catch (e) { alert("Error: " + e.response?.data?.msg); }
  };

  return (
    <div className="space-y-6 animate-in fade-in h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Sampling & R&D</h1>
            <p className="text-slate-500 mt-2">Design, Prototype, and Approve new products.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200">
            <FiPlus /> Create Sample
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
            {stages.map(stage => (
                <div key={stage} className="w-72 flex flex-col bg-slate-100/80 rounded-2xl p-3 border border-slate-200/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <span className={`w-2 h-2 rounded-full ${stage === 'Approved' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                        <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{stage}</h4>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                            {samples.filter(s => s.status === stage).length}
                        </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                        {samples.filter(s => s.status === stage).map(sample => (
                            <div key={sample._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400">{sample.sampleId}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${sample.type === 'New Design' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                        {sample.type === 'New Design' ? 'NEW' : 'MOD'}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm">{sample.name}</h4>
                                
                                {/* Show Category Details on Card */}
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {sample.color && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1"><FiLayers size={8}/> {sample.color}</span>}
                                    {sample.fabricType && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1"><FiTag size={8}/> {sample.fabricType}</span>}
                                </div>

                                <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                                    {stage === 'Pattern' && !sample.materialsIssued && (
                                        <button onClick={() => handleIssueMaterial(sample._id)} className="flex-1 bg-amber-50 text-amber-700 text-xs font-bold py-2 rounded-lg hover:bg-amber-100 flex justify-center gap-1 items-center">
                                            <FiBox size={12}/> Issue Mat
                                        </button>
                                    )}

                                    {stage === 'Approved' && !sample.convertedProductId ? (
                                        <button onClick={() => handleConvert(sample._id)} className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 flex justify-center gap-1 items-center shadow-emerald-200 shadow-sm">
                                            <FiCheckCircle size={12}/> Make Product
                                        </button>
                                    ) : stage === 'Approved' && sample.convertedProductId ? (
                                        <div className="w-full text-center text-[10px] text-green-600 font-bold bg-green-50 py-2 rounded-lg border border-green-100">
                                            ✅ Product Created
                                        </div>
                                    ) : (
                                        <button onClick={() => handleNextStage(sample)} className="flex-1 bg-slate-50 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-colors flex justify-center gap-1 items-center">
                                            Next <FiArrowRight size={12}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {showModal && (
          <CreateSampleModal 
            onClose={() => setShowModal(false)} 
            onSuccess={() => { setShowModal(false); fetchData(); }}
            products={products}
            materials={materials}
          />
      )}
    </div>
  );
}