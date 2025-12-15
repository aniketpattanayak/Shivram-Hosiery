"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import api from '@/utils/api';
import {
  FiPlus,
  FiUser,
  FiPhone,
  FiFileText,
  FiShoppingCart,
  FiDollarSign,
  FiPrinter,
  FiCheck,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expenses, setExpenses] = useState([]); // 🟢 Added Expenses State
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "leads") fetchLeads();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "quotes") fetchQuotes();
    if (activeTab === "expenses") fetchExpenses(); // 🟢 Fetch on Tab Click
  }, [activeTab]);

  // --- API CALLS ---
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/leads");
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/quotes");
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 NEW: Fetch Expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sales/expenses");
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 NEW: Approve/Reject Logic
  const handleExpenseStatus = async (id, status) => {
    try {
      await api.put(`/sales/expenses/${id}/status`, {
        status,
      });
      fetchExpenses(); // Refresh list immediately
    } catch (error) {
      alert("Error updating status");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Sales Hub</h1>

          <div className="flex gap-2">
            <Link
              href="/sales/clients"
              className="px-4 py-2 bg-white text-slate-700 font-bold rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <FiUser /> Manage Clients
            </Link>

            {activeTab === "leads" && (
              <Link
                href="/sales/new-lead"
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FiPlus /> New Lead
              </Link>
            )}
            {activeTab === "quotes" && (
              <Link
                href="/sales/quotes/new"
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <FiPlus /> Create Quote
              </Link>
            )}
            {activeTab === "orders" && (
              <Link
                href="/sales/orders/new"
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
              >
                <FiShoppingCart /> Create Order
              </Link>
            )}
            {activeTab === "expenses" && (
              <Link
                href="/sales/expenses/new"
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <FiPlus /> Log Expense
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: "leads", label: "Leads CRM", icon: FiUser },
            { id: "quotes", label: "Quotations", icon: FiFileText },
            { id: "orders", label: "Sales Orders", icon: FiShoppingCart },
            { id: "expenses", label: "Expenses", icon: FiDollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {/* LEADS VIEW */}
        {activeTab === "leads" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.length > 0
              ? leads.map((lead) => (
                  <div
                    key={lead._id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400">
                        {lead.leadId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          lead.status === "Won"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900">
                      {lead.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <FiPhone size={10} /> {lead.phone}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-50 text-xs font-medium text-slate-600">
                      Interest: {lead.selectedItem || "General"}
                    </div>
                  </div>
                ))
              : !loading && (
                  <div className="p-8 text-center text-slate-400 col-span-full">
                    No leads found.
                  </div>
                )}
          </div>
        )}

        {/* QUOTES VIEW */}
        {activeTab === "quotes" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Quote ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.length > 0
                  ? quotes.map((quote) => (
                      <tr
                        key={quote._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 font-bold text-purple-600">
                          {quote.quoteId}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {quote.clientName}
                        </td>
                        <td className="p-4 text-slate-500 truncate max-w-xs">
                          {quote.subject}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          ₹{quote.grandTotal?.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/sales/quotes/${quote._id}`}
                            className="text-blue-600 hover:underline font-bold text-xs flex items-center justify-end gap-1"
                          >
                            <FiPrinter /> View PDF
                          </Link>
                        </td>
                      </tr>
                    ))
                  : !loading && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-10 text-center text-slate-400"
                        >
                          No quotations found.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        )}

        {/* ORDERS VIEW */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0
                  ? orders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 font-bold text-blue-600">
                          {order.orderId}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {order.customerName}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === "Production_Queued"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {order.items.length}
                        </td>
                      </tr>
                    ))
                  : !loading && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-10 text-center text-slate-400"
                        >
                          No orders found.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        )}

        {/* 🟢 EXPENSES VIEW (New Implementation) */}
        {activeTab === "expenses" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Person</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length > 0
                  ? expenses.map((exp) => (
                      <tr
                        key={exp._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 text-slate-500 font-medium">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {exp.salesPerson}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-700">
                            {exp.category}
                          </div>
                          <div className="text-xs text-slate-500">
                            {exp.description}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                          {exp.status === "Pending" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleExpenseStatus(exp._id, "Approved")
                                }
                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="Approve"
                              >
                                <FiCheck />
                              </button>
                              <button
                                onClick={() =>
                                  handleExpenseStatus(exp._id, "Rejected")
                                }
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                title="Reject"
                              >
                                <FiX />
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                exp.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {exp.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  : !loading && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-10 text-center text-slate-400"
                        >
                          No expenses logged yet.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
