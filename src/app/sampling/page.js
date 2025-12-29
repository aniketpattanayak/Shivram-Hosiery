"use client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import api from "@/utils/api";
import {
  FiScissors,
  FiCheckCircle,
  FiPlus,
  FiBox,
  FiArrowRight,
  FiTag,
  FiLayers,
  FiSearch,
  FiMessageSquare,
  FiList,
  FiX,
  FiInfo,
} from "react-icons/fi";

// --- SUB-COMPONENT 1: CREATE SAMPLE MODAL (Preserving all your original logic) ---
const CreateSampleModal = ({
  onClose,
  onSuccess,
  products,
  materials,
  masterCategories,
}) => {
  const [type, setType] = useState("New Design");
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    description: "",
    originalProductId: "",
    category: "",
    subCategory: "",
    fabricType: "",
    color: "",
  });

  const [manualBom, setManualBom] = useState([
    { material: "", qtyRequired: "" },
  ]);

  // 🟢 LINKED LOGIC: Filter sub-categories based on selected category
  const filteredSubCats = useMemo(() => {
    if (!formData.category || !masterCategories) return [];
    const selectedCat = masterCategories.find(
      (c) => c.name === formData.category
    );
    return selectedCat ? selectedCat.subCategories : [];
  }, [formData.category, masterCategories]);

  const addRow = () =>
    setManualBom([...manualBom, { material: "", qtyRequired: "" }]);

  const handleBomChange = (index, field, value) => {
    const newBom = [...manualBom];
    newBom[index][field] = value;
    setManualBom(newBom);
  };

  const handleSubmit = async () => {
    if (!formData.name) return alert("Name is required");
    const payload = {
      ...formData,
      type,
      manualBom: type === "New Design" ? manualBom : [],
    };
    if (payload.originalProductId === "") delete payload.originalProductId;
    try {
      await api.post("/sampling", payload);
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
          <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">
            Create New Sample
          </h3>
          <button onClick={onClose}>
            <FiX
              className="text-slate-400 hover:text-red-500 transition-colors"
              size={20}
            />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setType("New Design")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                type === "New Design"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500"
              }`}
            >
              New Design (R&D)
            </button>
            <button
              onClick={() => setType("Existing Product")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                type === "Existing Product"
                  ? "bg-white shadow text-purple-600"
                  : "text-slate-500"
              }`}
            >
              Modify Existing
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">
              Sample Name
            </label>
            <input
              className="w-full border border-slate-200 p-2.5 rounded-lg font-bold mt-1 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. Summer Floral Dress V1"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {type === "New Design" && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {/* 🟢 DYNAMIC CATEGORY SELECT */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Category
                </label>
                <select
                  className="w-full border p-2 rounded-lg text-sm font-bold mt-1"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      subCategory: "",
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {masterCategories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🟢 DYNAMIC SUB-CATEGORY SELECT */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Sub-Category
                </label>
                <select
                  className="w-full border p-2 rounded-lg text-sm font-bold mt-1"
                  value={formData.subCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subCategory: e.target.value })
                  }
                  disabled={!formData.category}
                >
                  <option value="">Select Sub-Cat</option>
                  {filteredSubCats.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Fabric Type
                </label>
                <input
                  className="w-full border p-2 rounded-lg mt-1 text-sm font-bold"
                  placeholder="e.g. Cotton"
                  value={formData.fabricType}
                  onChange={(e) =>
                    setFormData({ ...formData, fabricType: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Color
                </label>
                <input
                  className="w-full border p-2 rounded-lg mt-1 text-sm font-bold"
                  placeholder="e.g. Red"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* BOM logic fully preserved */}
          {type === "New Design" && (
            <div className="bg-white border border-slate-200 p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Rough BOM Builder
                </label>
                <button
                  onClick={addRow}
                  className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded"
                >
                  + Add Row
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto pr-1">
                {manualBom.map((row, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      className="flex-1 border p-1.5 rounded-lg text-xs font-bold"
                      value={row.material}
                      onChange={(e) =>
                        handleBomChange(idx, "material", e.target.value)
                      }
                    >
                      <option value="">- Material -</option>
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="w-16 border p-1.5 rounded-lg text-xs font-bold"
                      placeholder="Qty"
                      value={row.qtyRequired}
                      onChange={(e) =>
                        handleBomChange(idx, "qtyRequired", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">
                Client
              </label>
              <input
                className="w-full border border-slate-200 p-2.5 rounded-lg mt-1 text-sm font-bold"
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">
                Description
              </label>
              <input
                className="w-full border border-slate-200 p-2.5 rounded-lg mt-1 text-sm font-bold"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 shadow-xl transition-all uppercase text-xs"
          >
            Create R&D Sample
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT 2: REMARKS MODAL ---
const RemarksModal = ({ isOpen, onClose, onConfirm, nextStage }) => {
  const [remarks, setRemarks] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg mb-2 uppercase">
          Transition to {nextStage}
        </h3>
        <p className="text-[10px] text-slate-500 mb-4 font-black uppercase">
          Record Production Feedback
        </p>
        <textarea
          className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-2 ring-blue-100 h-28 font-medium"
          placeholder="e.g. Fabric is cutting well, needle size 14 used for stitching..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-[10px]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(remarks);
              setRemarks("");
            }}
            className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px]"
          >
            Confirm & Save
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
  const [masterCategories, setMasterCategories] = useState([]); // 🟢 For Linked Dropdowns
  const [showModal, setShowModal] = useState(false);
  const [viewBomId, setViewBomId] = useState(null);
  const [remarksModal, setRemarksModal] = useState({
    isOpen: false,
    sample: null,
    nextStage: "",
  });

  const stages = ["Design", "Cutting", "Stitching", "Packaging", "Approved"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, pRes, mRes, cRes] = await Promise.all([
        api.get("/sampling"),
        api.get("/products"),
        api.get("/inventory/stock"),
        api.get("/master/categories"),
      ]);
      setSamples(sRes.data);
      setProducts(pRes.data);
      setMaterials(mRes.data);
      setMasterCategories(cRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextStageTrigger = (sample) => {
    const currentIndex = stages.indexOf(sample.status);
    if (currentIndex >= stages.length - 1) return;
    const nextStage = stages[currentIndex + 1];
    if (sample.status === "Design" && !sample.materialsIssued)
      return alert("⚠️ Please ISSUE MATERIALS first.");
    setRemarksModal({ isOpen: true, sample, nextStage });
  };

  const handleStatusUpdate = async (remarks) => {
    const { sample, nextStage } = remarksModal;
    try {
      // 🟢 API call now includes 'remarks'
      await api.put("/sampling/status", {
        sampleId: sample._id,
        status: nextStage,
        remarks,
      });
      setRemarksModal({ isOpen: false, sample: null, nextStage: "" });
      fetchData();
    } catch (e) {
      alert("Error updating status");
    }
  };

  const handleIssueMaterial = async (sampleId) => {
    if (!confirm("Issue materials and deduct stock?")) return;
    try {
      await api.post("/sampling/issue", { sampleId });
      alert("✅ Materials Issued!");
      fetchData();
    } catch (e) {
      alert("Error: " + e.response?.data?.msg);
    }
  };

  const handleConvert = async (sampleId) => {
    const price = prompt("Enter Final Selling Price:");
    if (!price) return;
    try {
      await api.post("/sampling/convert", { sampleId, finalPrice: price });
      alert("🎉 Successfully converted to Master Product!");
      fetchData();
    } catch (e) {
      alert("Error: " + e.response?.data?.msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in h-[calc(100vh-100px)] flex flex-col p-6">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            Sampling Production
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Row-wise prototype management.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl uppercase text-xs tracking-widest"
        >
          <FiPlus /> New Sample
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Sample & specs</th>
                <th className="px-6 py-4">BOM / Material Names</th>
                <th className="px-6 py-4 text-center">Progress</th>
                <th className="px-6 py-4">Latest Remarks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map((sample) => (
                <tr
                  key={sample._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {sample.sampleId}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {sample.name}
                    </div>

                    {/* 🟢 SPEC BADGES (Linked Category, Sub, Fabric, Color) */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sample.category && (
                        <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded uppercase border border-slate-200">
                          {sample.category}
                        </span>
                      )}
                      {sample.subCategory && (
                        <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded uppercase border border-slate-200">
                          {sample.subCategory}
                        </span>
                      )}
                      {sample.fabricType && (
                        <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase border border-blue-100">
                          {sample.fabricType}
                        </span>
                      )}
                      {sample.color && (
                        <span className="text-[8px] font-black bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded uppercase border border-purple-100">
                          {sample.color}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        setViewBomId(
                          viewBomId === sample._id ? null : sample._id
                        )
                      }
                      className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-blue-600 bg-slate-100 px-3 py-1.5 rounded-lg border uppercase"
                    >
                      <FiList size={14} /> BOM List
                    </button>
                    {viewBomId === sample._id && (
                      <div className="mt-2 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in slide-in-from-top-1 w-64">
                        {(sample.manualBom || sample.bom || []).map((b, i) => {
                          {
                            /* 🟢 FIXED: Mapping Material Name from Inventory State */
                          }
                          const matId = b.material?._id || b.material;
                          const matObj = materials.find((m) => m._id === matId);
                          return (
                            <div
                              key={i}
                              className="text-[9px] font-bold text-slate-500 flex justify-between gap-4 border-b last:border-0 pb-1"
                            >
                              <span className="truncate w-40">
                                {matObj?.name || "Loading Material..."}
                              </span>
                              <span className="text-blue-600 font-black">
                                {b.qtyRequired}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4">
                      {stages.map((st, idx) => (
                        <div
                          key={st}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className={`w-3 h-3 rounded-full border-2 ${
                              stages.indexOf(sample.status) >= idx
                                ? "bg-emerald-500 border-emerald-500"
                                : "bg-white border-slate-200"
                            }`}
                          />
                          <span
                            className={`text-[8px] font-black uppercase ${
                              sample.status === st
                                ? "text-blue-600"
                                : "text-slate-300"
                            }`}
                          >
                            {st}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-[10px] text-slate-500 italic max-w-[250px]">
                    {sample.remarks ? (
                      <div className="flex items-start gap-2">
                        <FiMessageSquare
                          className="text-blue-400 mt-1 flex-shrink-0"
                          size={12}
                        />
                        <p className="line-clamp-3">{sample.remarks}</p>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {sample.status === "Design" &&
                        !sample.materialsIssued && (
                          <button
                            onClick={() => handleIssueMaterial(sample._id)}
                            className="bg-amber-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg uppercase"
                          >
                            Issue Mat
                          </button>
                        )}
                      {sample.status === "Approved" &&
                      !sample.convertedProductId ? (
                        <button
                          onClick={() => handleConvert(sample._id)}
                          className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg uppercase"
                        >
                          Make Product
                        </button>
                      ) : sample.convertedProductId ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                          PRODUCT READY
                        </span>
                      ) : (
                        <button
                          onClick={() => handleNextStageTrigger(sample)}
                          className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg uppercase flex items-center gap-1"
                        >
                          Next Step <FiArrowRight />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RemarksModal
        isOpen={remarksModal.isOpen}
        onClose={() => setRemarksModal({ ...remarksModal, isOpen: false })}
        onConfirm={handleStatusUpdate}
        nextStage={remarksModal.nextStage}
      />
      {showModal && (
        <CreateSampleModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData();
          }}
          products={products}
          materials={materials}
          masterCategories={masterCategories}
        />
      )}
    </div>
  );
}
