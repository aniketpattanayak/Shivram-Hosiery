"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FiX, FiSave, FiPlus } from "react-icons/fi";
import api from '@/utils/api';

export default function AddMaterialModal({ onClose, onSuccess }) {
  // 🟢 Form Data State
  const [formData, setFormData] = useState({
    materialId: "",
    name: "",
    materialType: "",
    unit: "",
    reorderLevel: 100,
    costPerUnit: 0,
    openingStock: 0,
    batchNumber: "",
    // 🟢 NEW FIELDS: PLANNING METRICS
    avgConsumption: 0,
    leadTime: 0,
    safetyStock: 0,
  });

  // 🟢 Dynamic Data State
  const [materialTypes, setMaterialTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟢 Quick Add Modal State
  const [showQuickAdd, setShowQuickAdd] = useState(null);
  const [newItemValue, setNewItemValue] = useState("");

  // 1. Fetch Dynamic Lists on Load
  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const res = await api.get(
        "/master/attributes"
      );
      const allAttrs = res.data;
      setMaterialTypes(allAttrs.materialType || ["Fabric", "Thread"]);
      setUnits(allAttrs.unit || ["MTR", "KG", "PCS"]);
    } catch (error) {
      console.error("Error fetching attributes", error);
    }
  };

  // 2. Handle Quick Add Submission
  const handleQuickAddSubmit = async () => {
    if (!newItemValue.trim()) return;
    try {
      const res = await api.post(
        "/master/attributes",
        {
          type: showQuickAdd,
          value: newItemValue,
        }
      );

      if (showQuickAdd === "materialType") {
        setMaterialTypes([...materialTypes, res.data.value]);
        setFormData({ ...formData, materialType: res.data.value });
      } else {
        setUnits([...units, res.data.value]);
        setFormData({ ...formData, unit: res.data.value });
      }

      closeQuickAdd();
    } catch (error) {
      alert("Failed to add item. It might already exist.");
    }
  };

  const closeQuickAdd = () => {
    setShowQuickAdd(null);
    setNewItemValue("");
  };

  // 3. Handle Main Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.materialId ||
      !formData.name ||
      !formData.materialType ||
      !formData.unit
    ) {
      return alert("Please fill all required fields");
    }

    setLoading(true);
    try {
      await api.post(
        "/inventory/materials",
        formData
      );
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.msg || "Error adding material");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      {/* MAIN MODAL */}
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Add Raw Material</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: ID & Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Material ID
              </label>
              <input
                className="w-full border-slate-200 bg-slate-50 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                placeholder="RM-001"
                value={formData.materialId}
                onChange={(e) =>
                  setFormData({ ...formData, materialId: e.target.value })
                }
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Material Name
              </label>
              <input
                className="w-full border-slate-200 rounded-lg p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                placeholder="e.g. Red Cotton Fabric"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Row 2: Type & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mt-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Material Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd("materialType")}
                  className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <FiPlus /> Add New
                </button>
              </div>
              <select
                className="w-full border-slate-200 rounded-lg p-3 text-sm mt-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.materialType}
                onChange={(e) =>
                  setFormData({ ...formData, materialType: e.target.value })
                }
                required
              >
                <option value="">Select Type</option>
                {materialTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mt-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Unit (UOM)
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd("unit")}
                  className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <FiPlus /> Add New
                </button>
              </div>
              <select
                className="w-full border-slate-200 rounded-lg p-3 text-sm mt-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              >
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🟢 NEW ROW 3: PLANNING METRICS (Consumption, Lead Time, Safety) */}
          <div className="grid grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Avg. Consump.
              </label>
              <input
                type="number"
                className="w-full border-blue-200 rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.avgConsumption}
                onChange={(e) =>
                  setFormData({ ...formData, avgConsumption: e.target.value })
                }
                placeholder="Daily Qty"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Lead Time
              </label>
              <input
                type="number"
                className="w-full border-blue-200 rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.leadTime}
                onChange={(e) =>
                  setFormData({ ...formData, leadTime: e.target.value })
                }
                placeholder="Days"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Safety Stock
              </label>
              <input
                type="number"
                className="w-full border-blue-200 rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.safetyStock}
                onChange={(e) =>
                  setFormData({ ...formData, safetyStock: e.target.value })
                }
                placeholder="Buffer Qty"
              />
            </div>
          </div>

          {/* Row 4: Opening Stock & Cost */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                Opening Stock
              </label>
              <input
                type="number"
                className="w-full border-emerald-200 bg-emerald-50 rounded-lg p-3 text-sm font-bold text-emerald-900 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.openingStock}
                onChange={(e) =>
                  setFormData({ ...formData, openingStock: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                Batch / Lot No.
              </label>
              <input
                type="text"
                className="w-full border-emerald-200 bg-emerald-50 rounded-lg p-3 text-sm font-bold text-emerald-900 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                placeholder="e.g. OPENING-01"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Cost Per Unit
              </label>
              <input
                type="number"
                className="w-full border-slate-200 rounded-lg p-3 text-sm font-semibold mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.costPerUnit}
                onChange={(e) =>
                  setFormData({ ...formData, costPerUnit: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <FiSave /> Save Material
              </>
            )}
          </button>
        </form>

        {/* Quick Add Modal Overlay */}
        {showQuickAdd && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
            <div className="bg-white p-5 rounded-xl shadow-2xl border border-slate-200 w-64 animate-in zoom-in-95 duration-200 ring-4 ring-slate-50">
              <h4 className="font-bold text-slate-800 mb-3 text-sm">
                Add New {showQuickAdd === "materialType" ? "Type" : "Unit"}
              </h4>
              <input
                autoFocus
                className="w-full border border-slate-300 rounded-lg p-2 text-sm mb-3 outline-none focus:border-blue-500"
                placeholder="Enter value..."
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={closeQuickAdd}
                  className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAddSubmit}
                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
