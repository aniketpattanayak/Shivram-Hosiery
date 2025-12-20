'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi';
import api from '@/utils/api';
import { SYSTEM_MODULES } from "@/utils/navigationConfig"; // 🟢 IMPORT ADDED

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', formData);
      
      // 1. Validate Response
      if (!res.data || !res.data.token || !res.data.user) {
          throw new Error("Invalid server response");
      }

      // 2. Save User Data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      
      // 3. 🟢 SMART REDIRECT LOGIC STARTS HERE
      const user = res.data.user;
      const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
      const isAdmin = user.role === 'Admin';
      
      // Helper to check access
      const hasAccess = (key) => isAdmin || userPerms.includes('all') || userPerms.includes(key);

      // A. Check Dashboard First (Default)
      if (hasAccess('dashboard')) {
          router.push('/dashboard');
          return;
      }

      // B. If no dashboard, find the first allowed link
      let firstAllowedRoute = null;

      if (SYSTEM_MODULES && Array.isArray(SYSTEM_MODULES)) {
          for (const module of SYSTEM_MODULES) {
              // Case 1: Group (e.g. Sales Hub)
              if (module.groupName && Array.isArray(module.items)) {
                  for (const item of module.items) {
                      const key = item.key || (item.href ? item.href.replace('/', '').replace('/', '_') : "");
                      if (key && hasAccess(key)) {
                          firstAllowedRoute = item.href;
                          break;
                      }
                  }
              } 
              // Case 2: Direct Link (e.g. Analytics)
              else if (module.href) {
                  const key = module.key || module.href.replace('/', '').replace('/', '_');
                  if (hasAccess(key)) {
                      firstAllowedRoute = module.href;
                      break;
                  }
              }
              if (firstAllowedRoute) break; // Stop loop once found
          }
      }

      // C. Redirect
      if (firstAllowedRoute) {
          router.push(firstAllowedRoute);
      } else {
          // Fallback if they have NO permissions at all
          router.push('/dashboard'); 
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-xl">
        
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Shivram H<span className="text-blue-600">os</span>iery
          </h1>
          <p className="text-slate-400 font-medium mt-2">Sign in to manage operations</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="admin@factory.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? 'Signing in...' : 'Access Dashboard'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Don't have an account? Contact IT Admin.
          </p>
        </div>

      </div>
    </div>
  );
}