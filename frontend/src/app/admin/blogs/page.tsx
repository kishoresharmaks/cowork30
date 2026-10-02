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
  FolderEdit,
  FolderPlus,
  Layers,
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

interface CategoryInfo {
  name: string;
  totalCount: number;
  publishedCount: number;
}

function autoFormatToHtml(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const hasHtml = /<\/?(p|div|h[1-6]|ul|ol|li|table|blockquote|section|article)\b/i.test(trimmed);
  if (hasHtml) return trimmed;

  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const withLinks = trimmed.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  const paragraphs = withLinks.split(/\n{2,}/);

  return paragraphs
    .map((p) => {
      const pTrimmed = p.trim();
      if (!pTrimmed) return '';
      const lines = pTrimmed.split(/\n+/);

      const isBullet = lines.length > 1 && lines.every((l) => /^[-*•]\s+/.test(l.trim()));
      if (isBullet) {
        const items = lines.map((l) => `<li>${l.trim().replace(/^[-*•]\s+/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
      }

      const isNumbered = lines.length > 1 && lines.every((l) => /^\d+[\.\)]\s+/.test(l.trim()));
      if (isNumbered) {
        const items = lines.map((l) => `<li>${l.trim().replace(/^\d+[\.\)]\s+/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }

      const formattedLines = lines.map((line) => {
        return line.replace(/^([A-Za-z0-9\s._\-&/|]+:)/, '<strong>$1</strong>');
      });

      return `<p>${formattedLines.join('<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Category Edit State inside Category Modal
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [newCategoryInputValue, setNewCategoryInputValue] = useState('');
  const [addCategoryInputValue, setAddCategoryInputValue] = useState('');

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
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/cms/categories');
      if (res.data?.categories && Array.isArray(res.data.categories)) {
        setCategoriesList(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      shortDescription: '',
      featuredImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80',
      content: '<h2>The Future of Modern Workspaces</h2><p>Write your detailed blog content here...</p>',
      category: categoriesList.length > 0 ? categoriesList[0].name : 'Coworking Trends',
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
        const rawUrl = res.data.relativeUrl || res.data.url;
        const cleanPath = String(rawUrl).replace(/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/i, '');
        setFormData((prev) => ({ ...prev, featuredImage: cleanPath }));
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
      const formattedContent = autoFormatToHtml(formData.content);
      const payload = {
        ...formData,
        content: formattedContent,
        status: targetStatus,
      };

      if (editingBlog) {
        await apiClient.put(`/cms/admin/blogs/${editingBlog.id}`, payload);
      } else {
        await apiClient.post('/cms/admin/blogs', payload);
      }

      setShowModal(false);
      loadBlogs();
      loadCategories();
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
      loadCategories();
    } catch (err: any) {
      alert('Failed to delete blog post.');
    }
  };

  // Category Management Handlers
  const handleAddCategory = async () => {
    if (!addCategoryInputValue.trim()) return;
    const catName = addCategoryInputValue.trim();
    if (categoriesList.some((c) => c.name.toLowerCase() === catName.toLowerCase())) {
      alert('This category already exists.');
      return;
    }
    setCategoriesList((prev) => [
      ...prev,
      { name: catName, totalCount: 0, publishedCount: 0 },
    ]);
    setAddCategoryInputValue('');
  };

  const handleRenameCategorySubmit = async (oldName: string) => {
    if (!newCategoryInputValue.trim() || newCategoryInputValue.trim() === oldName) {
      setEditingCategoryName(null);
      return;
    }
    try {
      await apiClient.put('/cms/admin/categories', {
        oldName,
        newName: newCategoryInputValue.trim(),
      });
      setEditingCategoryName(null);
      setNewCategoryInputValue('');
      loadBlogs();
      loadCategories();
    } catch (err: any) {
      alert('Failed to rename category.');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete category "${categoryName}"? Existing posts will be reassigned to "General".`)) {
      return;
    }
    try {
      await apiClient.delete(`/cms/admin/categories/${encodeURIComponent(categoryName)}`);
      loadBlogs();
      loadCategories();
    } catch (err: any) {
      alert('Failed to delete category.');
    }
  };

  const categories = ['All', ...Array.from(new Set([...categoriesList.map((c) => c.name), ...blogs.map((b) => b.category)]))];
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
              Create, edit, delete, draft, and manage blog categories for the Cowork30 platform.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2.5 rounded-full bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-bold text-slate-200 flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
            >
              <FolderEdit className="w-4 h-4 text-purple-400" />
              <span>Manage Categories</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-xs font-extrabold text-white flex items-center space-x-2 shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Article</span>
            </button>
          </div>
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

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          blog.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-base text-[#F8FAFC] line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {blog.shortDescription}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#334155]/60">
                      <span>{blog.authorName || 'Cowork30 Team'}</span>
                      <span>{blog.readTime || '3 min read'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons (Edit, Delete, Preview) */}
                <div className="p-4 bg-[#0F172A]/50 border-t border-[#334155] flex items-center justify-between gap-2">
                  <Link
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View</span>
                  </Link>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(blog)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold flex items-center space-x-1 border border-purple-500/30 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold flex items-center space-x-1 border border-rose-500/30 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CATEGORY MANAGEMENT MODAL */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1E293B] rounded-3xl border border-[#334155] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                <div className="flex items-center space-x-2">
                  <FolderEdit className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-extrabold text-[#F8FAFC]">Manage Categories</h2>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add New Category Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={addCategoryInputValue}
                  onChange={(e) => setAddCategoryInputValue(e.target.value)}
                  placeholder="New Category Name..."
                  className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Categories List Table */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {categoriesList.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-4">No custom categories found.</p>
                ) : (
                  categoriesList.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-[#334155]/70"
                    >
                      {editingCategoryName === cat.name ? (
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <input
                            type="text"
                            defaultValue={cat.name}
                            onChange={(e) => setNewCategoryInputValue(e.target.value)}
                            className="w-full bg-[#1E293B] border border-[#6366F1] rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleRenameCategorySubmit(cat.name)}
                            className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCategoryName(null)}
                            className="p-1 bg-slate-700 text-white rounded-lg text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-xs text-white">{cat.name}</span>
                          <span className="ml-2 text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {cat.totalCount} articles
                          </span>
                        </div>
                      )}

                      {editingCategoryName !== cat.name && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategoryName(cat.name);
                              setNewCategoryInputValue(cat.name);
                            }}
                            className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition"
                            title="Edit Category Name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.name)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT BLOG POST MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#1E293B] rounded-3xl border border-[#334155] max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-extrabold text-[#F8FAFC]">
                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Blog Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    1. Blog Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. The Future of Hybrid Coworking in 2026"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                {/* Category & Author Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      2. Blog Category <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#6366F1] focus:outline-none"
                      >
                        {categories
                          .filter((c) => c !== 'All')
                          .map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        {!categories.includes(formData.category) && (
                          <option value={formData.category}>{formData.category}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, authorName: e.target.value }))}
                      placeholder="e.g. Cowork30 Editorial Team"
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. Blog Description / Summary <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Brief summary displayed on article cards & social previews..."
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                {/* Featured Image (Blob Upload) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. Blog Featured Image (Blob Upload & WebP Supported)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="Image URL or upload file..."
                      className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none"
                    />
                    <label className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Blog Content Rich Toolbar & Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      5. Blog Content <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center space-x-1.5 bg-[#0F172A] p-0.5 rounded-lg border border-[#334155]">
                      <button
                        type="button"
                        onClick={() => setEditorTab('edit')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                          editorTab === 'edit' ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Edit Code / Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 ${
                          editorTab === 'preview' ? 'bg-[#6366F1] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-[#0F172A] border border-b-0 border-[#334155] rounded-t-xl text-slate-300">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<h2>', '</h2>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs font-bold"
                        title="Heading 2"
                      >
                        <Heading className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<b>', '</b>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs font-bold"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<i>', '</i>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<ul><li>Item 1</li><li>Item 2</li></ul>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<blockquote>', '</blockquote>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContentFormatting('<p>', '</p>')}
                        className="p-1.5 hover:bg-slate-800 rounded text-xs"
                        title="Paragraph"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const formatted = autoFormatToHtml(formData.content);
                        setFormData((prev) => ({ ...prev, content: formatted }));
                      }}
                      className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition"
                      title="Convert plain text & linebreaks into structured HTML paragraphs"
                    >
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span>✨ Auto-Format Plain Text</span>
                    </button>
                  </div>

                  {editorTab === 'edit' ? (
                    <textarea
                      rows={11}
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Type or paste your article content here..."
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-b-xl px-4 py-3 text-xs text-white font-mono placeholder-[#64748B] focus:border-[#6366F1] focus:outline-none leading-relaxed"
                    />
                  ) : (
                    <div className="bg-white rounded-b-xl p-6 border border-[#334155] min-h-[220px] max-h-[380px] overflow-y-auto">
                      <div
                        className="blog-rich-content prose prose-purple max-w-none text-slate-800 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: autoFormatToHtml(formData.content) || '<p class="text-slate-400 italic">No content to preview yet.</p>',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('draft')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('published')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-extrabold shadow-lg transition cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
