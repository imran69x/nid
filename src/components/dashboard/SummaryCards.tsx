'use client';

import React from 'react';
import {
  Scan,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SummaryCardsProps {
  totalScans: number;
  savedRecordsCount: number;
  ocrEngine: string;
}

export function SummaryCards({
  totalScans,
  savedRecordsCount,
  ocrEngine,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Scans Performed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Scans
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{totalScans}</div>
        <div className="text-xs text-slate-500 font-bengali">
          বর্তমান সেশনে প্রক্রিয়াকৃত কার্ড
        </div>
      </div>

      {/* Card 2: Saved Records */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Saved Records
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{savedRecordsCount}</div>
        <div className="text-xs text-slate-500 font-bengali">
          সম্মতিসহ সংরক্ষিত তথ্য
        </div>
      </div>

      {/* Card 3: OCR Engine Active */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            OCR Engine
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
        <div className="text-base font-bold text-slate-900 mb-1 capitalize truncate">
          {ocrEngine === 'google-vision' ? 'Google Cloud Vision' : 'Tesseract (ben+eng)'}
        </div>
        <div className="text-xs text-slate-500 font-bengali">
          বাংলা ও ইংরেজি যৌথ শনাক্তকরণ
        </div>
      </div>

      {/* Card 4: Privacy Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Privacy Shield
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-base font-bold text-teal-700 mb-1 flex items-center gap-1.5">
          <span>In-Memory Only</span>
        </div>
        <div className="text-xs text-slate-500 font-bengali">
          ছবি সার্ভারে সংরক্ষিত হয় না
        </div>
      </div>
    </div>
  );
}
