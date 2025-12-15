'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiClipboard, FiActivity, FiFilter, FiSearch } from 'react-icons/fi';
import QCModal from './QCModal';

export default function QCPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      // FIX: Fetch specifically from the QC endpoint
      const res = await axios.get('http://localhost:2121/api/quality/pending');
      setJobs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quality Control</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Inspect finished goods and authorize warehouse transfer.</p>
        </div>
        
        {/* Search / Filter Toolbar */}
        <div className="flex gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Search Job ID..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all w-64"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <FiFilter />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Inspections...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <FiClipboard size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Inspections Pending</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">The production floor is clear. Great work!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            // FIX: Robust Name Lookup (Batch vs Normal)
            const productName = job.productId?.name || job.planId?.product?.name || 'Unknown Item';
            
            return (
              <div key={job._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group">
                
                {/* Left: Job Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      {job.jobId}
                    </span>
                    
                    {/* Display Type Badge */}
                    {job.isBatch ? (
                       <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                           BATCH
                       </span>
                    ) : (
                       <span className={`text-[10px] font-bold px-2 py-1 rounded ${job.type==='In-House'?'bg-blue-50 text-blue-600':'bg-amber-50 text-amber-600'}`}>
                           {job.type}
                       </span>
                    )}

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {productName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {/* FIX: Use job.totalQty for correct batch size */}
                    <span>Target: <strong className="text-slate-700">{job.totalQty} Units</strong></span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Client: {job.planId?.orderId?.customer || 'Multiple / Internal'}</span>
                  </div>
                </div>

                {/* Middle: Status */}
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Ready for QC
                </div>

                {/* Right: Action */}
                <button
                  onClick={() => setSelectedJob(job)}
                  className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-200 hover:shadow-blue-200 transition-all transform active:scale-95 flex items-center gap-2"
                >
                  <FiClipboard /> Inspect Batch
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* QC Modal Overlay */}
      {selectedJob && (
        <QCModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          onSuccess={() => {
            setSelectedJob(null);
            fetchJobs();
          }} 
        />
      )}
    </div>
  );
}