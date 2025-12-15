"use client";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiPackage,
  FiCalendar,
  FiUser,
  FiMinus,
  FiSave,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";

// --- Sub-Component: Order Item Row ---
const OrderItemRow = ({
  index,
  item,
  onChange,
  onRemove,
  isOnlyItem,
  productList,
}) => {
  return (
    <div className="group flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 relative">
      <span className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 font-mono">
        {index + 1}
      </span>
      <div className="flex-grow w-full sm:w-auto relative">
        <label className="sr-only">Product Name</label>
        <div className="relative">
          <input
            list={`product-list-${index}`}
            type="text"
            value={item.productName}
            onChange={(e) => onChange(index, "productName", e.target.value)}
            placeholder="Search product name..."
            className="w-full bg-transparent border-0 border-b border-slate-200 px-0 py-2 pl-8 text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:border-blue-600 transition-colors font-bold"
            required
          />
          <FiSearch className="absolute left-0 top-3 text-slate-400" />
        </div>
        <datalist id={`product-list-${index}`}>
          {productList.map((prod) => (
            <option key={prod._id} value={prod.name}>
              Category: {prod.category} | Price: ${prod.sellingPrice || 0}
            </option>
          ))}
        </datalist>
      </div>
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() =>
            onChange(
              index,
              "qtyOrdered",
              Math.max(1, Number(item.qtyOrdered) - 1)
            )
          }
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200"
        >
          <FiMinus size={14} />
        </button>
        <input
          type="number"
          value={item.qtyOrdered}
          onChange={(e) =>
            onChange(index, "qtyOrdered", Number(e.target.value))
          }
          className="w-16 text-center border-none bg-white p-0 text-sm font-semibold text-slate-700 focus:ring-0 appearance-none"
          min="1"
          required
        />
        <button
          type="button"
          onClick={() =>
            onChange(index, "qtyOrdered", Number(item.qtyOrdered) + 1)
          }
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200"
        >
          <FiPlus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={isOnlyItem}
        className={`p-2 rounded-lg transition-colors ml-0 sm:ml-2 ${
          isOnlyItem
            ? "text-slate-200 cursor-not-allowed"
            : "text-slate-400 hover:text-red-600 hover:bg-red-50"
        }`}
      >
        <FiTrash2 size={18} />
      </button>
    </div>
  );
};

export default function NewOrderPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    customerName: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    priority: "Medium",
    items: [{ productName: "", qtyOrdered: 1 }],
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:2121/api/products");
        setProducts(res.data);
      } catch (error) {
        console.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const totalUnits = useMemo(() => {
    return formData.items.reduce(
      (acc, curr) => acc + (Number(curr.qtyOrdered) || 0),
      0
    );
  }, [formData.items]);

  const handleHeaderChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };
  const addItem = () =>
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productName: "", qtyOrdered: 1 }],
    }));
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      const res = await axios.post(
        "http://localhost:2121/api/sales/orders",
        formData
      );
      if (res.data.success) {
        setStatus({
          type: "success",
          msg: `Order #${res.data.order.orderId} Created Successfully`,
        });
        setFormData({
          customerName: "",
          deliveryDate: new Date().toISOString().split("T")[0],
          priority: "Medium",
          items: [{ productName: "", qtyOrdered: 1 }],
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      setStatus({
        type: "error",
        msg: error.response?.data?.msg || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            New Sales Order
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg">
            Generate a new demand order.
          </p>
        </div>
        {status.msg && (
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center shadow-sm ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {status.type === "success" ? (
              <FiCheckCircle className="mr-2 text-lg" />
            ) : (
              <FiAlertCircle className="mr-2 text-lg" />
            )}{" "}
            {status.msg}
          </div>
        )}
      </header>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="group mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleHeaderChange}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div className="group mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleHeaderChange}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                required
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Low", "Medium", "High"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                      formData.priority === p
                        ? p === "High"
                          ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500"
                          : "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg sticky top-6">
            <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">
              Order Summary
            </h4>
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-3xl font-bold">
                  {formData.items.length}
                </div>
                <div className="text-slate-400 text-sm">Unique Products</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-300">
                  {totalUnits}
                </div>
                <div className="text-slate-400 text-sm">Total Units</div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <FiSave size={18} /> Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3">
                  <FiPackage size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Order Items</h3>
                  <p className="text-xs text-slate-400">
                    Search for products from your Master List.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all hover:pr-6"
              >
                <FiPlus className="transition-transform group-hover:rotate-90" />{" "}
                Add Item
              </button>
            </div>
            <div className="space-y-4 flex-grow">
              {formData.items.map((item, index) => (
                <OrderItemRow
                  key={index}
                  index={index}
                  item={item}
                  onChange={handleItemChange}
                  onRemove={removeItem}
                  isOnlyItem={formData.items.length === 1}
                  productList={products}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
