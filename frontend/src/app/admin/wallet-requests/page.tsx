'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Check,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function AdminWalletRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Rejection Reason Modal State
  const [rejectingReqId, setRejectingReqId] = useState<number | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await apiClient.get('/wallet/admin/pending-topups');
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error('Failed to load wallet topup requests', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: number) => {
    if (!confirm('Approve payment proof receipt and credit wallet balance?')) return;
    try {
      const res = await apiClient.post(`/wallet/admin/topup-requests/${requestId}/approve`);
      alert(res.data?.message || 'Top-up request approved and wallet credited!');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve top-up request');
    }
  };

  const handleOpenRejectModal = (requestId: number) => {
    setRejectingReqId(requestId);
    setRejectionReasonInput('Payment receipt proof verification failed or invalid receipt image.');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReqId) return;

    setSubmittingReject(true);
    try {
      const res = await apiClient.post(`/wallet/admin/topup-requests/${rejectingReqId}/reject`, {
        rejectionReason: rejectionReasonInput,
      });
      alert(res.data?.message || 'Top-up request rejected.');
      setRejectingReqId(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject top-up request');
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const nameMatch = r.user?.name?.toLowerCase().includes(query);
    const emailMatch = r.user?.email?.toLowerCase().includes(query);
    const phoneMatch = r.user?.phone?.toLowerCase().includes(query);
    const refMatch = r.referenceNumber?.toLowerCase().includes(query);
    const notesMatch = r.notes?.toLowerCase().includes(query);

    return nameMatch || emailMatch || phoneMatch || refMatch || notesMatch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const totalApprovedValue = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.amount) + Number(r.bonus || 0), 0);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Financial Audit & Proof Verification Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Manual Wallet Top-Up Proof Approvals</h1>
            <p className="text-xs text-[#94A3B8]">
              Inspect member cash deposit receipts, verify UTR reference numbers, approve wallet credits, or reject requests with audit logs.
            </p>
          </div>
        </div>

        {/* Executive Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#F59E0B]/40 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] block">Pending Verifications</span>
            <div className="text-2xl font-black text-[#F59E0B] flex items-center justify-between">
              <span>{pendingCount}</span>
              <Clock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-[10px] text-[#F59E0B] block font-semibold">Action Required</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Approved Submissions</span>
            <div className="text-2xl font-black text-[#10B981] flex items-center justify-between">
              <span>{approvedCount}</span>
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Total Credited: ₹{totalApprovedValue.toLocaleString()}</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Rejected Submissions</span>
            <div className="text-2xl font-black text-[#F43F5E] flex items-center justify-between">
              <span>{rejectedCount}</span>
              <XCircle className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Verification Failed</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Submissions Queue</span>
            <div className="text-2xl font-black text-[#6366F1] flex items-center justify-between">
              <span>{requests.length}</span>
              <FileText className="w-5 h-5 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Audit History Recorded</span>
          </div>
        </div>

        {/* Filter & Navigation Bar */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center space-x-2 border-b sm:border-b-0 border-[#334155] pb-2 sm:pb-0 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({pendingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved ({approvedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40 shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#6366F1] text-white shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <span>All ({requests.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, UTR, or notes..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#94A3B8]">Loading top-up verification queue...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#94A3B8]">No top-up proof requests found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-[#94A3B8] font-bold border-b border-[#334155] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Member Account</th>
                    <th className="px-6 py-4">Requested Top-Up</th>
                    <th className="px-6 py-4">UTR / Ref Number</th>
                    <th className="px-6 py-4 text-center">Receipt Proof Image</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#0F172A]/50 transition-colors">
                      <td className="px-6 py-4 text-[#94A3B8] font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-extrabold text-[#F8FAFC]">{req.user?.name || 'Member'}</p>
                        <p className="text-[10px] text-[#94A3B8]">{req.user?.email}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-[#10B981] text-sm">₹{Number(req.amount).toLocaleString()}</span>
                          {req.bonus > 0 && (
                            <span className="block text-[10px] text-[#10B981] font-bold">+ ₹{Number(req.bonus).toLocaleString()} Bonus</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono">
                        {req.referenceNumber ? (
                          <span className="px-2 py-1 rounded bg-[#0F172A] border border-[#334155] text-[#6366F1] font-bold text-[11px]">
                            {req.referenceNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8]">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {req.paymentProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImageModal(req.paymentProofUrl)}
                            className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] font-bold text-[11px] hover:bg-[#6366F1]/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Proof</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8]">No Image</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            req.status === 'approved'
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              : req.status === 'rejected'
                              ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 animate-pulse'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(req.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#94A3B8] font-bold">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* LIGHTBOX PROOF PREVIEW MODAL */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/90 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-2xl w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <h3 className="text-sm font-extrabold text-[#F8FAFC]">Payment Proof Receipt Inspection</h3>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-full bg-[#0F172A] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-[#334155]">
              <img src={previewImageModal} alt="Payment Proof Receipt" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setRejectingReqId(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#F43F5E]">Reject Top-Up Request</h3>
              <p className="text-xs text-[#94A3B8]">Provide audit reason for rejecting this member's top-up proof.</p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-[#F8FAFC] focus:border-[#F43F5E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReject}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submittingReject ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
