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
  FiSettings,
  FiLogOut,
  FiPlay,
  FiLayers,
  FiPieChart,
  FiShield,
  FiUserCheck,
  FiFileText,
  FiCreditCard,
  FiPlusSquare, // 🟢 Import the new icon
} from "react-icons/fi";
import { PiDress } from "react-icons/pi";

// Base Menu Items
const baseMenuItems = [
  { name: "Dashboard", href: "/", icon: FiGrid },

  { section: "Commercial" },
  { name: "Product Master", href: "/products", icon: FiLayers },
  { name: "Clients & Leads", href: "/sales/clients", icon: FiUserCheck },
  { name: "Quotations", href: "/sales/quotes", icon: FiFileText },
  { name: "Sales Orders", href: "/sales/orders", icon: FiShoppingCart },
  
  // 🟢 The List View
  { name: "Expenses", href: "/sales/expenses", icon: FiCreditCard },

  // 🟢 The New Button (Separate Item)
  { name: "Log Expense", href: "/sales/expenses/new", icon: FiPlusSquare },

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
  { name: "Invoicing", href: "/finance", icon: FiFileText },

  { section: "Analytics" },
  { name: "Reports Center", href: "/reports", icon: FiPieChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
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

  const menuItems = [...baseMenuItems];
  if (user?.role === "Admin") {
    menuItems.push(
      { section: "System" },
      { name: "System Settings", href: "/settings", icon: FiShield }
    );
  }

  // 🟢 SMART ACTIVE CHECK FUNCTION
  // This ensures 'Expenses' doesn't light up when you are on 'Log Expense'
  const isActive = (href) => {
    // 1. Exact Match is always active
    if (pathname === href) return true;

    // 2. Special Case: If we are on 'Log Expense' page, DO NOT highlight 'Expenses' list
    if (href === '/sales/expenses' && pathname === '/sales/expenses/new') {
        return false; 
    }

    // 3. Otherwise, check if it starts with the href (for sub-pages like /sales/expenses/123)
    return pathname.startsWith(`${href}/`);
  };

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <div className="w-64 bg-white flex flex-col h-screen border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 print:hidden">
      <div className="h-16 flex items-center justify-center border-b border-slate-100 bg-white">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-wider">
          Shivram H<span className="text-blue-600">os</span>iery
        </h1>
      </div>

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
              // 🟢 Use the smart `isActive` function here
              className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group
                ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <item.icon
                className={`w-5 h-5 mr-3 transition-colors ${
                  isActive(item.href)
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {item.name}
            </Link>
          )
        )}
      </nav>

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