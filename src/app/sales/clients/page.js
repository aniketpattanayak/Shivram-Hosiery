"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import api from "@/utils/api";
import {
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiSave,
  FiSearch,
  FiPlus,
  FiActivity,
  FiX,
  FiBriefcase,
  FiEdit3,
  FiClock,
  FiBox,
  FiTrash2,
} from "react-icons/fi";
import Link from "next/link";

// SKELETON LOADER
const ClientSkeleton = () => (
  <tr className="animate-pulse border-b border-slate-100">
    <td className="p-4">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-1/3"></div>
    </td>
    <td className="p-4">
      <div className="h-6 bg-slate-200 rounded-full w-20"></div>
    </td>
    <td className="p-4">
      <div className="h-4 bg-slate-200 rounded w-24"></div>
    </td>
    <td className="p-4">
      <div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto"></div>
    </td>
  </tr>
);

// HISTORY MODAL
const HistoryModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;
  const history =
    client.activityLog?.sort((a, b) => new Date(b.date) - new Date(a.date)) ||
    [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Activity History</h3>
            <p className="text-xs text-slate-500">{client.name}</p>
          </div>
          <button onClick={onClose}>
            <FiX size={20} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 text-sm">
              No history found.
            </div>
          ) : (
            history.map((log, idx) => (
              <div
                key={idx}
                className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-1"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      {log.status}
                    </span>
                    <p className="text-sm font-medium text-slate-800 mt-1">
                      "{log.remark}"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1">
                        <FiUser size={10} /> {log.updatedBy || "Unknown"}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded uppercase">
                        {log.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 text-right">
                    {new Date(log.date).toLocaleDateString()}
                    <br />
                    {new Date(log.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ACTIVITY MODAL
const ActivityModal = ({ isOpen, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: "Call",
    status: "",
    remark: "",
  });
  useEffect(() => {
    if (client)
      setFormData((prev) => ({
        ...prev,
        status: client.status || "Interested",
      }));
  }, [client]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sales/clients/${client._id}`, {
        status: formData.status,
        lastActivity: { type: formData.type, remark: formData.remark },
      });
      alert(`✅ Status Updated`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error updating client activity.");
    }
  };
  if (!isOpen || !client) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Update Status</h3>
          </div>
          <button onClick={onClose}>
            <FiX size={20} className="text-slate-400 hover:text-red-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Client
            </label>
            <input
              value={client.name}
              disabled
              className="w-full mt-1 p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Type
              </label>
              <select
                className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option>Call</option>
                <option>Visit</option>
                <option>Email</option>
                <option>Whatsapp</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                New Status
              </label>
              <select
                className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm font-bold text-blue-600 bg-white"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option>Interested</option>
                <option>Approach</option>
                <option>Negotiation</option>
                <option value="Order Won">Order Won 🏆</option>
                <option value="Customer">Customer ✅</option>
                <option>Order Lost</option>
                <option>Cold Stage</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Remark
            </label>
            <textarea
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm"
              rows="3"
              value={formData.remark}
              onChange={(e) =>
                setFormData({ ...formData, remark: e.target.value })
              }
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg"
          >
            Save Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ClientsPage() {
  const router = useRouter();
  const [view, setView] = useState("list");

  // Data State
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Master Data
  const [masterProducts, setMasterProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [colors, setColors] = useState([]);

  // Pagination & Loading
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedClient, setSelectedClient] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    billToAddress: "",
    contactPerson: "",
    contactNumber: "",
    billingContact: "", // 🟢 Added for uniqueness validation
    email: "",
    paymentTerms: "30 Days",
    salesPerson: "",
    leadType: "Medium", 
    interestedProducts: [],
  });

  const observer = useRef();
  const lastClientRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  useEffect(() => {
    fetchStaticData();
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      if (parsed.role !== "Admin" && parsed.role !== "Manager") {
        setFormData((prev) => ({ ...prev, salesPerson: parsed.name }));
      }
    }
  }, []);

  const fetchStaticData = async () => {
    try {
      const [quotesRes, usersRes, catRes, attrRes, prodRes] = await Promise.all(
        [
          api.get("/sales/quotes"),
          api.get("/auth/users"),
          api.get("/master/categories"),
          api.get("/master/attributes"),
          api.get("/products"),
        ]
      );
      setQuotes(quotesRes.data || []);
      setUsersList(usersRes.data || []);
      setCategories(catRes.data || []);
      setFabrics(attrRes.data.fabric || []);
      setColors(attrRes.data.color || []);
      setMasterProducts(prodRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (page === 1) {
      setClients([]);
      fetchClients(1, true);
    } else {
      fetchClients(page, false);
    }
  }, [page, searchTerm]);

  const fetchClients = async (pageNum, isInitial) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await api.get(
        `/sales/clients?page=${pageNum}&limit=20&search=${searchTerm}`
      );
      let newData = [];
      let moreAvailable = false;
      if (Array.isArray(res.data)) {
        newData = res.data;
      } else {
        newData = res.data.data || [];
        moreAvailable = res.data.hasMore || false;
      }
      setClients((prev) => (pageNum === 1 ? newData : [...prev, ...newData]));
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Fetch Error:", error);
      setClients([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
    setHasMore(true);
  };
  const hasQuote = (clientId) => {
    return quotes.some(
      (q) => String(q.clientId || q.client) === String(clientId)
    );
  };

  const startEdit = (client) => {
    setFormData({
      name: client.name || "",
      gstNumber: client.gstNumber || "",
      address: client.address || "",
      billToAddress: client.billToAddress || "",
      contactPerson: client.contactPerson || "",
      contactNumber: client.contactNumber || "",
      billingContact: client.billingContact || "",
      email: client.email || "",
      paymentTerms: client.paymentTerms || "30 Days",
      salesPerson: client.salesPerson || "",
      leadType: client.leadType || "Medium", 
      interestedProducts: client.interestedProducts || [],
    });
    setIsEditMode(true);
    setEditingId(client._id);
    setView("add");
  };

  // 🟢 Validation Function Moved Inside Component
  const validateForm = () => {
    // 1. GST Validation
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (formData.gstNumber && !gstRegex.test(formData.gstNumber)) {
      alert("❌ Invalid GST Number format (e.g., 07AAAAA0000A1Z5)");
      return false;
    }

    // 2. Phone Number (10 Digits) Validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      alert("❌ Enter a valid 10-digit primary phone number starting with 6-9");
      return false;
    }

    // 3. Billing Phone Validation (if provided)
    if (formData.billingContact && !phoneRegex.test(formData.billingContact)) {
        alert("❌ Enter a valid 10-digit billing phone number starting with 6-9");
        return false;
    }

    // 4. Phone Uniqueness Check
    if (formData.billingContact && formData.contactNumber === formData.billingContact) {
        alert("❌ Primary Phone and Billing Phone cannot be the same.");
        return false;
    }

    // 5. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      alert("❌ Enter a valid Email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 🟢 Run Validations
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/sales/clients/${editingId}`, formData);
        alert("✅ Client Details Updated!");
      } else {
        await api.post("/sales/clients", formData);
        alert("✅ Customer Added!");
      }
      setView("list");
      setPage(1);
      fetchClients(1, true);
      resetForm();
    } catch (error) {
      alert("Error saving: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const defaultSalesPerson =
      currentUser?.role === "Admin" || currentUser?.role === "Manager"
        ? ""
        : currentUser?.name;
    setFormData({
      name: "",
      gstNumber: "",
      address: "",
      billToAddress: "",
      contactPerson: "",
      contactNumber: "",
      billingContact: "",
      email: "",
      paymentTerms: "30 Days",
      salesPerson: defaultSalesPerson,
      leadType: "Medium", 
      interestedProducts: [],
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const addProductRow = () => {
    setFormData({
      ...formData,
      interestedProducts: [
        ...formData.interestedProducts,
        {
          productName: "",
          category: "",
          subCategory: "",
          fabric: "",
          color: "",
          expectedQty: "",
          targetRate: "",
        },
      ],
    });
  };

  const removeProductRow = (index) => {
    const updated = formData.interestedProducts.filter((_, i) => i !== index);
    setFormData({ ...formData, interestedProducts: updated });
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...formData.interestedProducts];
    updated[index][field] = value;
    if (field === "productName") {
      const matchedProduct = masterProducts.find((p) => p.name === value);
      if (matchedProduct) {
        updated[index]["category"] = matchedProduct.category || "";
        updated[index]["subCategory"] = matchedProduct.subCategory || "";
        updated[index]["fabric"] = matchedProduct.fabricType || "";
        updated[index]["color"] = matchedProduct.color || "";
        updated[index]["targetRate"] = matchedProduct.sellingPrice || "";
      }
    }
    if (field === "category") updated[index]["subCategory"] = "";
    setFormData({ ...formData, interestedProducts: updated });
  };

  const isSalesPersonLocked =
    currentUser &&
    currentUser.role !== "Admin" &&
    currentUser.role !== "Manager";

  return (
    <AuthGuard requiredPermission="sales_clients">
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Client Master
            </h1>
            <p className="text-slate-500 text-sm">
              Manage customer details and statuses.
            </p>
          </div>
          {view === "list" && (
            <button
              onClick={() => {
                resetForm();
                setView("add");
              }}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
            >
              <FiPlus /> Add Leads
            </button>
          )}
        </div>

        {view === "list" && (
          <div className="space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search client name or GST..."
                className="w-full pl-11 p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Sales Person</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading
                    ? [...Array(8)].map((_, i) => <ClientSkeleton key={i} />)
                    : clients.map((client, index) => {
                        const isLast = clients.length === index + 1;
                        return (
                          <tr
                            key={client._id}
                            ref={isLast ? lastClientRef : null}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-4 font-bold text-slate-800">
                              {client.name}
                              <span
                                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                  client.leadType === "High"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : client.leadType === "Low"
                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}
                              >
                                {client.leadType || "Medium"}
                              </span>
                              {currentUser?.role === "Admin" && (
                                <button
                                  onClick={() => startEdit(client)}
                                  className="ml-2 text-slate-300 hover:text-blue-600"
                                  title="Edit Master"
                                >
                                  <FiEdit3 size={16} />
                                </button>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="text-slate-900 font-medium">
                                {client.contactPerson}
                              </div>
                              <div className="text-xs text-slate-500">
                                {client.contactNumber}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 text-xs font-bold rounded border ${
                                    client.status === "Customer"
                                      ? "bg-purple-100 text-purple-700 border-purple-200"
                                      : client.status === "Order Won"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {client.status || "Active"}
                                </span>
                                <button
                                  onClick={() => setHistoryClient(client)}
                                  className="text-slate-400 hover:text-slate-800"
                                >
                                  <FiClock size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-600">
                              <div className="flex items-center gap-1">
                                <FiUser /> {client.salesPerson}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedClient(client)}
                                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                >
                                  <FiActivity /> Update
                                </button>
                                <Link
                                  href={`/sales/quotes/new?clientId=${client._id}`}
                                  className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                >
                                  <FiPlus /> Quote
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  {loadingMore && <ClientSkeleton />}
                </tbody>
              </table>
              {!loading && clients.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No clients found.
                </div>
              )}
            </div>
          </div>
        )}

{view === "add" && (
  <div className="max-w-4xl mx-auto pb-10">
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6"
    >
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FiUser className="text-blue-500" />{" "}
          {isEditMode ? "Edit Client" : "Client Details"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              required
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
            />
          </div>
          {/* GST Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber || ""}
              maxLength={15} 
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gstNumber: e.target.value.toUpperCase(),
                })
              } 
              placeholder="22AAAAA0000A1Z5"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none uppercase"
            />
          </div>

          {/* Primary Phone Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Primary Phone (10 Digits)
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) setFormData({...formData, contactNumber: val});
              }}
              required
              maxLength={10} 
              placeholder="9876543210"
              className={`w-full p-3 bg-slate-50 border rounded-xl font-medium outline-none ${formData.contactNumber?.length > 0 && formData.contactNumber?.length < 10 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Lead Priority
            </label>
            <select
              name="leadType"
              value={formData.leadType || "Medium"}
              onChange={handleChange}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none text-slate-700"
            >
              <option value="High">🔥 High Priority</option>
              <option value="Medium">⚡ Medium Priority</option>
              <option value="Low">🧊 Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FiBox />
            </div>
            Interested Products
          </h3>
          <button
            type="button"
            onClick={addProductRow}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"
          >
            <FiPlus /> Add Item
          </button>
        </div>

        {formData.interestedProducts?.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
            No products added yet. Click "Add Item" to define
            requirements.
          </div>
        )}

        <div className="space-y-3">
          {formData.interestedProducts?.map((item, index) => {
            const selectedCatObj = categories.find(
              (c) => c.name === item.category
            );
            const subCats = selectedCatObj
              ? selectedCatObj.subCategories
              : [];
            return (
              <div
                key={index}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative"
              >
                <button
                  type="button"
                  onClick={() => removeProductRow(index)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                >
                  <FiTrash2 />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Product Name
                    </label>
                    <input
                      list={`products-list-${index}`}
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold"
                      value={item.productName || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "productName",
                          e.target.value
                        )
                      }
                      placeholder="Type to search or add new..."
                    />
                    <datalist id={`products-list-${index}`}>
                      {masterProducts.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.sku}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Category
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.category || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "category",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Sub-Cat
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.subCategory || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "subCategory",
                          e.target.value
                        )
                      }
                      disabled={!item.category}
                    >
                      <option value="">Select</option>
                      {subCats.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Fabric
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.fabric || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "fabric",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select</option>
                      {fabrics.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Color
                    </label>
                    <select
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.color || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "color",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select</option>
                      {colors.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Qty
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.expectedQty || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "expectedQty",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Rate (₹)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                      value={item.targetRate || ""}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "targetRate",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FiCreditCard className="text-emerald-500" /> Commercials &
          Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Billing Address
            </label>
            <textarea
              name="billToAddress"
              value={formData.billToAddress || ""}
              onChange={handleChange}
              rows="2"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Shipping Address
            </label>
            <textarea
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              rows="2"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson || ""}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Billing Phone (Must be different)
            </label>
            <input
              type="text"
              name="billingContact"
              value={formData.billingContact || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) setFormData({...formData, billingContact: val});
              }}
              required
              maxLength={10}
              placeholder="0987654321"
              className={`w-full p-3 bg-slate-50 border rounded-xl font-medium outline-none ${formData.billingContact === formData.contactNumber && formData.billingContact?.length > 0 ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
            />
            {formData.billingContact === formData.contactNumber && formData.billingContact?.length > 0 && (
              <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">Cannot be same as Primary Phone</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Payment Terms
            </label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms || "Advance"}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
            >
              <option value="Advance">Advance</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="45 Days">45 Days</option>
              <option value="60 Days">60 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <FiBriefcase /> Sales Rep
            </label>
            {isSalesPersonLocked ? (
              <div className="relative">
                <input
                  type="text"
                  value={formData.salesPerson || ""}
                  disabled
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold uppercase">
                  Locked
                </span>
              </div>
            ) : (
              <select
                name="salesPerson"
                value={formData.salesPerson || ""}
                onChange={handleChange}
                className="w-full p-3 bg-white border border-blue-200 text-blue-700 rounded-xl font-bold outline-none"
              >
                <option value="">-- Assign --</option>
                {usersList.map((u) => (
                  <option key={u._id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => {
            setView("list");
            resetForm();
          }}
          className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black flex justify-center items-center gap-2"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <FiSave /> {isEditMode ? "Update" : "Save"}
            </>
          )}
        </button>
      </div>
    </form>
  </div>
)}
        <ActivityModal
          isOpen={!!selectedClient}
          client={selectedClient}
          onClose={() => {
            setSelectedClient(null);
            setPage(1);
            fetchClients(1, true);
          }}
          onSuccess={() => {}}
        />
        <HistoryModal
          isOpen={!!historyClient}
          client={historyClient}
          onClose={() => setHistoryClient(null)}
        />
      </div>
    </AuthGuard>
  );
}