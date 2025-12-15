'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiUser, FiLock, FiMail, FiShield } from 'react-icons/fi';
import api from '@/utils/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'Admin' // Default to Admin for first user
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connects to the Backend Register Route we made earlier
      await axios.post('http://localhost:2121/api/auth/register', formData);
      
      alert("✅ Admin Account Created! You can now login.");
      router.push('/login'); // Send to login page
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-red-200 shadow-xl relative overflow-hidden">
        
        {/* Warning Badge */}
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
          DEV ONLY
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Create First Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Setup the master account.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                required
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                placeholder="John Admin"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                placeholder="admin@factory.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                placeholder="Strong Password"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
            <div className="relative">
              <FiShield className="absolute left-3 top-3 text-slate-400" />
              <select 
                className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Manager">Manager (Production Only)</option>
                <option value="Worker">Worker (Limited)</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

      </div>
    </div>
  );
}