"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import {
  FiScissors,
  FiLayers,
  FiPackage,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
  FiSearch,
  FiX,
  FiMapPin,
  FiAlertTriangle,
  FiUser,
  FiChevronsRight,
  FiList,
  FiCheckSquare,
  FiShield, // 🟢 New icon for Assembly QC
  FiActivity,
} from "react-icons/fi";

// 🟢 UPDATED WORKFLOW: Now includes Assembly QC (SFG Gate) and Final QC (FG Gate)
const WORKFLOW_STEPS = [
  {
    id: "Cutting_Started",
    label: "Cutting",
    icon: FiScissors,
    color: "amber",
    routeKey: "cutting",
  },
  {
    id: "Sewing_Started",
    label: "Stitching",
    icon: FiLayers,
    color: "indigo",
    routeKey: "stitching",
  },
  {
    id: "Packaging_Pending",
    label: "Assembly QC", // 🟢 GATE 1
    icon: FiShield,
    color: "blue",
    routeKey: null,
  },
  {
    id: "Packaging_Started",
    label: "Packing",
    icon: FiPackage,
    color: "purple",
    routeKey: "packaging",
  },
  {
    id: "QC_Pending",
    label: "Final QC", // 🟢 GATE 2
    icon: FiCheckCircle,
    color: "emerald",
    routeKey: null,
  },
];

export default function ShopFloorPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("ALL");

  // Stores picking list feedback (History)
  const [pickingFeedback, setPickingFeedback] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

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

  // frontend/src/app/shop-floor/page.js

  const triggerAdvanceStage = (jobId, nextStage, label) => {
    // 🟢 Debugging: Check console if click is registered
    console.log("Advancing Job:", jobId, "to", nextStage);

    setConfirmDialog({
      isOpen: true,
      title: `Complete ${label}`,
      message: `Confirm that ${label} is finished. Move Job ${jobId} to the next stage?`,
      onConfirm: async () => {
        try {
          // This hits backend/routes/jobRoutes.js -> jobCardController.receiveProcess
          const res = await api.post("/shopfloor/receive", {
            jobId,
            nextStage,
          });

          if (res.data.success) {
            fetchData(); // Refresh the table
          }
        } catch (e) {
          console.error("Stage Update Error:", e);
          alert(
            "Error updating stage: " + (e.response?.data?.msg || e.message)
          );
        }
        setConfirmDialog({ isOpen: false });
      },
    });
  };

  // frontend/src/app/shop-floor/page.js

const getStepStatus = (job, stepId) => {
  const currentStepId = job.currentStep;
  
  // 1. Handle the "Assembly QC" (Gate 1) Bubble Logic 🟢
  if (stepId === 'Packaging_Pending') {
      // If job is in QC_Pending but NOT yet packed, highlight Assembly QC
      if (currentStepId === 'QC_Pending' && !job.productionData?.sfgSource?.lotNumber) {
          return 'active';
      }
      // If it already passed this stage, mark completed
      const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId);
      const assemblyIndex = WORKFLOW_STEPS.findIndex(s => s.id === 'Packaging_Pending');
      if (currentIndex > assemblyIndex) return 'completed';
  }

  // 2. Handle the "Final QC" (Gate 2) Bubble Logic 🟢
  if (stepId === 'QC_Pending') {
      // Only highlight the LAST bubble if the job has actually been packed
      if (currentStepId === 'QC_Pending' && job.productionData?.sfgSource?.lotNumber) {
          return 'active';
      }
      return 'pending';
  }

  // --- Standard logic for other steps (Cutting, Stitching, Packing) ---
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId);
  const stepIndex = WORKFLOW_STEPS.findIndex(s => s.id === stepId);

  if (currentStepId === "Cutting_Pending") {
      if (stepIndex === 0) return "active"; 
      return "pending";
  }

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "pending";
};

  const getNextStepLabel = (currentStepId) => {
    if (currentStepId === "Cutting_Pending") return "Start Cutting";
    if (currentStepId === "Packaging_Pending") return "Ready for Packing";

    const currentIndex = WORKFLOW_STEPS.findIndex(
      (s) => s.id === currentStepId
    );
    if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS.length - 1)
      return "Finish";

    return WORKFLOW_STEPS[currentIndex + 1].label;
  };

  const getActionConfig = (currentStep, jobId) => {
    switch (currentStep) {
      // 1. Starting the cutting process
      case "Cutting_Pending":
        return {
          text: "Start Cutting",
          nextStage: "Cutting_Started",
          color: "bg-blue-600",
          label: "Cutting",
        };

      // 2. Completing cutting, moving to stitching
      case "Cutting_Started":
        return {
          text: "Cutting Done",
          nextStage: "Sewing_Started",
          color: "bg-amber-600",
          label: "Stitching",
        };

      // 3. 🟢 GATE 1: Completing stitching, moving to Assembly QC
      // Note: Sewing_Started is the active step for the stitching floor
      case "Sewing_Started":
        return {
          text: "Send to Assembly QC",
          nextStage: "QC_Pending",
          color: "bg-indigo-600",
          label: "Assembly QC",
        };

      // 4. AFTER GATE 1 PASS: Job sits in Packaging_Pending. We start the packing process.
      case "Packaging_Pending":
        return {
          text: "Start Packaging",
          nextStage: "Packaging_Started",
          color: "bg-blue-600",
          label: "Packing",
        };

      // 5. 🟢 GATE 2: Completing packing, moving to Final QC
      case "Packaging_Started":
        return {
          text: "Packing Done",
          nextStage: "QC_Pending",
          color: "bg-purple-600",
          label: "Final QC",
        };

      default:
        return null;
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (job.type === "Full-Buy") return false;
    const matchesSearch = job.jobId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStage =
      filterStage === "ALL" || job.currentStep === filterStage;
    return matchesSearch && matchesStage;
  });

  return (
    <AuthGuard requiredPermission="shop-floor">
      <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Shop Floor Pipeline
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Managing Assembly (SFG) and Final (FG) Quality Gates.
            </p>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job ID..."
              className="pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm font-bold outline-none w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Visual Filter Cards */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
          <button
            onClick={() => setFilterStage("ALL")}
            className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${
              filterStage === "ALL"
                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
            }`}
          >
            <span className="font-black text-lg">
              {jobs.filter((j) => j.type !== "Full-Buy").length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Active
            </span>
          </button>
          {WORKFLOW_STEPS.map((step) => {
  // 🟢 CALCULATE COUNT DYNAMICALLY FOR DUAL GATES
  const count = jobs.filter((j) => {
    if (j.type === "Full-Buy") return false;

    // Special logic for Assembly QC (Gate 1)
    if (step.id === "Packaging_Pending") {
      return j.currentStep === "QC_Pending" && !j.productionData?.sfgSource?.lotNumber;
    }
    
    // Special logic for Final QC (Gate 2)
    if (step.id === "QC_Pending") {
      return j.currentStep === "QC_Pending" && j.productionData?.sfgSource?.lotNumber;
    }

    // Standard logic for Cutting, Stitching, Packing
    return j.currentStep === step.id;
  }).length;

  return (
    <button
      key={step.id}
      onClick={() => setFilterStage(step.id)}
      className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${
        filterStage === step.id
          ? "bg-blue-600 border-blue-600 text-white shadow-lg"
          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
      }`}
    >
      <step.icon size={16} />
      <div className="text-left">
        <div className="font-black text-sm leading-none">
          {count}
        </div>
        <div className="text-[9px] font-bold uppercase mt-1">
          {step.label}
        </div>
      </div>
    </button>
  );
})}
        </div>

        {/* Main Detailed Sheet Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4 w-56">Job & Product Info</th>
                <th className="p-4 text-center">Process Pipeline</th>
                <th className="p-4">Location / Lot Details</th>
                <th className="p-4 text-right">Production Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const action = getActionConfig(job.currentStep, job.jobId);

                const hasHistory =
                  job.issuedMaterials && job.issuedMaterials.length > 0;
                const nextStepLabel = getNextStepLabel(job.currentStep);

                let currentLocation = "Store";
                let isJobWork = false;
                const stepObj = WORKFLOW_STEPS.find(
                  (s) => s.id === job.currentStep
                );
                const route = stepObj?.routeKey
                  ? job.routing?.[stepObj.routeKey]
                  : null;

                if (route) {
                  isJobWork = route.type === "Job Work";
                  currentLocation = isJobWork
                    ? `Vendor: ${route.vendorName}`
                    : "In-House";
                }

                const displayLot =
                  job.lotNumber || job.batchNumber || job.planId?.batchNumber;

                return (
                  <tr
                    key={job._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* 1. Job Info */}
                    <td className="p-4 align-top">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded">
                          {job.jobId}
                        </span>
                        {displayLot && (
                          <span className="font-mono text-purple-600 font-bold text-[10px] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            LOT: {displayLot}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 text-sm mt-1">
                        {job.productId?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {job.productId?.sku || "NO-SKU"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-2 uppercase">
                        Qty: {job.totalQty} |{" "}
                        <span className="text-slate-400 font-medium">
                          Client: {job.planId?.clientName || "Internal"}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-3 hover:underline tracking-tight"
                      >
                        <FiClock /> TIMELINE LOG
                      </button>
                    </td>

                    {/* 2. Pipeline */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-center w-full max-w-lg mx-auto relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
                        {WORKFLOW_STEPS.map((step) => {
                          const status = getStepStatus(
                            job.currentStep,
                            step.id
                          );
                          const timeLog = job.timeline?.find(
                            (t) => t.stage === step.id
                          );
                          return (
                            <div
                              key={step.id}
                              className="flex-1 flex flex-col items-center"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all
                                                    ${
                                                      status === "completed"
                                                        ? "bg-emerald-500 text-white"
                                                        : status === "active"
                                                        ? "bg-blue-600 text-white shadow-lg scale-110"
                                                        : "bg-white border border-slate-200 text-slate-200"
                                                    }`}
                              >
                                <step.icon size={12} />
                              </div>
                              <span
                                className={`text-[8px] mt-1 font-bold uppercase ${
                                  status === "active"
                                    ? "text-blue-600"
                                    : "text-slate-300"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* 3. Location / SFG Details */}
                    <td className="p-4 align-top">
                      <div
                        className={`flex flex-col gap-1 text-xs font-bold ${
                          isJobWork ? "text-amber-600" : "text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FiMapPin className="mt-0.5" />
                          <span>{currentLocation}</span>
                        </div>
                        {isJobWork && (
                          <div className="text-[9px] bg-amber-50 px-1 py-0.5 rounded border border-amber-100 uppercase tracking-tighter w-fit ml-6">
                            Job Work Active
                          </div>
                        )}

                        {/* 🟢 NEW: VISUAL BOX FOR SFG LOT (GATE 1 PASS) */}
                        {job.currentStep === "Packaging_Pending" && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg animate-pulse">
                            <p className="text-[9px] font-black text-blue-600 uppercase">
                              Ready for Packaging
                            </p>
                            <p className="text-xs font-black text-slate-800 flex items-center gap-1 mt-0.5">
                              <FiPackage size={12} /> SFG Lot: SFG-
                              {job.jobId.split("-").pop()}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-400 mt-1 ml-6 text-[10px]">
                          <FiChevronsRight /> Next:{" "}
                          <span className="text-slate-600 font-bold uppercase">
                            {nextStepLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 4. Action & History */}
                    <td className="p-4 text-right align-top w-80">
                      {action ? (
                        <button
                          // 🟢 Pass the jobId, the nextStage string, and the display label
                          onClick={() =>
                            triggerAdvanceStage(
                              job.jobId,
                              action.nextStage,
                              action.label
                            )
                          }
                          className={`px-4 py-2 text-white text-[11px] font-black rounded-lg shadow-sm active:scale-95 transition-all ${action.color} mb-2 shadow-lg hover:brightness-110`}
                        >
                          {action.text} <FiArrowRight className="inline ml-1" />
                        </button>
                      ) : job.status === "QC_Pending" ? (
                        <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 border border-amber-200">
                          <FiActivity className="animate-pulse" /> Awaiting QC
                          Check
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-300">
                          In Process
                        </span>
                      )}

                      {/* DISPLAY SAVED HISTORY (From Kitting) */}
                      {hasHistory && (
                        <div className="text-left mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] shadow-sm">
                          <div className="font-bold text-slate-600 mb-2 flex items-center gap-1 border-b border-slate-200 pb-1">
                            <FiCheckCircle size={10} /> ISSUED MATERIAL
                            (History)
                          </div>
                          <div className="space-y-1">
                            {job.issuedMaterials.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-slate-500 font-mono text-[9px] bg-white px-2 py-1 rounded border border-slate-100"
                              >
                                <span>{item.materialName}</span>
                                <span>
                                  Lot{" "}
                                  <span className="font-bold text-slate-700">
                                    {item.lotNumber}
                                  </span>
                                  :{" "}
                                  <span className="font-bold text-blue-600">
                                    {item.qtyIssued}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CONFIRMATION DIALOG */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                  }
                  className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 tracking-tight uppercase">
                  Production Timeline: {selectedJob.jobId}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-slate-200 rounded-full"
                >
                  <FiX />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {selectedJob.timeline?.map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-4 border-l-2 border-blue-100 pl-4 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {log.action || log.stage}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                        {log.details}
                      </p>
                      {log.performedBy && (
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <FiUser size={10} /> Done by: {log.performedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
