"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiUser,
  FiBox,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";

// 🟢 1. INTERNAL COMPONENT
function NewQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(false);

  // Data from DB
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    clientId: "", // Empty if new client
    clientName: "",
    clientAddress: "",
    clientGst: "",
    subject: "",
    salesPerson: "Admin",
    items: [
      {
        name: "",
        category: "",
        subCategory: "",
        fabricType: "",
        color: "",
        description: "",
        qty: 1,
        rate: 0,
        gstPercent: 0,
      },
    ],
    terms: {
      delivery: "Schedule to be finalized at the time of PO.",
      payment: "45% Advance, Balance before Dispatch.",
      validity: "30 Days",
    },
  });

  // Fetch Master Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          api.get("/sales/clients?limit=1000"),
          api.get("/products"),
        ]);

        // Handle Paginated vs Array Response
        let clientList = [];
        if (Array.isArray(clientsRes.data)) {
          clientList = clientsRes.data;
        } else {
          clientList = clientsRes.data.data || [];
        }
        setClients(clientList);
        setProducts(productsRes.data);

        // AUTO-SYNC LOGIC (For "Quote" button from Client List)
        if (preSelectedClientId && clientList.length > 0) {
          const foundClient = clientList.find(
            (c) => String(c._id) === String(preSelectedClientId)
          );

          if (foundClient) {
            setFormData((prev) => ({
              ...prev,
              clientId: foundClient._id,
              clientName: foundClient.name,
              clientAddress: foundClient.billToAddress || foundClient.address,
              clientGst: foundClient.gstNumber || "",
              terms: {
                ...prev.terms,
                payment: foundClient.paymentTerms || prev.terms.payment,
              },
            }));
          }
        }

        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setFormData((prev) => ({ ...prev, salesPerson: user.name }));
        }
      } catch (error) {
        console.error("Error loading data", error);
      }
    };
    fetchData();
  }, [preSelectedClientId]);

  // 🟢 HYBRID CLIENT HANDLER (Select or Type New)
  const handleClientNameChange = (e) => {
    const val = e.target.value;
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === val.toLowerCase()
    );

    if (matchedClient) {
      // Existing Client Found -> Auto-fill
      setFormData((prev) => ({
        ...prev,
        clientId: matchedClient._id,
        clientName: matchedClient.name,
        clientAddress:
          matchedClient.billToAddress || matchedClient.address || "",
        clientGst: matchedClient.gstNumber || "",
        terms: {
          ...prev.terms,
          payment: matchedClient.paymentTerms || prev.terms.payment,
        },
      }));
    } else {
      // New Client Typed -> Allow editing address/GST, Clear ID
      setFormData((prev) => ({
        ...prev,
        clientId: "", // Backend will create new client if this is empty
        clientName: val,
        clientAddress: "", // User must type this for new client
        clientGst: "", // User must type this for new client
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (field === "name") {
      const product = products.find((p) => p.name === value);
      if (product) {
        newItems[index].category = product.category || "";
        newItems[index].subCategory = product.subCategory || "";
        newItems[index].fabricType = product.fabricType || "";
        newItems[index].color = product.color || "";
        newItems[index].rate = product.sellingPrice || 0;
        newItems[index].description = product.description || "";
      }
    }

    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          category: "",
          subCategory: "",
          fabricType: "",
          color: "",
          description: "",
          qty: 1,
          rate: 0,
          gstPercent: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const totals = useMemo(() => {
    let subTotal = 0;
    formData.items.forEach((item) => {
      const lineTotal = Number(item.qty) * Number(item.rate);
      subTotal += lineTotal;
    });
    return { subTotal, grandTotal: subTotal };
  }, [formData.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Safety check for New Clients
    if (!formData.clientId && !formData.clientAddress) {
      alert("For a New Client, please enter the Billing Address.");
      setLoading(false);
      return;
    }

    try {
      // 🟢 Send payload (if clientId is empty, backend creates new client)
      await api.post("/sales/quotes", formData);
      alert("✅ Quotation Generated & Client Saved Successfully!");
      router.push("/sales/quotes");
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20 p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
        >
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            New Quotation
          </h1>
          <p className="text-slate-500 text-sm">
            Create a price estimate for a client.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: CLIENT DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FiUser />
            </div>
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Customer Name
              </label>
              {/* 🟢 HYBRID INPUT: Select OR Type */}
              <input
                list="client-list"
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:font-normal"
                onChange={handleClientNameChange}
                value={formData.clientName}
                placeholder="Search existing or type new client name..."
                required
              />
              <datalist id="client-list">
                {clients.map((client) => (
                  <option key={client._id} value={client.name}>
                    {client.gstNumber ? `GST: ${client.gstNumber}` : "Lead"}
                  </option>
                ))}
              </datalist>
              {!formData.clientId && formData.clientName && (
                <p className="text-xs text-green-600 mt-1 font-bold">
                  ✨ New Client: Will be saved to Master automatically.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Billing Address
              </label>
              <textarea
                value={formData.clientAddress}
                onChange={(e) =>
                  setFormData({ ...formData, clientAddress: e.target.value })
                }
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 resize-none focus:ring-2 focus:ring-blue-100 outline-none"
                rows="3"
                placeholder="Enter Address..."
                required // Required if new client
              ></textarea>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.clientGst}
                  onChange={(e) =>
                    setFormData({ ...formData, clientGst: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Enter GST..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Subject / Title
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="e.g. Quote for 500kg Wire Fencing"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ITEMS TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FiBox />
              </div>
              Line Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-6">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Product
                    </label>
                    <input
                      list={`product-list-${index}`}
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Search product..."
                      required
                    />
                    <datalist id={`product-list-${index}`}>
                      {products.map((p) => (
                        <option key={p._id} value={p.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Category
                      </label>
                      <input
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                        value={item.category}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Sub-Cat
                      </label>
                      <input
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                        value={item.subCategory}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Fabric
                      </label>
                      <input
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                        value={item.fabricType}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Color
                      </label>
                      <input
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                        value={item.color}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-grow">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                      placeholder="Add custom notes..."
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      onChange={(e) =>
                        handleItemChange(index, "qty", e.target.value)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-center font-bold"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={item.rate}
                      min="0"
                      step="0.01"
                      onChange={(e) =>
                        handleItemChange(index, "rate", e.target.value)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-right font-mono"
                      required
                    />
                  </div>
                  <div className="w-32 text-right pb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Total
                    </label>
                    <div className="text-sm font-black text-slate-700 font-mono">
                      ₹{(item.qty * item.rate).toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-[1px]"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>₹{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TERMS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FiFileText />
            </div>
            Terms & Conditions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.terms.payment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, payment: e.target.value },
                  })
                }
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Delivery Schedule
              </label>
              <input
                type="text"
                value={formData.terms.delivery}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, delivery: e.target.value },
                  })
                }
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Price Validity
              </label>
              <input
                type="text"
                value={formData.terms.validity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    terms: { ...formData.terms, validity: e.target.value },
                  })
                }
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="bottom-4 z-10">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.99] flex justify-center items-center gap-2"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <FiSave size={20} /> Generate Quotation PDF
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-slate-400">Loading...</div>
      }
    >
      <NewQuoteContent />
    </Suspense>
  );
}
