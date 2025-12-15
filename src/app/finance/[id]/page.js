'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

export default function InvoiceView() {
  const { id } = useParams(); 
  const router = useRouter();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get('http://localhost:2121/api/finance/invoices');
      const found = res.data.find(inv => inv._id === id || inv.invoiceId === id);
      setInvoice(found);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400">Loading Invoice...</div>;
  if (!invoice) return <div className="p-20 text-center text-red-500">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex justify-center items-start print:bg-white print:p-0">
      
      {/* Action Bar */}
      <div className="fixed top-6 left-6 md:left-72 flex flex-col gap-4 print:hidden z-40">
        <button 
            onClick={() => router.back()} 
            className="p-3 bg-white rounded-full shadow-lg text-slate-600 hover:text-blue-600 transition-all border border-slate-200"
            title="Go Back"
        >
            <FiArrowLeft size={20} />
        </button>
        <button 
            onClick={() => window.print()} 
            className="p-3 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-700 transition-all" 
            title="Print / Save PDF"
        >
            <FiPrinter size={20} />
        </button>
      </div>

      {/* A4 INVOICE SHEET */}
      <div className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl print:shadow-none print:w-full print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                <p className="text-slate-500 mt-1 font-medium text-lg">#{invoice.invoiceId}</p>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-bold text-slate-900">FACTORY OS</h2>
                <p className="text-sm text-slate-500">123 Industrial Area, Sector 5</p>
                <p className="text-sm text-slate-500">Mumbai, MH, 400001</p>
                <p className="text-sm text-slate-500">GSTIN: 27ABCDE1234F1Z5</p>
            </div>
        </div>

        {/* Bill To & Dates */}
        <div className="flex justify-between items-start mb-12">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                <h3 className="text-xl font-bold text-slate-900">{invoice.customerName}</h3>
                <p className="text-sm text-slate-500 mt-1">Order Ref: {invoice.orderId?._id || 'N/A'}</p>
            </div>
            <div className="text-right space-y-2">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Date</p>
                    <p className="font-bold text-slate-900">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                    <p className="font-bold text-slate-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate'}</p>
                </div>
            </div>
        </div>

        {/* Table */}
        <table className="w-full mb-12">
            <thead>
                <tr className="border-b-2 border-slate-100">
                    <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Description</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
                {invoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                        <td className="py-4 font-bold">{item.productName}</td>
                        <td className="py-4 text-right">{item.qty}</td>
                        {/* 🟢 CHANGED $ to ₹ */}
                        <td className="py-4 text-right">₹{item.unitPrice?.toLocaleString()}</td>
                        <td className="py-4 text-right font-bold">₹{item.lineTotal?.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
            <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    {/* 🟢 CHANGED $ to ₹ */}
                    <span className="font-bold">₹{invoice.subTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax ({invoice.taxRate}%)</span>
                    {/* 🟢 CHANGED $ to ₹ */}
                    <span className="font-bold">₹{invoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total Due</span>
                    {/* 🟢 CHANGED $ to ₹ */}
                    <span className="text-2xl font-black text-slate-900">₹{invoice.grandTotal?.toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-slate-100 pt-8 text-center">
            <p className="text-sm font-bold text-slate-900">Thank you for your business!</p>
            <p className="text-xs text-slate-400 mt-1">Please include invoice number on your check.</p>
        </div>

      </div>
    </div>
  );
}