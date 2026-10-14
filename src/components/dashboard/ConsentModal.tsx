'use client';

import React from 'react';
import { ShieldAlert, Check, X, Lock } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}

export function ConsentModal({ isOpen, onClose, onConfirm, isSaving }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Explicit Data Privacy Consent
          </h3>
          <p className="text-xs text-slate-500 font-bengali mb-3">
            ব্যক্তিগত তথ্য সংরক্ষণের জন্য সম্মতি নিশ্চিত করুন
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 mb-5 leading-relaxed">
            <p>
              Under government privacy guidelines, Bangladeshi National ID details are highly sensitive.
            </p>
            <div className="flex items-start gap-2 text-slate-700">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                By confirming, you authorize storing these extracted text fields strictly under your authenticated user ID.
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Note: The original NID card photo is NEVER stored on our servers. You may permanently delete your saved records at any time.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel / বাতিল
            </button>
            <button
              onClick={onConfirm}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>I Consent, Save Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
