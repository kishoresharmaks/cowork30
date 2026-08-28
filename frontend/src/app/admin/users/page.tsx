'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Users,
  Search,
  Filter,
  Wallet,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Plus,
  Minus,
  Eye,
  X,
  CreditCard,
  UserCheck,
  UserX,
  ArrowRight,
  FileText,
  Download,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

function formatDateClean(dateStr?: string | null) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    adminUsers: 0,
    memberUsers: 0,
    totalWalletBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pending Top-Up Requests State
  const [pendingTopups, setPendingTopups] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'desks' | 'meetings' | 'wallet' | 'invoices'>('profile');

  // Adjust Wallet Modal State
  const [adjustModalUser, setAdjustModalUser] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);

  // Load Users Function
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/admin/users', {
        params: { search: searchQuery, role: roleFilter },
      });
      setUsers(res.data?.users || []);
      setStats(res.data?.stats || {});
    } catch (err) {
      console.error('Failed to load users directory', err);
    } finally {
      setLoading(false);
    }
  }

  // Load Pending Topup Requests Function
  async function fetchPendingTopups() {
    try {
      const res = await apiClient.get('/wallet/admin/pending-topups');
      setPendingTopups(res.data?.requests || []);
    } catch (err) {
      console.error('Failed to load pending top-up requests', err);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchPendingTopups();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Fetch Full User Detail Modal
  const openUserDetailModal = async (userId: number) => {
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/auth/admin/users/${userId}`);
      setSelectedUserDetail(res.data);
      setActiveModalTab('profile');
    } catch (err) {
      alert('Failed to load user detail profile');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Load pricing plans for admin assign tool
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [assignPlanId, setAssignPlanId] = useState<number | null>(null);
  const [assignWaive, setAssignWaive] = useState<boolean>(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await apiClient.get('/pricing/plans');
        setAdminPlans(res.data || []);
      } catch (err) {
        setAdminPlans([]);
      }
    }
    fetchPlans();
  }, []);

  // Handle Role Change (Promote/Demote)
  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

    try {
      await apiClient.put(`/auth/admin/users/${userId}/role`, { role: newRole });
      alert(`User role updated to ${newRole.toUpperCase()}`);
      fetchUsers();
      if (selectedUserDetail?.user?.id === userId) {
        openUserDetailModal(userId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Handle Adjust Wallet Form Submit
  const handleAdjustWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser || !adjustAmount) return;

    setAdjusting(true);
    try {
      const numAmount = Number(adjustAmount);
      await apiClient.post(`/auth/admin/users/${adjustModalUser.id}/wallet-adjust`, {
        amount: numAmount,
        type: adjustType,
        reason: adjustReason || `Admin Manual ${adjustType.toUpperCase()} adjustment`,
      });

      alert(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ₹${numAmount} to user wallet!`);
      setAdjustModalUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();

      if (selectedUserDetail?.user?.id === adjustModalUser.id) {
        openUserDetailModal(adjustModalUser.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust wallet balance');
    } finally {
      setAdjusting(false);
    }
  };

  const handleAssignPlanSubmit = async () => {
    if (!selectedUserDetail?.user?.id || !assignPlanId) return;
    setAssigning(true);
    try {
      await apiClient.post(`/auth/admin/users/${selectedUserDetail.user.id}/assign-plan`, {
        pricingPlanId: assignPlanId,
        waivePayment: assignWaive,
      });
      alert('Plan assigned successfully!');
      openUserDetailModal(selectedUserDetail.user.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign plan');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Enterprise Member Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">User Management & Wallet Control</h1>
            <p className="text-xs text-[#94A3B8]">View member profiles, track reservations, manage credit balances, and assign admin roles.</p>
          </div>

          <Link
            href="/admin/wallet-requests"
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all shadow-md shadow-[#6366F1]/20 flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Wallet Proof Approvals</span>
          </Link>
        </div>

        {/* Executive Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Platform Members</span>
            <div className="text-2xl font-black text-[#F8FAFC] flex items-center justify-between">
              <span>{stats.totalUsers || 0}</span>
              <Users className="w-5 h-5 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">{stats.memberUsers || 0} Members • {stats.adminUsers || 0} Admins</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Outstanding Wallet Credits</span>
            <div className="text-2xl font-black text-[#10B981] flex items-center justify-between">
              <span>₹{Number(stats.totalWalletBalance || 0).toLocaleString()}</span>
              <Wallet className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-[10px] text-[#10B981] block font-semibold">Available for 1-Click Reservations</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Member Accounts</span>
            <div className="text-2xl font-black text-[#6366F1] flex items-center justify-between">
              <span>{stats.memberUsers || 0}</span>
              <UserCheck className="w-5 h-5 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Active Community Members</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Administrator Accounts</span>
            <div className="text-2xl font-black text-[#F59E0B] flex items-center justify-between">
              <span>{stats.adminUsers || 0}</span>
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-[10px] text-[#F59E0B] block font-semibold">Full System Control</span>
          </div>
        </div>

        {/* PENDING WALLET TOP-UP PROOF VERIFICATION BANNER */}
        {pendingTopups.filter((r) => r.status === 'pending').length > 0 && (
          <div className="p-5 rounded-2xl border border-[#F59E0B]/50 bg-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold border border-[#F59E0B]/30 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">
                  {pendingTopups.filter((r) => r.status === 'pending').length} Pending Wallet Top-Up Request(s)
                </h3>
                <p className="text-xs text-[#CBD5E1]">
                  Members have submitted cash deposit / bank transfer receipt proofs awaiting admin verification.
                </p>
              </div>
            </div>

            <Link
              href="/admin/wallet-requests"
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] transition-all flex items-center space-x-2 shadow-md shrink-0 cursor-pointer"
            >
              <span>Open Verification Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, company, GSTIN..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
            />
          </form>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-xs text-[#CBD5E1] font-medium">Role Filter:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
            >
              <option value="all">All Members & Admins</option>
              <option value="member">Regular Members</option>
              <option value="admin">Administrators Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#94A3B8]">Loading user directory...</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#94A3B8]">No members found matching your search filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-[#94A3B8] font-bold border-b border-[#334155] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Member Name</th>
                    <th className="px-6 py-4">Contact Details</th>
                    <th className="px-6 py-4">Company & GSTIN</th>
                    <th className="px-6 py-4">Membership</th>
                    <th className="px-6 py-4 text-right">Wallet Balance</th>
                    <th className="px-6 py-4 text-center">Role</th>
                    <th className="px-6 py-4 text-center">Bookings</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#0F172A]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#6366F1] text-white font-bold flex items-center justify-center shrink-0 border border-white/20">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              u.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#F8FAFC] text-sm">{u.name}</p>
                            <p className="text-[10px] text-[#94A3B8]">Since {formatDateClean(u.createdAt)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-[#CBD5E1] font-medium">{u.email}</p>
                        <p className="text-[10px] text-[#94A3B8]">{u.phone || 'No phone'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-[#CBD5E1] font-semibold">{u.companyName || 'Independent'}</p>
                        {u.gstin ? (
                          <span className="font-mono text-[10px] text-[#6366F1] font-bold">{u.gstin}</span>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8]">No GSTIN</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {u.membershipActive ? (
                          <div className="text-[10px] font-bold text-[#10B981]">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30">Active</span>
                            <div className="text-[10px] text-[#CBD5E1] mt-0.5">{u.membershipPlanName || 'Membership'}</div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#94A3B8] font-medium">No Active Plan</div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold">
                        <span className="text-[#10B981]">₹{Number(u.walletBalance || 0).toLocaleString()}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin'
                              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                              : 'bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/40'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-extrabold text-[#F8FAFC] text-sm">{u.totalBookings || 0}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openUserDetailModal(u.id)}
                            className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] hover:border-[#6366F1] text-[#6366F1] transition-all cursor-pointer"
                            title="View Profile & Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdjustModalUser(u)}
                            className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] hover:border-[#10B981] text-[#10B981] transition-all cursor-pointer"
                            title="Adjust Wallet Credit/Debit"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRoleToggle(u.id, u.role)}
                            className={`p-2 rounded-xl bg-[#0F172A] border border-[#334155] transition-all cursor-pointer ${
                              u.role === 'admin'
                                ? 'hover:border-[#F43F5E] text-[#F43F5E]'
                                : 'hover:border-[#F59E0B] text-[#F59E0B]'
                            }`}
                            title={u.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          >
                            {u.role === 'admin' ? <UserX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ADJUST WALLET MODAL */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-5 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setAdjustModalUser(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10B981]">
                Admin Balance Adjustment
              </span>
              <h3 className="text-lg font-extrabold text-[#F8FAFC]">{adjustModalUser.name}</h3>
              <p className="text-xs text-[#94A3B8]">Current Balance: ₹{Number(adjustModalUser.walletBalance || 0).toLocaleString()}</p>
            </div>

            <form onSubmit={handleAdjustWalletSubmit} className="space-y-4 text-xs">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0F172A] border border-[#334155]">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`flex-1 py-1.5 rounded-lg font-extrabold transition-all ${
                    adjustType === 'credit' ? 'bg-[#10B981] text-white shadow-xs' : 'text-[#94A3B8]'
                  }`}
                >
                  + Add Credit
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`flex-1 py-1.5 rounded-lg font-extrabold transition-all ${
                    adjustType === 'debit' ? 'bg-[#F43F5E] text-white shadow-xs' : 'text-[#94A3B8]'
                  }`}
                >
                  - Deduct Balance
                </button>
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for downtime / Manual cash top-up"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={adjusting}
                className={`w-full py-3.5 rounded-full text-xs font-bold text-white shadow-md cursor-pointer ${
                  adjustType === 'credit' ? 'bg-[#10B981] hover:bg-[#059669]' : 'bg-[#F43F5E] hover:bg-[#E11D48]'
                }`}
              >
                <span>{adjusting ? 'Processing...' : `Confirm ${adjustType.toUpperCase()} of ₹${adjustAmount || 0}`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL MODAL (ALL 5 TABS FULLY IMPLEMENTED) */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC] shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setSelectedUserDetail(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1.5 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 border-b border-[#334155] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white text-xl font-bold shrink-0 border border-white/20">
                {selectedUserDetail.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#F8FAFC]">{selectedUserDetail.user?.name}</h3>
                <p className="text-xs text-[#94A3B8]">{selectedUserDetail.user?.email} • {selectedUserDetail.user?.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Modal Tabs Bar (ALL 5 TABS) */}
            <div className="flex items-center space-x-2 border-b border-[#334155] pb-3 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeModalTab === 'profile' ? 'bg-[#6366F1] text-white shadow-xs' : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                Profile & Plan
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('desks')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeModalTab === 'desks' ? 'bg-[#6366F1] text-white shadow-xs' : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                Desks ({selectedUserDetail.deskBookings?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('meetings')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeModalTab === 'meetings' ? 'bg-[#6366F1] text-white shadow-xs' : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                Meeting Suites ({selectedUserDetail.meetingBookings?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('wallet')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeModalTab === 'wallet' ? 'bg-[#6366F1] text-white shadow-xs' : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                Wallet Ledger ({selectedUserDetail.walletTransactions?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('invoices')}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeModalTab === 'invoices' ? 'bg-[#6366F1] text-white shadow-xs' : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8]'
                }`}
              >
                GST Invoices ({selectedUserDetail.invoices?.length || 0})
              </button>
            </div>

            {/* TAB 1: PROFILE & PLAN */}
            {activeModalTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-1">
                  <span className="text-[#94A3B8] font-medium">Company Name:</span>
                  <p className="text-[#F8FAFC] font-bold text-sm">{selectedUserDetail.user?.companyName || 'Independent Member'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-1">
                  <span className="text-[#94A3B8] font-medium">Wallet Balance:</span>
                  <p className="text-[#10B981] font-extrabold text-base">₹{Number(selectedUserDetail.user?.walletBalance || 0).toLocaleString()}</p>
                </div>

                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-3">
                  <span className="text-[#CBD5E1] font-bold block">Assign / Overwrite Membership Tier</span>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={assignPlanId ?? ''}
                      onChange={(e) => setAssignPlanId(e.target.value ? Number(e.target.value) : null)}
                      className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] w-full sm:w-auto"
                    >
                      <option value="">Select Membership Plan</option>
                      {adminPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} • ₹{(p.priceMonthly || p.priceDaily || 0).toString()}
                        </option>
                      ))}
                    </select>

                    <label className="text-xs text-[#CBD5E1] inline-flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={assignWaive} onChange={(e) => setAssignWaive(e.target.checked)} className="w-4 h-4" />
                      <span>Waive Payment</span>
                    </label>

                    <button
                      type="button"
                      disabled={assigning || !assignPlanId}
                      onClick={handleAssignPlanSubmit}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 cursor-pointer"
                    >
                      {assigning ? 'Assigning...' : 'Assign Plan'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DESK RESERVATIONS */}
            {activeModalTab === 'desks' && (
              <div className="space-y-3 text-xs">
                {!selectedUserDetail.deskBookings || selectedUserDetail.deskBookings.length === 0 ? (
                  <p className="text-[#94A3B8] py-8 text-center">No desk bookings recorded for this member.</p>
                ) : (
                  <div className="overflow-x-auto border border-[#334155] rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-[#0F172A] text-[#94A3B8] font-bold text-[10px] uppercase border-b border-[#334155]">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Desk / Plan</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {selectedUserDetail.deskBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-[#0F172A]/40">
                            <td className="px-4 py-3 font-mono font-bold text-[#6366F1]">{b.bookingCode || `#${b.id}`}</td>
                            <td className="px-4 py-3 text-[#F8FAFC] font-medium">{b.notes || b.bookingType || 'Desk Pass'}</td>
                            <td className="px-4 py-3 text-[#94A3B8]">{formatDateClean(b.preferredDate)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#10B981]/20 text-[#10B981]">
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-[#10B981]">₹{Number(b.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MEETING SUITES */}
            {activeModalTab === 'meetings' && (
              <div className="space-y-3 text-xs">
                {!selectedUserDetail.meetingBookings || selectedUserDetail.meetingBookings.length === 0 ? (
                  <p className="text-[#94A3B8] py-8 text-center">No meeting suite passes recorded for this member.</p>
                ) : (
                  <div className="overflow-x-auto border border-[#334155] rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-[#0F172A] text-[#94A3B8] font-bold text-[10px] uppercase border-b border-[#334155]">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Suite Name</th>
                          <th className="px-4 py-3">Booking Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {selectedUserDetail.meetingBookings.map((mb: any) => (
                          <tr key={mb.id} className="hover:bg-[#0F172A]/40">
                            <td className="px-4 py-3 font-mono font-bold text-[#6366F1]">{mb.bookingCode}</td>
                            <td className="px-4 py-3 text-[#F8FAFC] font-medium">{mb.meetingRoom?.name || 'Meeting Suite'}</td>
                            <td className="px-4 py-3 text-[#94A3B8]">{formatDateClean(mb.bookingDate)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#10B981]/20 text-[#10B981]">
                                {mb.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-[#10B981]">₹{Number(mb.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WALLET LEDGER */}
            {activeModalTab === 'wallet' && (
              <div className="space-y-3 text-xs">
                {!selectedUserDetail.walletTransactions || selectedUserDetail.walletTransactions.length === 0 ? (
                  <p className="text-[#94A3B8] py-8 text-center">No wallet transactions recorded for this member.</p>
                ) : (
                  <div className="overflow-x-auto border border-[#334155] rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-[#0F172A] text-[#94A3B8] font-bold text-[10px] uppercase border-b border-[#334155]">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Reason / Description</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {selectedUserDetail.walletTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-[#0F172A]/40">
                            <td className="px-4 py-3 text-[#94A3B8] font-mono text-[11px]">{formatDateClean(tx.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  tx.type === 'credit'
                                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                                    : 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#F8FAFC] font-medium">{tx.reason || tx.description || 'Wallet transaction'}</td>
                            <td
                              className={`px-4 py-3 text-right font-mono font-bold ${
                                tx.type === 'credit' ? 'text-[#10B981]' : 'text-[#F43F5E]'
                              }`}
                            >
                              {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: GST INVOICES */}
            {activeModalTab === 'invoices' && (
              <div className="space-y-3 text-xs">
                {!selectedUserDetail.invoices || selectedUserDetail.invoices.length === 0 ? (
                  <p className="text-[#94A3B8] py-8 text-center">No GST tax invoices issued for this member yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-[#334155] rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-[#0F172A] text-[#94A3B8] font-bold text-[10px] uppercase border-b border-[#334155]">
                        <tr>
                          <th className="px-4 py-3">Invoice #</th>
                          <th className="px-4 py-3">Issue Date</th>
                          <th className="px-4 py-3">Subtotal</th>
                          <th className="px-4 py-3">Tax / GST</th>
                          <th className="px-4 py-3 text-right">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {selectedUserDetail.invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-[#0F172A]/40">
                            <td className="px-4 py-3 font-mono font-bold text-[#6366F1]">{inv.invoiceNumber || `INV-${inv.id}`}</td>
                            <td className="px-4 py-3 text-[#94A3B8]">{formatDateClean(inv.createdAt)}</td>
                            <td className="px-4 py-3 text-[#CBD5E1] font-mono">₹{Number(inv.subtotal || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-[#CBD5E1] font-mono">₹{Number(inv.taxAmount || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-[#10B981]">₹{Number(inv.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
