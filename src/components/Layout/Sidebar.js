"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiLogOut, FiChevronDown, FiChevronRight, FiShield
} from "react-icons/fi";
import { SYSTEM_MODULES } from "@/utils/navigationConfig";
import api from "@/utils/api"; 

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  // 🟢 1. STRICT SECURITY CHECK (Forced Logout on Change)
  useEffect(() => {
    const checkUserStatus = async () => {
      const stored = localStorage.getItem("userInfo");
      if (!stored) return;

      const localUser = JSON.parse(stored);
      if (!user) setUser(localUser); // Load menu instantly

      try {
        // Fetch Fresh Data from DB
        const { data: freshUser } = await api.get("/auth/me");
        
        // Compare Database vs Local Storage
        const roleChanged = freshUser.role !== localUser.role;
        const permsChanged = JSON.stringify(freshUser.permissions) !== JSON.stringify(localUser.permissions);

        // 🚨 KILL SWITCH: If anything changed, force logout
        if (roleChanged || permsChanged) {
             alert("⚠️ System Notice: Your access permissions have been updated by an Admin.\n\nPlease log in again to refresh your profile.");
             
             // Destroy Session
             localStorage.removeItem("userInfo");
             localStorage.removeItem("token"); // Ensure token is cleared too
             
             // Force Redirect
             router.push("/login");
        }
      } catch (error) {
        // If 401 (Unauthorized), user is deleted/blocked
        if (error.response?.status === 401) {
            localStorage.removeItem("userInfo");
            localStorage.removeItem("token");
            router.push("/login");
        }
      }
    };

    checkUserStatus();
  }, [pathname]); // Runs on every page navigation

  // 🟢 HELPER: Check Access
  const hasAccess = (moduleKey) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; 
    
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
    return userPerms.includes(moduleKey) || userPerms.includes('all');
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
      router.push("/login");
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isActive = (href) => {
    if (pathname === href) return true;
    if (href === '/sales/expenses' && pathname === '/sales/expenses/new') return false; 
    return pathname.startsWith(`${href}/`);
  };

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <div className="w-64 bg-white flex flex-col h-screen border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 print:hidden fixed left-0 top-0">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-center border-b border-slate-100 bg-white">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-wider">
          Shivram H<span className="text-blue-600">os</span>iery
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3 custom-scrollbar">
        
        {SYSTEM_MODULES.map((item, index) => {
          
          if (item.groupName) {
            const childItemsWithAccess = item.items.filter(sub => {
                const childKey = sub.key || sub.href.replace('/', '').replace('/', '_'); 
                return hasAccess(childKey);
            });

            if (childItemsWithAccess.length === 0) return null;

            const isOpen = expandedGroups[item.groupName];
            const isGroupActive = item.items.some(sub => isActive(sub.href));

            return (
              <div key={index} className="mb-2">
                <button
                  onClick={() => toggleGroup(item.groupName)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200
                    ${isGroupActive ? 'text-slate-800 bg-slate-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 mr-3 ${isGroupActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.groupName}</span>
                  </div>
                  {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                </button>

                {isOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-slate-100 pl-2">
                    {childItemsWithAccess.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                          ${isActive(subItem.href) ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                         <subItem.icon className={`w-4 h-4 mr-3 transition-colors ${isActive(subItem.href) ? "text-blue-600" : "text-slate-400"}`} />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const itemKey = item.key || item.href.replace('/', '').replace('/', '_');
          if (!hasAccess(itemKey)) return null; 

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group mb-2
                ${isActive(item.href) ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive(item.href) ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
              {item.name}
            </Link>
          );
        })}

        {user?.role === "Admin" && (
            <Link
            href="/settings"
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group mb-2 mt-4
              ${isActive('/settings') ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <FiShield className={`w-5 h-5 mr-3 transition-colors ${isActive('/settings') ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            System Settings
          </Link>
        )}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-200">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 font-medium truncate">{user?.role || "Staff"}</p>
          </div>
          <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full" title="Logout">
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}