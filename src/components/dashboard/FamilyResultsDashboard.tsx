'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  BookmarkPlus,
  User,
  Users,
} from 'lucide-react';
import { ExtractedNidData, FamilyMember } from '@/types/nid';
import { copyToClipboard, formatAllFieldsForCopy } from '@/lib/utils/clipboard';
import { isValidCalendarDate, isValidNidNumber } from '@/lib/validation/nidSchema';
import { ConsentModal } from './ConsentModal';
import { saveExtractionRecord } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/lib/firebase/authContext';
import { toast } from 'sonner';

interface FamilyResultsDashboardProps {
  members: FamilyMember[];
  onScanAgain: () => void;
}

const EMPTY_DATA: ExtractedNidData = {
  nameBangla: '',
  nameEnglish: '',
  fatherNameBangla: '',
  fatherNameEnglish: '',
  motherNameBangla: '',
  motherNameEnglish: '',
  nidNumber: '',
  dateOfBirth: '',
};

function docTypeLabel(t?: string) {
  if (t === 'nid_smart') return 'Smart NID';
  if (t === 'nid_old') return 'পুরনো NID';
  if (t === 'birth_certificate') return 'জন্ম নিবন্ধন';
  return 'Document';
}

/* ─── Single member form with copy buttons ─── */
function MemberForm({ member }: { member: FamilyMember }) {
  const { user } = useAuth();
  const [form, setForm] = useState<ExtractedNidData>(member.data || EMPTY_DATA);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopy = async (key: string, val: string) => {
    if (!val) return;
    const ok = await copyToClipboard(val);
    if (ok) {
      setCopiedField(key);
      toast.success('কপি হয়েছে');
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const handleCopyAll = async () => {
    const ok = await copyToClipboard(formatAllFieldsForCopy(form));
    if (ok) {
      setIsCopiedAll(true);
      toast.success('সব তথ্য কপি হয়েছে!');
      setTimeout(() => setIsCopiedAll(false), 2000);
    }
  };

  const handleChange = (key: keyof ExtractedNidData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  const handleSave = async () => {
    if (!user) { toast.error('লগইন করুন'); setIsConsentOpen(false); return; }
    setIsSaving(true);
    try {
      await saveExtractionRecord(user.uid, form, member.documentType as string);
      setIsSaved(true);
      toast.success('সেভ হয়েছে!');
      setIsConsentOpen(false);
    } catch (err: unknown) {
      toast.error(`সেভ ব্যর্থ: ${err instanceof Error ? err.message : 'error'}`);
    } finally { setIsSaving(false); }
  };

  type F = { key: keyof ExtractedNidData; bn: string; ph: string; bengali?: boolean; upper?: boolean; mono?: boolean };

  const fields: F[] = [
    { key: 'nameBangla', bn: 'নাম (বাংলা)', ph: 'যেমন: মোঃ সাকিব আল হাসান', bengali: true },
    { key: 'nameEnglish', bn: 'নাম (ইংরেজি)', ph: 'MD. SAKIB AL HASAN', upper: true },
    { key: 'fatherNameBangla', bn: 'পিতার নাম (বাংলা)', ph: 'পিতার নাম', bengali: true },
    { key: 'fatherNameEnglish', bn: 'পিতার নাম (ইংরেজি)', ph: 'MD. MASHRUR REZA', upper: true },
    { key: 'motherNameBangla', bn: 'মাতার নাম (বাংলা)', ph: 'মাতার নাম', bengali: true },
    { key: 'motherNameEnglish', bn: 'মাতার নাম (ইংরেজি)', ph: 'MST. REHANA KHATUN', upper: true },
    { key: 'nidNumber', bn: 'ID নম্বর', ph: '10/13/17 ডিজিট', mono: true },
    { key: 'dateOfBirth', bn: 'জন্ম তারিখ', ph: 'DD-MM-YYYY', mono: true },
  ];

  // Show place of birth for birth certificates
  if (member.documentType === 'birth_certificate' || form.placeOfBirth) {
    fields.push({ key: 'placeOfBirth', bn: 'জন্মস্থান', ph: 'জন্মস্থান', bengali: true });
  }

  return (
    <div className="space-y-3">
      {/* Top bar: Copy All + Save */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
        <button
          onClick={handleCopyAll}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
        >
          {isCopiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopiedAll ? 'কপি হয়েছে!' : 'সব কপি'}</span>
        </button>
        <button
          onClick={() => setIsConsentOpen(true)}
          disabled={isSaved}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
            isSaved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          }`}
        >
          {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />}
          <span>{isSaved ? 'সেভ হয়েছে' : 'সেভ'}</span>
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(({ key, bn, ph, bengali, upper, mono }) => {
          const val = (form[key] as string) || '';
          const copied = copiedField === key;
          // Validation badges for NID & DOB
          let badge: React.ReactNode = null;
          if (key === 'nidNumber' && val) {
            const ok = isValidNidNumber(val);
            badge = (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {ok ? `✓ ${val.length} digit` : '⚠'}
              </span>
            );
          }
          if (key === 'dateOfBirth' && val) {
            const ok = isValidCalendarDate(val);
            badge = (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {ok ? '✓' : '⚠'}
              </span>
            );
          }

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold text-slate-800 ${bengali ? 'font-bengali' : ''}`}>{bn}</label>
                {badge}
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={ph}
                  className={`w-full px-3 py-2 pr-16 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 text-sm transition-all ${
                    bengali ? 'font-bengali' : upper ? 'uppercase font-medium tracking-wide' : mono ? 'font-mono font-semibold tracking-wider' : 'font-medium'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(key, val)}
                  className={`absolute right-1.5 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '✓' : 'কপি'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConfirm={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

/* ─── Main Dashboard ─── */
export function FamilyResultsDashboard({ members, onScanAgain }: FamilyResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full space-y-4">
      {/* Header: member count + scan again */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">
            {members.length === 1 ? 'স্ক্যান ফলাফল' : `${members.length} জন সদস্য`}
          </span>
        </div>
        <button
          onClick={onScanAgain}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>আবার স্ক্যান</span>
        </button>
      </div>

      {/* Member tabs (only if >1) */}
      {members.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {members.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                activeTab === i
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{m.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === i ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {docTypeLabel(m.documentType)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active form */}
      {members[activeTab] && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <MemberForm key={members[activeTab].id} member={members[activeTab]} />
        </div>
      )}
    </div>
  );
}
