'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiTrash2, FiEdit2, FiShield, FiCheckSquare, FiSquare, FiSave, FiX } from 'react-icons/fi';

// 🟢 1. Define Default Presets (To make your life easier)
const ROLE_PRESETS = {
  Admin: {
    sales: { read: true, write: true },
    inventory: { read: true, write: true },
    production: { read: true, write: true },
    finance: { read: true, write: true },
    settings: { read: true, write: true },
  },
  Manager: {
    sales: { read: true, write: false }, // Can view orders
    inventory: { read: true, write: true }, // Full inventory control
    production: { read: true, write: true }, // Full production control
    finance: { read: false, write: false },
    settings: { read: false, write: false },
  },
  Sales: {
    sales: { read: true, write: true }, // Full CRM
    inventory: { read: true, write: false }, // Can view stock
    production: { read: false, write: false },
    finance: { read: false, write: false },
    settings: { read: false, write: false },
  },
  Worker: {
    sales: { read: false, write: false },
    inventory: { read: false, write: false },
    production: { read: true, write: false }, // View tasks only
    finance: { read: false, write: false },
    settings: { read: false, write: false },
  }
};

const INITIAL_FORM = {
  name: '', email: '', password: '', role: 'Worker',
  permissions: ROLE_PRESETS.Worker
};

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false); // Are we adding or editing?
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:2121/api/users');
      setUsers(res.data);
    } catch (error) { console.error(error); }
  };

  // 🟢 2. Handle Role Change (Auto-fill Checkboxes)
  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: JSON.parse(JSON.stringify(ROLE_PRESETS[role])) // Deep copy to avoid reference issues
    }));
  };

  // 🟢 3. Handle Manual Checkbox Toggle
  const togglePermission = (module, type) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [type]: !prev.permissions[module][type]
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // Update Existing User
        await axios.put(`http://localhost:2121/api/users/${editId}`, formData);
        alert("✅ User Updated Successfully!");
      } else {
        // Create New User
        await axios.post('http://localhost:2121/api/users', formData);
        alert("✅ User Created Successfully!");
      }
      
      resetForm();
      fetchUsers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.msg || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setIsEditing(true);
    setEditId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Keep empty to not change
      role: user.role,
      permissions: user.permissions // Load their custom permissions
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(INITIAL_FORM);
  };

  const handleDelete = async (id) => {
    if(!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:2121/api/users/${id}`);
      fetchUsers();
    } catch (error) { alert("Failed to delete"); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Manage team access and security permissions.</p>
        </div>
        {isEditing && (
          <button onClick={resetForm} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2">
            <FiX /> Cancel Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 📝 LEFT: User Form (Add / Edit) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl ring-1 ring-slate-900/5 sticky top-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              {isEditing ? <FiEdit2 className="text-blue-600"/> : <FiShield className="text-emerald-600"/>}
              {isEditing ? 'Edit User Permissions' : 'Add New Employee'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Login</label>
                  <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                {!isEditing && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                    <input type="password" required value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Set initial password" />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Role Preset</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-bold outline-none"
                  >
                    <option value="Admin">Admin (Owner)</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales">Sales Team</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>
              </div>

              {/* 🛡️ PERMISSIONS MATRIX */}
              <div className="pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Access Control Matrix</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <div className="grid grid-cols-3 bg-slate-100 p-2 font-bold text-slate-600 text-xs">
                    <span>Module</span>
                    <span className="text-center">View</span>
                    <span className="text-center">Edit</span>
                  </div>
                  {['sales', 'inventory', 'production', 'finance', 'settings'].map((mod) => (
                    <div key={mod} className="grid grid-cols-3 p-2 border-t border-slate-100 items-center hover:bg-slate-50">
                      <span className="capitalize font-medium text-slate-700">{mod}</span>
                      
                      {/* Read Checkbox */}
                      <div className="flex justify-center">
                        <button type="button" onClick={() => togglePermission(mod, 'read')} className={`${formData.permissions[mod]?.read ? 'text-blue-600' : 'text-slate-300'}`}>
                          {formData.permissions[mod]?.read ? <FiCheckSquare size={18}/> : <FiSquare size={18}/>}
                        </button>
                      </div>

                      {/* Write Checkbox */}
                      <div className="flex justify-center">
                         <button type="button" onClick={() => togglePermission(mod, 'write')} className={`${formData.permissions[mod]?.write ? 'text-red-500' : 'text-slate-300'}`}>
                          {formData.permissions[mod]?.write ? <FiCheckSquare size={18}/> : <FiSquare size={18}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black shadow-lg flex justify-center items-center gap-2">
                {loading ? 'Saving...' : <><FiSave /> {isEditing ? 'Update User' : 'Create Account'}</>}
              </button>
            </form>
          </div>
        </div>

        {/* 📋 RIGHT: User List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
               <h3 className="font-bold text-slate-700">All Employees</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map(user => (
                <div key={user._id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{user.name} <span className="text-xs font-normal text-slate-500">({user.role})</span></h4>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(user)} 
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      {user.role !== 'Admin' && (
                        <button onClick={() => handleDelete(user._id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Permissions Badge Preview */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {Object.entries(user.permissions || {}).map(([key, val]) => (
                      (val.read || val.write) && (
                        <span key={key} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${val.write ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {key} {val.write ? '(Edit)' : '(View)'}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}