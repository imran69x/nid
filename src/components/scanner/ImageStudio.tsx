'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Sparkles, RefreshCcw, Plus, Loader2 } from 'lucide-react';
import { processImageToCanvas, DEFAULT_FILTERS } from '@/lib/utils/imageProcess';

interface ImageStudioProps {
  initialImageSrc: string;
  onScan: (processedCanvas: HTMLCanvasElement) => void;
  onAddAnother?: (processedCanvas: HTMLCanvasElement) => void;
  onReset: () => void;
  isProcessing: boolean;
  progressStatus?: string;
  progressPercent?: number;
  pendingCount?: number;
}

export function ImageStudio({
  initialImageSrc,
  onScan,
  onAddAnother,
  onReset,
  isProcessing,
  progressStatus,
  progressPercent,
  pendingCount = 0,
}: ImageStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderCanvas = useCallback(async () => {
    try {
      const processed = await processImageToCanvas(initialImageSrc, DEFAULT_FILTERS);
      const target = canvasRef.current;
      if (!target) return;
      target.width = processed.width;
      target.height = processed.height;
      const ctx = target.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, target.width, target.height);
        ctx.drawImage(processed, 0, 0);
      }
    } catch (err) {
      console.error('Canvas render error:', err);
    }
  }, [initialImageSrc]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvas = () => canvasRef.current;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Image Preview */}
      <div className="relative bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[500px] object-contain"
        />

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">
                {progressStatus || 'Google Gemini AI বিশ্লেষণ করছে...'}
              </p>
              {pendingCount > 0 && (
                <p className="text-blue-300 text-xs mt-1">
                  {pendingCount + 1} জন সদস্য একসাথে স্ক্যান হচ্ছে
                </p>
              )}
            </div>
            {/* Progress Bar */}
            <div className="w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, progressPercent || 20)}%` }}
              />
            </div>
            {progressPercent ? (
              <span className="text-slate-400 text-xs">{progressPercent}%</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Buttons — only 3 */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        {/* Scan */}
        <button
          onClick={() => { const c = getCanvas(); if (c) onScan(c); }}
          disabled={isProcessing}
          className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>
            {isProcessing
              ? 'স্ক্যান হচ্ছে...'
              : pendingCount > 0
              ? `স্ক্যান করুন (${pendingCount + 1} জন)`
              : 'স্ক্যান করুন'}
          </span>
        </button>

        {/* Add Another — only if callback provided */}
        {onAddAnother && !isProcessing && (
          <button
            onClick={() => { const c = getCanvas(); if (c) onAddAnother(c); }}
            className="flex-1 py-3 px-5 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>আরও যোগ করুন</span>
          </button>
        )}

        {/* Retake */}
        {!isProcessing && (
          <button
            onClick={onReset}
            className="py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Retake</span>
          </button>
        )}
      </div>
    </div>
  );
}
