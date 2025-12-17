'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSave, FiUser, FiLock, FiShield, FiCheck, FiX, FiGrid, FiPlus, FiTrash2, FiEdit3, FiUsers 
} from 'react-icons/fi';
import api from '@/utils/api'; // Ensure this points to your axios instance
import { SYSTEM_MODULES } from '@/utils/navigationConfig';
import AuthGuard from '@/components/AuthGuard'; // 🟢 Added security wrapper

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(false);
  
  // --- STATE: COMPANY PROFILE ---
  const [company, setCompany] = useState({
    name: 'Shivram Hosiery',
    address: '123, Industrial Area, Ludhiana',
    taxId: 'GSTIN123456789',
    phone: '+91 98765 43210'
  });

  // --- STATE: USERS ---
  const [users, setUsers] = useState([]); 
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // 🟢 NEW: State for Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Manager' });

  // --- STATE: ROLES ---
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', permissions: ['all'], isSystem: true }, 
    { id: 2, name: 'Manager', permissions: ['dashboard', 'inventory', 'production'], isSystem: false },
    { id: 3, name: 'Store Keeper', permissions: ['inventory', 'procurement'], isSystem: false },
    { id: 4, name: 'Production Head', permissions: ['production', 'shop-floor', 'qc'], isSystem: false }
  ]);
  const [selectedRole, setSelectedRole] = useState(roles[0]); 
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // 1. SECURITY CHECK & DATA LOADING
  useEffect(() => {
    // Basic check, AuthGuard handles the rest
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || '{}');
    if (userInfo.role !== 'Admin') {
        // alert("Access Denied: Admins Only"); // AuthGuard handles this now
        // router.push('/');
        return;
    }
    fetchUsers(); 
  }, [router]);

  // 🟢 API: Fetch Users
  const fetchUsers = async () => {
    try {
        const res = await api.get('/auth/users');
        setUsers(res.data);
    } catch (error) {
        console.error("Failed to load users", error);
    }
  };

  // 🟢 NEW: Prepare Modal for Editing
  const startEditUser = (user) => {
      setNewUser({ 
          name: user.name, 
          email: user.email, 
          password: '', // Leave blank to keep existing
          role: user.role 
      });
      setIsEditMode(true);
      setEditingUserId(user._id);
      setIsUserModalOpen(true);
  };

  // 🟢 API: Add OR Update User
  const handleSaveUser = async () => {
    if(!newUser.name || !newUser.email) {
        return alert("Name and Email are required.");
    }

    // Password is required only for NEW users
    if (!isEditMode && !newUser.password) {
        return alert("Please enter a password for the new user.");
    }

    // 1. Find the permissions for the selected role
    const assignedRole = roles.find(r => r.name === newUser.role);
    const rolePermissions = assignedRole ? assignedRole.permissions : [];

    const payload = {
        ...newUser,
        permissions: rolePermissions
    };

    try {
        if (isEditMode) {
            // 🟢 UPDATE Existing User
            // Note: Ensure you have a PUT route at /auth/users/:id in your backend
            await api.put(`/auth/users/${editingUserId}`, payload);
            alert("User Updated Successfully!");
        } else {
            // 🟢 CREATE New User
            await api.post('/auth/register', payload);
            alert("User Created Successfully!");
        }
        
        fetchUsers(); // Refresh list
        setIsUserModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'Manager' }); 
        setIsEditMode(false);
        setEditingUserId(null);
    } catch (error) {
        alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  // 🟢 API: Delete User
  const deleteUser = async (id) => {
      if(!confirm('Delete this user? They will lose access immediately.')) return;
      
      try {
          await api.delete(`/auth/users/${id}`);
          setUsers(users.filter(u => u._id !== id)); // Remove from UI
      } catch (error) {
          alert("Error deleting user: " + error.message);
      }
  };

  // --- ACTIONS: ROLES ---
  const createRole = () => {
      if (!newRoleName.trim()) return;
      const newRole = { 
          id: Date.now(), 
          name: newRoleName, 
          permissions: ['dashboard'], 
          isSystem: false 
      };
      setRoles([...roles, newRole]);
      setSelectedRole(newRole); 
      setIsRoleModalOpen(false);
      setNewRoleName('');
  };

  const deleteRole = (roleId) => {
      if(confirm('Are you sure? This will remove this role from the system.')) {
          const updatedRoles = roles.filter(r => r.id !== roleId);
          setRoles(updatedRoles);
          setSelectedRole(updatedRoles[0]); 
      }
  };

  const togglePermission = (moduleKey) => {
    if (selectedRole.name === 'Admin') return; 

    const currentPerms = selectedRole.permissions || [];
    let newPerms = [];

    if (currentPerms.includes(moduleKey)) {
        newPerms = currentPerms.filter(p => p !== moduleKey);
    } else {
        newPerms = [...currentPerms, moduleKey];
    }

    const updatedRole = { ...selectedRole, permissions: newPerms };
    setSelectedRole(updatedRole);
    setRoles(roles.map(r => r.id === selectedRole.id ? updatedRole : r));
  };

  const saveSettings = () => {
    setLoading(true);
    setTimeout(() => { 
        console.log("Saving State to DB:", { company, users, roles });
        alert("Settings Saved Successfully!"); 
        setLoading(false); 
    }, 800);
  };

  return (
    <AuthGuard requiredPermission="all">
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Global configuration and access control.</p>
        </div>
        <button onClick={saveSettings} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
            {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Company Profile</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>User Management</button>
        <button onClick={() => setActiveTab('permissions')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'permissions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Role Permissions</button>
      </div>

      {/* 🟢 TAB 1: COMPANY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><FiGrid /> Organization Details</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                    <input type="text" value={company.name} onChange={(e) => setCompany({...company, name: e.target.value})} className="w-full p-3 border rounded-lg font-bold text-slate-800" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                    <textarea value={company.address} onChange={(e) => setCompany({...company, address: e.target.value})} className="w-full p-3 border rounded-lg font-medium text-slate-700 h-24" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax ID / GSTIN</label>
                        <input type="text" value={company.taxId} onChange={(e) => setCompany({...company, taxId: e.target.value})} className="w-full p-3 border rounded-lg font-medium text-slate-700" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Contact</label>
                        <input type="text" value={company.phone} onChange={(e) => setCompany({...company, phone: e.target.value})} className="w-full p-3 border rounded-lg font-medium text-slate-700" />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 🟢 TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FiUsers /> System Users</h3>
                <button onClick={() => { setIsUserModalOpen(true); setIsEditMode(false); setNewUser({ name: '', email: '', password: '', role: 'Manager' }); }} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 text-sm flex items-center gap-2">
                    <FiPlus /> Add User
                </button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                    <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                        <tr key={u._id}>
                            <td className="p-4">
                                <div className="font-bold text-slate-800">{u.name}</div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                            </td>
                            <td className="p-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                                    {u.role}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                {u.role !== 'Admin' && (
                                    <div className="flex justify-end gap-2">
                                        {/* 🟢 Edit Button */}
                                        <button 
                                            onClick={() => startEditUser(u)} 
                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit User"
                                        >
                                            <FiEdit3 size={18} />
                                        </button>
                                        
                                        {/* Delete Button */}
                                        <button 
                                            onClick={() => deleteUser(u._id)} 
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Delete User"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan="3" className="p-8 text-center text-slate-400 italic">No users found. Add one above.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}

      {/* 🟢 TAB 3: ROLE PERMISSIONS (Dynamic) */}
      {activeTab === 'permissions' && (
        <div className="grid grid-cols-12 gap-8">
            
            {/* Sidebar: Role Selector */}
            <div className="col-span-3 space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roles</h3>
                    <button onClick={() => setIsRoleModalOpen(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><FiPlus size={16} /></button>
                </div>
                
                {roles.map(role => (
                    <div key={role.id} className="group relative">
                        <button 
                            onClick={() => setSelectedRole(role)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                selectedRole.id === role.id 
                                ? 'bg-slate-800 border-slate-800 text-white font-bold shadow-lg transform scale-105' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {selectedRole.id === role.id ? <FiCheck size={14} className="text-green-400" /> : <FiShield size={14} />}
                                <span>{role.name}</span>
                            </div>
                        </button>
                        {/* Delete Button for Non-System Roles */}
                        {!role.isSystem && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }}
                                className="absolute right-2 top-3 text-slate-300 hover:text-red-500 hidden group-hover:block"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content: Module Toggles */}
            <div className="col-span-9 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Access Control: {selectedRole.name}</h2>
                        <p className="text-sm text-slate-500">Define which modules this role can access.</p>
                    </div>
                    {selectedRole.name === 'Admin' && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                            <FiLock /> Admin has full access
                        </span>
                    )}
                </div>

                <div className="space-y-6">
                    {/* DYNAMIC LOOP */}
                    {SYSTEM_MODULES.map((mod, idx) => {
                        if (mod.groupName) {
                            return (
                                <div key={idx} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold">
                                        <mod.icon className="text-slate-400" />
                                        <span>{mod.groupName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {mod.items.map((subItem) => {
                                            const permKey = subItem.href.replace('/', '').replace('/', '_'); 
                                            const isEnabled = selectedRole.permissions.includes('all') || selectedRole.permissions.includes(permKey);
                                            return (
                                                <div key={subItem.name} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            <subItem.icon size={14} />
                                                        </div>
                                                        <span className={`text-sm font-medium ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>{subItem.name}</span>
                                                    </div>
                                                    <button onClick={() => togglePermission(permKey)} className={`w-10 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }
                        return null; // Skip non-grouped items for brevity or handle them similarly
                    })}
                </div>
            </div>
        </div>
      )}

      {/* 🟢 MODAL: ADD / EDIT USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-4">{isEditMode ? 'Edit User' : 'Add New User'}</h3>
                
                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                <input type="text" className="w-full p-3 border rounded-lg mb-3" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Login</label>
                <input type="email" className="w-full p-3 border rounded-lg mb-3" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                
                {/* 🟢 PASSWORD FIELD (Optional if Editing) */}
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Password {isEditMode && <span className="text-xs text-slate-400 normal-case">(Leave blank to keep current)</span>}
                </label>
                <input type="password" placeholder="Create a login password" className="w-full p-3 border rounded-lg mb-3" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                
                <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                <select className="w-full p-3 border rounded-lg mb-6" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>

                <div className="flex gap-2">
                    <button 
                        onClick={() => { setIsUserModalOpen(false); setIsEditMode(false); setNewUser({ name: '', email: '', password: '', role: 'Manager' }); }} 
                        className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
                    >
                        Cancel
                    </button>
                    <button onClick={handleSaveUser} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                        {isEditMode ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 🟢 MODAL: ADD ROLE */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-4">Create New Role</h3>
                <input type="text" placeholder="Role Name (e.g. Supervisor)" className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                <div className="flex gap-2">
                    <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Cancel</button>
                    <button onClick={createRole} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black">Create Role</button>
                </div>
            </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}