'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Compass,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useBranch } from '@/context/BranchContext';

interface BranchItem {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  _count?: {
    floorMaps: number;
    meetingRooms: number;
    services: number;
    users: number;
  };
}

export default function AdminBranchesPage() {
  const { refreshBranches } = useBranch();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    latitude: '',
    longitude: '',
    isActive: true,
  });

  const fetchAdminBranches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/branches/admin/all');
      setBranches(res.data || []);
    } catch (err) {
      console.error('Failed to load admin branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminBranches();
  }, []);

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      slug: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      openingTime: '08:00 AM',
      closingTime: '08:00 PM',
      latitude: '',
      longitude: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (branch: BranchItem) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      slug: branch.slug || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      zip: branch.zip || '',
      phone: branch.phone || '',
      email: branch.email || '',
      openingTime: branch.openingTime || '08:00 AM',
      closingTime: branch.closingTime || '08:00 PM',
      latitude: branch.latitude ? String(branch.latitude) : '',
      longitude: branch.longitude ? String(branch.longitude) : '',
      isActive: branch.isActive,
    });
    setModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: editingBranch
        ? prev.slug
        : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Branch name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBranch) {
        await apiClient.put(`/branches/${editingBranch.id}`, formData);
      } else {
        await apiClient.post('/branches', formData);
      }
      setModalOpen(false);
      await fetchAdminBranches();
      await refreshBranches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save branch location.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branchId: number) => {
    try {
      await apiClient.put(`/branches/${branchId}/status`);
      await fetchAdminBranches();
      await refreshBranches();
    } catch (err) {
      alert('Failed to toggle branch status.');
    }
  };

  const handleDelete = async (branchId: number, branchName: string) => {
    if (confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      try {
        await apiClient.delete(`/branches/${branchId}`);
        await fetchAdminBranches();
        await refreshBranches();
      } catch (err) {
        alert('Failed to delete branch.');
      }
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8 space-y-6 overflow-y-auto pt-16 md:pt-8">
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
              Location & Infrastructure Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mt-0.5">
              Branch Locations Directory
            </h1>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-pink-600/25 flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch name, city, or address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1E293B] border border-[#334155] text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          <div className="text-xs font-bold text-[#94A3B8]">
            Total Locations: <span className="text-[#F8FAFC] font-extrabold">{branches.length}</span>
          </div>
        </div>

        {/* Branch Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-[#1E293B]/60 rounded-2xl animate-pulse border border-[#334155]" />
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center bg-[#1E293B]/40 rounded-2xl border border-[#334155] space-y-3">
            <MapPin className="w-10 h-10 text-[#6366F1] mx-auto" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">No Branch Locations Found</h3>
            <p className="text-xs text-[#94A3B8]">Click "Add New Branch" above to register a new coworking location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className={`bg-[#1E293B] rounded-2xl p-5 border transition-all space-y-4 relative flex flex-col justify-between ${
                  branch.isActive ? 'border-[#334155] hover:border-[#6366F1]/50' : 'border-rose-900/40 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top Pill & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-wide">
                      {branch.city || 'City N/A'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(branch.id)}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                        branch.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {branch.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Location</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Slug */}
                  <div>
                    <h3 className="text-base font-extrabold text-[#F8FAFC] truncate">{branch.name}</h3>
                    <p className="text-[10px] font-mono text-[#94A3B8] truncate">/{branch.slug}</p>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 pt-1 text-xs text-[#CBD5E1]">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px]">{branch.address}, {branch.city}, {branch.state} {branch.zip}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[11px]">{branch.openingTime} - {branch.closingTime}</span>
                    </div>

                    {branch.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px]">{branch.phone}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-[11px] truncate">{branch.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Linked Inventory Counters */}
                  {branch._count && (
                    <div className="pt-2 grid grid-cols-3 gap-2 border-t border-[#334155]/60 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-[#0F172A] border border-[#334155]">
                        <p className="font-extrabold text-[#F8FAFC]">{branch._count.floorMaps || 0}</p>
                        <p className="text-[#94A3B8]">Floor Maps</p>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0F172A] border border-[#334155]">
                        <p className="font-extrabold text-[#F8FAFC]">{branch._count.meetingRooms || 0}</p>
                        <p className="text-[#94A3B8]">Meeting Rooms</p>
                      </div>
                      <div className="p-2 rounded-xl bg-[#0F172A] border border-[#334155]">
                        <p className="font-extrabold text-[#F8FAFC]">{branch._count.services || 0}</p>
                        <p className="text-[#94A3B8]">Services</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#334155] flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(branch)}
                    className="px-3 py-1.5 rounded-lg bg-[#334155] hover:bg-[#475569] text-[#F8FAFC] text-xs font-extrabold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(branch.id, branch.name)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-extrabold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#F8FAFC]">
                    {editingBranch ? 'Edit Branch Location' : 'Register New Branch Location'}
                  </h2>
                  <p className="text-[10px] text-[#94A3B8]">
                    {editingBranch ? `Updating #${editingBranch.id} - ${editingBranch.name}` : 'Add a new active coworking space hub'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">Branch Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Downtown Main Hub"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">URL Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. downtown-main-hub"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#CBD5E1]">Street Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 100 Innovation Boulevard, Suite 500"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Tech City"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. CA"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">ZIP Code *</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="e.g. 90001"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 300-2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. downtown@cowork30.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">Opening Time</label>
                  <input
                    type="text"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    placeholder="e.g. 08:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#CBD5E1]">Closing Time</label>
                  <input
                    type="text"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    placeholder="e.g. 08:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-[#0F172A] border-[#334155]"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-[#F8FAFC] cursor-pointer">
                  Mark Branch as Active & Visible in Location Selector
                </label>
              </div>

              <div className="pt-4 border-t border-[#334155] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#334155] hover:bg-[#475569] text-[#F8FAFC] font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 text-white font-extrabold shadow-lg shadow-pink-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Location...' : editingBranch ? 'Save Branch Changes' : 'Create Branch Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
