'use client';
import { useState } from 'react';
import axios from 'axios';
import { FiX, FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import api from '@/utils/api';

export default function QCModal({ job, onClose, onSuccess }) {
  const [passed, setPassed] = useState('');
  const [rejected, setRejected] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const qtyPassed = Number(passed) || 0;
    const qtyRejected = Number(rejected) || 0;

    if (qtyPassed + qtyRejected === 0) {
      alert("Please enter quantities.");
      return;
    }

    setLoading(true);
    try {
      // Connect to Backend to update Stock
      await api.post('/quality/submit', {
        jobId: job.jobId,
        qtyPassed,
        qtyRejected
      });
      onSuccess(); // Close modal on success
    } catch (error) {
      alert('Error: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">QC Inspection</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{job.jobId}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-8 space-y-6">
          
          {/* Passed Input */}
          <div className="group">
            <label className="flex items-center text-sm font-bold text-emerald-700 mb-2">
              <FiCheckCircle className="mr-2" /> Quantity Passed
            </label>
            <div className="relative">
              <input 
                type="number"
                value={passed}
                onChange={(e) => setPassed(e.target.value)}
                className="w-full text-3xl font-black text-slate-800 placeholder-slate-200 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 p-4 transition-all outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">UNITS</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 pl-1">These will move to <strong>Finished Goods Inventory</strong>.</p>
          </div>

          {/* Rejected Input */}
          <div className="group">
            <label className="flex items-center text-sm font-bold text-red-700 mb-2">
              <FiXCircle className="mr-2" /> Quantity Rejected
            </label>
            <div className="relative">
              <input 
                type="number"
                value={rejected}
                onChange={(e) => setRejected(e.target.value)}
                className="w-full text-3xl font-black text-slate-800 placeholder-slate-200 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 p-4 transition-all outline-none"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">UNITS</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center gap-2 text-sm"
          >
            {loading ? 'Submitting...' : <>Submit Results <FiArrowRight /></>}
          </button>
        </div>

      </div>
    </div>
  );
}