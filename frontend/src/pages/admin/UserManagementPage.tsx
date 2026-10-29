import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { User, UserRole } from '../../types';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.adminGetUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      const updated = await api.adminUpdateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-electric-500" />
            User & Role Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign role permissions (Customer, Gate Operator, Administrator) across system users.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          title="Refresh user list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-12 bg-slate-100 dark:bg-navy-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">User Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3">Role Assignment</th>
                  <th className="py-2.5 px-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{u.phone || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-500'
                            : u.role === 'operator'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-electric-500 disabled:opacity-50"
                      >
                        <option value="customer">Customer</option>
                        <option value="operator">Gate Operator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
