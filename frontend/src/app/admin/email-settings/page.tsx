'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import {
  Mail,
  Send,
  Sliders,
  FileCode,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Code2,
  AlertCircle,
  Save,
  Check,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function AdminEmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'logs'>('smtp');

  // Notification Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // --- TAB 1: SMTP SETTINGS & TEST EMAIL ---
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    secure: false,
  });

  // Test Email Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  async function fetchSmtpSettings() {
    setSmtpLoading(true);
    try {
      const res = await apiClient.get('/notifications/admin/smtp');
      if (res.data?.settings) {
        setSmtpForm({
          host: res.data.settings.host || '',
          port: res.data.settings.port || 587,
          user: res.data.settings.user || '',
          pass: res.data.settings.pass || '',
          fromEmail: res.data.settings.fromEmail || '',
          fromName: res.data.settings.fromName || '',
          secure: Boolean(res.data.settings.secure),
        });
      }
    } catch (err: any) {
      showToast('error', 'Failed to load SMTP settings');
    } finally {
      setSmtpLoading(false);
    }
  }

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await apiClient.post('/notifications/admin/smtp', smtpForm);
      if (res.data?.success) {
        showToast('success', 'SMTP Configuration updated successfully!');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update SMTP settings');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setSendingTest(true);
    try {
      const res = await apiClient.post('/notifications/admin/test-email', {
        to: testEmailAddress,
      });
      if (res.data?.success) {
        showToast('success', res.data.message || 'Test email dispatched successfully!');
        setShowTestModal(false);
        setTestEmailAddress('');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Test email dispatch failed');
    } finally {
      setSendingTest(false);
    }
  };

  // --- TAB 2: TEMPLATES EDITOR ---
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlBody: '',
    isActive: true,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'code' | 'visual'>('split');

  async function fetchTemplates() {
    setTemplatesLoading(true);
    try {
      const res = await apiClient.get('/notifications/admin/templates');
      if (res.data?.templates) {
        setTemplates(res.data.templates);
        if (res.data.templates.length > 0 && !selectedTemplate) {
          selectTemplate(res.data.templates[0]);
        }
      }
    } catch (err) {
      showToast('error', 'Failed to load email templates');
    } finally {
      setTemplatesLoading(false);
    }
  }

  function selectTemplate(tmpl: any) {
    setSelectedTemplate(tmpl);
    setTemplateForm({
      name: tmpl.name || '',
      subject: tmpl.subject || '',
      htmlBody: tmpl.htmlBody || '',
      isActive: tmpl.isActive ?? true,
    });
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    try {
      const res = await apiClient.patch(`/notifications/admin/templates/${selectedTemplate.id}`, templateForm);
      if (res.data?.success) {
        showToast('success', `Template [${selectedTemplate.key}] updated successfully!`);
        fetchTemplates();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const insertVariableToken = (token: string) => {
    const formattedToken = `{{${token}}}`;
    setTemplateForm((prev) => ({
      ...prev,
      htmlBody: prev.htmlBody + formattedToken,
    }));
    showToast('success', `Inserted token ${formattedToken}`);
  };

  // --- TAB 3: OUTBOUND EMAIL AUDIT LOGS ---
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsData, setLogsData] = useState<{
    logs: any[];
    stats: { totalCount: number; sentCount: number; failedCount: number };
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }>({
    logs: [],
    stats: { totalCount: 0, sentCount: 0, failedCount: 0 },
    pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 1 },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [resendingLogId, setResendingLogId] = useState<number | null>(null);
  const [selectedErrorLog, setSelectedErrorLog] = useState<any | null>(null);

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const res = await apiClient.get('/notifications/admin/logs', {
        params: {
          search: searchQuery,
          status: statusFilter,
          page,
          limit: 25,
        },
      });
      if (res.data) {
        setLogsData({
          logs: res.data.logs || [],
          stats: res.data.stats || { totalCount: 0, sentCount: 0, failedCount: 0 },
          pagination: res.data.pagination || { page: 1, limit: 25, totalCount: 0, totalPages: 1 },
        });
      }
    } catch (err) {
      showToast('error', 'Failed to fetch email logs');
    } finally {
      setLogsLoading(false);
    }
  }

  const handleResend = async (logId: number) => {
    setResendingLogId(logId);
    try {
      const res = await apiClient.post(`/notifications/admin/logs/${logId}/resend`);
      if (res.data?.success) {
        showToast('success', `Email resent successfully! Log #${res.data.logId}`);
        fetchLogs();
      } else {
        showToast('error', res.data?.error || 'Email resend failed');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendingLogId(null);
    }
  };

  useEffect(() => {
    fetchSmtpSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, page, statusFilter]);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto space-y-8">
        {/* Toast Alert Banner */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Email Control Engine & Audit Logs
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Configure SMTP dynamic mail transport, customize template variables, and monitor outbound audit logs.
            </p>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center bg-slate-900/80 p-1.5 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('smtp')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'smtp'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>SMTP Credentials</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Email Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Outbound Logs</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: SMTP CONFIGURATION & TEST MODAL */}
        {/* ==================================================================== */}
        {activeTab === 'smtp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>SMTP Transport Configuration</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your standard SMTP service (Gmail, SendGrid, Amazon SES, Mailgun, SMTP relay).
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Test Email</span>
                  </button>
                </div>

                {smtpLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-500" />
                    <span className="text-sm">Loading SMTP configuration settings...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSmtp} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          SMTP Server Host / Endpoint
                        </label>
                        <input
                          type="text"
                          required
                          value={smtpForm.host}
                          onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                          placeholder="smtp.gmail.com or smtp.sendgrid.net"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          SMTP Port Number
                        </label>
                        <input
                          type="number"
                          required
                          value={smtpForm.port}
                          onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                          placeholder="587 or 465"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          SMTP Username / Email
                        </label>
                        <input
                          type="text"
                          value={smtpForm.user}
                          onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                          placeholder="apikey or your-email@gmail.com"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          SMTP Password / API Key
                        </label>
                        <input
                          type="password"
                          value={smtpForm.pass}
                          onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                          placeholder="••••••••••••••••"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Sender Address (From Email)
                        </label>
                        <input
                          type="email"
                          required
                          value={smtpForm.fromEmail}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                          placeholder="no-reply@cowork30.com"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Sender Name (From Name)
                        </label>
                        <input
                          type="text"
                          required
                          value={smtpForm.fromName}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                          placeholder="Ishwarji Cowork 30 Platform"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={smtpForm.secure}
                        onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                      />
                      <label htmlFor="smtpSecure" className="text-xs text-slate-300 cursor-pointer">
                        Enable SSL/TLS Explicit Transport Encryption (Required for Port 465)
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button
                        type="submit"
                        disabled={smtpSaving}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                      >
                        {smtpSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                            <span>Saving Settings...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            <span>Save SMTP Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Quick Helper Panel */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Preset Configurations</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="font-bold text-slate-200">Gmail / Google Workspace</p>
                    <p className="mt-1">Host: <code className="text-indigo-300">smtp.gmail.com</code></p>
                    <p>Port: <code className="text-indigo-300">587</code> | TLS: Yes</p>
                    <p className="text-[11px] text-amber-400 mt-1">
                      Note: Use Google 16-character App Password, not main account password.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="font-bold text-slate-200">SendGrid</p>
                    <p className="mt-1">Host: <code className="text-indigo-300">smtp.sendgrid.net</code></p>
                    <p>User: <code className="text-indigo-300">apikey</code></p>
                    <p>Port: <code className="text-indigo-300">587</code></p>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="font-bold text-slate-200">Amazon SES</p>
                    <p className="mt-1">Host: <code className="text-indigo-300">email-smtp.us-east-1.amazonaws.com</code></p>
                    <p>Port: <code className="text-indigo-300">587</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEST EMAIL DISPATCH MODAL */}
        {showTestModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Send className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Send SMTP Verification Email</h3>
                </div>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-slate-400 hover:text-white text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="your-name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    An interactive test notification will be dispatched through your configured SMTP credentials.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {sendingTest ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Test...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Test Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: TEMPLATE EDITOR WITH LIVE PREVIEW */}
        {/* ==================================================================== */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar List of Templates */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                System Templates ({templates.length})
              </h3>

              {templatesLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading templates...
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((tmpl) => {
                    const isSelected = selectedTemplate?.id === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => selectTemplate(tmpl)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{tmpl.name}</span>
                          {tmpl.isActive ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Inactive" />
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-indigo-400 mt-1">[{tmpl.key}]</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template Editor Area */}
            <div className="lg:col-span-3 space-y-6">
              {selectedTemplate ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center space-x-2">
                        <FileCode className="w-5 h-5 text-indigo-400" />
                        <span>Editing Template: {selectedTemplate.name}</span>
                      </h2>
                      <p className="text-xs font-mono text-indigo-400 mt-0.5">Key: {selectedTemplate.key}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs">
                        <button
                          onClick={() => setPreviewMode('split')}
                          className={`px-3 py-1 rounded-md transition-all ${
                            previewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Split
                        </button>
                        <button
                          onClick={() => setPreviewMode('code')}
                          className={`px-3 py-1 rounded-md transition-all ${
                            previewMode === 'code' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Code Only
                        </button>
                        <button
                          onClick={() => setPreviewMode('visual')}
                          className={`px-3 py-1 rounded-md transition-all ${
                            previewMode === 'visual' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          Preview
                        </button>
                      </div>

                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                      >
                        {savingTemplate ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                  {/* Template Subject Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Subject Header Line (Supports Tokens)
                    </label>
                    <input
                      type="text"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="Email Subject Line"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  {/* Token Helper Quick Insertion Bar */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Click Token Pill to Insert into HTML Body:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedTemplate.variablesJson) &&
                        selectedTemplate.variablesJson.map((varName: string) => (
                          <button
                            key={varName}
                            type="button"
                            onClick={() => insertVariableToken(varName)}
                            className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-mono font-medium transition-all flex items-center space-x-1"
                          >
                            <span>{`{{${varName}}}`}</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* HTML Editor & Live HTML Visualizer */}
                  <div
                    className={`grid gap-6 ${
                      previewMode === 'split'
                        ? 'grid-cols-1 md:grid-cols-2'
                        : previewMode === 'code'
                        ? 'grid-cols-1'
                        : 'grid-cols-1'
                    }`}
                  >
                    {(previewMode === 'split' || previewMode === 'code') && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                            <Code2 className="w-4 h-4 text-indigo-400" />
                            <span>HTML Source Body</span>
                          </label>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {templateForm.htmlBody.length} chars
                          </span>
                        </div>
                        <textarea
                          rows={18}
                          value={templateForm.htmlBody}
                          onChange={(e) => setTemplateForm({ ...templateForm, htmlBody: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    )}

                    {(previewMode === 'split' || previewMode === 'visual') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                          <Eye className="w-4 h-4 text-emerald-400" />
                          <span>Real-time Visual Preview</span>
                        </label>
                        <div className="bg-white rounded-xl border border-slate-700 overflow-hidden h-[420px]">
                          <iframe
                            title="Template Preview"
                            srcDoc={templateForm.htmlBody
                              .replace(/\{\{\s*name\s*\}\}/g, 'Alex Johnson')
                              .replace(/\{\{\s*bookingCode\s*\}\}/g, 'BK-98A72F')
                              .replace(/\{\{\s*bookingType\s*\}\}/g, 'Executive Desk Pass')
                              .replace(/\{\{\s*date\s*\}\}/g, new Date().toLocaleDateString())
                              .replace(/\{\{\s*branchName\s*\}\}/g, 'Ishwarji Cowork 30 Main')
                              .replace(/\{\{\s*amount\s*\}\}/g, '1,500')
                              .replace(/\{\{\s*roomName\s*\}\}/g, 'Executive Boardroom')
                              .replace(/\{\{\s*timeSlot\s*\}\}/g, '10:00 AM - 12:00 PM')
                              .replace(/\{\{\s*seatsBooked\s*\}\}/g, '8')
                              .replace(/\{\{\s*newBalance\s*\}\}/g, '5,000')
                              .replace(/\{\{\s*referenceId\s*\}\}/g, 'TX-TOPUP-9901')
                              .replace(/\{\{\s*email\s*\}\}/g, 'member@cowork30.com')
                              .replace(/\{\{\s*newPassword\s*\}\}/g, 'Pass#2026!')}
                            className="w-full h-full border-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                  Select a template from the list on the left to begin editing.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: OUTBOUND EMAIL AUDIT LOGS */}
        {/* ==================================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Stats Overview Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                <p className="text-xs font-bold text-slate-400">Total Outbound Emails</p>
                <p className="text-2xl font-extrabold text-white mt-1">{logsData.stats.totalCount}</p>
              </div>

              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-md">
                <p className="text-xs font-bold text-emerald-400">Successfully Dispatched</p>
                <p className="text-2xl font-extrabold text-emerald-300 mt-1">{logsData.stats.sentCount}</p>
              </div>

              <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-md">
                <p className="text-xs font-bold text-rose-400">Failed / Errors</p>
                <p className="text-2xl font-extrabold text-rose-300 mt-1">{logsData.stats.failedCount}</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  placeholder="Search recipient email or subject line..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 rounded-xl px-4 py-2 focus:outline-none"
                >
                  <option value="all">All Dispatch Statuses</option>
                  <option value="sent">Sent Only</option>
                  <option value="failed">Failed Only</option>
                  <option value="pending">Pending Only</option>
                </select>

                <button
                  onClick={() => fetchLogs()}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Email Audit Logs Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
              {logsLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span>Fetching outbound email audit logs...</span>
                </div>
              ) : logsData.logs.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  No outbound email log records found matching your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold">
                      <tr>
                        <th className="px-5 py-3.5">Log ID</th>
                        <th className="px-5 py-3.5">Recipient Email</th>
                        <th className="px-5 py-3.5">Template / Subject</th>
                        <th className="px-5 py-3.5">Dispatch Status</th>
                        <th className="px-5 py-3.5">Sent Timestamp</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logsData.logs.map((log) => {
                        const isSent = log.status === 'sent';
                        const isFailed = log.status === 'failed';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-4 font-mono text-indigo-400 font-bold">#{log.id}</td>

                            <td className="px-5 py-4 font-medium text-white">{log.recipient}</td>

                            <td className="px-5 py-4 space-y-0.5">
                              <p className="font-semibold text-slate-200">{log.subject}</p>
                              <p className="text-[11px] font-mono text-indigo-400/80">Key: {log.templateKey}</p>
                            </td>

                            <td className="px-5 py-4">
                              {isSent ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Sent
                                </span>
                              ) : isFailed ? (
                                <button
                                  onClick={() => setSelectedErrorLog(log)}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed (View Error)
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                              {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleResend(log.id)}
                                disabled={resendingLogId === log.id}
                                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1 disabled:opacity-50"
                              >
                                {resendingLogId === log.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                <span>Resend</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {logsData.pagination.totalPages > 1 && (
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page {logsData.pagination.page} of {logsData.pagination.totalPages} ({logsData.pagination.totalCount} records)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg font-semibold"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= logsData.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ERROR INSPECTOR MODAL */}
        {selectedErrorLog && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Email Dispatch Exception Log</h3>
                </div>
                <button
                  onClick={() => setSelectedErrorLog(null)}
                  className="text-slate-400 hover:text-white text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p><strong>Recipient:</strong> <code className="text-indigo-300">{selectedErrorLog.recipient}</code></p>
                <p><strong>Subject:</strong> {selectedErrorLog.subject}</p>
                <p><strong>Template Key:</strong> <code className="font-mono text-indigo-400">{selectedErrorLog.templateKey}</code></p>

                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">Stack Trace Error Message:</label>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 text-rose-300 font-mono text-[11px] whitespace-pre-wrap overflow-x-auto max-h-48">
                    {selectedErrorLog.errorMessage || 'Unknown SMTP error'}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedErrorLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
