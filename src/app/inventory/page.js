"use client";

import { useEffect, useState, useMemo } from "react";

import {
  FiPlus,
  FiBox,
  FiLayers,
  FiX,
  FiClipboard,
  FiEdit3,
  FiPackage,
  FiCalendar,
  FiActivity,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import AddMaterialModal from "./AddMaterialModal";

import ProductForm from "@/components/ProductForm";

import ViewRecipeModal from "./ViewRecipeModal";

import api from "@/utils/api";

import AuthGuard from "@/components/AuthGuard";

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);

  const [recalcLoading, setRecalcLoading] = useState(false);

  const [modalMode, setModalMode] = useState("NONE");

  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState(null);

  // 🟢 Edit States

  const [editingProduct, setEditingProduct] = useState(null);

  const [editingMaterial, setEditingMaterial] = useState(null); // New State for RM

  const [viewStockItem, setViewStockItem] = useState(null);

  const [rawMaterials, setRawMaterials] = useState([]);

  const [products, setProducts] = useState([]);

  const [filterType, setFilterType] = useState("ALL");

  const [filterHealth, setFilterHealth] = useState("ALL");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);

    try {
      const [matRes, prodRes] = await Promise.all([
        api.get("/inventory/stock"),

        api.get("/products"),
      ]);

      setRawMaterials(matRes.data);

      setProducts(prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (
      !confirm(
        "This will update Health Status for all items based on the new formula. Proceed?"
      )
    )
      return;

    setRecalcLoading(true);

    try {
      await api.post("/inventory/recalculate");

      alert("✅ System Updated! All items recalculated.");

      fetchStock();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setRecalcLoading(false);
    }
  };

  const unifiedData = useMemo(() => {
    const formattedRM = rawMaterials.map((m) => ({
      ...m,
      type: "Raw Material",
      status: m.status || "UNKNOWN",
    }));

    const formattedFG = products.map((p) => ({
      ...p,
      type: "Finished Good",
      status: p.status || "UNKNOWN",
      bom: p.bom,
    }));

    let combined = [...formattedRM, ...formattedFG];

    combined = combined.map((i) => {
      const currentStock = i.stock?.current || i.stock?.warehouse || 0;
        
      const totalSFG = i.stock?.semiFinished?.reduce((sum, lot) => sum + (lot.qty || 0), 0) || 0;
      const targetStock = i.stockAtLeast || i.safetyStock || 1;

      const healthRatio = (currentStock / targetStock) * 100;

      return {
        _id: i._id,

        idDisplay: i.materialId || i.sku,

        name: i.name,

        type: i.type,

        unit: i.unit || "PCS",

        current: currentStock,
        sfgStock: totalSFG,

        reserved: i.stock?.reserved || 0,

        stockAtLeast: targetStock,

        health: healthRatio,

        status: i.status,

        bom: i.bom,

        batches: i.stock?.batches || [],

        original: i,
      };
    });

    // Filters

    if (filterType !== "ALL")
      combined = combined.filter((i) =>
        filterType === "RM"
          ? i.type === "Raw Material"
          : i.type === "Finished Good"
      );

    if (filterHealth !== "ALL")
      combined = combined.filter((i) => i.status === filterHealth);

    // Search Filter

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();

      combined = combined.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.idDisplay.toLowerCase().includes(query) ||
          i.type.toLowerCase().includes(query)
      );
    }

    return combined;
  }, [rawMaterials, products, filterType, filterHealth, searchQuery]);

  const getStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : "UNKNOWN";

    if (s === "CRITICAL")
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
          CRITICAL
        </span>
      );

    if (s === "MEDIUM")
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-100">
          MEDIUM
        </span>
      );

    if (s === "OPTIMAL")
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
          OPTIMAL
        </span>
      );

    if (s === "EXCESS")
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100">
          EXCESS
        </span>
      );

    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">
        {s}
      </span>
    );
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product.original);

    setModalMode("ADD_FG");
  };

  // 🟢 NEW: Handle Edit Material

  const handleEditMaterial = (material) => {
    setEditingMaterial(material.original);

    setModalMode("ADD_RM");
  };

  // 🟢 NEW: Close Handler to reset edit state

  const handleCloseRMModal = () => {
    setModalMode("NONE");

    setEditingMaterial(null);
  };

  return (
    <AuthGuard requiredPermission="inventory">
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header & Filters */}

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Master Inventory
            </h1>

            <p className="text-slate-500 mt-2 text-sm font-medium">
              Unified view of Raw Materials & Finished Goods.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalcLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              <FiRefreshCw className={recalcLoading ? "animate-spin" : ""} />

              {recalcLoading ? "Fixing Data..." : "Refresh Health"}
            </button>

            <button
              onClick={() => {
                setEditingProduct(null);
                setEditingMaterial(null);
                setModalMode("SELECTION");
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <FiPlus /> Add Item
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-end gap-6">
          <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">
            {/* Search Filter UI */}

            <div className="w-full md:w-64">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Search Item
              </label>

              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Name, SKU or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Item Type
              </label>

              <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden w-fit">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`px-5 py-2.5 text-sm font-bold border-r ${
                    filterType === "ALL"
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-50"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilterType("RM")}
                  className={`px-5 py-2.5 text-sm font-bold border-r ${
                    filterType === "RM"
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Raw
                </button>

                <button
                  onClick={() => setFilterType("FG")}
                  className={`px-5 py-2.5 text-sm font-bold ${
                    filterType === "FG"
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-50"
                  }`}
                >
                  FG
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Health Status
            </label>

            <div className="flex rounded-lg overflow-hidden w-fit shadow-sm">
              <button
                onClick={() => setFilterHealth("ALL")}
                className={`px-4 py-2 text-xs font-bold text-white ${
                  filterHealth === "ALL" ? "bg-slate-600" : "bg-slate-400"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setFilterHealth("CRITICAL")}
                className={`px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 ${
                  filterHealth === "CRITICAL" ? "ring-2 ring-red-300" : ""
                }`}
              >
                Critical
              </button>

              <button
                onClick={() => setFilterHealth("MEDIUM")}
                className={`px-4 py-2 text-xs font-bold text-white bg-amber-400 hover:bg-amber-500 ${
                  filterHealth === "MEDIUM" ? "ring-2 ring-amber-300" : ""
                }`}
              >
                Medium
              </button>

              <button
                onClick={() => setFilterHealth("OPTIMAL")}
                className={`px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 ${
                  filterHealth === "OPTIMAL" ? "ring-2 ring-emerald-300" : ""
                }`}
              >
                Optimal
              </button>

              <button
                onClick={() => setFilterHealth("EXCESS")}
                className={`px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 ${
                  filterHealth === "EXCESS" ? "ring-2 ring-purple-300" : ""
                }`}
              >
                Excess
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4 w-64">Item Details</th>

                <th className="px-6 py-4">Type</th>

                <th className="px-6 py-4">Stock</th>

                <th className="px-6 py-4 bg-slate-100/50 border-l border-slate-200">
                  Stock At Least
                </th>

                <th className="px-6 py-4 bg-slate-100/50 w-48">Health %</th>

                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {unifiedData.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-800">
                        {item.name}
                      </div>

                      {/* 🟢 Finished Good Edit */}

                      {item.type === "Finished Good" && (
                        <button
                          onClick={() => handleEditProduct(item)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Edit Product"
                        >
                          <FiEdit3 size={14} />
                        </button>
                      )}

                      {/* 🟢 NEW: Raw Material Edit */}

                      {item.type === "Raw Material" && (
                        <button
                          onClick={() => handleEditMaterial(item)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Edit Material"
                        >
                          <FiEdit3 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {item.idDisplay}
                    </div>

                    {item.type === "Finished Good" && (
                      <button
                        onClick={() => setSelectedRecipeProduct(item)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <FiClipboard size={10} /> View BOM
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {item.type === "Raw Material" ? (
                      <span className="text-xs font-bold text-slate-500 flex gap-1">
                        <FiBox /> RM
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex gap-1 w-fit">
                        <FiLayers /> FG
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-slate-700 text-lg">
                      {Number(item.current).toFixed(2)}{" "}
                      <span className="text-[10px] text-slate-400 font-bold">
                        {item.unit}
                      </span>
                    </div>

                    {item.batches && item.batches.length > 0 && (
                      <button
                        onClick={() => setViewStockItem(item)}
                        className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1 bg-blue-50 px-1.5 py-0.5 rounded w-fit"
                      >
                        <FiPackage size={10} /> View Lots
                      </button>
                    )}
                  </td>

                  {/* Stock At Least */}

                  <td className="px-6 py-4 font-mono font-bold text-slate-500 bg-slate-50/50 border-l border-slate-100">
                    {Number(item.stockAtLeast).toFixed(2)}
                  </td>

                  {/* Health % */}

                  <td className="px-6 py-4 bg-slate-50/50">
                    <div className="w-full">
                      <div className="flex justify-between items-end mb-1">
                        <span
                          className={`text-xs font-black ${
                            item.health <= 33
                              ? "text-red-600"
                              : item.health <= 66
                              ? "text-amber-500"
                              : item.health <= 100
                              ? "text-emerald-600"
                              : "text-purple-600"
                          }`}
                        >
                          {item.health.toFixed(2)}%
                        </span>

                        {item.health <= 33 && (
                          <FiActivity
                            className="text-red-500 animate-pulse"
                            size={12}
                          />
                        )}
                      </div>

                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.health <= 33
                              ? "bg-red-500"
                              : item.health <= 66
                              ? "bg-amber-400"
                              : item.health <= 100
                              ? "bg-emerald-500"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${Math.min(item.health, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {unifiedData.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400 font-medium">
              Inventory is empty or no items match your search.
            </div>
          )}
        </div>

        {modalMode === "SELECTION" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in zoom-in-95">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
              <button
                onClick={() => setModalMode("NONE")}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <FiX size={24} />
              </button>

              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Add New Item
              </h3>

              <p className="text-slate-500 mb-8">
                What type of item are you adding to inventory?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModalMode("ADD_RM")}
                  className="p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FiBox size={24} />
                  </div>

                  <h4 className="font-bold text-slate-900 text-lg">
                    Raw Material
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Fabric, buttons, thread, ink, etc.
                  </p>
                </button>

                <button
                  onClick={() => setModalMode("ADD_FG")}
                  className="p-6 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FiLayers size={24} />
                  </div>

                  <h4 className="font-bold text-slate-900 text-lg">
                    Finished Good
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Products, garments, complete sets.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🟢 NEW: Pass initialData to AddMaterialModal for editing */}

        {modalMode === "ADD_RM" && (
          <AddMaterialModal
            initialData={editingMaterial}
            onClose={handleCloseRMModal}
            onSuccess={() => {
              handleCloseRMModal();
              fetchStock();
            }}
          />
        )}

        {modalMode === "ADD_FG" && (
          <ProductForm
            initialData={editingProduct}
            onClose={() => {
              setModalMode("NONE");
              setEditingProduct(null);
            }}
            onSuccess={() => {
              setModalMode("NONE");
              setEditingProduct(null);
              fetchStock();
            }}
          />
        )}

        {selectedRecipeProduct && (
          <ViewRecipeModal
            product={selectedRecipeProduct}
            onClose={() => setSelectedRecipeProduct(null)}
          />
        )}

        {viewStockItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <FiPackage className="text-blue-600" /> Batch / Lot Details
                  </h3>

                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    {viewStockItem.name}
                  </p>
                </div>

                <button
                  onClick={() => setViewStockItem(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <FiX />
                </button>
              </div>

              <div className="p-0 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-6 py-3 border-b border-slate-100">
                        Lot Number
                      </th>

                      <th className="px-6 py-3 border-b border-slate-100">
                        Date Added
                      </th>

                      <th className="px-6 py-3 border-b border-slate-100 text-right">
                        Quantity
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {viewStockItem.batches &&
                    viewStockItem.batches.length > 0 ? (
                      viewStockItem.batches.map((batch, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-mono text-xs font-bold text-blue-600 bg-blue-50/30">
                            {batch.lotNumber}
                          </td>

                          <td className="px-6 py-3 text-xs text-slate-500 flex items-center gap-1">
                            <FiCalendar size={10} />{" "}
                            {new Date(
                              batch.addedAt || Date.now()
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-3 text-right font-black text-slate-800">
                            {batch.qty}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-8 text-center text-slate-400 italic"
                        >
                          No active batches found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 text-right flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Total Physical
                </span>

                <span className="text-xl font-black text-slate-900">
                  {Number(viewStockItem.current).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
