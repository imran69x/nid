'use client';

import React from 'react';
import { CreditCard, Layers, X, Sparkles, Check } from 'lucide-react';

interface SampleCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (dataUrl: string) => void;
}

export function SampleCardsModal({ isOpen, onClose, onSelectSample }: SampleCardsModalProps) {
  if (!isOpen) return null;

  // Generates a realistic high-resolution Bangladeshi Smart NID card image on canvas
  const generateSmartCardSample = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gradient Card Background
    const bg = ctx.createLinearGradient(0, 0, 1000, 630);
    bg.addColorStop(0, '#f0fdf4');
    bg.addColorStop(0.5, '#ecfdf5');
    bg.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bg;
    ctx.roundRect(0, 0, 1000, 630, 30);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.roundRect(0, 0, 1000, 630, 30);
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 1000, 100);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Government of the People's Republic of Bangladesh", 500, 45);
    ctx.font = 'bold 22px -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('National ID Card  /  জাতীয় পরিচয় পত্র', 500, 80);

    // Photo placeholder box on the left
    ctx.fillStyle = '#cbd5e1';
    ctx.roundRect(50, 140, 200, 250, 16);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hologram Chip
    ctx.fillStyle = '#fbbf24';
    ctx.roundRect(50, 420, 100, 75, 10);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Card Details Text (Bengali and English)
    ctx.textAlign = 'left';

    // 1. Bengali Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Noto Sans Bengali", sans-serif';
    ctx.fillText('নাম: মোঃ সাকিব আল হাসান', 280, 175);

    // 2. English Name
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('Name: MD. SAKIB AL HASAN', 280, 225);

    // 3. Father's Name (Bangla)
    ctx.font = '22px "Noto Sans Bengali", sans-serif';
    ctx.fillText('পিতা: মোঃ মাশরুর রেজা', 280, 275);

    // 4. Father's Name (English)
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText('Father Name: MD. MASHRUR REZA', 280, 315);

    // 5. Mother's Name (Bangla)
    ctx.font = '22px "Noto Sans Bengali", sans-serif';
    ctx.fillText('মাতা: শিরিন আক্তার', 280, 360);

    // 6. Mother's Name (English)
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText('Mother Name: SHIRIN AKHTER', 280, 400);

    // 7. Date of Birth
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Date of Birth: 24 Mar 1987', 280, 455);

    // 8. 10-Digit Smart NID Number
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText('NID No. 195 243 8920', 280, 520);

    // Signature line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 580);
    ctx.lineTo(250, 580);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('স্বাক্ষর / Signature', 100, 600);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Generates a realistic Old Laminated Bangladeshi NID card sample image
  const generateOldCardSample = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Old yellowed paper background
    ctx.fillStyle = '#fefce8';
    ctx.roundRect(0, 0, 1000, 630, 20);
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.roundRect(0, 0, 1000, 630, 20);
    ctx.stroke();

    // Bangladesh Emblem Seal Top Center
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(500, 65, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#14532d';
    ctx.font = 'bold 28px "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 500, 135);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 22px "Noto Sans Bengali", sans-serif';
    ctx.fillText('জাতীয় পরিচয় পত্র', 500, 170);

    // Photo Box on Right for Old Card format
    ctx.fillStyle = '#e2e8f0';
    ctx.roundRect(740, 200, 210, 260, 8);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fields on Left
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';

    ctx.font = 'bold 26px "Noto Sans Bengali", sans-serif';
    ctx.fillText('নাম: ড. মুহম্মদ ইউনূস', 80, 240);

    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText('Name: DR. MUHAMMAD YUNUS', 80, 285);

    ctx.font = '22px "Noto Sans Bengali", sans-serif';
    ctx.fillText('পিতা: হাজী দুলা মিয়া চৌধুরী', 80, 335);

    ctx.font = '22px "Noto Sans Bengali", sans-serif';
    ctx.fillText('মাতা: সুফিয়া খাতুন', 80, 385);

    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('Date of Birth: 28 Jun 1940', 80, 440);

    // 17-digit Old NID Number
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('ID NO: 19401594389201847', 80, 520);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleSelect = (type: 'smart' | 'old') => {
    const dataUrl = type === 'smart' ? generateSmartCardSample() : generateOldCardSample();
    onSelectSample(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">
              Try Ready-to-Scan Sample NID Cards
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-bengali leading-relaxed">
          আপনার কাছে তাৎক্ষণিকভাবে এনআইডি কার্ড না থাকলে, নিচের যেকোনো একটি ডেমো কার্ড বেছে নিয়ে ওআইসিআর এবং আলাদা ফিল্ডে এক্সট্র্যাকশন পরীক্ষা করতে পারেন:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Smart Card Option */}
          <button
            onClick={() => handleSelect('smart')}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                10-Digit Smart Card
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Smart NID Card</h4>
              <p className="text-[11px] text-slate-500 font-bengali mt-0.5">
                বাংলা ও ইংরেজি নাম, পিতা, মাতা, ১০ ডিজিট নম্বর এবং ইংরেজি জন্মতারিখ
              </p>
            </div>
          </button>

          {/* Old Laminated Card Option */}
          <button
            onClick={() => handleSelect('old')}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                17-Digit Old Card
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Traditional NID Card</h4>
              <p className="text-[11px] text-slate-500 font-bengali mt-0.5">
                গণপ্রজাতন্ত্রী বাংলাদেশ সরকার ১৭ ডিজিট ঐতিহ্যবাহী জাতীয় পরিচয়পত্র
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
