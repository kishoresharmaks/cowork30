'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ImageUploader from '@/components/ui/ImageUploader';
import { Plus, Trash2, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const PRESET_GALLERY_PHOTOS = [
  { label: 'Executive Boardroom', url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=600&q=80' },
  { label: 'Open Workspace Lounge', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Private Office Hub', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80' },
  { label: 'Artisanal Cafe Lounge', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=600&q=80' },
];

export default function AdminGalleryPage() {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'workspaces',
    imageUrl: PRESET_GALLERY_PHOTOS[0].url,
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadGallery() {
    setLoading(true);
    try {
      const res = await apiClient.get('/cms/gallery');
      setGallery(res.data || []);
    } catch (err) {
      console.error('Failed to load gallery', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/cms/gallery', formData);
      setShowModal(false);
      loadGallery();
    } catch (err) {
      alert('Failed to add gallery photo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      await apiClient.delete(`/cms/gallery/${id}`);
      loadGallery();
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>CMS Photo Gallery Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Photo Gallery & Banners Manager</h1>
            <p className="text-xs text-[#94A3B8]">Manage workspace photo showcases, high-resolution interior shots, and category tags.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                category: 'workspaces',
                imageUrl: PRESET_GALLERY_PHOTOS[0].url,
              });
              setShowModal(true);
            }}
            className="px-5 py-2.5 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-bold text-white flex items-center space-x-2 w-fit shadow-md cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gallery Photo</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#94A3B8]">Loading public photo gallery...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="bg-[#1E293B] p-3 rounded-2xl border border-[#334155] space-y-2 relative group shadow-xs">
                <div className="relative h-44 w-full rounded-xl overflow-hidden bg-[#0F172A]">
                  <img src={item.imageUrl || PRESET_GALLERY_PHOTOS[0].url} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#020617]/80 text-[#6366F1] border border-[#6366F1]/30 backdrop-blur-xs">
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#F43F5E] text-white hover:bg-[#E11D48] shadow-xs cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-extrabold text-xs text-[#F8FAFC] truncate px-1">{item.title}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Photo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-md w-full p-6 space-y-4 text-[#F8FAFC] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC]">
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-[#F8FAFC]">Add Photo to Gallery</h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Executive Boardroom Suite"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="workspaces">Workspaces & Desks</option>
                  <option value="meeting_rooms">Meeting Rooms & Suites</option>
                  <option value="amenities">Amenities & Lounges</option>
                  <option value="events">Events & Community</option>
                </select>
              </div>

              <ImageUploader
                label="Gallery Photo Image File"
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submitting ? 'Adding Photo...' : 'Add Photo to Public Showcase'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
