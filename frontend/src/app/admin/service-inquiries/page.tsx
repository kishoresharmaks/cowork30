'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Building2,
  Trash2,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import InquiryChatModal from '@/components/ui/InquiryChatModal';
import { MessageSquare } from 'lucide-react';

export default function AdminServiceInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatInquiry, setChatInquiry] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  async function loadData() {
    setLoading(true);
    try {
      const [inquiriesRes, branchesRes] = await Promise.all([
        apiClient.get('/services/admin/inquiries'),
        apiClient.get('/branches/admin/all').catch(() => apiClient.get('/branches')),
      ]);

      const list = Array.isArray(inquiriesRes.data?.inquiries)
        ? inquiriesRes.data.inquiries
        : Array.isArray(inquiriesRes.data)
        ? inquiriesRes.data
        : [];

      const branchList = Array.isArray(branchesRes.data)
        ? branchesRes.data
        : Array.isArray(branchesRes.data?.data)
        ? branchesRes.data.data
        : [];

      setInquiries(list);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load service inquiries', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await apiClient.put(`/services/admin/inquiries/${id}/status`, { status });
      loadData();
    } catch (err) {
      alert('Failed to update inquiry status');
    }
  };

  const handlePaymentStatusChange = async (id: number, paymentStatus: string) => {
    try {
      await apiClient.put(`/services/admin/inquiries/${id}/status`, { paymentStatus });
      loadData();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service inquiry record?')) return;
    try {
      await apiClient.delete(`/services/admin/inquiries/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to delete inquiry record');
    }
  };

  // Filtered List
  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (inq.bookingCode && inq.bookingCode.toLowerCase().includes(q)) ||
      (inq.customerName && inq.customerName.toLowerCase().includes(q)) ||
      (inq.customerEmail && inq.customerEmail.toLowerCase().includes(q)) ||
      (inq.companyName && inq.companyName.toLowerCase().includes(q)) ||
      (inq.notes && inq.notes.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const matchesBranch =
      selectedBranchFilter === 'all' || String(inq.branchId || inq.branch?.id) === String(selectedBranchFilter);

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Calculate Pipeline Metrics
  const totalCount = inquiries.length;
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
  const confirmedCount = inquiries.filter((i) => i.status === 'confirmed' || i.status === 'completed').length;
  const pipelineValue = inquiries.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Dedicated Service Leads & Solution Requests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
              Workspace Solution Inquiries Manager
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Manage corporate office requests, team seat inquiries, move-in dates, and solution quotes submitted from the /services portal.
            </p>
          </div>
        </div>

        {/* Analytics Counter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] p-4 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#94A3B8] block">Total Inquiries</span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">{totalCount}</span>
          </div>

          <div className="bg-[#1E293B] border border-[#F59E0B]/30 p-4 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#F59E0B] block flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" /> <span>Pending Review</span>
            </span>
            <span className="text-2xl font-extrabold text-[#F59E0B]">{pendingCount}</span>
          </div>

          <div className="bg-[#1E293B] border border-[#10B981]/30 p-4 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#10B981] block flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> <span>Confirmed Deals</span>
            </span>
            <span className="text-2xl font-extrabold text-[#10B981]">{confirmedCount}</span>
          </div>

          <div className="bg-[#1E293B] border border-[#6366F1]/30 p-4 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-[#6366F1] block flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5" /> <span>Pipeline Value (Est.)</span>
            </span>
            <span className="text-2xl font-extrabold text-[#F8FAFC]">₹{pipelineValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by customer name, email, company, or SRV- ref code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-[#CBD5E1] rounded-xl px-3 py-2 font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
            >
              <option value="all">All Locations ({inquiries.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] text-[#CBD5E1] rounded-xl px-3 py-2 font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Inquiries Data Table */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading service solution inquiries...</div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#1E293B] rounded-3xl border border-[#334155]">
            <Briefcase className="w-10 h-10 text-[#6366F1] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Inquiries Found</h3>
            <p className="text-xs text-[#94A3B8]">No service inquiries match your active search filters or branch selection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inq) => {
              let badgeColor = 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
              if (inq.status === 'confirmed' || inq.status === 'completed') {
                badgeColor = 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40';
              } else if (inq.status === 'cancelled') {
                badgeColor = 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40';
              }

              return (
                <div
                  key={inq.id}
                  className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-4 shadow-xs hover:border-[#6366F1]/50 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#6366F1]/40 text-[#6366F1] font-mono font-extrabold text-xs">
                        {inq.bookingCode}
                      </span>
                      <span className="text-[#94A3B8] font-semibold text-[11px] flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Submitted: {new Date(inq.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#CBD5E1]">Status:</span>
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border cursor-pointer ${badgeColor}`}
                      >
                        <option value="pending" className="bg-[#0F172A] text-white">Pending</option>
                        <option value="confirmed" className="bg-[#0F172A] text-white">Confirmed</option>
                        <option value="cancelled" className="bg-[#0F172A] text-white">Cancelled</option>
                        <option value="completed" className="bg-[#0F172A] text-white">Completed</option>
                      </select>

                      <span className="text-xs font-bold text-[#CBD5E1] pl-1">Payment:</span>
                      <select
                        value={inq.paymentStatus || 'unpaid'}
                        onChange={(e) => handlePaymentStatusChange(inq.id, e.target.value)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold border cursor-pointer ${
                          inq.paymentStatus === 'paid'
                            ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                            : 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40'
                        }`}
                      >
                        <option value="unpaid" className="bg-[#0F172A] text-white">Unpaid</option>
                        <option value="paid" className="bg-[#0F172A] text-white">Paid</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-1.5 rounded-lg bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F43F5E] hover:border-[#F43F5E]"
                        title="Delete inquiry record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Customer Info */}
                    <div className="space-y-1 bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
                      <span className="text-[10px] font-extrabold uppercase text-[#6366F1] block">Customer Details</span>
                      <p className="font-bold text-[#F8FAFC] text-sm">{inq.customerName}</p>
                      <p className="text-[#94A3B8]">{inq.customerEmail}</p>
                      {inq.customerPhone && <p className="text-[#94A3B8]">{inq.customerPhone}</p>}
                      {inq.companyName && (
                        <p className="text-[#CBD5E1] font-semibold pt-1">Company: {inq.companyName}</p>
                      )}
                    </div>

                    {/* Service & Branch Info */}
                    <div className="space-y-1 bg-[#0F172A] p-3 rounded-xl border border-[#334155]">
                      <span className="text-[10px] font-extrabold uppercase text-[#6366F1] block">Requested Offering</span>
                      <p className="font-bold text-[#F8FAFC] text-sm flex items-center space-x-1.5">
                        <Building2 className="w-4 h-4 text-[#6366F1]" />
                        <span>{inq.notes?.split('|')[0] || 'Workspace Solution'}</span>
                      </p>
                      <p className="text-[#CBD5E1] font-semibold flex items-center space-x-1 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-pink-400" />
                        <span>{inq.branch?.name || 'Branch Location'} ({inq.branch?.city})</span>
                      </p>
                      {inq.preferredDate && (
                        <p className="text-[#94A3B8] pt-0.5">
                          Target Move-in: <strong>{new Date(inq.preferredDate).toLocaleDateString()}</strong>
                        </p>
                      )}
                    </div>

                    {/* Financial Estimate & Notes */}
                    <div className="space-y-1 bg-[#0F172A] p-3 rounded-xl border border-[#334155] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-[#6366F1]">Negotiated Quote</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setChatInquiry(inq)}
                              className="px-2 py-0.5 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#818cf8] font-bold text-[10px] flex items-center space-x-1 hover:bg-[#6366F1]/30 transition-all"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Live Chat</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const val = prompt('Enter negotiated custom quote amount (₹):', String(inq.totalAmount || 0));
                                if (val !== null && !isNaN(Number(val))) {
                                  apiClient.put(`/services/admin/inquiries/${inq.id}/status`, { totalAmount: Number(val) })
                                    .then(() => loadData())
                                    .catch(() => alert('Failed to update quote amount'));
                                }
                              }}
                              className="text-[10px] font-bold text-[#6366F1] hover:underline"
                            >
                              ✏️ Edit Quote
                            </button>
                          </div>
                        </div>
                        <p className="text-lg font-extrabold text-[#10B981]">₹{Number(inq.totalAmount || 0).toLocaleString()}</p>
                      </div>

                      {inq.notes && (
                        <p className="text-[11px] text-[#94A3B8] italic border-t border-[#334155] pt-1 mt-1 line-clamp-2">
                          "{inq.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {chatInquiry && (
          <InquiryChatModal
            inquiry={chatInquiry}
            isOpen={!!chatInquiry}
            onClose={() => setChatInquiry(null)}
            currentUserType="admin"
            currentUserName="Community Manager"
            onInquiryUpdated={() => loadData()}
          />
        )}
      </main>
    </div>
  );
}
