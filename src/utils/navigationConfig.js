'use client';
import {
  FiGrid, FiShoppingCart, FiScissors, FiBox, FiTruck, FiSettings, FiPlay, FiLayers, 
  FiPieChart, FiUserCheck, FiFileText, FiCreditCard, FiPlusSquare, FiActivity, FiTool,
  FiPackage, FiZap, 
  FiHome, FiClipboard, FiTrendingUp,
  FiBarChart2, FiAlertTriangle, FiTarget,
  FiRotateCcw, FiShield,
  FiPlusCircle // 🟢 Added for Surplus Tracking
} from "react-icons/fi";
import { PiDress } from "react-icons/pi";

export const SYSTEM_MODULES = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: FiGrid,
    key: "dashboard"
  },
  {
    groupName: "Sales Hub",
    icon: FiActivity,
    key: "sales", 
    items: [
      { name: "Clients & Leads", href: "/sales/clients", icon: FiUserCheck },
      { name: "Quotations", href: "/sales/quotes", icon: FiFileText },
      { name: "Sales Orders", href: "/sales/orders", icon: FiShoppingCart },
      { name: "Dispatch", href: "/dispatch", icon: FiTruck },
      { name: "Return Request", href: "/returns", icon: FiRotateCcw }, 
      { name: "Log Expense", href: "/sales/expenses/new", icon: FiPlusSquare },
    ]
  },
  {
    groupName: "Product & Material",
    icon: FiLayers,
    key: "product", 
    items: [
      { name: "Product Master", href: "/products", icon: FiLayers },
      { name: "Sampling & R&D", href: "/sampling", icon: PiDress },
      { name: "Inventory", href: "/inventory", icon: FiBox },
      { name: "Surplus Tracker", href: "/surplus", icon: FiPlusCircle }, // 🟢 NEW: Extra Pieces Shadow Ledger
    ]
  },
  {
    groupName: "Procurement",
    icon: FiBox,
    key: "procurement", 
    items: [
      { name: "Purchase Orders", href: "/procurement", icon: FiBox },
      { name: "Receive Stock", href: "/receive", icon: FiTruck },
      { name: "Direct Stock (No PO)", href: "/direct-entry", icon: FiZap, key: "procurement" },
    ]
  },
  {
    groupName: "Manufacturing",
    icon: FiTool,
    key: "manufacturing", 
    items: [
      { name: "Production Plan", href: "/production", icon: FiScissors },
      { name: "Full Kitting", href: "/kitting", icon: FiPackage, key: "production" }, 
      { name: "Production Floor", href: "/shop-floor", icon: FiPlay },
      { name: "Quality Control", href: "/qc", icon: FiSettings },
    ]
  },
  {
    groupName: "Vendor Portal",
    icon: FiHome,
    key: "vendor_portal", 
    items: [
      { name: "My Job Cards", href: "/vendor/jobs", icon: FiClipboard },
    ]
  },
  {
    groupName: "Finance",
    icon: FiCreditCard,
    key: "finance", 
    items: [
      { name: "Invoicing", href: "/finance", icon: FiFileText },
      { name: "Expenses", href: "/sales/expenses", icon: FiCreditCard },
    ]
  },
  {
    groupName: "Analytics",
    icon: FiPieChart,
    key: "analytics", 
    items: [
      { name: "Intelligence Hub", href: "/factory-intelligence", icon: FiTarget },
      { name: "QC Hold/Returns", href: "/returns/admin", icon: FiShield }, 
      { name: "Reports Center", href: "/reports", icon: FiPieChart },
      { name: "Vendor Efficiency", href: "/reports/efficiency", icon: FiTrendingUp }, 
    ]
  }
];