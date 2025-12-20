"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiSave, FiUser, FiLock, FiShield, FiCheck, FiGrid, FiPlus, FiTrash2, FiEdit3, FiUsers
} from "react-icons/fi";
import api from "@/utils/api";
import { SYSTEM_MODULES } from "@/utils/navigationConfig";
import AuthGuard from '@/components/AuthGuard';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("permissions");
  const [loading, setLoading] = useState(false);

  // --- COMPANY STATE ---
  const [company, setCompany] = useState({
    name: "Shivram Hosiery",
    address: "123, Industrial Area, Ludhiana",
    taxId: "GSTIN123456789",
    phone: "+91 98765 43210",
  });

  // --- USERS STATE ---
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "Manager" });

  // --- 🟢 ROLES STATE (NOW DYNAMIC) ---
  const [roles, setRoles] = useState([]); 
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  // 1. INITIAL LOAD
  useEffect(() => {
    fetchUsers();
    fetchRoles(); // 🟢 Now this will work!
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
      if (res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0]); // Auto-select first role
      }
    } catch (e) { console.error(e); }
  };

  // --- ROLE ACTIONS ---
  
  const createRole = async () => {
    if (!newRoleName.trim()) return;
    try {
        const res = await api.post("/roles", { name: newRoleName });
        setRoles([...roles, res.data]);
        setSelectedRole(res.data);
        setIsRoleModalOpen(false);
        setNewRoleName("");
    } catch (e) { alert("Error creating role: " + e.response?.data?.msg); }
  };

  const deleteRole = async (roleId) => {
    if (!confirm("Delete this role?")) return;
    try {
        await api.delete(`/roles/${roleId}`);
        const updated = roles.filter(r => r._id !== roleId);
        setRoles(updated);
        setSelectedRole(updated[0]);
    } catch (e) { alert("Error deleting role: " + e.response?.data?.msg); }
  };

  const togglePermission = (moduleKey) => {
    if (!selectedRole || selectedRole.name === "Admin") return; 

    const currentPerms = selectedRole.permissions || [];
    let newPerms = [];

    if (currentPerms.includes(moduleKey)) {
      newPerms = currentPerms.filter((p) => p !== moduleKey);
    } else {
      newPerms = [...currentPerms, moduleKey];
    }

    // Optimistic UI Update
    const updatedRole = { ...selectedRole, permissions: newPerms };
    setSelectedRole(updatedRole);
    setRoles(roles.map((r) => (r._id === selectedRole._id ? updatedRole : r)));
  };

  // 🟢 REAL SAVE FUNCTION
  const saveSettings = async () => {
    setLoading(true);
    try {
      if (selectedRole && selectedRole.name !== "Admin") {
          await api.put(`/roles/${selectedRole._id}`, {
              permissions: selectedRole.permissions
          });
      }
      alert("✅ Permissions Saved Successfully!");
    } catch (error) {
      alert("Error Saving: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- USER ACTIONS ---
  // 🟢 FIXED HANDLE SAVE USER
  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) return alert("Fields required");

    // Get Permissions
    const roleTemplate = roles.find(r => r.name === newUser.role);
    const assignedPermissions = roleTemplate ? roleTemplate.permissions : [];

    // 🟢 Prepare Payload (Without Password initially)
    const payload = { 
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: assignedPermissions
    };

    // 🟢 Only add password if the user actually typed something
    if (newUser.password && newUser.password.trim() !== "") {
        payload.password = newUser.password;
    }

    try {
      if (isEditMode) {
        // Update Existing User
        await api.put(`/auth/users/${editingUserId}`, payload);
        alert("User Updated!");
      } else {
        // Create New User (Password is mandatory here)
        if (!payload.password) return alert("Password is required for new users");
        await api.post("/auth/register", payload);
        alert("User Created!");
      }
      fetchUsers();
      setIsUserModalOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "Manager" });
    } catch (e) { 
        console.error(e);
        alert(e.response?.data?.msg || "Error updating user"); 
    }
  };

  const deleteUser = async (id) => {
      if(!confirm("Delete user?")) return;
      try { await api.delete(`/auth/users/${id}`); fetchUsers(); } catch(e) { alert(e.message); }
  };

  const startEditUser = (u) => {
      setNewUser({ name: u.name, email: u.email, password: "", role: u.role });
      setEditingUserId(u._id); setIsEditMode(true); setIsUserModalOpen(true);
  };

  return (
    <AuthGuard requiredPermission="all">
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in pb-20">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Global configuration and access control.</p>
        </div>
        {activeTab === 'permissions' && (
            <button onClick={saveSettings} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
            </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-8">
        <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Company Profile</button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>User Management</button>
        <button onClick={() => setActiveTab('permissions')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'permissions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Role Permissions</button>
      </div>

      {activeTab === 'profile' && <div className="bg-white p-8 rounded-2xl border border-slate-200">Company Settings Placeholder</div>}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Users</h3>
                <button onClick={() => { setIsUserModalOpen(true); setIsEditMode(false); }} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 text-sm flex items-center gap-2"><FiPlus /> Add User</button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u._id} className="border-t border-slate-50">
                            <td className="p-4 font-bold">{u.name}<br/><span className="text-xs text-slate-400 font-normal">{u.email}</span></td>
                            <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                <button onClick={() => startEditUser(u)} className="text-blue-500"><FiEdit3 /></button>
                                {u.role !== 'Admin' && <button onClick={() => deleteUser(u._id)} className="text-red-500"><FiTrash2 /></button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* ROLES TAB */}
      {activeTab === 'permissions' && selectedRole && (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3 space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase">Roles</h3>
                    <button onClick={() => setIsRoleModalOpen(true)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><FiPlus size={16} /></button>
                </div>
                {roles.map(role => (
                    <div key={role._id} className="group relative">
                        <button onClick={() => setSelectedRole(role)} className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedRole._id === role._id ? 'bg-slate-800 border-slate-800 text-white font-bold shadow-lg' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <div className="flex items-center gap-3">
                                {selectedRole._id === role._id ? <FiCheck size={14} className="text-green-400" /> : <FiShield size={14} />}
                                <span>{role.name}</span>
                            </div>
                        </button>
                        {!role.isSystem && <button onClick={(e) => { e.stopPropagation(); deleteRole(role._id); }} className="absolute right-2 top-3 text-slate-300 hover:text-red-500 hidden group-hover:block"><FiTrash2 size={14} /></button>}
                    </div>
                ))}
            </div>

            <div className="col-span-9 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-800">Access Control: {selectedRole.name}</h2>
                    {selectedRole.name === 'Admin' && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2"><FiLock /> Full Access</span>}
                </div>
                <div className="space-y-6">
                    {SYSTEM_MODULES.map((mod, idx) => {
                        if (!mod.groupName) return null;
                        return (
                            <div key={idx} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold"><mod.icon className="text-slate-400" /><span>{mod.groupName}</span></div>
                                <div className="grid grid-cols-2 gap-3">
                                    {mod.items.map((subItem) => {
                                        const permKey = subItem.href.replace('/', '').replace('/', '_'); 
                                        const isEnabled = selectedRole.permissions.includes('all') || selectedRole.permissions.includes(permKey);
                                        return (
                                            <div key={subItem.name} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                <span className={`text-sm font-medium ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}>{subItem.name}</span>
                                                <button onClick={() => togglePermission(permKey)} disabled={selectedRole.name === 'Admin'} className={`w-10 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* MODALS */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-4">{isEditMode ? 'Edit User' : 'Add New User'}</h3>
                <input type="text" placeholder="Name" className="w-full p-3 border rounded-lg mb-3" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg mb-3" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg mb-3" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <select className="w-full p-3 border rounded-lg mb-6" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <button onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancel</button>
                    <button onClick={handleSaveUser} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                </div>
            </div>
        </div>
      )}

      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
                <h3 className="text-lg font-bold mb-4">Create New Role</h3>
                <input type="text" placeholder="Role Name" className="w-full p-3 border rounded-lg mb-4" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                <div className="flex gap-2">
                    <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold">Cancel</button>
                    <button onClick={createRole} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Create</button>
                </div>
            </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}