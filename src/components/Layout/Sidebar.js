"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiGrid,
  FiShoppingCart,
  FiScissors,
  FiBox,
  FiTruck,
  FiSettings, // Used for Quality Control
  FiLogOut,
  FiPlay,
  FiLayers,
  FiDollarSign,
  FiPieChart,
  FiShield, // 🟢 Added for System Settings
} from "react-icons/fi";
import { PiDress } from "react-icons/pi";

// Base Menu Items (Visible to relevant staff)
const baseMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: FiGrid },

  { section: "Commercial" },
  { name: "Product Master", href: "/products", icon: FiLayers },
  { name: "Sales & CRM", href: "/sales", icon: FiShoppingCart },
  { name: "Procurement", href: "/procurement", icon: FiBox },
  { name: "Receive Stock", href: "/receive", icon: FiTruck },
  { name: "Sampling & R&D", href: "/sampling", icon: PiDress },

  { section: "Factory Floor" },
  { name: "Production Plan", href: "/production", icon: FiScissors },
  { name: "Shop Floor", href: "/shop-floor", icon: FiPlay },
  { name: "Inventory", href: "/inventory", icon: FiBox },
  { name: "Quality Control", href: "/qc", icon: FiSettings },

  { section: "Logistics" },
  { name: "Dispatch", href: "/dispatch", icon: FiTruck },

  { section: "Finance" },
  { name: "Invoicing", href: "/finance", icon: FiDollarSign },

  { section: "Analytics" },
  { name: "Reports Center", href: "/reports", icon: FiPieChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  // 🟢 1. SECURITY CHECK
  useEffect(() => {
    // Don't run security check if we are already on the login/register page
    if (pathname === "/login" || pathname === "/register") return;

    const userInfo = localStorage.getItem("userInfo");

    if (!userInfo) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userInfo));
    }
  }, [router, pathname]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("userInfo");
      router.push("/login");
    }
  };

  // 🟢 2. DYNAMIC MENU LOGIC
  // Create a copy of the base menu
  const menuItems = [...baseMenuItems];

  // If the user is an Admin, add the Settings section
  if (user?.role === "Admin") {
    menuItems.push(
      { section: "System" },
      { name: "System Settings", href: "/settings", icon: FiShield }
    );
  }

  // 🟢 3. HIDE SIDEBAR CHECK
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <div className="w-64 bg-white flex flex-col h-screen border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 print:hidden">
      {/* 1. Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-slate-100 bg-white">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-wider">
        Shivram H<span className="text-blue-600">os</span>iery
        </h1>
      </div>

      {/* 2. Scrollable Menu */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3 custom-scrollbar">
        {menuItems.map((item, index) =>
          item.section ? (
            <div key={index} className="px-4 py-3 mt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {item.section}
              </p>
            </div>
          ) : (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group
                ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <item.icon
                className={`w-5 h-5 mr-3 transition-colors ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {item.name}
            </Link>
          )
        )}
      </nav>

      {/* 3. User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate">
              {user?.role || "Staff"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
            title="Logout"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
