'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi';
import api from '@/utils/api';

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
      
      // Save User Data to Browser Storage
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      
      // Redirect to Dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
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