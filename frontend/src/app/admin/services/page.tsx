'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ImageUploader from '@/components/ui/ImageUploader';
import MultiImageUploader from '@/components/ui/MultiImageUploader';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Power,
  Images,
  Building2,
  Briefcase,
  Laptop,
  Globe,
  ShieldCheck,
  Coffee,
  Users,
  Wifi,
  Sparkles,
  Search,
  X,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const PRESET_SERVICE_PHOTOS = [
  { label: 'Hot Desking Area', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dedicated Suite', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Private Cabin Office', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80' },
  { label: 'Conference & Event Space', url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80' },
];

const CATEGORY_ICONS = [
  { name: 'Building2', icon: Building2, label: 'Building Suite' },
  { name: 'Briefcase', icon: Briefcase, label: 'Corporate Office' },
  { name: 'Laptop', icon: Laptop, label: 'Tech Workspace' },
  { name: 'Globe', icon: Globe, label: 'Virtual Office' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'GST & Legal' },
  { name: 'Coffee', icon: Coffee, label: 'Lounge & Cafe' },
  { name: 'Users', icon: Users, label: 'Team Cabins' },
  { name: 'Wifi', icon: Wifi, label: 'High-Speed Hub' },
  { name: 'Sparkles', icon: Sparkles, label: 'Premium VIP' },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    branchId: 1 as number,
    slug: '',
    shortDescription: '',
    fullDescription: '',
    startingPrice: 5000,
    sortOrder: 1,
    icon: 'Building2',
    imageUrl: PRESET_SERVICE_PHOTOS[0].url,
    galleryImages: [] as string[],
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadServices() {
    setLoading(true);
    try {
      const [servicesRes, branchesRes] = await Promise.all([
        apiClient.get('/services?all=true'),
        apiClient.get('/branches/admin/all').catch(() => apiClient.get('/branches')),
      ]);
      const list = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.data || []);
      const branchList = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.data || []);
      setServices(list);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load services or branches', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const handleToggleActive = async (service: any) => {
    try {
      await apiClient.put(`/services/${service.id}`, { isActive: !service.isActive });
      loadServices();
    } catch (err) {
      alert('Failed to toggle service active status');
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      branchId: branches[0]?.id || 1,
      slug: '',
      shortDescription: '',
      fullDescription: '',
      startingPrice: 5000,
      sortOrder: services.length + 1,
      icon: 'Building2',
      imageUrl: PRESET_SERVICE_PHOTOS[0].url,
      galleryImages: [],
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      branchId: service.branchId || service.branch?.id || branches[0]?.id || 1,
      slug: service.slug || '',
      shortDescription: service.shortDescription || '',
      fullDescription: service.detailedDescription || service.fullDescription || '',
      startingPrice: Number(service.startingPrice || 5000),
      sortOrder: Number(service.sortOrder || 1),
      icon: service.iconClass || service.icon || 'Building2',
      imageUrl: service.featuredImage || service.imageUrl || PRESET_SERVICE_PHOTOS[0].url,
      galleryImages: Array.isArray(service.galleryImages) ? service.galleryImages : [],
      isActive: Boolean(service.isActive ?? true),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        branchId: Number(formData.branchId || 1),
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        startingPrice: Number(formData.startingPrice),
        sortOrder: Number(formData.sortOrder),
        detailedDescription: formData.fullDescription,
        featuredImage: formData.imageUrl,
        iconClass: formData.icon,
      };

      if (editingService) {
        await apiClient.put(`/services/${editingService.id}`, payload);
      } else {
        await apiClient.post('/services', payload);
      }
      setShowModal(false);
      loadServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save service solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workspace solution?')) return;
    try {
      await apiClient.delete(`/services/${id}`);
      setShowModal(false);
      loadServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const filteredServices = services.filter((srv: any) => {
    const matchesSearch =
      !searchQuery.trim() ||
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.shortDescription && srv.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? srv.isActive : !srv.isActive);

    const matchesBranch =
      selectedBranchFilter === 'all' || String(srv.branchId || srv.branch?.id) === String(selectedBranchFilter);

    return matchesSearch && matchesStatus && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Workspace Solutions Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Workspace Solutions & Offerings Manager</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage private office suites, starting prices (₹), detailed descriptions, gallery photos, icons, and status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-bold text-white flex items-center space-x-2 w-fit shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workspace Solution</span>
          </button>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search solutions by name or summary..."
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
              <option value="all">All Locations ({services.length})</option>
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
              <option value="active">Active Only ({services.filter((s) => s.isActive).length})</option>
              <option value="draft">Draft / Inactive ({services.filter((s) => !s.isActive).length})</option>
            </select>
          </div>
        </div>

        {/* Services Showcase Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-semibold text-[#94A3B8]">Loading workspace solutions catalog...</div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#1E293B] rounded-3xl border border-[#334155]">
            <FileText className="w-10 h-10 text-[#6366F1] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Workspace Solutions Found</h3>
            <p className="text-xs text-[#94A3B8]">No solutions match your active search filters.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-[#6366F1] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Workspace Solution</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const galleryCount = Array.isArray(service.galleryImages) ? service.galleryImages.length : 0;
              const IconComp = CATEGORY_ICONS.find((i) => i.name === service.iconClass)?.icon || Building2;

              return (
                <div
                  key={service.id}
                  className={`bg-[#1E293B] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between shadow-xs ${
                    service.isActive ? 'border-[#334155]' : 'border-[#F43F5E]/40 bg-[#F43F5E]/5'
                  }`}
                >
                  {/* Solution Cover Photo */}
                  <div className="h-40 w-full relative overflow-hidden bg-[#0F172A]">
                    <img
                      src={service.featuredImage || service.imageUrl || PRESET_SERVICE_PHOTOS[0].url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#020617]/80 text-[#10B981] border border-[#10B981]/30 backdrop-blur-xs">
                        Starting ₹{service.startingPrice || 5000}/mo
                      </span>
                    </div>

                    <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#020617]/80 text-[#94A3B8] border border-[#334155]">
                      Order #{service.sortOrder || 1}
                    </span>
                  </div>

                  <div className="p-5 space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center border border-[#6366F1]/30">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-extrabold text-[#F8FAFC]">{service.name}</h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(service)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                            service.isActive
                              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                              : 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/40'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{service.isActive ? 'Active' : 'Draft'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">{service.shortDescription}</p>

                      {service.detailedDescription && (
                        <p className="text-[11px] text-[#CBD5E1] bg-[#0F172A] p-2.5 rounded-xl border border-[#334155] line-clamp-2 italic">
                          "{service.detailedDescription}"
                        </p>
                      )}

                      {galleryCount > 0 && (
                        <div className="flex items-center space-x-1.5 text-[10px] text-[#6366F1] font-semibold pt-1">
                          <Images className="w-3.5 h-3.5" />
                          <span>{galleryCount} Showcase Photos Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#334155] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] border border-[#334155] text-xs font-bold text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#6366F1] flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Solution</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 rounded-xl bg-[#0F172A] border border-[#334155] text-[#F43F5E] hover:bg-[#F43F5E]/10 cursor-pointer"
                        title="Delete Solution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULLY POPULATED ADD / EDIT SOLUTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-2xl w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-full bg-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                {editingService ? 'Solution Configurator' : 'Create Workspace Solution'}
              </span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">
                {editingService ? `Edit Solution: ${editingService.name}` : 'Add Workspace Solution'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Cover Image & Presets */}
              <div className="space-y-2">
                <label className="block text-[#CBD5E1] font-semibold">Featured Solution Cover Image</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {PRESET_SERVICE_PHOTOS.map((photo) => (
                    <div
                      key={photo.label}
                      onClick={() => setFormData({ ...formData, imageUrl: photo.url })}
                      className={`relative h-16 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        formData.imageUrl === photo.url ? 'border-[#6366F1] ring-2 ring-[#6366F1]' : 'border-[#334155] opacity-70'
                      }`}
                    >
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.5 truncate px-1">
                        {photo.label}
                      </span>
                    </div>
                  ))}
                </div>

                <ImageUploader
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  label="Featured Cover Image"
                />
              </div>

              {/* Branch Assignment Selector */}
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Branch Location *</label>
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}, {b.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Solution Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dedicated Private Office Suite"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. dedicated-office-suite"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Price, Sort Order, Icon Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Starting Price (₹/mo) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Category Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
                  >
                    {CATEGORY_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Short & Detailed Descriptions */}
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Short Summary Description *</label>
                <input
                  type="text"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief 1-line summary for workspace cards..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Detailed Overview & Full Specifications</label>
                <textarea
                  rows={4}
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  placeholder="Comprehensive details on seating options, ergonomics, inclusions, GST benefits, espresso bar access, 24/7 security..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none resize-y"
                ></textarea>
              </div>

              {/* Showcase Gallery Photos */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2">
                <span className="text-[#94A3B8] font-bold block text-[11px]">Showcase Photo Gallery (Multiple Photos)</span>
                <MultiImageUploader
                  value={formData.galleryImages}
                  onChange={(urls) => setFormData({ ...formData, galleryImages: urls })}
                  label="Upload Additional Solution Photos"
                />
              </div>

              {/* Active Status Switch */}
              <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#0F172A] border border-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#6366F1] accent-[#6366F1]"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#F8FAFC] block">Publish Workspace Solution Active</span>
                  <span className="text-[10px] text-[#94A3B8]">Visible on public offerings page and member portal</span>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                {editingService ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingService.id)}
                    className="px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Solution</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-full bg-[#0F172A] border border-[#334155] text-[#CBD5E1] text-xs font-bold hover:text-[#F8FAFC]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>{submitting ? 'Saving Solution...' : 'Save Workspace Solution'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
