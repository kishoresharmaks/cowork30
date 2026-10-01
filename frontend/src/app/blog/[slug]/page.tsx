'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Check,
  Tag,
  ChevronRight,
  BookOpen,
  Sparkles,
  Building2,
  ArrowRight,
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

export default function BlogSinglePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/cms/blogs/${slug}`);
      if (res.data?.post) {
        setPost(res.data.post);
        setRelatedPosts(res.data.related || []);
      }
    } catch (err) {
      console.error('Failed to load article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently published';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-slate-200 rounded-full" />
            <div className="h-10 w-3/4 bg-slate-200 rounded-xl" />
            <div className="h-5 w-1/2 bg-slate-200 rounded-lg" />
            <div className="w-full h-80 bg-slate-200 rounded-2xl" />
            <div className="space-y-3 pt-4">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Article Not Found</h2>
          <p className="text-slate-600 mb-6 max-w-md">
            The article you are looking for might have been moved or unpublished.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editorial & Blog</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* HEADER HERO */}
        <section className="bg-slate-950 text-white pt-10 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs text-slate-400">
              <Link href="/" className="hover:text-slate-200 transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <Link href="/blog" className="hover:text-slate-200 transition">
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-purple-400 font-medium truncate max-w-[200px]">
                {post.category}
              </span>
            </nav>

            {/* Category Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>{post.category}</span>
            </div>

            {/* Article Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {post.title}
            </h1>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                    {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <span className="block font-semibold text-white">
                      {post.authorName || 'Cowork30 Team'}
                    </span>
                    <span className="text-slate-400 text-xs">Author</span>
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-px bg-slate-800" />

                <div className="flex items-center space-x-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span>{post.readTime || '4 min read'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
                  title="Share Article Link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN BODY CONTAINER */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
          {/* Featured Hero Cover Image */}
          {post.featuredImage && (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[16/9] mb-10">
              <img
                src={getMediaUrl(post.featuredImage)}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Short Description Highlight Callout Box */}
          {post.shortDescription && (
            <div className="mb-10 p-6 sm:p-8 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl border border-purple-100/80 text-slate-800 shadow-sm">
              <p className="text-base sm:text-lg font-medium leading-relaxed italic text-purple-950">
                "{post.shortDescription}"
              </p>
            </div>
          )}

          {/* Article HTML Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
            <article
              className="prose prose-purple max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-li:text-slate-700 prose-img:rounded-xl prose-img:shadow-md font-sans space-y-6"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Author Bio Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 mb-16 border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-lg">
              {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Written By</span>
              </div>
              <h3 className="text-xl font-bold text-white">{post.authorName || 'Cowork30 Team'}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Empowering teams, freelancers, and businesses with flexible workspace solutions, enterprise amenities, and growth strategy insights.
              </p>
            </div>
          </div>

          {/* RELATED ARTICLES SECTION */}
          {relatedPosts.length > 0 && (
            <div className="space-y-8 mb-16">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Related Articles
                  </h2>
                  <p className="text-sm text-slate-500">
                    Handpicked workspace and productivity stories you might like
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="hidden sm:inline-flex items-center space-x-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={getMediaUrl(rel.featuredImage)}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {rel.category}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {rel.shortDescription}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                        <span>{formatDate(rel.publishedAt || rel.createdAt)}</span>
                        <span className="font-medium text-purple-600 group-hover:underline">Read Article →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA BANNER */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden border border-purple-500/20">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <Building2 className="w-10 h-10 text-pink-400 mx-auto" />
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to Experience Cowork30?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Book flexible day passes, dedicated desks, or high-tech meeting rooms instantly with transparent pricing and top-tier amenities.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link
                  href="/pricing"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all"
                >
                  Explore Pricing Plans
                </Link>
                <Link
                  href="/meeting-rooms"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all border border-white/20"
                >
                  Book Meeting Room
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
