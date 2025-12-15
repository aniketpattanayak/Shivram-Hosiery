"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiLayers,
  FiTag,
  FiBox,
  FiX, // Added for Modal
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';

export default function ProductMasterPage() {
  // --- EXISTING STATE ---
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // --- 🟢 NEW DYNAMIC MASTER STATE ---
  const [categories, setCategories] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);
  const [availableSubCats, setAvailableSubCats] = useState([]);

  // --- 🟢 QUICK ADD MODAL STATE ---
  const [showModal, setShowModal] = useState(null); // 'category', 'subCategory', 'fabric', 'color'
  const [newItemValue, setNewItemValue] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "", // Changed default to empty to force selection
    subCategory: "",
    fabricType: "",
    color: "",
    costPerUnit: "",
    sellingPrice: "",
    bom: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 🟢 Updated to fetch Products, Stock, Categories, and Attributes
      const [prodRes, matRes, catRes, attrRes] = await Promise.all([
        api.get("/products"),
        api.get("/inventory/stock"),
        api.get("/master/categories"),
        api.get("/master/attributes"),
      ]);

      setProducts(prodRes.data);
      setMaterials(matRes.data);
      setCategories(catRes.data);
      setFabrics(attrRes.data.fabric || []);
      setColors(attrRes.data.color || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      alert("Product Deleted");
      fetchData();
    } catch (error) {
      alert(
        "Error deleting product: " +
          (error.response?.data?.msg || error.message)
      );
    }
  };

  // --- 🟢 DYNAMIC HANDLERS ---

  // Handle Category Change to filter Sub-Categories
  const handleCategoryChange = (e) => {
    const catName = e.target.value;
    const selectedCat = categories.find((c) => c.name === catName);

    setFormData({ ...formData, category: catName, subCategory: "" }); // Reset SubCat
    setAvailableSubCats(selectedCat ? selectedCat.subCategories : []);
  };

  // Handle Quick Add Submission (Popup)
  const handleQuickAdd = async () => {
    if (!newItemValue.trim()) return;
    try {
      if (showModal === "category") {
        const res = await api.post(
          "/master/categories",
          { name: newItemValue }
        );
        setCategories([...categories, res.data]);
        setFormData({ ...formData, category: newItemValue, subCategory: "" });
        setAvailableSubCats([]);
      } else if (showModal === "subCategory") {
        const currentCat = categories.find((c) => c.name === formData.category);
        if (!currentCat) return alert("Select a Category first");

        const res = await api.post(
          "/master/categories/sub",
          {
            categoryId: currentCat._id,
            subCategory: newItemValue,
          }
        );

        // Update local state
        const updatedCats = categories.map((c) =>
          c._id === res.data._id ? res.data : c
        );
        setCategories(updatedCats);
        setAvailableSubCats(res.data.subCategories);
        setFormData({ ...formData, subCategory: newItemValue });
      } else if (showModal === "fabric") {
        const res = await api.post(
          "/master/attributes",
          { type: "fabric", value: newItemValue }
        );
        setFabrics([...fabrics, res.data.value]);
        setFormData({ ...formData, fabricType: newItemValue });
      } else if (showModal === "color") {
        const res = await api.post(
          "/master/attributes",
          { type: "color", value: newItemValue }
        );
        setColors([...colors, res.data.value]);
        setFormData({ ...formData, color: newItemValue });
      }

      closeModal();
    } catch (error) {
      alert("Failed to add item");
    }
  };

  const closeModal = () => {
    setShowModal(null);
    setNewItemValue("");
  };

  // --- EXISTING HANDLERS ---

  const addBomItem = () => {
    if (materials.length === 0)
      return alert("No materials found! Add materials in Inventory first.");
    setFormData({
      ...formData,
      bom: [...formData.bom, { material: materials[0]?._id, qtyRequired: 1 }],
    });
  };

  const updateBom = (index, field, value) => {
    const newBom = [...formData.bom];
    newBom[index][field] = value;
    setFormData({ ...formData, bom: newBom });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sku) return alert("SKU is required");

    try {
      await api.post("/products", formData);
      alert("Product Created Successfully!");
      setShowForm(false);
      setFormData({
        name: "",
        sku: "",
        category: "",
        subCategory: "",
        fabricType: "",
        color: "",
        costPerUnit: "",
        sellingPrice: "",
        bom: [],
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.msg || error.message);
    }
  };

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Product Master
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Define finished goods, prices, and recipes.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
        >
          <FiPlus /> {showForm ? "Cancel" : "New Product"}
        </button>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <h3 className="font-bold text-xl mb-6 text-slate-800">
            Define New Product
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {/* Row 1: Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slim Fit Polo"
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  SKU Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. POLO-001"
                  className={inputClass}
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Row 2: DYNAMIC Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Category */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModal("category")}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <FiPlus /> Add New
                  </button>
                </div>
                <select
                  className={inputClass}
                  value={formData.category}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Category */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Sub-Category
                  </label>
                  {formData.category && (
                    <button
                      type="button"
                      onClick={() => setShowModal("subCategory")}
                      className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <FiPlus /> Add New
                    </button>
                  )}
                </div>
                <select
                  className={inputClass}
                  value={formData.subCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subCategory: e.target.value })
                  }
                  disabled={!formData.category}
                >
                  <option value="">Select Sub-Category</option>
                  {availableSubCats.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fabric Type */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Fabric Type
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModal("fabric")}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <FiPlus /> Add New
                  </button>
                </div>
                <select
                  className={inputClass}
                  value={formData.fabricType}
                  onChange={(e) =>
                    setFormData({ ...formData, fabricType: e.target.value })
                  }
                >
                  <option value="">Select Fabric</option>
                  {fabrics.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Color
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModal("color")}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <FiPlus /> Add New
                  </button>
                </div>
                <select
                  className={inputClass}
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                >
                  <option value="">Select Color</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Mfg Cost (Per Unit)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className={inputClass}
                  value={formData.costPerUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, costPerUnit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                  <FaRupeeSign />
                  Selling Price
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* BOM SECTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex justify-between mb-4">
                <label className="font-bold text-slate-700 flex items-center gap-2">
                  <FiLayers /> Recipe (Bill of Materials)
                </label>
                <button
                  type="button"
                  onClick={addBomItem}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm"
                >
                  + Add Material
                </button>
              </div>

              {formData.bom.length === 0 && (
                <p className="text-sm text-slate-400 italic">
                  No materials added yet. Click "+ Add Material" to define
                  recipe.
                </p>
              )}

              {formData.bom.map((item, index) => (
                <div key={index} className="flex gap-4 mb-3 items-center">
                  <select
                    className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900"
                    value={item.material}
                    onChange={(e) =>
                      updateBom(index, "material", e.target.value)
                    }
                  >
                    {materials.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} (
                        {m.costPerUnit ? `₹${m.costPerUnit}` : "No Cost"})
                      </option>
                    ))}
                  </select>
                  <div className="relative w-32">
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 text-center"
                      value={item.qtyRequired}
                      onChange={(e) =>
                        updateBom(index, "qtyRequired", e.target.value)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBom = formData.bom.filter((_, i) => i !== index);
                      setFormData({ ...formData, bom: newBom });
                    }}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99]">
              Save Product Master
            </button>

            {/* 🟢 QUICK ADD POPUP MODAL */}
            {showModal && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm ring-4 ring-slate-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 capitalize">
                      Add New {showModal}
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    placeholder={`Enter new ${showModal} name...`}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAdd}
                      className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* PRODUCT LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group"
          >
            {/* DELETE BUTTON */}
            <button
              onClick={() => deleteProduct(product._id)}
              className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
              title="Delete Product"
            >
              <FiTrash2 />
            </button>

            <div className="flex justify-between items-start mb-2 pr-8">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                {product.sku}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {product.category}
              </span>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-2">
              {product.name}
            </h3>

            {/* DETAILS TAGS */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {product.subCategory && (
                <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                  <FiBox size={10} /> {product.subCategory}
                </span>
              )}
              {product.fabricType && (
                <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                  <FiLayers size={10} /> {product.fabricType}
                </span>
              )}
              {product.color && (
                <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                  <FiTag size={10} /> {product.color}
                </span>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-slate-50 pt-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Inventory
                </p>
                <p className="text-xl font-black text-slate-900">
                  {product.stock?.warehouse ?? 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Price
                </p>
                <div className="text-emerald-600 font-black text-xl">
                  ₹{product.sellingPrice ?? "0"}
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                BOM Overview
              </p>
              {product.bom && product.bom.length > 0 ? (
                product.bom.slice(0, 2).map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs text-slate-600"
                  >
                    <span>{b.material?.name || "Unknown"}</span>
                    <span className="font-bold">
                      {b.qtyRequired} {b.material?.unit}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No recipe defined
                </p>
              )}
              {product.bom && product.bom.length > 2 && (
                <p className="text-[10px] text-blue-500 font-bold">
                  +{product.bom.length - 2} more items...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
