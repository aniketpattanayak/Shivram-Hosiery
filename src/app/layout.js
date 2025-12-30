import "./globals.css";
// 🟢 30-YEAR INSIGHT: Removed Google Font import to stop network timeout errors
import LayoutWrapper from "../components/LayoutWrapper";

export const metadata = {
  title: "Shivram ERP",
  description: "Factory Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* You can add specific head tags here if needed */}
      </head>
      {/* 🟢 FIXED: Added suppressHydrationWarning as requested */}
      {/* 🟢 FIXED: Used standard system font stack to avoid Inter download errors */}
      <body 
        className="antialiased font-sans bg-slate-50 text-slate-900" 
        suppressHydrationWarning={true}
      >
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}