'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  X,
  Search,
  Check,
  Clock,
  Tag,
  Globe,
  Heading,
  Bold,
  Italic,
  List,
  Quote,
  Code,
  Image as ImageIcon,
} from 'lucide-react';
import { apiClient, getMediaUrl } from '@/lib/api-client';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  featuredImage: string;
  content: string;
  category: string;
  status: 'draft' | 'published';
  authorName: string;
  readTime: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    featuredImage: '',
    content: '',
    category: 'Coworking Trends',
    authorName: 'Cowork30 Team',
    status: 'published' as 'draft' | 'published',
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/cms/admin/blogs');
      setBlogs(res.data?.posts || []);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      shortDescription: '',
      featuredImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
      content: '<h2>The Future of Modern Workspaces</h2><p>Write your detailed blog content here...</p>',
      category: 'Coworking Trends',
      authorName: 'Cowork30 Team',
      status: 'published',
    });
    setShowModal(true);
  };

  const openEditModal = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      shortDescription: blog.shortDescription,
      featuredImage: blog.featuredImage,
      content: blog.content,
      category: blog.category,
      authorName: blog.authorName || 'Cowork30 Team',
      status: blog.status,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const res = await apiClient.post('/cms/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.relativeUrl || res.data?.url) {
        const imageUrl = res.data.relativeUrl || res.data.url;
        setFormData((prev) => ({ ...prev, featuredImage: imageUrl }));
      }
    } catch (err: any) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open-Source Rich Text Editor Helper Actions
  const appendContentFormatting = (tagStart: string, tagEnd: string = '') => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + `${tagStart}Sample Text${tagEnd}`,
    }));
  };

  const handleSubmit = async (targetStatus: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      alert('Please enter a Blog Title.');
      return;
    }
    if (!formData.shortDescription.trim()) {
      alert('Please enter a Blog Description.');
      return;
    }
    if (!formData.content.trim()) {
      alert('Please enter Blog Content.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: targetStatus,
      };

      if (editingBlog) {
        await apiClient.put(`/cms/admin/blogs/${editingBlog.id}`, payload);
      } else {
        await apiClient.post('/cms/admin/blogs', payload);
      }

      setShowModal(false);
      loadBlogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save blog post.';
      alert(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await apiClient.delete(`/cms/admin/blogs/${id}`);
      loadBlogs();
    } catch (err: any) {
      alert('Failed to delete blog post.');
    }
  };

  const categories = ['All', ...Array.from(new Set(blogs.map((b) => b.category)))];
  const filteredBlogs = blogs.filter((b) => {
    const matchesCategory = selectedCategoryFilter === 'All' || b.category === selectedCategoryFilter;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex font-sans selection:bg-[#6366F1] selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pt-16 md:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-5">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] mb-2">
              <Newspaper className="w-3.5 h-3.5" />
              <span>CMS Editorial Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Blog & Articles Manager</h1>
            <p className="text-xs text-[#94A3B8]">
              Create, edit, draft, and publish high-quality articles for the Cowork30 platform.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-xs font-extrabold text-white flex items-center space-x-2 w-fit shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#334155] hover:text-white border border-[#334155]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
        </div>

        {/* Blog Posts Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-2xl border border-[#334155] h-[340px] animate-pulse" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-12 text-center max-w-md mx-auto space-y-3">
            <Newspaper className="w-8 h-8 text-[#64748B] mx-auto" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No Blog Posts Found</h3>
            <p className="text-xs text-[#94A3B8]">Click "Create New Article" to write and publish your first post.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-[#1E293B] rounded-2xl border border-[#334155] hover:border-[#6366F1]/50 overflow-hidden flex flex-col justify-between group transition-all duration-300 shadow-lg"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={getMediaUrl(blog.featuredImage)}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 backdrop-blur-md text-purple-300 border border-purple-500/30">
                        {blog.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          blog.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="text-base font-extrabold text-[#F8FAFC] line-clamp-2 leading-snug group-hover:text-[#6366F1] transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {blog.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#6366F1]" />
                        <span>{blog.readTime || '3 min read'}</span>
                      </span>
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-4 pt-0 border-t border-[#334155]/60 flex items-center justify-between mt-2">
                  <Link
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(blog)}
                      className="p-1.5 rounded-lg bg-[#334155]/60 hover:bg-[#6366F1] text-[#CBD5E1] hover:text-white transition-all cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-1.5 rounded-lg bg-[#334155]/60 hover:bg-rose-600 text-[#CBD5E1] hover:text-white transition-all cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE / EDIT BLOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#F8FAFC]">
                    {editingBlog ? 'Edit Blog Article' : 'Write New Article'}
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Fill in the blog fields, design rich content, and select Draft or Publish.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs">
              {/* 1. Blog Title */}
              <div>
                <label className="block text-[#CBD5E1] font-extrabold mb-1.5">1. Blog Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 10 Proven Strategies for Maximizing Focus in Coworking Spaces"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] font-semibold focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              {/* 2. Blog Category & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#CBD5E1] font-extrabold mb-1.5">2. Blog Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] font-medium focus:border-[#6366F1] focus:outline-none"
                  >
                    <option value="Coworking Trends">Coworking Trends</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Startup Guides">Startup Guides</option>
                    <option value="Community & Events">Community & Events</option>
                    <option value="Virtual Office">Virtual Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-extrabold mb-1.5">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="e.g. Cowork30 Editorial Team"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] font-medium focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Blog Description */}
              <div>
                <label className="block text-[#CBD5E1] font-extrabold mb-1.5">3. Blog Short Description / Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Provide a compelling 2-sentence summary that appears on blog cards and search engines..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none leading-relaxed"
                />
              </div>

              {/* 4. Blog Image (Blob / File Upload or Image URL) */}
              <div className="space-y-2">
                <label className="block text-[#CBD5E1] font-extrabold">4. Blog Featured Image (Blob Upload to reduce DB size) *</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="Image URL or upload image file below..."
                    className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:border-[#6366F1] focus:outline-none"
                  />
                  <label className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading Blob...' : 'Upload Image File'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {formData.featuredImage && (
                  <div className="relative h-32 w-full max-w-xs rounded-xl overflow-hidden border border-[#334155] bg-slate-900 mt-2">
                    <img
                      src={getMediaUrl(formData.featuredImage)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* 5. Open-Source Free Rich Text Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[#CBD5E1] font-extrabold">5. Blog Article Content (Rich HTML / Open-Source Editor) *</label>
                  <span className="text-[10px] text-[#94A3B8]">Supports HTML tags & Formatting Tools</span>
                </div>

                {/* Free Open-Source Formatting Toolbar */}
                <div className="flex items-center gap-1 p-2 rounded-t-xl bg-[#0F172A] border border-b-0 border-[#334155] flex-wrap">
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<h2>', '</h2>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Insert Heading H2"
                  >
                    <Heading className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<strong>', '</strong>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Bold Text"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<em>', '</em>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Italic Text"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<ul><li>Item 1</li><li>Item 2</li></ul>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Insert Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<blockquote>', '</blockquote>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Insert Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => appendContentFormatting('<p>', '</p>')}
                    className="p-1.5 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white transition-colors"
                    title="Insert Paragraph"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write complete article content using formatting toolbar..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-b-xl px-3.5 py-2.5 text-[#F8FAFC] font-mono text-xs focus:border-[#6366F1] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Action Buttons: Draft vs Publish */}
              <div className="pt-4 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#334155] text-[#CBD5E1] hover:text-white hover:bg-[#334155] font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('draft')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#334155] hover:bg-[#475569] text-amber-300 font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('published')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Globe className="w-4 h-4" />
                  <span>Publish Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
