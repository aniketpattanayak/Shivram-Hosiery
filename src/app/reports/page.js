"use client";
import { useState } from "react";
import axios from "axios";
import {
  FiDownload,
  FiFilter,
  FiFileText,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // 🟢 NEW STATE

  const generateReport = async () => {
    setLoading(true);
    setHasSearched(true); // User clicked the button
    try {
      let url = `http://localhost:2121/api/reports/${reportType}`;
      if (dates.start && dates.end) {
        url += `?startDate=${dates.start}&endDate=${dates.end}`;
      }

      const res = await axios.get(url);
      setData(res.data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to server. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (data.length === 0) return alert("No data to export");
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Reports Center
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">
          Analyze performance and export data.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-1/4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Report Type
          </label>
          <select
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setHasSearched(false);
              setData([]);
            }}
          >
            <option value="sales">💰 Sales Register</option>
            <option value="production">🏭 Production History</option>
            <option value="inventory">📦 Inventory Valuation</option>
          </select>
        </div>

        {reportType !== "inventory" && (
          <>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                onChange={(e) => setDates({ ...dates, start: e.target.value })}
              />
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                onChange={(e) => setDates({ ...dates, end: e.target.value })}
              />
            </div>
          </>
        )}

        <button
          onClick={generateReport}
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
        >
          {loading ? (
            "Fetching..."
          ) : (
            <>
              <FiFilter /> Generate Data
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {data.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FiFileText className="text-blue-500" /> Preview ({data.length}{" "}
              Records)
            </h3>
            <button
              onClick={downloadCSV}
              className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 flex items-center gap-2"
            >
              <FiDownload /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {Object.keys(data[0]).map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    {Object.values(row).map((val, i) => (
                      <td
                        key={i}
                        className="px-6 py-3 text-sm font-medium text-slate-700 whitespace-nowrap"
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // 🟢 FIX: Handle Empty States Clearly
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          {hasSearched ? (
            // 🔴 Searched but found 0 results
            <>
              <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <FiAlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">
                No Records Found
              </h3>
              <p className="text-slate-400 mt-1">
                Try selecting a wider date range.
              </p>
            </>
          ) : (
            // ⚪ Initial State
            <>
              <div className="w-16 h-16 bg-white text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FiLayers size={32} />
              </div>
              <p className="text-slate-400 font-medium">
                Select report options above and click Generate.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
