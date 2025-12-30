"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { FiPrinter, FiArrowLeft, FiDownload } from "react-icons/fi";
import api from "@/utils/api";

export default function ViewQuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await api.get(`/sales/quotes/${id}`);
        setQuote(res.data);
      } catch (error) {
        alert("Error fetching quotation");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuote();
  }, [id]);

  if (loading)
    return <div className="p-10 text-center">Loading Document...</div>;
  if (!quote)
    return <div className="p-10 text-center">Quotation not found.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
      {/* Toolbar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold"
        >
          <FiArrowLeft /> Back
        </button>
        <div className="flex gap-3">
          {/* <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-2">
            <FiDownload /> Download PDF
          </button> */}
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPrinter /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Layout */}
      <div className="max-w-4xl mx-auto bg-white p-12 shadow-2xl rounded-xl print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              QUOTATION
            </h1>
            <p className="text-slate-500 font-medium mt-1"># {quote.quoteId}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">
              Shivram Hosiery Factory
            </h2>
            <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed mt-1">
              <br />
              Ludhiana <br />
              GSTIN: 03AFEPA1102L1ZB
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quotation For
            </h3>
            <p className="text-lg font-bold text-slate-900">
              {quote.clientName}
            </p>
            <p className="text-sm text-slate-600 whitespace-pre-line mt-1">
              {quote.clientAddress}
            </p>
            {quote.clientGst && (
              <p className="text-sm font-bold text-slate-800 mt-2">
                GSTIN: {quote.clientGst}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Date
              </h3>
              <p className="font-bold text-slate-900">
                {new Date(quote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Valid Until
              </h3>
              <p className="font-bold text-red-600">
                {new Date(quote.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Subject */}
        {quote.subject && (
          <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-700">Subject:</span>{" "}
            <span className="text-slate-600">{quote.subject}</span>
          </div>
        )}

        {/* Items Table */}
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-3 text-xs font-bold text-slate-500 uppercase">
                Item & Description
              </th>
              <th className="py-3 text-xs font-bold text-slate-500 uppercase text-right">
                Qty
              </th>
              <th className="py-3 text-xs font-bold text-slate-500 uppercase text-right">
                Rate
              </th>
              <th className="py-3 text-xs font-bold text-slate-500 uppercase text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {quote.items.map((item, index) => (
              <tr key={index}>
                <td className="py-4">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </td>
                <td className="py-4 text-right font-medium text-slate-700">
                  {item.qty}
                </td>
                <td className="py-4 text-right font-medium text-slate-700">
                  ₹{item.rate.toLocaleString()}
                </td>
                <td className="py-4 text-right font-bold text-slate-900">
                  ₹{item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals (UPDATED: NO GST) */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>₹{quote.subTotal.toLocaleString()}</span>
            </div>
            {/* GST Removed */}
            <div className="flex justify-between text-xl font-black text-slate-900 pt-4 border-t-2 border-slate-900 mt-2">
              <span>Total</span>
              <span>₹{quote.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-slate-200 pt-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-sm">
              Terms & Conditions
            </h3>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              <li>
                <strong>Payment:</strong> {quote.terms?.payment || "N/A"}
              </li>
              <li>
                <strong>Delivery:</strong> {quote.terms?.delivery || "N/A"}
              </li>
              <li>
                <strong>Validity:</strong> {quote.terms?.validity || "30 Days"}
              </li>
            </ul>
          </div>
          <div className="text-right flex flex-col justify-end">
            <div className="h-16"></div> {/* Space for signature */}
            <p className="font-bold text-slate-900">For Shivram Hosiery</p>
            <p className="text-xs text-slate-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
