'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  ChevronRight,
  BookOpen,
  Sparkles,
  Building2,
  ArrowRight,
  X,
  Copy,
  MessageCircle,
  Mail,
  Globe,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/api-client';

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

interface Props {
  post: BlogPost | null;
  relatedPosts: BlogPost[];
}

export default function BlogSingleClient({ post, relatedPosts }: Props) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getArticleUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://cowork30.com/blog/${post?.slug || ''}`;
  };

  const handleShareClick = async () => {
    const shareData = {
      title: post?.title || 'Cowork30 Blog',
      text: post?.shortDescription || 'Check out this insight on Cowork30!',
      url: getArticleUrl(),
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to share modal if user cancelled or web share failed
      }
    }
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(getArticleUrl());
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

  const articleUrl = getArticleUrl();
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedSummary = encodeURIComponent(post.shortDescription);

  const shareLinks = [
    {
      name: 'WhatsApp',
      renderIcon: () => <MessageCircle className="w-4 h-4" />,
      bgColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      renderIcon: () => (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgColor: 'bg-slate-900 hover:bg-black text-white',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      renderIcon: () => (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
        </svg>
      ),
      bgColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      renderIcon: () => (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.79c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.89h-2.34v6.99C18.34 21.12 22 16.99 22 12z" />
        </svg>
      ),
      bgColor: 'bg-blue-700 hover:bg-blue-800 text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Email',
      renderIcon: () => <Mail className="w-4 h-4" />,
      bgColor: 'bg-purple-600 hover:bg-purple-700 text-white',
      url: `mailto:?subject=${encodedTitle}&body=${encodedSummary}%0A%0ARead%20more:%20${encodedUrl}`,
    },
  ];

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
                  onClick={handleShareClick}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  title="Share Article"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Article</span>
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

            {/* In-Article Share Footer Bar */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Found this article valuable?</h4>
                <p className="text-xs text-slate-500">Share it with your network or team members.</p>
              </div>

              <div className="flex items-center space-x-2">
                {shareLinks.slice(0, 4).map((item) => {
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center transition shadow-xs ${item.bgColor}`}
                      title={`Share on ${item.name}`}
                    >
                      {item.renderIcon()}
                    </a>
                  );
                })}

                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

      {/* INTERACTIVE SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Share Article</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Social Channels List */}
            <div className="grid grid-cols-2 gap-3">
              {shareLinks.map((item) => {
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2.5 transition shadow-xs ${item.bgColor}`}
                  >
                    {item.renderIcon()}
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Direct URL Copy Field */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600">Article URL</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={articleUrl}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1 transition shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
