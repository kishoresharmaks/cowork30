'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Newspaper,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  User,
  Calendar,
  Tag,
  BookOpen,
  Layers,
  ChevronRight,
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
  status: string;
  authorName: string;
  readTime: string;
  publishedAt?: string;
  createdAt: string;
}

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, [selectedCategory]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory === 'All' ? '' : selectedCategory;
      const res = await apiClient.get('/cms/blogs', {
        params: { category: categoryParam, search: searchQuery },
      });
      setBlogs(res.data?.posts || []);
      if (res.data?.categories && Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBlogs();
  };

  const featuredPost = blogs.length > 0 ? blogs[0] : null;
  const remainingPosts = blogs.length > 1 ? blogs.slice(1) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* HERO HEADER */}
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-20 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-xs font-bold text-pink-300 uppercase tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>COWORK30 EDITORIAL & INSIGHTS</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Workplace Trends, Tech &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400">
                Growth Insights
              </span>
            </h1>

            <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Explore deep dives on hybrid workspace productivity, startup growth, virtual offices, and modern coworking trends.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-4 max-w-lg mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles on productivity, tax, startups..."
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full pl-10 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all shadow-md"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-xs font-bold text-white hover:opacity-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* CATEGORY FILTER PILLS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* FEATURED STORY HERO CARD */}
        {featuredPost && selectedCategory === 'All' && !searchQuery && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch group hover:shadow-xl transition-all duration-300">
              <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] bg-slate-900 overflow-hidden">
                <img
                  src={getMediaUrl(featuredPost.featuredImage)}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950/85 text-pink-300 backdrop-blur-md border border-white/20 shadow-md">
                    Featured Article
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-xs font-bold text-purple-600">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {featuredPost.category}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight group-hover:text-purple-600 transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {featuredPost.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs">
                      {featuredPost.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{featuredPost.authorName}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-purple-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* BLOG ARTICLES 3-COLUMN GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-900">
              {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{blogs.length} articles published</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 h-[380px] animate-pulse" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900">No Articles Found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                There are currently no published articles in this category. Check back soon for new insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {(selectedCategory === 'All' && !searchQuery ? remainingPosts : blogs).map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1.5"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative h-48 sm:h-52 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={getMediaUrl(post.featuredImage)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80';
                        }}
                      />

                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white/95 backdrop-blur-md text-slate-900 shadow-xs border border-white/60">
                          {post.category}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-950/80 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-pink-400" />
                          <span>{post.readTime || '3 min read'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-3">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {post.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-6 pt-0">
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                          {post.authorName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600">{post.authorName}</span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-xs font-bold text-purple-600 hover:text-pink-600 flex items-center gap-1 group/link"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
