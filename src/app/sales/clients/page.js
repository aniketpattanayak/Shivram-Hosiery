"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import {
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiSave,
  FiSearch,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";

export default function ClientsPage() {
  const router = useRouter();
  const [view, setView] = useState("list"); // 'list' or 'add'
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    billToAddress: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    paymentTerms: "30 Days",
    salesPerson: "Admin", // Default, in real app get from localStorage
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("/sales/clients");
      setClients(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/sales/clients", formData);
      alert("✅ Customer Added Successfully!");
      setView("list");
      fetchClients(); // Refresh list
      // Reset Form
      setFormData({
        name: "",
        gstNumber: "",
        address: "",
        billToAddress: "",
        contactPerson: "",
        contactNumber: "",
        email: "",
        paymentTerms: "30 Days",
        salesPerson: "Admin",
      });
    } catch (error) {
      alert("Error adding customer");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter Logic
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Client Master
            </h1>
            <p className="text-slate-500 text-sm">
              Manage customer details and billing info.
            </p>
          </div>
        </div>

        {view === "list" && (
          <button
            onClick={() => setView("add")}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus /> Add Customer
          </button>
        )}
      </div>

      {/* VIEW 1: LIST OF CLIENTS */}
      {view === "list" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or GST..."
              className="w-full pl-11 p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">GST Number</th>
                  <th className="p-4">Payment Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr
                    key={client._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-800">
                      {client.name}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 font-medium">
                        {client.contactPerson}
                      </div>
                      <div className="text-xs text-slate-500">
                        {client.contactNumber}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {client.gstNumber || "N/A"}
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100">
                        {client.paymentTerms}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No clients found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ADD NEW CLIENT FORM */}
      {view === "add" && (
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Basic Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiUser className="text-blue-500" /> Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. Tata Steel Ltd"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="accounts@company.com"
                  />
                </div>
              </div>
            </div>

            {/* 2. Address */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiMapPin className="text-red-500" /> Locations
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Billing Address
                  </label>
                  <textarea
                    name="billToAddress"
                    required
                    onChange={handleChange}
                    rows="2"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="Full address for invoicing..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Shipping Address (Main)
                  </label>
                  <textarea
                    name="address"
                    onChange={handleChange}
                    rows="2"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="Warehouse delivery address..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 3. Commercials */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiCreditCard className="text-emerald-500" /> Commercial Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="e.g. Mr. Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    onChange={handleChange}
                    defaultValue="30 Days"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  >
                    <option value="Advance">Advance</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>{" "}
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setView("list")}
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
                    <FiSave /> Save Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}



//final