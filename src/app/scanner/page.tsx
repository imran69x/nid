'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, UploadCloud, Users, Trash2, AlertOctagon, Settings, Shield } from 'lucide-react';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { ImageUploader } from '@/components/scanner/ImageUploader';
import { ImageStudio } from '@/components/scanner/ImageStudio';
import { FamilyResultsDashboard } from '@/components/dashboard/FamilyResultsDashboard';
import { OcrResult, FamilyMember } from '@/types/nid';
import { getSystemSettings, SystemSettings } from '@/lib/firebase/adminService';
import { useAuth } from '@/lib/firebase/authContext';
import { toast } from 'sonner';

type Step = 'capture' | 'studio' | 'result';

interface PendingImage {
  id: string;
  dataUrl: string;
  label: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('capture');
  const [inputTab, setInputTab] = useState<'camera' | 'upload'>('camera');

  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [studioImageSrc, setStudioImageSrc] = useState<string | null>(null);
  const [studioImageId, setStudioImageId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // System settings check
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    scanningEnabled: true,
    noticeMessage: '',
  });

  useEffect(() => {
    getSystemSettings().then((res) => {
      setSystemSettings(res);
    });
  }, []);

  // Image selected → go to studio
  const handleImageSelected = (dataUrl: string) => {
    if (!systemSettings.scanningEnabled) {
      toast.error('স্ক্যানিং ফিচার সাময়িকভাবে বন্ধ আছে।');
      return;
    }
    setStudioImageSrc(dataUrl);
    setStudioImageId(`img_${Date.now()}`);
    setStep('studio');
  };

  // Add Another: save current to queue, go back to capture
  const handleAddToQueue = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const idx = pendingImages.length + 1;
    setPendingImages((prev) => [
      ...prev,
      { id: studioImageId || `img_${Date.now()}`, dataUrl, label: `সদস্য ${idx}` },
    ]);
    toast.success(`সদস্য ${idx} যোগ হয়েছে`);
    setStudioImageSrc(null);
    setStudioImageId(null);
    setStep('capture');
  };

  // Scan all (queue + current)
  const handleScanAll = async (canvas: HTMLCanvasElement) => {
    if (!systemSettings.scanningEnabled) {
      toast.error('স্ক্যানিং ফিচার সাময়িকভাবে বন্ধ আছে।');
      return;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const idx = pendingImages.length + 1;
    const allImages = [
      ...pendingImages,
      { id: studioImageId || `img_${Date.now()}`, dataUrl, label: `সদস্য ${idx}` },
    ];

    setIsProcessing(true);
    setProgressStatus('শুরু হচ্ছে...');
    setProgressPercent(10);

    const results: FamilyMember[] = [];

    try {
      for (let i = 0; i < allImages.length; i++) {
        const img = allImages[i];
        const num = i + 1;
        setProgressStatus(`সদস্য ${num}/${allImages.length} স্ক্যান হচ্ছে...`);
        setProgressPercent(10 + Math.round((i / allImages.length) * 80));

        try {
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: img.dataUrl, mimeType: 'image/jpeg' }),
          });

          if (res.ok) {
            const data: OcrResult & { requiresLocalOcr?: boolean } = await res.json();
            if (data.success && !data.requiresLocalOcr) {
              results.push({
                id: img.id,
                memberIndex: num,
                label: img.label,
                documentType: data.documentType || 'unknown',
                data: data.data,
                confidence: data.confidence,
                rawText: data.rawText,
              });
            }
          }
        } catch (err) {
          console.warn(`OCR failed for member ${num}:`, err);
        }
      }

      if (results.length > 0) {
        setFamilyMembers(results);
        setStep('result');
        setPendingImages([]);
        setStudioImageSrc(null);
        toast.success(`${results.length} জন সদস্যের তথ্য বের হয়েছে!`);

        // Track count
        if (typeof window !== 'undefined') {
          const c = parseInt(localStorage.getItem('bd_nid_total_scans_count') || '0', 10);
          localStorage.setItem('bd_nid_total_scans_count', String(c + results.length));
        }
      } else {
        toast.error('তথ্য বের করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OCR failure';
      toast.error(`ত্রুটি: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
      setProgressPercent(0);
    }
  };

  // Remove from queue
  const handleRemoveFromQueue = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Reset
  const handleReset = () => {
    setPendingImages([]);
    setFamilyMembers([]);
    setStudioImageSrc(null);
    setStudioImageId(null);
    setStep('capture');
  };

  return (
    <div className="space-y-4">
      {/* Scanning Disabled Notice */}
      {!systemSettings.scanningEnabled && (
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <span>স্ক্যানিং ফিচার সাময়িকভাবে বন্ধ আছে (Scanning Disabled)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {systemSettings.noticeMessage ||
              'অ্যাডমিন কর্তৃক স্ক্যানিং ফিচার বর্তমানে বন্ধ রাখা হয়েছে। অনুগ্রহ করে অপেক্ষা করুন।'}
          </p>
          {user?.isAdmin && (
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্যানেলে যান ও চালু করুন</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ──── Step 1: Capture ──── */}
      {step === 'capture' && (
        <div className="space-y-4">
          {/* Camera / Upload toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-2xl bg-slate-200/80 p-1.5 border border-slate-300 shadow-inner">
              <button
                onClick={() => setInputTab('camera')}
                disabled={!systemSettings.scanningEnabled}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                  inputTab === 'camera'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>ক্যামেরা</span>
              </button>
              <button
                onClick={() => setInputTab('upload')}
                disabled={!systemSettings.scanningEnabled}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                  inputTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>আপলোড</span>
              </button>
            </div>
          </div>

          {/* Pending queue bar */}
          {pendingImages.length > 0 && (
            <div className="max-w-3xl mx-auto p-3 rounded-xl bg-blue-600 text-white flex flex-wrap items-center gap-3 shadow-lg">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>{pendingImages.length} জন যোগ হয়েছে</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingImages.map((img) => (
                  <div key={img.id} className="flex items-center gap-1 bg-blue-500 rounded-lg px-2 py-1 text-xs font-semibold">
                    <img src={img.dataUrl} alt={img.label} className="w-6 h-6 rounded object-cover" />
                    <span>{img.label}</span>
                    <button onClick={() => handleRemoveFromQueue(img.id)} className="ml-1 text-blue-200 hover:text-white">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera or Upload */}
          <div className="max-w-3xl mx-auto">
            {inputTab === 'camera' ? (
              <CameraScanner onCapture={handleImageSelected} />
            ) : (
              <ImageUploader onImageSelected={handleImageSelected} />
            )}
          </div>
        </div>
      )}

      {/* ──── Step 2: Preview + 3 buttons ──── */}
      {step === 'studio' && studioImageSrc && (
        <div className="max-w-3xl mx-auto">
          <ImageStudio
            initialImageSrc={studioImageSrc}
            onScan={handleScanAll}
            onAddAnother={pendingImages.length < 9 ? handleAddToQueue : undefined}
            onReset={handleReset}
            isProcessing={isProcessing}
            progressStatus={progressStatus}
            progressPercent={progressPercent}
            pendingCount={pendingImages.length}
          />
        </div>
      )}

      {/* ──── Step 3: Results ──── */}
      {step === 'result' && familyMembers.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <FamilyResultsDashboard
            members={familyMembers}
            onScanAgain={handleReset}
          />
        </div>
      )}
    </div>
  );
}
