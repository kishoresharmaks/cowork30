'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Search,
  Filter,
  Zap,
  Sun,
  Grid,
  Maximize2,
  CheckCircle2,
  X,
  MapPin,
  Tag,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const SAMPLE_DESK_PHOTOS = [
  { label: 'Hot Desk Standard', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Window Dedicated Suite', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Private Cabin Suite', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80' },
  { label: 'Ergonomic Pod', url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=600&q=80' },
];

export default function AdminFloorMapPage() {
  const [floorMap, setFloorMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDesk, setSelectedDesk] = useState<any>(null);

  // Drag-and-drop state for 2D Canvas positioning
  const [draggingDeskId, setDraggingDeskId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapCanvasRef = React.useRef<HTMLDivElement>(null);

  // View Mode: 2D Spatial Canvas vs Catalog Cards Grid
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const handleMouseDownNode = (e: React.MouseEvent, desk: any) => {
    e.stopPropagation();
    setSelectedDesk(desk);
    setDraggingDeskId(desk.id);
    if (mapCanvasRef.current) {
      const rect = mapCanvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - (desk.xCoordinate || desk.xPosition || 100),
        y: e.clientY - rect.top - (desk.yCoordinate || desk.yPosition || 100),
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingDeskId || !mapCanvasRef.current) return;
    const rect = mapCanvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(Math.round(e.clientX - rect.left - dragOffset.x), Math.round(rect.width - 80)));
    const newY = Math.max(10, Math.min(Math.round(e.clientY - rect.top - dragOffset.y), Math.round(rect.height - 80)));

    setFloorMap((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        desks: prev.desks.map((d: any) => (d.id === draggingDeskId ? { ...d, xCoordinate: newX, yCoordinate: newY } : d)),
      };
    });
  };

  const handleMouseUpCanvas = async () => {
    if (!draggingDeskId || !floorMap) return;
    const movedDesk = floorMap.desks.find((d: any) => d.id === draggingDeskId);
    const targetDeskId = draggingDeskId;
    setDraggingDeskId(null);

    if (movedDesk) {
      try {
        await apiClient.put(`/floor-map/desk/${targetDeskId}`, {
          xCoordinate: movedDesk.xCoordinate,
          yCoordinate: movedDesk.yCoordinate,
        });
      } catch (err) {
        console.error('Failed to auto-save dragged desk position', err);
      }
    }
  };

  // Multi-Floor State
  const [allFloors, setAllFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  // Create Floor Modal State
  const [showCreateFloorModal, setShowCreateFloorModal] = useState(false);
  const [createFloorData, setCreateFloorData] = useState({
    floorName: '',
    floorLevel: 2,
    branchId: 1,
  });
  const [creatingFloor, setCreatingFloor] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Floor Plan Details Modal State
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [floorFormData, setFloorFormData] = useState({
    floorName: '',
    floorLevel: 1,
    branchName: '',
  });
  const [submittingFloor, setSubmittingFloor] = useState(false);

  // Modal State for Add/Edit Desk
  const [showDeskModal, setShowDeskModal] = useState(false);
  const [editingDesk, setEditingDesk] = useState<any>(null);
  const [formData, setFormData] = useState({
    deskNumber: '',
    deskType: 'hot_desk',
    status: 'available',
    monthlyPrice: 5000,
    dailyPrice: 500,
    xCoordinate: 150,
    yCoordinate: 150,
    width: 60,
    height: 60,
    hasPowerOutlet: true,
    hasWindowView: false,
    imageUrl: SAMPLE_DESK_PHOTOS[0].url,
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadFloorsList(preferredFloorId?: number) {
    try {
      const res = await apiClient.get('/floor-map/floors/all');
      const floors = res.data?.floors || [];
      setAllFloors(floors);

      const targetId = preferredFloorId || selectedFloorId || floors[0]?.id || 1;
      setSelectedFloorId(targetId);
      await loadFloorMap(targetId);
    } catch (err) {
      console.error('Failed to load floors list', err);
    }
  }

  async function loadFloorMap(floorId?: number) {
    try {
      setLoading(true);
      const targetId = floorId || selectedFloorId || 1;
      const res = await apiClient.get(`/floor-map/floor/${targetId}`);
      setFloorMap(res.data.floorMap);
      setSelectedFloorId(res.data.floorMap.id);
    } catch (err) {
      console.error('Failed to load floor map', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFloorsList();
  }, []);

  const openFloorModal = () => {
    setFloorFormData({
      floorName: floorMap?.floorName || 'Ground Floor Innovation Hub',
      floorLevel: Number(floorMap?.floorLevel || 1),
      branchName: floorMap?.branch?.name || 'Downtown Main Hub',
    });
    setShowFloorModal(true);
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorMap?.id) return;
    setSubmittingFloor(true);
    try {
      await apiClient.put(`/floor-map/${floorMap.id}`, floorFormData);
      setShowFloorModal(false);
      await loadFloorsList(floorMap.id);
      alert('Floor Plan & Branch details updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update floor details');
    } finally {
      setSubmittingFloor(false);
    }
  };

  const openCreateFloorModal = () => {
    const nextLevel = allFloors.length > 0 ? Math.max(...allFloors.map((f: any) => f.floorLevel || 1)) + 1 : 2;
    setCreateFloorData({
      floorName: `Floor ${nextLevel} Dedicated Suites`,
      floorLevel: nextLevel,
      branchId: floorMap?.branchId || 1,
    });
    setShowCreateFloorModal(true);
  };

  const handleCreateFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingFloor(true);
    try {
      const res = await apiClient.post('/floor-map/floor', createFloorData);
      setShowCreateFloorModal(false);
      alert(`Floor "${createFloorData.floorName}" created successfully!`);
      await loadFloorsList(res.data.floorMap.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create new floor');
    } finally {
      setCreatingFloor(false);
    }
  };

  const handleDeleteFloor = async (floorId: number, floorName: string) => {
    if (!confirm(`Are you sure you want to delete "${floorName}" and all desks on this floor?`)) return;
    try {
      await apiClient.delete(`/floor-map/floor/${floorId}`);
      alert('Floor deleted successfully');
      await loadFloorsList();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete floor');
    }
  };

  const openCreateModal = () => {
    setEditingDesk(null);
    setFormData({
      deskNumber: `A-${(floorMap?.desks?.length || 0) + 101}`,
      deskType: 'hot_desk',
      status: 'available',
      monthlyPrice: 5000,
      dailyPrice: 500,
      xCoordinate: 150,
      yCoordinate: 150,
      width: 60,
      height: 60,
      hasPowerOutlet: true,
      hasWindowView: false,
      imageUrl: SAMPLE_DESK_PHOTOS[0].url,
    });
    setShowDeskModal(true);
  };

  const openEditModal = (desk: any) => {
    setEditingDesk(desk);
    setFormData({
      deskNumber: desk.deskNumber || '',
      deskType: desk.deskType || 'hot_desk',
      status: desk.status || 'available',
      monthlyPrice: Number(desk.monthlyPrice || 5000),
      dailyPrice: Number(desk.dailyPrice || 500),
      xCoordinate: Number(desk.xCoordinate ?? desk.xPosition ?? 100),
      yCoordinate: Number(desk.yCoordinate ?? desk.yPosition ?? 100),
      width: Number(desk.width || 60),
      height: Number(desk.height || 60),
      hasPowerOutlet: Boolean(desk.hasPowerOutlet),
      hasWindowView: Boolean(desk.hasWindowView),
      imageUrl: desk.imageUrl || SAMPLE_DESK_PHOTOS[0].url,
    });
    setShowDeskModal(true);
  };

  const handleDeskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        xCoordinate: Number(formData.xCoordinate),
        yCoordinate: Number(formData.yCoordinate),
        width: Number(formData.width || 60),
        height: Number(formData.height || 60),
        monthlyPrice: Number(formData.monthlyPrice),
        dailyPrice: Number(formData.dailyPrice),
        floorMapId: selectedFloorId || floorMap?.id || 1,
      };

      if (editingDesk) {
        await apiClient.put(`/floor-map/desk/${editingDesk.id}`, payload);
      } else {
        await apiClient.post('/floor-map/desk', payload);
      }
      setShowDeskModal(false);
      setSelectedDesk(null);
      await loadFloorsList(selectedFloorId || floorMap?.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save desk record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (deskId: number, status: string) => {
    try {
      await apiClient.put(`/floor-map/desk/${deskId}/status`, { status });
      await loadFloorsList(selectedFloorId || floorMap?.id);
      if (selectedDesk?.id === deskId) {
        setSelectedDesk((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteDesk = async (deskId: number) => {
    if (!confirm('Are you sure you want to delete this desk node from the floor map?')) return;
    try {
      await apiClient.delete(`/floor-map/desk/${deskId}`);
      setSelectedDesk(null);
      setShowDeskModal(false);
      await loadFloorsList(selectedFloorId || floorMap?.id);
    } catch (err) {
      alert('Failed to delete desk');
    }
  };

  const allDesks = floorMap?.desks || [];

  const filteredDesks = allDesks.filter((desk: any) => {
    const matchesSearch =
      !searchQuery.trim() ||
      desk.deskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desk.deskType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || desk.status === statusFilter;
    const matchesType = typeFilter === 'all' || desk.deskType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Spatial 2D Layout & Desk Editor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">2D Floor Map & Desk Position Manager</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage 2D spatial desk positions, rates (₹), category types, power outlets, window views, and live availability.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={openFloorModal}
              className="px-4 py-2.5 rounded-full bg-[#1E293B] border border-[#334155] hover:border-[#6366F1] text-xs font-bold text-[#CBD5E1] hover:text-[#F8FAFC] cursor-pointer"
            >
              <span>Edit Floor Info</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-bold text-white flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Desk Node</span>
            </button>
          </div>
        </div>

        {/* FLOOR SELECTOR TABS BAR */}
        <div className="bg-[#1E293B] p-3.5 rounded-2xl border border-[#334155] flex items-center justify-between gap-4 overflow-x-auto shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#94A3B8] flex items-center space-x-1 pl-2 pr-1">
              <Layers className="w-4 h-4 text-[#6366F1]" />
              <span>Floors ({allFloors.length}):</span>
            </span>

            {allFloors.map((fl: any) => {
              const isActive = fl.id === (selectedFloorId || floorMap?.id);
              const deskCount = fl.desks?.length || 0;

              return (
                <div
                  key={fl.id}
                  onClick={() => {
                    setSelectedFloorId(fl.id);
                    setSelectedDesk(null);
                    loadFloorMap(fl.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#6366F1] text-white shadow-xs'
                      : 'bg-[#0F172A] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>Level {fl.floorLevel}: {fl.floorName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isActive ? 'bg-black/30 text-white font-mono' : 'bg-[#1E293B] text-[#94A3B8] font-mono'
                    }`}
                  >
                    {deskCount} {deskCount === 1 ? 'desk' : 'desks'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openCreateFloorModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] border border-[#334155] hover:border-[#6366F1] text-xs font-bold text-[#6366F1] flex items-center space-x-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Floor</span>
          </button>
        </div>

        {/* SEARCH & FILTERS BAR + VIEW MODE SWITCHER */}
        <div className="bg-[#1E293B] p-4 rounded-2xl border border-[#334155] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs text-xs">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search desk number (e.g. A-101) or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F172A] border border-[#334155] text-[#CBD5E1] rounded-xl px-3 py-2 font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#0F172A] border border-[#334155] text-[#CBD5E1] rounded-xl px-3 py-2 font-semibold focus:border-[#6366F1] focus:outline-none cursor-pointer"
              >
                <option value="all">All Desk Types</option>
                <option value="hot_desk">Hot Desk Flex</option>
                <option value="dedicated_desk">Dedicated Desk</option>
                <option value="private_cabin">Private Cabin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 bg-[#0F172A] p-1 rounded-xl border border-[#334155]">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'canvas' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>2D Spatial Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-[#6366F1] text-white shadow-xs' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Catalog Cards ({filteredDesks.length})</span>
            </button>
          </div>
        </div>

        {/* MAIN DISPLAY CONTENT */}
        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-[#94A3B8]">Loading spatial layout & floor maps...</div>
        ) : filteredDesks.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-[#1E293B] rounded-3xl border border-[#334155]">
            <Compass className="w-10 h-10 text-[#6366F1] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Desks Found</h3>
            <p className="text-xs text-[#94A3B8]">No desk nodes match the active search filters or floor selection.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-[#6366F1] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Desk Node</span>
            </button>
          </div>
        ) : viewMode === 'canvas' ? (
          /* 2D SPATIAL INTERACTIVE CANVAS VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span className="text-xs font-extrabold text-[#F8FAFC]">
                    Interactive 2D Spatial Map — Level {floorMap?.floorLevel}: {floorMap?.floorName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                    💡 Drag & Drop Desks Visually
                  </span>
                </div>
              </div>

              {/* 2D Map Area with Drag & Drop */}
              <div
                ref={mapCanvasRef}
                onMouseMove={handleMouseMoveCanvas}
                onMouseUp={handleMouseUpCanvas}
                onMouseLeave={handleMouseUpCanvas}
                className="relative w-full h-[520px] bg-[#0F172A] rounded-2xl border border-[#334155] overflow-hidden shadow-inner select-none cursor-crosshair"
              >
                {/* Canvas Grid Lines Background */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#6366F1 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                ></div>

                {/* Drag Tip Floating Banner */}
                <div className="absolute top-3 left-3 z-30 bg-[#0F172A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#6366F1]/40 text-[11px] font-bold text-[#CBD5E1] shadow-lg flex items-center space-x-2 pointer-events-none">
                  <Compass className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />
                  <span>
                    {draggingDeskId
                      ? `Dragging Desk #${floorMap?.desks?.find((d: any) => d.id === draggingDeskId)?.deskNumber || ''}... release to save!`
                      : 'Click & Drag any desk marker to position visually! X/Y coords update automatically.'}
                  </span>
                </div>

                {/* Desk Node Markers */}
                {filteredDesks.map((desk: any) => {
                  const isSelected = selectedDesk?.id === desk.id;
                  const isDraggingThis = draggingDeskId === desk.id;
                  const xPos = Math.min(Math.max(desk.xCoordinate || desk.xPosition || 100, 10), 820);
                  const yPos = Math.min(Math.max(desk.yCoordinate || desk.yPosition || 100, 10), 440);

                  let badgeColor = 'bg-[#10B981] text-white border-[#10B981]';
                  if (desk.status === 'reserved' || desk.status === 'occupied') {
                    badgeColor = 'bg-[#F43F5E] text-white border-[#F43F5E]';
                  } else if (desk.status === 'maintenance') {
                    badgeColor = 'bg-[#F59E0B] text-white border-[#F59E0B]';
                  }

                  return (
                    <div
                      key={desk.id}
                      onMouseDown={(e) => handleMouseDownNode(e, desk)}
                      onClick={() => setSelectedDesk(desk)}
                      style={{
                        position: 'absolute',
                        left: `${xPos}px`,
                        top: `${yPos}px`,
                      }}
                      className={`group cursor-grab active:cursor-grabbing transition-all duration-75 z-10 hover:z-30 ${
                        isDraggingThis
                          ? 'scale-115 z-40 opacity-90'
                          : isSelected
                          ? 'scale-110'
                          : 'hover:scale-105'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-2xl border-2 shadow-lg flex flex-col items-center justify-center space-y-1 transition-all ${
                          isDraggingThis
                            ? 'bg-[#6366F1] border-white ring-4 ring-[#6366F1]/50 text-white shadow-2xl'
                            : isSelected
                            ? 'bg-[#1E293B] border-[#6366F1] ring-4 ring-[#6366F1]/30 shadow-[#6366F1]/40'
                            : 'bg-[#1E293B]/95 border-[#334155] hover:border-[#6366F1]'
                        }`}
                        style={{
                          minWidth: '75px',
                        }}
                      >
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          {desk.status}
                        </span>

                        <span className="font-extrabold text-xs text-[#F8FAFC] font-mono">{desk.deskNumber}</span>

                        <div className="flex items-center space-x-1 text-[10px] text-[#94A3B8]">
                          {desk.hasPowerOutlet && <span title="Power Outlet Available"><Zap className="w-3 h-3 text-[#F59E0B]" /></span>}
                          {desk.hasWindowView && <span title="Window Daylight View"><Sun className="w-3 h-3 text-[#38BDF8]" /></span>}
                          <span className="font-bold text-[#10B981]">₹{desk.dailyPrice}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Canvas Legend Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1 text-[#94A3B8]">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                    <span>Available</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></span>
                    <span>Reserved</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    <span>Maintenance</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-[#CBD5E1]">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-[#F59E0B]" />
                    <span>Power Outlet</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Sun className="w-3 h-3 text-[#38BDF8]" />
                    <span>Window View</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Desk Node Details Drawer */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-xs space-y-4">
              {selectedDesk ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1] block">
                        Selected Node
                      </span>
                      <h3 className="text-xl font-extrabold text-[#F8FAFC]">Desk #{selectedDesk.deskNumber}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedDesk)}
                      className="px-3 py-1.5 rounded-full bg-[#6366F1] text-white text-xs font-bold flex items-center space-x-1 hover:bg-[#4F46E5] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Specs</span>
                    </button>
                  </div>

                  <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-[#0F172A] border border-[#334155]">
                    <img
                      src={selectedDesk.imageUrl || SAMPLE_DESK_PHOTOS[0].url}
                      alt={selectedDesk.deskNumber}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border backdrop-blur-xs ${
                        selectedDesk.status === 'available'
                          ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                          : selectedDesk.status === 'reserved'
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                      }`}
                    >
                      {selectedDesk.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">Desk Category</span>
                      <span className="font-extrabold text-[#F8FAFC] uppercase text-[11px]">
                        {selectedDesk.deskType?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">2D Position (X, Y)</span>
                      <span className="font-mono font-bold text-[#6366F1]">
                        X: {selectedDesk.xCoordinate || selectedDesk.xPosition || 100}, Y:{' '}
                        {selectedDesk.yCoordinate || selectedDesk.yPosition || 100}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">Daily Rate</span>
                      <span className="font-extrabold text-[#10B981] text-sm">₹{selectedDesk.dailyPrice}/day</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-1">
                      <span className="text-[10px] text-[#94A3B8] font-semibold block">Monthly Pass</span>
                      <span className="font-extrabold text-[#10B981] text-sm">₹{selectedDesk.monthlyPrice}/mo</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155] space-y-2">
                    <span className="text-[10px] text-[#94A3B8] font-semibold block">Infrastructure & Features</span>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`flex items-center space-x-1 font-bold ${
                          selectedDesk.hasPowerOutlet ? 'text-[#F59E0B]' : 'text-[#64748B] line-through'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Power Outlet</span>
                      </span>
                      <span
                        className={`flex items-center space-x-1 font-bold ${
                          selectedDesk.hasWindowView ? 'text-[#38BDF8]' : 'text-[#64748B] line-through'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Window View</span>
                      </span>
                    </div>
                  </div>

                  {/* Status Change Toggles */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[#94A3B8] font-semibold block text-[11px]">Quick Status Override:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(selectedDesk.id, 'available')}
                        className={`py-1.5 rounded-xl font-bold text-[10px] uppercase border ${
                          selectedDesk.status === 'available'
                            ? 'bg-[#10B981] text-white border-[#10B981]'
                            : 'bg-[#0F172A] border-[#334155] text-[#94A3B8]'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(selectedDesk.id, 'reserved')}
                        className={`py-1.5 rounded-xl font-bold text-[10px] uppercase border ${
                          selectedDesk.status === 'reserved'
                            ? 'bg-[#F43F5E] text-white border-[#F43F5E]'
                            : 'bg-[#0F172A] border-[#334155] text-[#94A3B8]'
                        }`}
                      >
                        Reserved
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(selectedDesk.id, 'maintenance')}
                        className={`py-1.5 rounded-xl font-bold text-[10px] uppercase border ${
                          selectedDesk.status === 'maintenance'
                            ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                            : 'bg-[#0F172A] border-[#334155] text-[#94A3B8]'
                        }`}
                      >
                        Maint.
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteDesk(selectedDesk.id)}
                      className="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Desk Node</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-2 text-[#94A3B8]">
                  <Compass className="w-8 h-8 mx-auto text-[#6366F1]" />
                  <p className="font-semibold text-xs text-[#F8FAFC]">No Node Selected</p>
                  <p className="text-[11px]">Click any desk pin on the 2D map canvas to inspect or adjust specs.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CATALOG CARDS GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDesks.map((desk: any) => (
              <div
                key={desk.id}
                onClick={() => setSelectedDesk(desk)}
                className={`bg-[#1E293B] p-4 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-xs ${
                  selectedDesk?.id === desk.id
                    ? 'border-[#6366F1] ring-2 ring-[#6366F1]/30'
                    : 'border-[#334155] hover:border-[#94A3B8]'
                }`}
              >
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-[#0F172A] border border-[#334155]">
                  <img src={desk.imageUrl || SAMPLE_DESK_PHOTOS[0].url} alt={desk.deskNumber} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-2 right-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border backdrop-blur-xs ${
                      desk.status === 'available'
                        ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                        : desk.status === 'reserved'
                        ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40'
                        : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                    }`}
                  >
                    {desk.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#F8FAFC]">Desk #{desk.deskNumber}</span>
                  <span className="text-[10px] font-bold text-[#6366F1] uppercase">{desk.deskType?.replace('_', ' ')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Position: ({desk.xCoordinate || 100}, {desk.yCoordinate || 100})</span>
                  <div className="flex items-center space-x-1">
                    {desk.hasPowerOutlet && <Zap className="w-3 h-3 text-[#F59E0B]" />}
                    {desk.hasWindowView && <Sun className="w-3 h-3 text-[#38BDF8]" />}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#334155] flex items-center justify-between text-xs">
                  <span className="text-[#10B981] font-bold">₹{desk.dailyPrice}/day</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(desk);
                    }}
                    className="p-1.5 rounded bg-[#0F172A] border border-[#334155] text-[#CBD5E1] hover:text-[#F8FAFC]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FULLY POPULATED DESK ADD / EDIT MODAL */}
      {showDeskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-xl w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowDeskModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-full bg-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">
                {editingDesk ? 'Desk Node Editor' : 'Create New Spatial Node'}
              </span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">
                {editingDesk ? `Edit Desk #${editingDesk.deskNumber}` : 'Add New Desk Node'}
              </h3>
            </div>

            <form onSubmit={handleDeskSubmit} className="space-y-4 text-xs">
              {/* Basic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Desk Number / Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.deskNumber}
                    onChange={(e) => setFormData({ ...formData, deskNumber: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-mono"
                    placeholder="e.g. A-101"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Desk Category *</label>
                  <select
                    value={formData.deskType}
                    onChange={(e) => setFormData({ ...formData, deskType: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="hot_desk">Hot Desk Flex</option>
                    <option value="dedicated_desk">Dedicated Pro Desk</option>
                    <option value="private_cabin">Private Executive Cabin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Operational Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved / Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Pricing Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.dailyPrice}
                    onChange={(e) => setFormData({ ...formData, dailyPrice: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-semibold mb-1">Monthly Pass (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* 2D Canvas Position & Dimensions */}
              <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-[#334155] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-2">
                  <div>
                    <span className="text-[#6366F1] font-extrabold block text-xs">2D Spatial Position & Marker Size (px)</span>
                    <span className="text-[10px] text-[#94A3B8]">
                      Controls desk pin placement on the floor map canvas. (Or drag & drop directly on the 2D map screen!)
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] text-[#94A3B8] font-bold mr-1">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, xCoordinate: 320, yCoordinate: 200 })}
                      className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] hover:border-[#6366F1] text-[10px] font-bold text-[#CBD5E1]"
                      title="Place in center of floor map"
                    >
                      📍 Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, xCoordinate: 80, yCoordinate: 80 })}
                      className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] hover:border-[#6366F1] text-[10px] font-bold text-[#CBD5E1]"
                      title="Place top left"
                    >
                      ↖️ Top-Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, xCoordinate: 580, yCoordinate: 80 })}
                      className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] hover:border-[#6366F1] text-[10px] font-bold text-[#CBD5E1]"
                      title="Place top right"
                    >
                      ↗️ Top-Right
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[#CBD5E1] font-semibold mb-0.5">X Coord (px)</label>
                    <span className="block text-[9px] text-[#94A3B8] mb-1">Left to Right</span>
                    <input
                      type="number"
                      required
                      value={formData.xCoordinate}
                      onChange={(e) => setFormData({ ...formData, xCoordinate: Number(e.target.value) })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#CBD5E1] font-semibold mb-0.5">Y Coord (px)</label>
                    <span className="block text-[9px] text-[#94A3B8] mb-1">Top to Bottom</span>
                    <input
                      type="number"
                      required
                      value={formData.yCoordinate}
                      onChange={(e) => setFormData({ ...formData, yCoordinate: Number(e.target.value) })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#CBD5E1] font-semibold mb-0.5">Width (px)</label>
                    <span className="block text-[9px] text-[#94A3B8] mb-1">Marker Width</span>
                    <input
                      type="number"
                      required
                      value={formData.width}
                      onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#CBD5E1] font-semibold mb-0.5">Height (px)</label>
                    <span className="block text-[9px] text-[#94A3B8] mb-1">Marker Height</span>
                    <input
                      type="number"
                      required
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-1.5 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#0F172A] border border-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPowerOutlet}
                    onChange={(e) => setFormData({ ...formData, hasPowerOutlet: e.target.checked })}
                    className="w-4 h-4 rounded text-[#6366F1] accent-[#6366F1]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#F8FAFC] block flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Dedicated Power Outlet</span>
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">High-speed charging & surge socket</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 p-3 rounded-xl bg-[#0F172A] border border-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasWindowView}
                    onChange={(e) => setFormData({ ...formData, hasWindowView: e.target.checked })}
                    className="w-4 h-4 rounded text-[#6366F1] accent-[#6366F1]"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#F8FAFC] block flex items-center space-x-1">
                      <Sun className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Window Daylight View</span>
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">Natural sunlight & city view</span>
                  </div>
                </label>
              </div>

              {/* Showcase Image */}
              <div className="space-y-2">
                <label className="block text-[#CBD5E1] font-semibold">Desk Showcase Photo</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_DESK_PHOTOS.map((photo) => (
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

                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Or enter custom image URL..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none font-mono text-[11px]"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                {editingDesk ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteDesk(editingDesk.id)}
                    className="px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Node</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowDeskModal(false)}
                    className="px-4 py-2.5 rounded-full bg-[#0F172A] border border-[#334155] text-[#CBD5E1] text-xs font-bold hover:text-[#F8FAFC]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>{submitting ? 'Saving Node...' : 'Save Desk Node'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW FLOOR MODAL */}
      {showCreateFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCreateFloorModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-full bg-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">Floor Map Builder</span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">Create New Floor Layout</h3>
            </div>

            <form onSubmit={handleCreateFloorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Floor Plan Name *</label>
                <input
                  type="text"
                  required
                  value={createFloorData.floorName}
                  onChange={(e) => setCreateFloorData({ ...createFloorData, floorName: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  placeholder="e.g. Executive Suites Floor"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Floor Level (Number) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={createFloorData.floorLevel}
                  onChange={(e) => setCreateFloorData({ ...createFloorData, floorLevel: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowCreateFloorModal(false)}
                  className="px-4 py-2.5 rounded-full bg-[#0F172A] border border-[#334155] text-[#CBD5E1] font-bold hover:text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFloor}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md cursor-pointer"
                >
                  <span>{creatingFloor ? 'Creating Floor...' : 'Create Floor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLOOR INFO MODAL */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowFloorModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-full bg-[#0F172A]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#334155] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366F1]">Floor Settings</span>
              <h3 className="text-xl font-extrabold text-[#F8FAFC]">Edit Floor & Branch Info</h3>
            </div>

            <form onSubmit={handleFloorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={floorFormData.branchName}
                  onChange={(e) => setFloorFormData({ ...floorFormData, branchName: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Floor Plan Name</label>
                <input
                  type="text"
                  required
                  value={floorFormData.floorName}
                  onChange={(e) => setFloorFormData({ ...floorFormData, floorName: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Floor Level Number</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={floorFormData.floorLevel}
                  onChange={(e) => setFloorFormData({ ...floorFormData, floorLevel: Number(e.target.value) })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#334155]">
                {floorMap?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowFloorModal(false);
                      handleDeleteFloor(floorMap.id, floorMap.floorName);
                    }}
                    className="px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Floor</span>
                  </button>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowFloorModal(false)}
                    className="px-4 py-2.5 rounded-full bg-[#0F172A] border border-[#334155] text-[#CBD5E1] font-bold hover:text-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFloor}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md cursor-pointer"
                  >
                    <span>{submittingFloor ? 'Saving...' : 'Save Floor Info'}</span>
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
