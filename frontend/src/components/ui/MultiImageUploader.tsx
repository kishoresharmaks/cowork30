'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  className?: string;
}

export default function MultiImageUploader({
  value = [],
  onChange,
  label = 'Additional Gallery Photos',
  className = '',
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif|avif)$/i)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post('/cms/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.url) {
          newUrls.push(res.data.url);
        }
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
      }
    } catch (err: any) {
      console.error('Multi-image upload failed', err);
      alert('Failed to upload gallery images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <label className="block text-slate-300 font-medium text-xs">{label}</label>}

      {/* Grid of Uploaded Gallery Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div key={idx} className="relative h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group">
              <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-1 rounded-md bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                title="Remove Photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 hover:border-purple-500 hover:bg-slate-900 transition-all cursor-pointer text-center space-y-1.5 flex flex-col items-center justify-center"
      >
        {uploading ? (
          <div className="flex items-center space-x-2 text-xs text-purple-400 py-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading Gallery Photos...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white">
            <Plus className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">Upload Additional Gallery Photos</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesUpload(e.target.files);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
