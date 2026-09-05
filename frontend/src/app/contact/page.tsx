'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/cms/contact', formData);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact form:', err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar />

      <main className="pt-6 sm:pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
            Get in Touch With Us
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Have questions about private office suites, membership plans, or hosting custom events? Reach out to our community team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl space-y-6 border border-slate-200/90 shadow-xs">
              <h3 className="text-xl font-bold text-slate-900">Downtown Main Hub</h3>

              <div className="space-y-4 text-xs text-slate-600 font-medium">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>100 Innovation Boulevard, Suite 500, Tech City, CA 90001</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>+1 (555) 300-2026</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>contact@cowork30.com</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-900 block">Operating Hours</span>
              <p className="text-xs text-slate-600 font-medium">Monday - Friday: 08:00 AM - 08:00 PM</p>
              <p className="text-xs text-slate-600 font-medium">Dedicated Members: 24/7 Keycard Access</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Send Us a Message</h3>

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-slate-900">Message Sent!</h4>
                <p className="text-xs text-slate-600">Thank you for reaching out. We will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
