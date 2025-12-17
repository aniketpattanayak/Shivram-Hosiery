"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import {
  FiBox,
  FiScissors,
  FiLayers,
  FiCheckCircle,
  FiArrowRight,
  FiX,
  FiClock,
  FiMapPin,
  FiActivity,
  FiUser,
  FiPackage,
  FiShoppingCart,
} from "react-icons/fi";

export default function ShopFloorPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Feedback State
  const [pickingFeedback, setPickingFeedback] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/shopfloor");
      setJobs(res.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  // --- ACTIONS ---
  const issueMaterial = async (jobId) => {
    const job = jobs.find((j) => j.jobId === jobId);

    const cuttingStrategy = job.routing?.cutting;
    const isJobWork = cuttingStrategy?.type === "Job Work";
    const vendorName = cuttingStrategy?.vendorName || "Unknown Vendor";

    let confirmMsg = "Confirm Issue Material for Internal Cutting?";
    if (isJobWork) {
      confirmMsg = `⚠️ ALERT: This is a JOB WORK Order.\n\nIssue Material to Vendor: "${vendorName}"?\n\n(This will generate a Job Work Challan)`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await api.post("/shopfloor/issue", { jobId });
      if (res.data.pickingList) {
        setPickingFeedback((prev) => ({
          ...prev,
          [jobId]: res.data.pickingList,
        }));
      }
      fetchData();
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  const receiveCutting = async (jobId) => {
    try {
      await api.post("/shopfloor/receive", {
        jobId,
        nextStage: "Sewing_Started",
      });
      fetchData();
    } catch (error) {
      alert("Error receiving");
    }
  };

  const receiveSewing = async (jobId) => {
    try {
      await api.post("/shopfloor/receive", {
        jobId,
        nextStage: "Packaging_Started",
      });
      fetchData();
    } catch (error) {
      alert("Error receiving");
    }
  };

  const receivePackaging = async (jobId) => {
    try {
      await api.post("/shopfloor/receive", { jobId, nextStage: "QC_Pending" });
      fetchData();
    } catch (error) {
      alert("Error receiving");
    }
  };

  const dismissFeedback = (jobId) => {
    setPickingFeedback((prev) => {
      const newState = { ...prev };
      delete newState[jobId];
      return newState;
    });
  };

  // --- KANBAN COLUMNS ---
  const stages = [
    {
      id: "Material_Pending",
      title: "🔴 Material Pending",
      icon: FiBox,
      action: issueMaterial,
      btnText: "Issue Fabric",
    },
    {
      id: "Cutting_Started",
      title: "✂️ Cutting",
      icon: FiScissors,
      action: receiveCutting,
      btnText: "Cutting Done",
    },
    {
      id: "Sewing_Started",
      title: "🧵 Stitching",
      icon: FiLayers,
      action: receiveSewing,
      btnText: "Stitching Done",
    },
    {
      id: "Packaging_Started",
      title: "📦 Packaging",
      icon: FiPackage,
      action: receivePackaging,
      btnText: "Packing Done",
    },
    {
      id: "QC_Pending",
      title: "🔍 Ready for QC",
      icon: FiCheckCircle,
      action: null,
      btnText: "Go to QC Module",
    },
    {
      id: "Procurement_Pending",
      title: "🛒 Procurement (Full Buy)",
      icon: FiShoppingCart,
      action: null,
      btnText: "View PO",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Shop Floor Execution
          </h1>
          <p className="text-slate-500 mt-2">
            Manage Job Cards, Issue Materials, and Track Production Stages.
          </p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px]">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[340px] bg-slate-100 rounded-2xl p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold px-2 uppercase tracking-wide text-xs">
              <stage.icon size={16} /> {stage.title}
            </div>

            <div className="space-y-3 flex-1">
              {jobs
                .filter((j) => j.currentStep === stage.id)
                .map((job) => {
                  const feedback = pickingFeedback[job.jobId];
                  const isFullBuy = job.type === "Full-Buy";

                  // 🟢 LOGIC: Calculate "Current" and "Next" Locations based on Routing
                  let currentLocation = "Store";
                  let targetLocation = "";
                  let isJobWorkStep = false; // Controls Badge Color

                  // 1. MATERIAL PENDING
                  if (job.currentStep === "Material_Pending") {
                    const route = job.routing?.cutting;
                    isJobWorkStep = route?.type === "Job Work";
                    targetLocation = isJobWorkStep
                      ? `Job Work: ${route.vendorName} (Cutting)`
                      : "In-House Cutting";
                  }

                  // 2. CUTTING (Active)
                  else if (job.currentStep === "Cutting_Started") {
                    const currentRoute = job.routing?.cutting;
                    isJobWorkStep = currentRoute?.type === "Job Work";
                    currentLocation = isJobWorkStep
                      ? `Job Work: ${currentRoute.vendorName}`
                      : "In-House Cutting";

                    const nextRoute = job.routing?.stitching;
                    const nextJw = nextRoute?.type === "Job Work";
                    targetLocation = nextJw
                      ? `Next: ${nextRoute.vendorName} (Stitching)`
                      : "Next: In-House Stitching";
                  }

                  // 3. STITCHING (Active)
                  else if (job.currentStep === "Sewing_Started") {
                    const currentRoute = job.routing?.stitching;
                    isJobWorkStep = currentRoute?.type === "Job Work";
                    currentLocation = isJobWorkStep
                      ? `Job Work: ${currentRoute.vendorName}`
                      : "In-House Stitching";

                    const nextRoute = job.routing?.packing;
                    const nextJw = nextRoute?.type === "Job Work";
                    targetLocation = nextJw
                      ? `Next: ${nextRoute.vendorName} (Packing)`
                      : "Next: In-House Packing";
                  }

                  // 4. PACKAGING (Active)
                  else if (job.currentStep === "Packaging_Started") {
                    const currentRoute = job.routing?.packing;
                    isJobWorkStep = currentRoute?.type === "Job Work";
                    currentLocation = isJobWorkStep
                      ? `Job Work: ${currentRoute.vendorName}`
                      : "In-House Packing";

                    targetLocation = "Next: QC Check";
                  }

                  const isBatch =
                    job.isBatch ||
                    (job.batchPlans && job.batchPlans.length > 0);

                  return (
                    <div
                      key={job._id}
                      className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition-all relative group bg-white ${
                        isFullBuy
                          ? "border-purple-200 bg-purple-50/30"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-3">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded ${
                            isFullBuy
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {job.jobId}
                        </span>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                          <FiClock /> History
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm mb-1">
                        {job.productId?.name || "Unknown Item"}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium mb-4">
                        Qty:{" "}
                        <span className="text-slate-900 font-bold">
                          {job.totalQty}
                        </span>{" "}
                        units
                      </div>

                      {/* 🟢 LOCATION BADGES (The "Old Card" Design) */}
                      {!isFullBuy && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-2 border border-slate-100">
                          <div className="flex items-start gap-2">
                            <FiMapPin
                              className="text-slate-400 mt-0.5"
                              size={12}
                            />
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                Current Location
                              </p>
                              <p
                                className={`text-xs font-bold ${
                                  isJobWorkStep
                                    ? "text-amber-600"
                                    : "text-slate-700"
                                }`}
                              >
                                {currentLocation}
                              </p>
                            </div>
                          </div>
                          {targetLocation && (
                            <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                              <FiArrowRight
                                className="text-slate-400 mt-0.5"
                                size={12}
                              />
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">
                                  Target / Next
                                </p>
                                <p className="text-xs font-bold text-slate-600">
                                  {targetLocation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 🟢 FULL BUY STATUS (If applicable) */}
                      {isFullBuy && (
                        <div className="bg-white rounded-lg p-3 mb-4 border border-purple-100 space-y-2 shadow-sm">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-purple-800 font-bold flex items-center gap-1">
                              <FiShoppingCart /> PO Status
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 text-[9px] font-bold">
                              Pending
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-medium">
                              Received Qty
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              0 / {job.totalQty}
                            </span>
                          </div>
                        </div>
                      )}

                      {isBatch && (
                        <div className="absolute top-14 right-5">
                          <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                            BATCH ({job.batchPlans?.length || 0})
                          </span>
                        </div>
                      )}

                      {/* Feedback (Picking List) */}
                      {feedback && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 relative animate-in zoom-in-95 duration-200">
                          <button
                            onClick={() => dismissFeedback(job.jobId)}
                            className="absolute top-1 right-1 text-emerald-400 hover:text-emerald-700"
                          >
                            <FiX size={14} />
                          </button>
                          <p className="text-[10px] font-bold uppercase text-emerald-600 mb-2">
                            ✅ Material Issued:
                          </p>
                          <ul className="space-y-2">
                            {feedback.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-[10px] text-slate-700 flex justify-between items-start border-b border-emerald-100 last:border-0 pb-1 last:pb-0"
                              >
                                <span className="font-medium">
                                  {item.material}:
                                </span>
                                <div className="text-right">
                                  <span className="font-mono font-bold block text-slate-900">
                                    {item.qty} from {item.lotNumber}
                                  </span>
                                  {item.vendorName && (
                                    <span className="text-[9px] text-slate-500 block uppercase tracking-wide">
                                      (Supp: {item.vendorName})
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {stage.action && !isFullBuy ? (
                        <button
                          onClick={() => stage.action(job.jobId)}
                          className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                          {stage.btnText} <FiArrowRight />
                        </button>
                      ) : (
                        <div
                          className={`text-center text-xs font-bold py-2.5 rounded-lg border ${
                            isFullBuy
                              ? "bg-purple-100 text-purple-600 border-purple-200"
                              : "text-emerald-600 bg-emerald-50 border-emerald-100"
                          }`}
                        >
                          {isFullBuy
                            ? "View Purchase Order"
                            : "Waiting for Next Step"}
                        </div>
                      )}
                    </div>
                  );
                })}
              {jobs.filter((j) => j.currentStep === stage.id).length === 0 && (
                <div className="text-center py-12 text-slate-300 text-xs font-bold italic opacity-50">
                  Empty Station
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🟢 HISTORY MODAL (Removed Bottom Close Button) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Job Card History
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedJob.jobId}
                </p>
              </div>
              {/* Header Close Button (Kept as requested) */}
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {selectedJob.timeline && selectedJob.timeline.length > 0 ? (
                selectedJob.timeline.map((log, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== selectedJob.timeline.length - 1 && (
                      <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-slate-200"></div>
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm z-10 
                                    ${
                                      log.stage?.includes("Material")
                                        ? "bg-blue-100 text-blue-600"
                                        : log.stage?.includes("Cutting")
                                        ? "bg-amber-100 text-amber-600"
                                        : "bg-emerald-100 text-emerald-600"
                                    }`}
                    >
                      <FiActivity size={16} />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {log.action || log.stage}
                      </h4>
                      <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                        <p>
                          <strong className="text-slate-800">
                            Assigned To:
                          </strong>{" "}
                          {log.vendorName || "In-House"}
                        </p>
                        {/* Shows the detailed history text from Backend */}
                        {log.details && (
                          <p className="mt-1 border-t border-slate-200 pt-1 whitespace-pre-line">
                            {log.details}
                          </p>
                        )}
                        {log.performedBy && (
                          <p className="mt-1 text-slate-400 flex items-center gap-1">
                            <FiUser size={10} /> {log.performedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-8">
                  No history recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
