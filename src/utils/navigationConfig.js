// src/utils/navigationConfig.js
import {
    FiGrid, FiShoppingCart, FiScissors, FiBox, FiTruck, FiSettings, FiPlay, FiLayers, 
    FiPieChart, FiUserCheck, FiFileText, FiCreditCard, FiPlusSquare, FiActivity, FiTool
  } from "react-icons/fi";
  import { PiDress } from "react-icons/pi";
  
  export const SYSTEM_MODULES = [
    { 
      name: "Dashboard", 
      href: "/", // 🟢 FIXED: Changed from '/dashboard' to '/' to fix 404 error
      icon: FiGrid,
      key: "dashboard"
    },
    {
      groupName: "Sales Hub",
      icon: FiActivity,
      key: "sales", // 🟢 THIS KEY IS REQUIRED FOR PERMISSIONS
      items: [
        { name: "Clients & Leads", href: "/sales/clients", icon: FiUserCheck },
        { name: "Quotations", href: "/sales/quotes", icon: FiFileText },
        { name: "Sales Orders", href: "/sales/orders", icon: FiShoppingCart },
      ]
    },
    {
      groupName: "Product & Material",
      icon: FiLayers,
      key: "product", // 🟢 REQUIRED
      items: [
        { name: "Product Master", href: "/products", icon: FiLayers },
        { name: "Sampling & R&D", href: "/sampling", icon: PiDress },
        { name: "Inventory", href: "/inventory", icon: FiBox },
      ]
    },
    {
      groupName: "Procurement",
      icon: FiBox,
      key: "procurement", // 🟢 REQUIRED
      items: [
        { name: "Purchase Orders", href: "/procurement", icon: FiBox },
        { name: "Receive Stock", href: "/receive", icon: FiTruck },
      ]
    },
    {
      groupName: "Manufacturing",
      icon: FiTool,
      key: "manufacturing", // 🟢 REQUIRED
      items: [
        { name: "Production Plan", href: "/production", icon: FiScissors },
        { name: "Shop Floor", href: "/shop-floor", icon: FiPlay },
        { name: "Quality Control", href: "/qc", icon: FiSettings },
      ]
    },
    {
      groupName: "Finance & Logistics",
      icon: FiCreditCard,
      key: "finance", // 🟢 REQUIRED
      items: [
        { name: "Dispatch", href: "/dispatch", icon: FiTruck },
        { name: "Invoicing", href: "/finance", icon: FiFileText },
        { name: "Expenses", href: "/sales/expenses", icon: FiCreditCard },
        { name: "Log Expense", href: "/sales/expenses/new", icon: FiPlusSquare },
      ]
    },
    {
      groupName: "Analytics",
      icon: FiPieChart,
      key: "analytics", // 🟢 REQUIRED
      items: [
        { name: "Reports Center", href: "/reports", icon: FiPieChart },
      ]
    }
  ];