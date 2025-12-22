"use client";
import { FiX, FiLayers, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function ViewRecipeModal({ product, onClose }) {
  // If backend populate worked, item.material is an object. 
  // If not, it might be an ID string (safety check).
  const bom = product.bom || [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <FiLayers className="text-blue-600" /> {product.name}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
              BOM of 1 Unit • SKU: {product.idDisplay}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto custom-scrollbar">
          {bom.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
              No recipe (BOM) defined for this product.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-3">Raw Material</th>
                  <th className="px-6 py-3 text-right">Qty / Unit</th>
                  <th className="px-6 py-3 text-right">Available Stock</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bom.map((item, idx) => {
                  const matName = item.material?.name || "Unknown Material";
                  const matUnit = item.material?.unit || "Units";
                  const qtyReq = item.qtyRequired || 0;
                  
                  // 🟢 STOCK CHECK LOGIC
                  // Note: item.material might be populated with stock data from the backend
                  const currentStock = item.material?.stock?.current || 0;
                  const isLow = currentStock < qtyReq;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-bold text-slate-700">
                        {matName}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-slate-600">
                        {qtyReq} <span className="text-xs text-slate-400">{matUnit}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-bold">
                        {currentStock}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                            <FiAlertCircle /> Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            <FiCheckCircle /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
           This recipe defines the raw materials deducted when you produce 1 unit of {product.name}.
        </div>
      </div>
    </div>
  );
}