'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Upload Image',
  className = '',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif|avif)$/i)) {
      alert('Please select a valid image file (JPG, PNG, WEBP, GIF, AVIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds maximum 5MB limit');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/cms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        onChange(res.data.url);
      }
    } catch (err: any) {
      console.error('Image upload failed', err);
      alert(err.response?.data?.message || 'Failed to upload image file');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-[#CBD5E1] font-semibold text-xs mb-1">{label}</label>}

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group h-36 w-full flex items-center justify-center">
          <img src={value} alt="Uploaded Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-xs font-semibold text-white border border-slate-700 hover:border-rose-500"
            >
              Replace Photo
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-rose-500/80 text-white hover:bg-rose-600"
              title="Remove Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 flex flex-col items-center justify-center ${
            dragOver
              ? 'border-rose-500 bg-rose-500/10'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2 py-2">
              <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
              <span className="text-xs font-semibold text-slate-300">Optimizing & Uploading...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <UploadCloud className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Click to Upload or Drag & Drop</span>
                <span className="text-[10px] text-slate-500 block pt-0.5">JPG, PNG, WEBP, AVIF up to 5MB</span>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
