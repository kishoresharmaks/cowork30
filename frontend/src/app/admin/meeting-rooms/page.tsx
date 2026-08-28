'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ImageUploader from '@/components/ui/ImageUploader';
import {
  Building2,
  Plus,
  Edit2,
  Clock,
  Users,
  Save,
  Power,
  ShieldCheck,
  Tag,
  Check,
  X,
  MapPin,
  FileText,
  Sparkles,
  DollarSign,
  Layers,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function formatTime12Hr(timeStr?: string | null): string {
  if (!timeStr) return '24/7 Access';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

const PRESET_CATEGORIES = [
  'Conference Room',
  'Executive Boardroom',
  'Interview Suite',
  'Podcast / Media Studio',
  'Workshop & Training Hall',
  'Innovation Pod',
  'Private Office Suite',
];

const PRESET_AMENITIES = [
  'High-Speed Wi-Fi',
  '4K Display / Smart TV',
  'Interactive Whiteboard',
  'HD Video Conferencing',
  'Air Conditioning',
  'Soundproof Walls',
  'Coffee & Refreshments',
  'HDMI & Type-C Adapters',
];

export default function AdminMeetingRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [floorMaps, setFloorMaps] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    branchId: 1 as number,
    category: 'Conference Room',
    description: '',
    imageUrl: '',
    perSeatPrice: 150,
    minSeats: 2,
    maxSeats: 10,
    hourlyRate: 300,
    dailyRate: 2400,
    serviceChargeType: 'fixed',
    serviceChargeValue: 200,
    startTime: '08:00',
    endTime: '20:00',
    is24Hours: false,
    amenities: ['High-Speed Wi-Fi', 'Interactive Whiteboard'] as string[],
    floorMapId: null as number | null,
    xCoordinate: '' as string | number,
    yCoordinate: '' as string | number,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadRoomsAndFloors() {
    setLoading(true);
    try {
      const [roomsRes, floorsRes, branchesRes] = await Promise.all([
        apiClient.get('/meeting-rooms?all=true'),
        apiClient.get('/floor-map/floors/all'),
        apiClient.get('/branches/admin/all').catch(() => apiClient.get('/branches')),
      ]);
      const roomsList = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data?.data || []);
      const floorsList = Array.isArray(floorsRes.data)
        ? floorsRes.data
        : (Array.isArray(floorsRes.data?.floors)
        ? floorsRes.data.floors
        : floorsRes.data?.data || []);
      const branchesList = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.data || []);

      setRooms(roomsList);
      setFloorMaps(floorsList);
      setBranches(branchesList);
    } catch (err) {
      console.error('Failed to load catalog, floor maps, or branches', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoomsAndFloors();
  }, []);

  const handleToggleActive = async (room: any) => {
    try {
      await apiClient.put(`/meeting-rooms/${room.id}`, { isActive: !room.isActive });
      loadRoomsAndFloors();
    } catch (err) {
      alert('Failed to toggle room active status');
    }
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setIsCustomCategory(false);
    setCustomAmenityInput('');
    setFormData({
      name: '',
      branchId: branches[0]?.id || 1,
      category: 'Conference Room',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80',
      perSeatPrice: 150,
      minSeats: 2,
      maxSeats: 12,
      hourlyRate: 300,
      dailyRate: 2400,
      serviceChargeType: 'fixed',
      serviceChargeValue: 200,
      startTime: '08:00',
      endTime: '20:00',
      is24Hours: false,
      amenities: ['High-Speed Wi-Fi', '4K Display / Smart TV', 'Interactive Whiteboard'],
      floorMapId: floorMaps[0]?.id || null,
      xCoordinate: '',
      yCoordinate: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    const roomCategory = room.category || 'Conference Room';
    setIsCustomCategory(!PRESET_CATEGORIES.includes(roomCategory));
    setCustomAmenityInput('');
    const hasCustomHours = Boolean(room.startTime && room.endTime);
    const existingImage =
      room.imageUrl ||
      room.featuredImage ||
      (Array.isArray(room.images) && room.images.length > 0
        ? room.images[0]
        : typeof room.images === 'string'
        ? room.images
        : '') ||
      '';

    let parsedAmenities: string[] = ['High-Speed Wi-Fi'];
    if (Array.isArray(room.amenities)) {
      parsedAmenities = room.amenities;
    } else if (typeof room.amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(room.amenities);
      } catch (e) {
        parsedAmenities = [room.amenities];
      }
    }

    setFormData({
      name: room.name,
      branchId: room.branchId || room.branch?.id || branches[0]?.id || 1,
      category: roomCategory,
      description: room.description || '',
      imageUrl: existingImage,
      perSeatPrice: Number(room.perSeatPrice || 150),
      minSeats: Number(room.minSeats || 1),
      maxSeats: Number(room.maxSeats || room.capacity || 10),
      hourlyRate: Number(room.hourlyRate || 300),
      dailyRate: Number(room.dailyRate || 2400),
      serviceChargeType: room.serviceChargeType || 'fixed',
      serviceChargeValue: Number(room.serviceChargeValue || 0),
      startTime: room.startTime || '08:00',
      endTime: room.endTime || '20:00',
      is24Hours: !hasCustomHours,
      amenities: parsedAmenities,
      floorMapId: room.floorMapId || null,
      xCoordinate: room.xCoordinate !== null && room.xCoordinate !== undefined ? room.xCoordinate : '',
      yCoordinate: room.yCoordinate !== null && room.yCoordinate !== undefined ? room.yCoordinate : '',
      isActive: room.isActive ?? true,
    });
    setShowModal(true);
  };

  const toggleAmenity = (item: string) => {
    if (formData.amenities.includes(item)) {
      setFormData({ ...formData, amenities: formData.amenities.filter((a) => a !== item) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, item] });
    }
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    const clean = customAmenityInput.trim();
    if (!formData.amenities.includes(clean)) {
      setFormData({ ...formData, amenities: [...formData.amenities, clean] });
    }
    setCustomAmenityInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.category.trim()) {
      alert('Please select or enter a custom category name.');
      return;
    }

    if (!formData.is24Hours) {
      if (!formData.startTime || !formData.endTime) {
        alert('Please specify both Start Time and End Time in 24hr format (e.g. 08:00 - 20:00), or check 24/7 Access.');
        return;
      }
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        alert('Start Time must be strictly earlier than End Time.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { is24Hours, ...restData } = formData;
      const payload = {
        ...restData,
        branchId: Number(formData.branchId || 1),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        startTime: is24Hours ? null : formData.startTime,
        endTime: is24Hours ? null : formData.endTime,
        floorMapId: formData.floorMapId ? Number(formData.floorMapId) : null,
        xCoordinate: formData.xCoordinate !== '' ? Number(formData.xCoordinate) : null,
        yCoordinate: formData.yCoordinate !== '' ? Number(formData.yCoordinate) : null,
      };

      if (editingRoom) {
        await apiClient.put(`/meeting-rooms/${editingRoom.id}`, payload);
      } else {
        await apiClient.post('/meeting-rooms', payload);
      }
      setShowModal(false);
      loadRoomsAndFloors();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save meeting room');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCategories = ['All', ...Array.from(new Set(rooms.map((r) => r.category || 'Conference Room')))];
  const filteredRooms = rooms.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || (r.category || 'Conference Room') === selectedCategory;
    const matchesBranch = selectedBranchFilter === 'all' || String(r.branchId || r.branch?.id) === String(selectedBranchFilter);
    return matchesCategory && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Meeting Rooms Catalog Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Meeting Rooms & Seat Pricing Manager</h1>
            <p className="text-xs text-[#94A3B8]">
              Configure room descriptions, 24hr operating hours, service charges, amenities, and floor map pin positions.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-bold text-white flex items-center space-x-2 w-fit shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Suite</span>
          </button>
        </div>

        {/* Category & Branch Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-3">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Branch Location Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] font-extrabold focus:outline-none focus:border-[#6366F1]"
            >
              <option value="all">All Branch Locations ({rooms.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const imgUrl =
              room.imageUrl ||
              room.featuredImage ||
              (Array.isArray(room.images) && room.images.length > 0
                ? room.images[0]
                : typeof room.images === 'string'
                ? room.images
                : '') ||
              'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80';

            let roomAmenities: string[] = [];
            if (Array.isArray(room.amenities)) {
              roomAmenities = room.amenities;
            } else if (typeof room.amenities === 'string') {
              try {
                roomAmenities = JSON.parse(room.amenities);
              } catch (e) {
                roomAmenities = [room.amenities];
              }
            }

            const roomBranchName =
              room.branch?.name || branches.find((b) => b.id === (room.branchId || room.branch?.id))?.name || 'Branch Location';

            return (
              <div
                key={room.id}
                className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 space-y-4 shadow-xs relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-[#0F172A] border border-[#334155]">
                    <img src={imgUrl} alt={room.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#0F172A]/80 backdrop-blur-xs text-[#6366F1] border border-[#6366F1]/30">
                      {room.category || 'Conference Room'}
                    </div>

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[#0F172A]/80 backdrop-blur-xs border border-[#334155]">
                      {room.isActive ? (
                        <span className="text-[#10B981] flex items-center space-x-1">
                          <Check className="w-3 h-3" /> <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[#F43F5E] flex items-center space-x-1">
                          <X className="w-3 h-3" /> <span>Inactive</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold text-[#F8FAFC]">{room.name}</h3>
                      <span className="text-xs font-black text-[#10B981]">₹{room.hourlyRate}/hr</span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-extrabold flex items-center space-x-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{roomBranchName}</span>
                      </span>
                    </div>

                    {room.description && (
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">{room.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#CBD5E1] font-semibold">
                        Per Seat: ₹{room.perSeatPrice || 0}/hr
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#CBD5E1] font-semibold">
                        Full Day: ₹{room.dailyRate || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0F172A] border border-[#334155] text-[#F59E0B] font-semibold">
                        Svc Charge:{' '}
                        {room.serviceChargeType === 'percentage'
                          ? `${room.serviceChargeValue}%`
                          : `₹${room.serviceChargeValue}`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#334155] grid grid-cols-2 gap-2 text-xs text-[#CBD5E1]">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#6366F1]" />
                      <span>{room.minSeats} - {room.maxSeats || room.capacity} Seats</span>
                    </span>

                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
                      <span>
                        {room.startTime && room.endTime
                          ? `${formatTime12Hr(room.startTime)} - ${formatTime12Hr(room.endTime)}`
                          : '24/7 Access'}
                      </span>
                    </span>
                  </div>

                  {/* Amenities List */}
                  {roomAmenities.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-[#334155]">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block">
                        Included Amenities ({roomAmenities.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roomAmenities.map((am, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-[#6366F1]/10 border border-[#6366F1]/30 text-[10px] font-semibold text-[#6366F1]"
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#334155] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(room)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                      room.isActive
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                        : 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{room.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(room)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Suite Specs</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* EDIT / CREATE ROOM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-xl w-full p-6 space-y-5 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-bold p-1 rounded-full bg-[#0F172A]"
            >
              ✕
            </button>

            <div className="space-y-1 border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                Executive Suite Configuration
              </span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">
                {editingRoom ? `Edit Suite: ${editingRoom.name}` : 'Add New Meeting Room Suite'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Cover Image Upload */}
              <ImageUploader
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                label="Room Cover Image"
              />

              {/* Branch Assignment Selector */}
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Branch Location *</label>
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}, {b.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Room Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Executive Boardroom"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Category *</label>
                  <select
                    value={isCustomCategory ? 'custom' : formData.category}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomCategory(true);
                        setFormData({ ...formData, category: '' });
                      } else {
                        setIsCustomCategory(false);
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">Custom Category...</option>
                  </select>
                </div>
              </div>

              {isCustomCategory && (
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. VR Innovation Hub"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Room Detailed Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe room features, layout, ideal audience, and equipment details..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none resize-y"
                />
              </div>

              {/* Operating Hours (24-Hour Format) */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC] flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#6366F1]" />
                    <span>Operating Hours (24-Hour Format)</span>
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is24Hours}
                      onChange={(e) => setFormData({ ...formData, is24Hours: e.target.checked })}
                      className="accent-[#6366F1] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-bold text-[#10B981]">24/7 Round-the-Clock</span>
                  </label>
                </div>

                {!formData.is24Hours && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[#94A3B8] font-semibold mb-1">Start Time (24hr HH:mm) *</label>
                      <input
                        type="time"
                        required={!formData.is24Hours}
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#94A3B8] font-semibold mb-1">End Time (24hr HH:mm) *</label>
                      <input
                        type="time"
                        required={!formData.is24Hours}
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 text-[10px] text-[#6366F1] font-semibold">
                      Preview: Operating interval will be display formatted as{' '}
                      <strong>
                        {formatTime12Hr(formData.startTime)} - {formatTime12Hr(formData.endTime)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Base Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Full-Day Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Per-Seat Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.perSeatPrice}
                    onChange={(e) => setFormData({ ...formData, perSeatPrice: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Capacity Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Min Seats *</label>
                  <input
                    type="number"
                    required
                    value={formData.minSeats}
                    onChange={(e) => setFormData({ ...formData, minSeats: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Max Seats Capacity *</label>
                  <input
                    type="number"
                    required
                    value={formData.maxSeats}
                    onChange={(e) => setFormData({ ...formData, maxSeats: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Charges Configuration */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2">
                <span className="font-bold text-[#F8FAFC] flex items-center space-x-1.5">
                  <Tag className="w-4 h-4 text-[#F59E0B]" />
                  <span>Service Charge Configuration</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">Calculation Type</label>
                    <select
                      value={formData.serviceChargeType}
                      onChange={(e) => setFormData({ ...formData, serviceChargeType: e.target.value })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                    >
                      <option value="fixed">Fixed ₹ Amount</option>
                      <option value="percentage">Percentage % of Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">
                      Value ({formData.serviceChargeType === 'percentage' ? '%' : '₹'})
                    </label>
                    <input
                      type="number"
                      value={formData.serviceChargeValue}
                      onChange={(e) => setFormData({ ...formData, serviceChargeValue: Number(e.target.value) })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities Manager */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2.5">
                <span className="font-bold text-[#F8FAFC] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#6366F1]" />
                  <span>Room Amenities & Equipment</span>
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AMENITIES.map((item) => {
                    const isSelected = formData.amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#6366F1] text-white border-[#6366F1]'
                            : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-[#F8FAFC]'
                        }`}
                      >
                        {isSelected ? `✓ ${item}` : `+ ${item}`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="Add custom amenity..."
                    className="flex-1 bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-3 py-1.5 rounded-xl bg-[#6366F1] text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>

                {formData.amenities.length > 0 && (
                  <div className="pt-2 border-t border-[#334155] flex flex-wrap gap-1">
                    {formData.amenities.map((am) => (
                      <span
                        key={am}
                        className="px-2 py-0.5 rounded-md bg-[#6366F1]/10 border border-[#6366F1]/30 text-[10px] font-bold text-[#6366F1] flex items-center space-x-1"
                      >
                        <span>{am}</span>
                        <button
                          type="button"
                          onClick={() => toggleAmenity(am)}
                          className="hover:text-red-400 font-black ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Floor Map Association */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-2">
                <span className="font-bold text-[#F8FAFC] flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-[#10B981]" />
                  <span>Floor Map Placement & Coordinates</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">Associated Floor Map</label>
                    <select
                      value={formData.floorMapId || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, floorMapId: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                    >
                      <option value="">None / Unassigned</option>
                      {Array.isArray(floorMaps) &&
                        floorMaps.map((fm) => (
                          <option key={fm.id} value={fm.id}>
                            {fm.floorName} (Level {fm.floorLevel})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">X Coordinate</label>
                    <input
                      type="number"
                      value={formData.xCoordinate}
                      onChange={(e) => setFormData({ ...formData, xCoordinate: e.target.value })}
                      placeholder="e.g. 150"
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-semibold mb-1">Y Coordinate</label>
                    <input
                      type="number"
                      value={formData.yCoordinate}
                      onChange={(e) => setFormData({ ...formData, yCoordinate: e.target.value })}
                      placeholder="e.g. 320"
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submitting ? 'Saving Suite Specs...' : 'Save Meeting Room Suite Specs'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
