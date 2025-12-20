import "./globals.css";
import { Inter } from "next/font/google";
import LayoutWrapper from "../components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Shivram ERP",
  description: "Factory Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 🟢 ADD suppressHydrationWarning={true} HERE */}
      <body className={inter.className} suppressHydrationWarning={true}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}