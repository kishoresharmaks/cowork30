import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Edit, Wallet } from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { apiClient } from '@/lib/api-client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/admin/users')
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">User Directory & Role Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Manage user roles (Admin, Staff, Member), wallet balances, and active subscriptions.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Meeting Credits</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-white">
                    <div>{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">₹{Number(u.walletBalance || 0).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-purple-400">{u.meetingCreditsBalance || 0} Hrs</td>
                  <td className="p-4">
                    <button className="p-1.5 text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
