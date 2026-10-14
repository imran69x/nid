'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageSelected: (imageDataUrl: string) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndReadFile = (file: File) => {
    // Check type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Invalid file format. Please upload JPEG, PNG, or WebP image.');
      return;
    }

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        toast.success(`Loaded "${file.name}" successfully!`);
        onImageSelected(dataUrl);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative w-full border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 shadow-sm'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        <UploadCloud className="w-8 h-8" />
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Upload NID Card Image / ছবি আপলোড করুন
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4">
        Drag & drop your Bangladeshi National ID Card photo here, or browse from your device.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-medium">
          JPEG / JPG
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-medium">
          PNG
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-medium">
          WebP
        </span>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-medium">
          Max {MAX_FILE_SIZE_MB}MB
        </span>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Image stays strictly on your browser for processing</span>
      </div>
    </div>
  );
}
