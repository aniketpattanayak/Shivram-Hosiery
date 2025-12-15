import './globals.css';
import Sidebar from '@/components/Layout/Sidebar';

export const metadata = {
  title: 'Shivram Hosiery',
  description: 'ERP System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning stops the Chrome Extension error */}
      <body className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden" suppressHydrationWarning={true}>
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}



