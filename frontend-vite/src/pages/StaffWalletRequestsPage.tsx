import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, XCircle, Search } from 'lucide-react';
import StaffSidebar from '@/components/layout/StaffSidebar';
import { apiClient } from '@/lib/api-client';

export default function StaffWalletRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/wallet/requests')
      .then((res) => setRequests(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
      .catch(() => setRequests([]));
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await apiClient.post(`/wallet/requests/${id}/approve`);
      alert('Wallet top-up approved!');
      setRequests(requests.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    } catch (err) {
      alert('Failed to approve request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <StaffSidebar />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Front-Desk Cash Wallet Approvals</h1>
            <p className="text-xs text-slate-400 mt-1">Approve or reject member cash payment requests for wallet balance top-ups.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Member</th>
                <th className="p-4">Requested Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-white">#{r.id}</td>
                  <td className="p-4 font-bold text-white">{r.user?.name || `Member #${r.userId}`}</td>
                  <td className="p-4 font-bold text-emerald-400">₹{Number(r.amount).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors"
                      >
                        Approve Top-Up
                      </button>
                    )}
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
