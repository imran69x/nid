'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  FileText,
  FileJson,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExtractedNidData, OcrResult } from '@/types/nid';
import { copyToClipboard, formatAllFieldsForCopy } from '@/lib/utils/clipboard';
import { isValidCalendarDate, isValidNidNumber } from '@/lib/validation/nidSchema';
import { ConsentModal } from './ConsentModal';
import { saveExtractionRecord } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/lib/firebase/authContext';
import { toast } from 'sonner';

interface ExtractedFormProps {
  ocrResult: OcrResult;
  imagePreviewSrc?: string;
  onScanAgain: () => void;
}

const INITIAL_EMPTY_DATA: ExtractedNidData = {
  nameBangla: '',
  nameEnglish: '',
  fatherNameBangla: '',
  fatherNameEnglish: '',
  motherNameBangla: '',
  motherNameEnglish: '',
  nidNumber: '',
  dateOfBirth: '',
};

export function ExtractedForm({ ocrResult, imagePreviewSrc, onScanAgain }: ExtractedFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExtractedNidData>(ocrResult.data || INITIAL_EMPTY_DATA);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Copy single field
  const handleCopyField = async (fieldName: string, value: string, label: string) => {
    if (!value) {
      toast.info(`The field "${label}" is currently empty.`);
      return;
    }
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(fieldName);
      toast.success(`Copied ${label}`);
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error('Failed to copy to clipboard.');
    }
  };

  // Copy all fields
  const handleCopyAll = async () => {
    const formatted = formatAllFieldsForCopy(formData);
    const success = await copyToClipboard(formatted);
    if (success) {
      setIsCopiedAll(true);
      toast.success('All extracted fields copied to clipboard!');
      setTimeout(() => setIsCopiedAll(false), 2500);
    } else {
      toast.error('Failed to copy text.');
    }
  };

  // Clear form
  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear all form fields?')) {
      setFormData(INITIAL_EMPTY_DATA);
      toast.info('Form cleared.');
    }
  };

  // Field change
  const handleChange = (key: keyof ExtractedNidData, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Handle Save with Consent
  const handleConfirmSave = async () => {
    if (!user) {
      toast.error('You must be signed in to save extraction records.');
      setIsConsentOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await saveExtractionRecord(user.uid, formData, ocrResult.cardType);
      setIsSavedSuccessfully(true);
      toast.success('NID extraction record saved securely to your records!');
      setIsConsentOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save record';
      toast.error(`Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NID_${formData.nidNumber || 'extracted'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported JSON successfully!');
  };

  // Export TXT
  const handleExportTxt = () => {
    const text = formatAllFieldsForCopy(formData);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NID_${formData.nidNumber || 'extracted'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported TXT successfully!');
  };

  // Date and NID validation badges
  const isDobValid = isValidCalendarDate(formData.dateOfBirth);
  const isNidValid = isValidNidNumber(formData.nidNumber);

  return (
    <div className="w-full space-y-6">
      {/* Top action header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Extracted Information Dashboard</h2>
            {ocrResult.cardType && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                {ocrResult.cardType === 'smart' ? 'Smart NID' : ocrResult.cardType === 'old' ? 'Old NID' : 'BD Card'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-bengali">
            যাচাই করুন এবং প্রয়োজন অনুযায়ী সম্পাদনা করুন (প্রতিটি ফিল্ডের পাশে কপি বোতাম রয়েছে)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy All Button */}
          <button
            onClick={handleCopyAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
            title="Copy all 8 fields formatted line-by-line"
          >
            {isCopiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{isCopiedAll ? 'All Copied!' : 'Copy All / সব কপি করুন'}</span>
          </button>

          {/* Save Record Button */}
          <button
            onClick={() => setIsConsentOpen(true)}
            disabled={isSavedSuccessfully}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
              isSavedSuccessfully
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
            }`}
          >
            {isSavedSuccessfully ? <Check className="w-4 h-4 text-emerald-600" /> : <BookmarkPlus className="w-4 h-4 text-blue-600" />}
            <span>{isSavedSuccessfully ? 'Saved' : 'Save Record'}</span>
          </button>

          {/* Scan Again Button */}
          <button
            onClick={onScanAgain}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Again</span>
          </button>
        </div>
      </div>

      {/* Warnings & Unidentified notice */}
      {ocrResult.warnings && ocrResult.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Manual Verification Required:</span>
            <p className="text-amber-800">
              Per strict security guidelines, missing or low-confidence fields have been left blank rather than guessed. Please review the highlighted fields below.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Card Image Preview & 8 Editable Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Preview & Fast Export */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs font-semibold text-slate-700">
              <span>Card Image Scanned</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Engine: {ocrResult.engine === 'gemini' ? 'Google Gemini AI' : ocrResult.engine === 'google-vision' ? 'Cloud Vision' : 'Tesseract (ben+eng)'}
              </span>
            </div>
            {imagePreviewSrc ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center p-2">
                <img
                  src={imagePreviewSrc}
                  alt="Scanned Bangladeshi NID"
                  className="max-h-[280px] w-auto object-contain rounded-lg shadow"
                />
              </div>
            ) : (
              <div className="h-48 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                No preview available
              </div>
            )}

            {/* Quick Export actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Export Extracted Data:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-600" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleExportTxt}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>TXT</span>
                </button>
              </div>
            </div>
          </div>

          {/* Raw Text Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="w-full px-5 py-3.5 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Inspect Raw Recognized OCR Text</span>
              </div>
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRawText && (
              <div className="p-4 bg-slate-900 text-slate-200 text-xs border-t border-slate-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">raw_ocr_lines</span>
                  <button
                    onClick={() => handleCopyField('rawText', ocrResult.rawText, 'Raw OCR Text')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Raw</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                  {ocrResult.rawText || 'No text recognized.'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 8 Required Editable Fields with Individual Copy Buttons */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              NID Information Fields
            </span>
            <button
              onClick={handleClearForm}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Field 1: Full Name (Bangla) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="font-bengali text-sm text-slate-900">১. নাম (বাংলা)</span>
                <span className="text-[11px] text-slate-400 font-normal">Full Name (Bangla)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.nameBangla}
                  onChange={(e) => handleChange('nameBangla', e.target.value)}
                  placeholder="যেমন: মোঃ সাকিব আল হাসান"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-bengali transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('nameBangla', formData.nameBangla, 'নাম (বাংলা)')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'nameBangla'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'nameBangla' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'nameBangla' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 2: Full Name (English) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>2. Name (English)</span>
                <span className="text-[11px] text-slate-400 font-bengali">ইংরেজি নাম</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.nameEnglish}
                  onChange={(e) => handleChange('nameEnglish', e.target.value)}
                  placeholder="e.g. MD. SAKIB AL HASAN"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium tracking-wide transition-all uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('nameEnglish', formData.nameEnglish, 'Name (English)')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'nameEnglish'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'nameEnglish' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'nameEnglish' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 3: Father's Name (Bangla) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="font-bengali text-sm text-slate-900">৩. পিতার নাম (বাংলা)</span>
                <span className="text-[11px] text-slate-400">Father&apos;s Name (Bangla)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.fatherNameBangla}
                  onChange={(e) => handleChange('fatherNameBangla', e.target.value)}
                  placeholder="পিতার নাম লিখুন"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-bengali transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('fatherNameBangla', formData.fatherNameBangla, 'পিতার নাম (বাংলা)')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'fatherNameBangla'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'fatherNameBangla' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'fatherNameBangla' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 4: Father's Name (English) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>4. Father&apos;s Name (English)</span>
                <span className="text-[11px] text-slate-400 font-bengali">পিতার ইংরেজি নাম</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.fatherNameEnglish}
                  onChange={(e) => handleChange('fatherNameEnglish', e.target.value)}
                  placeholder="e.g. MD. MASHRAFE"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium transition-all uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('fatherNameEnglish', formData.fatherNameEnglish, "Father's Name (English)")}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'fatherNameEnglish'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'fatherNameEnglish' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'fatherNameEnglish' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 5: Mother's Name (Bangla) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="font-bengali text-sm text-slate-900">৫. মাতার নাম (বাংলা)</span>
                <span className="text-[11px] text-slate-400">Mother&apos;s Name (Bangla)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.motherNameBangla}
                  onChange={(e) => handleChange('motherNameBangla', e.target.value)}
                  placeholder="মাতার নাম লিখুন"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-bengali transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('motherNameBangla', formData.motherNameBangla, 'মাতার নাম (বাংলা)')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'motherNameBangla'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'motherNameBangla' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'motherNameBangla' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 6: Mother's Name (English) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>6. Mother&apos;s Name (English)</span>
                <span className="text-[11px] text-slate-400 font-bengali">মাতার ইংরেজি নাম</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.motherNameEnglish}
                  onChange={(e) => handleChange('motherNameEnglish', e.target.value)}
                  placeholder="e.g. BEGUM ROKEYA"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-medium transition-all uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('motherNameEnglish', formData.motherNameEnglish, "Mother's Name (English)")}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'motherNameEnglish'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'motherNameEnglish' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'motherNameEnglish' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 7: NID Number */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  7. NID Number / জাতীয় পরিচয় নম্বর
                </label>
                {formData.nidNumber && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isNidValid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isNidValid
                      ? formData.nidNumber.length === 10
                        ? '✓ Valid 10-Digit Smart NID'
                        : `✓ Valid ${formData.nidNumber.length}-Digit Old NID`
                      : '⚠ Incomplete / Non-standard NID'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.nidNumber}
                  onChange={(e) => handleChange('nidNumber', e.target.value)}
                  placeholder="10, 13, or 17 digit NID number"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-mono tracking-wider font-semibold transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('nidNumber', formData.nidNumber, 'NID Number')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'nidNumber'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'nidNumber' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'nidNumber' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Field 8: Date of Birth */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  8. Date of Birth (DD-MM-YYYY) / জন্ম তারিখ
                </label>
                {formData.dateOfBirth && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isDobValid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {isDobValid ? '✓ Valid Calendar Date' : '⚠ Invalid Date Format'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  placeholder="DD-MM-YYYY (e.g. 05-03-1992)"
                  className="w-full px-3.5 py-2.5 pr-24 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm font-mono font-semibold transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyField('dateOfBirth', formData.dateOfBirth, 'Date of Birth')}
                  className={`absolute right-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedField === 'dateOfBirth'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedField === 'dateOfBirth' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'dateOfBirth' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Consent Modal */}
      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
}
