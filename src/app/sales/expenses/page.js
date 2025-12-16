"use client";
import { useState, useEffect } from "react";
// 🔴 Removed Link import since we don't need the button anymore
import { FiCheck, FiX, FiCreditCard } from "react-icons/fi"; // Removed FiPlus
import api from "@/utils/api";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseStatus = async (id, status) => {
    try {
      await api.put(`/sales/expenses/${id}/status`, { status });
      fetchExpenses();
    } catch (error) {
      alert("Error updating status");
    }
  };

  return (
    <div className="p-6 animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm">
            Track sales and operational costs.
          </p>
        </div>
        {/* 🟢 BUTTON REMOVED: It is now in the Sidebar! */}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Person</th>
              <th className="p-4">Description</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <tr key={exp._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500 font-medium">
                  {new Date(exp.date).toLocaleDateString()}
                </td>
                <td className="p-4 font-bold text-slate-800">
                  {exp.salesPerson}
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-700">{exp.category}</div>
                  <div className="text-xs text-slate-500">
                    {exp.description}
                  </div>
                </td>
                <td className="p-4 font-mono font-bold text-slate-900">
                  ₹{Number(exp.amount).toLocaleString()}
                </td>

                <td className="p-4 flex justify-center gap-2">
                  {exp.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => handleExpenseStatus(exp._id, "Approved")}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                        title="Approve"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={() => handleExpenseStatus(exp._id, "Rejected")}
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
            ))}
            {expenses.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FiCreditCard size={32} className="text-slate-200" />
                    <p>No expenses logged yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
