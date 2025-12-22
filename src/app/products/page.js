"use client";
import { useState, useEffect } from "react";
import AuthGuard from '@/components/AuthGuard';
import { 
  FiPlus, FiTrash2, FiLayers, FiTag, FiBox, 
  FiEdit3, FiSearch, FiX, FiEye
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';
import ProductForm from "@/components/ProductForm";

export default function ProductMasterPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  
  // 🟢 NEW STATE: Track which product's BOM is being viewed
  const [viewBomProduct, setViewBomProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/products");
      // 🟢 FILTER: Ensure we only show Finished Goods
      const finishedGoods = res.data.filter(p => p.category !== 'Raw Material');
      setProducts(finishedGoods);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete product?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (error) {
      alert("Error deleting product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // 🟢 CLIENT-SIDE FILTERING
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard requiredPermission="products">
    <div className="space-y-6 animate-in fade-in duration-500 bg-white min-h-screen p-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Product Master</h1>
          <p className="text-slate-500 mt-2 text-sm">Central repository for Finished Goods & Inventory.</p>
        </div>
        
        <div className="flex gap-2">
            <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search SKU, Name..." 
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-bold outline-none w-64 focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button
              onClick={() => { setEditingProduct(null); setShowForm(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
            >
              <FiPlus /> New Product
            </button>
        </div>
      </div>

      {/* 🟢 PRODUCT FORM MODAL */}
      {showForm && (
        <ProductForm 
            initialData={editingProduct} 
            onClose={handleCloseForm} 
            onSuccess={() => {
                handleCloseForm();
                fetchData();
            }} 
        />
      )}

      {/* 🟢 BOM VIEW POPUP MODAL */}
      {viewBomProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Recipe / BOM Details</h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{viewBomProduct.name} ({viewBomProduct.sku})</p>
                    </div>
                    <button onClick={() => setViewBomProduct(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX className="text-slate-500" />
                    </button>
                </div>
                
                <div className="p-0 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                                <th className="px-6 py-3 border-b border-slate-100">Material Name</th>
                                <th className="px-6 py-3 border-b border-slate-100 text-right">Required Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {viewBomProduct.bom && viewBomProduct.bom.length > 0 ? (
                                viewBomProduct.bom.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-700">
                                            {item.material?.name || "Unknown Material"}
                                            <div className="text-[10px] text-slate-400 font-normal">
                                                In Stock: {item.material?.stock?.current || 0} {item.material?.unit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                                            {item.qtyRequired}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="px-6 py-8 text-center text-slate-400 italic">
                                        No recipe defined for this product.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                </div>
            </div>
        </div>
      )}

      {/* 🟢 EXCEL-LIKE TABULAR VIEW */}
      <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-300">
                    <tr>
                        <th className="p-4 font-bold border-r border-slate-200 w-32">SKU</th>
                        <th className="p-4 font-bold border-r border-slate-200">Product Name</th>
                        <th className="p-4 font-bold border-r border-slate-200">Category</th>
                        <th className="p-4 font-bold border-r border-slate-200">Variants</th>
                        <th className="p-4 font-bold border-r border-slate-200 w-32 text-center">Recipe (BOM)</th>
                        <th className="p-4 font-bold border-r border-slate-200 text-right">Selling Price</th>
                        <th className="p-4 font-bold border-r border-slate-200 text-right bg-blue-50 text-blue-800">Live Stock</th>
                        <th className="p-4 font-bold text-center w-24">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {filteredProducts.length === 0 ? (
                         <tr><td colSpan="8" className="p-8 text-center text-slate-400 font-medium">No Finished Goods found.</td></tr>
                    ) : (
                        filteredProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 border-r border-slate-200 font-mono font-bold text-slate-600 align-middle">
                                    {product.sku}
                                </td>
                                <td className="p-4 border-r border-slate-200 align-middle">
                                    <div className="font-bold text-slate-800">{product.name}</div>
                                </td>
                                <td className="p-4 border-r border-slate-200 text-slate-600 align-middle">
                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        {product.category}
                                    </span>
                                    {product.subCategory && <div className="text-xs mt-1 text-slate-400">{product.subCategory}</div>}
                                </td>
                                <td className="p-4 border-r border-slate-200 align-middle">
                                    <div className="flex flex-col gap-1 text-xs">
                                        {product.color && (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <span className="w-2 h-2 rounded-full bg-slate-400"></span> {product.color}
                                            </span>
                                        )}
                                        {product.fabricType && <span className="text-slate-400 italic">{product.fabricType}</span>}
                                    </div>
                                </td>
                                
                                {/* 🟢 BOM BUTTON COLUMN */}
                                <td className="p-4 border-r border-slate-200 align-middle text-center">
                                    <button 
                                        onClick={() => setViewBomProduct(product)}
                                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto transition-colors"
                                    >
                                        <FiLayers size={14} /> View BOM
                                    </button>
                                </td>

                                <td className="p-4 border-r border-slate-200 text-right align-middle">
                                    <div className="font-bold text-emerald-600">₹{product.sellingPrice?.toLocaleString() ?? "0"}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">Cost: ₹{product.costPerUnit?.toLocaleString() ?? "0"}</div>
                                </td>
                                <td className="p-4 border-r border-slate-200 text-right bg-blue-50/30 align-middle">
                                    <div className="font-black text-slate-900">{product.stock?.warehouse ?? 0}</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Units</div>
                                </td>
                                <td className="p-4 text-center align-middle">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Product"
                                        >
                                            <FiEdit3 />
                                        </button>
                                        <button 
                                            onClick={() => deleteProduct(product._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Product"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}