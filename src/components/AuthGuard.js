'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiHome } from 'react-icons/fi'; 

export default function AuthGuard({ children, requiredPermission }) {
  const router = useRouter();
  // We use 3 states: 'loading' (checking), 'authorized' (allow), 'denied' (show popup)
  const [status, setStatus] = useState('loading'); 

  useEffect(() => {
    // 1. Check if User is Logged In
    const stored = localStorage.getItem("userInfo");
    if (!stored) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(stored);

    // 2. Admin Super-Pass (Always Allowed)
    if (user.role === 'Admin') {
      setStatus('authorized');
      return;
    }

    // 3. Check Permissions
    const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

    if (userPerms.includes(requiredPermission) || userPerms.includes('all')) {
      setStatus('authorized');
    } else {
      // 🛑 Instead of alerting, we just set the state to 'denied'
      setStatus('denied');
    }
  }, [router, requiredPermission]);

  // Case 1: Still checking (Show nothing or a spinner)
  if (status === 'loading') return null; 

  // Case 2: Access Denied (Show Custom Popup)
  if (status === 'denied') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100 transform scale-100 transition-all">
           
           {/* Icon */}
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
             <FiAlertTriangle size={32} />
           </div>
           
           {/* Text */}
           <h3 className="text-xl font-black text-slate-900 mb-2">Access Denied</h3>
           <p className="text-slate-500 text-sm mb-6 leading-relaxed">
             You do not have permission to view the <strong className="text-slate-800 capitalize">{requiredPermission?.replace('_', ' ')}</strong> module.
           </p>

           {/* Action Button */}
           <button 
             onClick={() => router.push('/')}
             className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-200"
           >
             <FiHome /> Return to Dashboard
           </button>
        </div>
      </div>
    );
  }

  // Case 3: Authorized (Render the Page)
  return <>{children}</>;
}