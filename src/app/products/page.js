"use client";
import { useState, useEffect } from "react";
import AuthGuard from '@/components/AuthGuard';
import { FiPlus, FiTrash2, FiLayers, FiTag, FiBox } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';
import ProductForm from "@/components/ProductForm"; // 🟢 Import the new Component

export default function ProductMasterPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
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

  return (
    <AuthGuard requiredPermission="products">
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Product Master</h1>
          <p className="text-slate-500 mt-2 text-sm">Define finished goods, prices, and recipes.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200"
        >
          <FiPlus /> New Product
        </button>
      </div>

      {/* 🟢 REPLACED HUGE FORM WITH COMPONENT */}
      {showForm && (
        <ProductForm 
            onClose={() => setShowForm(false)} 
            onSuccess={() => {
                setShowForm(false);
                fetchData();
            }} 
        />
      )}

      {/* Product List (Kept as is) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
            <button onClick={() => deleteProduct(product._id)} className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"><FiTrash2 /></button>
            <div className="flex justify-between items-start mb-2 pr-8">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{product.sku}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{product.category}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">{product.name}</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              {product.subCategory && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1"><FiBox size={10} /> {product.subCategory}</span>}
              {product.fabricType && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1"><FiLayers size={10} /> {product.fabricType}</span>}
              {product.color && <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1"><FiTag size={10} /> {product.color}</span>}
            </div>
            <div className="flex justify-between items-end border-t border-slate-50 pt-4 mb-4">
              <div><p className="text-[10px] font-bold uppercase text-slate-400">Inventory</p><p className="text-xl font-black text-slate-900">{product.stock?.warehouse ?? 0}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold uppercase text-slate-400">Price</p><div className="text-emerald-600 font-black text-xl">₹{product.sellingPrice ?? "0"}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AuthGuard>
  );
}