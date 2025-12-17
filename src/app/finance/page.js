"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link"; // 🟢 Added Link import
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import {
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiPlus,
} from "react-icons/fi";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("invoices"); // 'invoices' or 'pending'
  const [invoices, setInvoices] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "invoices") {
        const res = await api.get(
          "/finance/invoices"
        );
        setInvoices(res.data);
      } else {
        const res = await api.get(
          "/finance/pending"
        );
        setPendingOrders(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (orderId) => {
    if (!confirm("Generate Invoice for this order?")) return;
    try {
      await api.post("/finance/create", { orderId });
      alert("✅ Invoice Generated!");
      setActiveTab("invoices"); // Switch to invoice view
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/finance/${id}/pay`);
      fetchData(); // Refresh
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthGuard requiredPermission="finance">
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Finance & Invoicing
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Manage billing, track payments, and revenue.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "invoices"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Invoices History
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Ready to Bill{" "}
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              New
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400">
          Loading Financial Data...
        </div>
      ) : (
        <div className="grid gap-4">
          {/* VIEW 1: INVOICE HISTORY */}
          {activeTab === "invoices" &&
            invoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      inv.status === "Paid"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {inv.status === "Paid" ? (
                      <FiCheckCircle size={24} />
                    ) : (
                      <FiClock size={24} />
                    )}
                  </div>
                  <div>
                    {/* 🟢 Added Link to View Page */}
                    <Link
                      href={`/finance/${inv._id || inv.invoiceId}`}
                      className="hover:underline"
                    >
                      <h3 className="font-bold text-slate-900 text-lg hover:text-blue-600 transition-colors">
                        {inv.customerName} ↗
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {inv.invoiceId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Total Amount
                  </p>
                  {/* 🟢 CHANGED $ TO ₹ HERE */}
                  <h4 className="text-2xl font-black text-slate-900">
                    ₹{inv.grandTotal?.toLocaleString()}
                  </h4>
                </div>

                <div>
                  {inv.status === "Unpaid" ? (
                    <button
                      onClick={() => markPaid(inv._id)}
                      className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                      Paid in Full
                    </span>
                  )}
                </div>
              </div>
            ))}

          {/* VIEW 2: PENDING ORDERS */}
          {activeTab === "pending" &&
            pendingOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {order.orderId}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dispatched:{" "}
                      {new Date(order.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900">
                    {order.customerName || order.customer || "Client"}
                  </h3>
                </div>
                <button
                  onClick={() => generateInvoice(order.orderId)}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform"
                >
                  <FiPlus /> Generate Bill
                </button>
              </div>
            ))}

          {invoices.length === 0 && activeTab === "invoices" && (
            <div className="text-center p-10 text-slate-400">
              No invoices generated yet. Go to "Ready to Bill" to start.
            </div>
          )}

          {pendingOrders.length === 0 && activeTab === "pending" && (
            <div className="text-center p-10 text-slate-400">
              No pending orders found. Dispatch some items first!
            </div>
          )}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
