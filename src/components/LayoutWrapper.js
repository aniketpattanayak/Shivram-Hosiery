"use client";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Layout/Sidebar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Define pages where sidebar should be hidden
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar handles its own visibility, but we include it here */}
      <Sidebar />

      {/* 🟢 CONDITIONAL STYLING:
          - If Auth Page: Center content, No margin, No padding (Login page handles its own layout)
          - If App Page: Add 'ml-64' (margin for sidebar) and 'p-8' (padding)
      */}
      <main 
        className={`flex-1 w-full transition-all duration-300 ${
          isAuthPage ? "flex items-center justify-center" : "ml-64 p-8"
        }`}
      >
        {children}
      </main>
    </div>
  );
}