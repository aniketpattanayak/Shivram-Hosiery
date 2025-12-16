'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiFileText, FiPrinter } from 'react-icons/fi';
import api from '@/utils/api';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 FETCH LOGIC (Moved from old SalesPage)
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/quotes');
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return (
    <div className="p-6 animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quotations</h1>
          <p className="text-slate-500 text-sm">Manage client estimates and pricing.</p>
        </div>
        <Link 
          href="/sales/quotes/new" 
          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200"
        >
          <FiPlus /> Create Quote
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b">
            <tr>
              <th className="p-4">Quote ID</th>
              <th className="p-4">Client</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-purple-600">{quote.quoteId || 'QT-###'}</td>
                <td className="p-4 font-bold text-slate-800">{quote.clientName}</td>
                <td className="p-4 text-slate-500 truncate max-w-xs">{quote.subject}</td>
                <td className="p-4 font-bold text-slate-900">₹{Number(quote.grandTotal).toLocaleString()}</td>
                <td className="p-4 text-right">
                   {/* 🟢 Keep View PDF Link */}
                   <Link href={`/sales/quotes/${quote._id}`} className="text-blue-600 hover:underline font-bold text-xs flex items-center justify-end gap-1">
                      <FiPrinter /> View PDF
                   </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FiFileText size={32} className="text-slate-200" />
                    <p>No quotations found.</p>
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