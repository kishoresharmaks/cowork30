'use client';

import React, { useState, useEffect } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';
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
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function StaffWalletRequestsPage() {
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

    return nameMatch || emailMatch || phoneMatch || refMatch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <StaffSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Verification Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Manual Wallet Proof Approvals</h1>
            <p className="text-xs text-[#94A3B8]">
              Inspect member deposit receipts, verify UTR codes, approve wallet credits, or send rejection feedback.
            </p>
          </div>
        </div>

        {/* Executive Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/5 space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] block">Pending Verifications</span>
            <div className="text-2xl font-extrabold text-[#F59E0B] flex items-center justify-between">
              <span>{pendingCount}</span>
              <Clock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="text-[10px] text-[#F59E0B] block font-semibold">Action Required</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Approved Submissions</span>
            <div className="text-2xl font-extrabold text-[#10B981] flex items-center justify-between">
              <span>{approvedCount}</span>
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Credited to Wallet</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Rejected Submissions</span>
            <div className="text-2xl font-extrabold text-[#F43F5E] flex items-center justify-between">
              <span>{rejectedCount}</span>
              <XCircle className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Verification Failed</span>
          </div>

          <div className="bg-[#1E293B] p-5 rounded-2xl border border-[#334155] space-y-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">Total Queue Records</span>
            <div className="text-2xl font-extrabold text-[#6366F1] flex items-center justify-between">
              <span>{requests.length}</span>
              <FileText className="w-5 h-5 text-[#6366F1]" />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">Staff Audit Record</span>
          </div>
        </div>

        {/* Status Tab Navigation & Search */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            <button
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
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#6366F1] text-white shadow-xs'
                  : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <span>All Requests ({requests.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, email, UTR reference..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading proof verification queue...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-[#1E293B] p-12 rounded-3xl border border-[#334155] text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Proof Requests Found</h3>
            <p className="text-xs text-[#94A3B8]">There are no wallet top-up proof submissions matching the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((req) => {
              const totalCredit = Number(req.amount) + Number(req.bonus || 0);
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className={`bg-[#1E293B] p-6 rounded-3xl border transition-all space-y-5 relative shadow-xs ${
                    isPending
                      ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5'
                      : 'border-[#334155]'
                  }`}
                >
                  <div className="flex items-start justify-between border-b border-[#334155] pb-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/10 text-[#6366F1] font-extrabold text-lg flex items-center justify-center shrink-0 border border-[#6366F1]/30">
                        {req.user?.avatarUrl ? (
                          <img src={req.user.avatarUrl} alt={req.user.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          req.user?.name?.charAt(0).toUpperCase() || 'M'
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-[#F8FAFC]">{req.user?.name || 'Member'}</h4>
                        <p className="text-xs text-[#94A3B8]">{req.user?.email} • {req.user?.phone || 'No phone'}</p>
                        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">{req.user?.companyName || 'Independent Creator'}</p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                          : req.status === 'rejected'
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 space-y-1">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">Proof Receipt</span>
                      {req.paymentProofUrl ? (
                        <div
                          onClick={() => setPreviewImageModal(req.paymentProofUrl)}
                          className="h-32 rounded-2xl bg-[#0F172A] border border-[#334155] overflow-hidden cursor-pointer group relative shadow-xs"
                          title="Click to view full screen resolution proof receipt"
                        >
                          <img src={req.paymentProofUrl} alt="Receipt Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity space-y-1">
                            <Eye className="w-5 h-5 text-white" />
                            <span className="text-[9px] font-bold text-white uppercase">Inspect Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 rounded-2xl bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 p-4 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2 text-xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8] font-medium">Pay Amount:</span>
                          <span className="font-bold text-[#F8FAFC]">₹{Number(req.amount).toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-[#94A3B8] font-medium">Bonus Credit:</span>
                          <span className="font-bold text-[#10B981]">+₹{Number(req.bonus || 0).toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between pt-1.5 border-t border-[#334155]">
                          <span className="text-[#F8FAFC] font-extrabold">Total Wallet Credit:</span>
                          <span className="text-[#10B981] font-mono font-black text-sm">₹{totalCredit.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#334155] text-[10px] space-y-0.5">
                        {req.referenceNumber && (
                          <div className="text-[#6366F1] font-mono font-bold flex items-center justify-between">
                            <span>Ref/UTR:</span>
                            <span className="bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/30">{req.referenceNumber}</span>
                          </div>
                        )}
                        <p className="text-[#94A3B8]">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center space-x-3 pt-2 border-t border-[#334155]">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex-1 py-3 rounded-full text-xs font-extrabold text-white bg-[#10B981] hover:bg-[#059669] transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Credit ₹{totalCredit.toLocaleString()}</span>
                      </button>

                      <button
                        onClick={() => handleOpenRejectModal(req.id)}
                        className="px-5 py-3 rounded-full text-xs font-bold text-[#F43F5E] bg-[#0F172A] border border-[#334155] hover:border-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL-SCREEN PROOF IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/90 backdrop-blur-xs">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-4 space-y-4">
            <div className="w-full flex items-center justify-between border-b border-[#334155] pb-3">
              <span className="text-xs font-bold text-[#CBD5E1]">Staff Receipt Inspector</span>
              <div className="flex items-center space-x-3">
                <a
                  href={previewImageModal}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-xs font-semibold text-[#6366F1] hover:border-[#6366F1] flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Image</span>
                </a>
                <button
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1 rounded-full text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <img
              src={previewImageModal}
              alt="Full Receipt Proof"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-[#334155] shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 text-[#F8FAFC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F43F5E]">Proof Verification</span>
                <h3 className="text-lg font-extrabold text-[#F8FAFC]">Reject Top-Up Request</h3>
              </div>
              <button onClick={() => setRejectingReqId(null)} className="p-1 rounded-full text-[#94A3B8] hover:text-[#F8FAFC]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Rejection Reason Note *</label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Specify why the proof receipt was rejected..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-2xl p-3 text-[#F8FAFC] focus:border-[#F43F5E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReject}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
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
