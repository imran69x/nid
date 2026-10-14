import { ExtractedNidData, FieldConfidence } from '@/types/nid';
import { isValidCalendarDate, isValidNidNumber } from '@/lib/validation/nidSchema';

// Map of Bengali digits to English ASCII digits
const BENGALI_DIGITS_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

// Map of Month names (English and Bangla) to 2-digit month strings
const MONTH_MAP: Record<string, string> = {
  // English short & long
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
  // Bengali months
  'জানুয়ারি': '01', 'জানু': '01',
  'ফেব্রুয়ারি': '02', 'ফেব্রু': '02',
  'মার্চ': '03',
  'এপ্রিল': '04',
  'মে': '05',
  'জুন': '06',
  'জুলাই': '07',
  'আগস্ট': '08', 'আগষ্ট': '08',
  'সেপ্টেম্বর': '09', 'সেপ্টে': '09',
  'অক্টোবর': '10', 'অক্টো': '10',
  'নভেম্বর': '11', 'নভে': '11',
  'ডিসেম্বর': '12', 'ডিসে': '12',
};

/**
 * Converts Bengali digits to standard ASCII digits
 */
export function normalizeBengaliDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[০-৯]/g, (char) => BENGALI_DIGITS_MAP[char] || char);
}

/**
 * Cleans OCR noise, punctuation, extra colons and spaces
 */
export function cleanFieldText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[:\-\s\.,|]+/, '') // leading punctuation
    .replace(/[:\-\s\.,|]+$/, '') // trailing punctuation
    .replace(/\s+/g, ' ')         // multiple spaces
    .trim();
}

/**
 * Normalizes date into DD-MM-YYYY format and validates it
 */
export function parseAndFormatDate(text: string): string {
  if (!text) return '';

  const normalized = normalizeBengaliDigits(text);

  // Pattern 1: DD MMM YYYY (e.g. 05 Mar 1990 or 5 March 1990)
  const ddMmmYyyyRegex = /\b(\d{1,2})\s+([A-Za-z\u0980-\u09FF]{3,12})\s+(\d{4})\b/i;
  const match1 = normalized.match(ddMmmYyyyRegex);
  if (match1) {
    const rawDay = match1[1].padStart(2, '0');
    const rawMonthStr = match1[2].toLowerCase();
    const rawYear = match1[3];
    const monthNum = MONTH_MAP[rawMonthStr];
    if (monthNum) {
      const candidate = `${rawDay}-${monthNum}-${rawYear}`;
      if (isValidCalendarDate(candidate)) return candidate;
    }
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const delimiterRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/;
  const match2 = normalized.match(delimiterRegex);
  if (match2) {
    const day = match2[1].padStart(2, '0');
    const month = match2[2].padStart(2, '0');
    const year = match2[3];
    const candidate = `${day}-${month}-${year}`;
    if (isValidCalendarDate(candidate)) return candidate;
  }

  // Pattern 3: YYYY-MM-DD or YYYY/MM/DD
  const yyyyFirstRegex = /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/;
  const match3 = normalized.match(yyyyFirstRegex);
  if (match3) {
    const year = match3[1];
    const month = match3[2].padStart(2, '0');
    const day = match3[3].padStart(2, '0');
    const candidate = `${day}-${month}-${year}`;
    if (isValidCalendarDate(candidate)) return candidate;
  }

  return '';
}

/**
 * Extracts NID Number from line or full text
 * Smart Card: 10 digits
 * Old NID: 13 or 17 digits
 */
export function extractNidNumber(text: string): string {
  if (!text) return '';
  const normalized = normalizeBengaliDigits(text);

  // Remove card noise words near NID
  const cleanLine = normalized
    .replace(/(?:NID|NO|ID|CARD|NUMBER|নম্বর|পরিচয়|জাতীয়|স্মার্ট|পত্র|[:\-\.])/gi, ' ');

  // Match 10, 13, or 17 digits that may be separated by single spaces (e.g. "195 243 8920")
  // First test with spaces removed
  const digitSequences = cleanLine.match(/\b\d(?:\s*\d){9,16}\b/g);
  if (digitSequences) {
    for (const seq of digitSequences) {
      const compact = seq.replace(/\s+/g, '');
      if (isValidNidNumber(compact)) {
        return compact;
      }
    }
  }

  // Also check direct numbers
  const directDigits = cleanLine.match(/\b\d{10}\b|\b\d{17}\b|\b\d{13}\b/g);
  if (directDigits && directDigits.length > 0) {
    return directDigits[0];
  }

  return '';
}

/**
 * Checks if a string contains significant Bengali characters
 */
export function isBengaliText(str: string): boolean {
  const bengaliChars = str.match(/[\u0980-\u09FF]/g);
  return Boolean(bengaliChars && bengaliChars.length >= 2);
}

/**
 * Checks if a string contains significant English letters
 */
export function isEnglishText(str: string): boolean {
  const englishChars = str.match(/[A-Za-z]/g);
  return Boolean(englishChars && englishChars.length >= 2);
}

/**
 * Header and noise lines to filter out
 */
const NOISE_WORDS = [
  'government of the people',
  'republic of bangladesh',
  'national id card',
  'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
  'জাতীয় পরিচয় পত্র',
  'blood group',
  'রক্তের গ্রুপ',
  'signature',
  'স্বাক্ষর',
  'প্রধান নির্বাচন কমিশনার',
  'election commission',
  'card no',
];

export function isNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  return NOISE_WORDS.some(noise => lower.includes(noise));
}

const COMMON_BANGLA_NAME_MAP: Record<string, string> = {
  'মোঃ': 'MD.', 'মো:': 'MD.', 'মোসাঃ': 'MST.', 'মোসাম্মৎ': 'MST.',
  'মুহাম্মদ': 'MUHAMMAD', 'মোহাম্মদ': 'MOHAMMAD',
  'আশরাফুল': 'ASHRAFUL', 'মাশরুর': 'MASHRUR', 'রেজা': 'REZA',
  'সাকিব': 'SAKIB', 'আল': 'AL', 'হাসান': 'HASAN',
  'শিরিন': 'SHIRIN', 'আক্তার': 'AKHTER', 'বেগম': 'BEGUM',
  'খাতুন': 'KHATUN', 'ফাতেমা': 'FATEMA', 'জাহানারা': 'JAHANARA',
  'রফিকুল': 'RAFIQUL', 'ইসলাম': 'ISLAM', 'আহমেদ': 'AHMED',
  'আহম্মেদ': 'AHMED', 'হোসেন': 'HOSSAIN', 'রহমান': 'RAHMAN',
  'আলী': 'ALI', 'খান': 'KHAN', 'চৌধুরী': 'CHOWDHURY',
  'সরকার': 'SARKER', 'মিয়া': 'MIAH', 'নুরুল': 'NURUL',
  'হক': 'HAQUE', 'সাইফুল': 'SAIFUL', 'শফিকুল': 'SHAFIQUL',
  'খন্দকার': 'KHONDAKER', 'রোকেয়া': 'ROKEYA', 'রোকেয়া': 'ROKEYA',
  'ইউনূস': 'YUNUS', 'দুলা': 'DULA', 'মুনীর': 'MUNEER',
  'তারেক': 'TAREK', 'জসিম': 'JASIM', 'উদ্দীন': 'UDDIN',
  'মাহমুদ': 'MAHMUD', 'করিম': 'KARIM', 'রশিদ': 'RASHID',
  'মাসুদ': 'MASUD', 'পারভেজ': 'PARVEZ', 'সুলতানা': 'SULTANA',
  'নাসরিন': 'NASRIN', 'শাহীন': 'SHAHIN', 'রাহিম': 'RAHIM',
  'আবুল': 'ABUL', 'কালাম': 'KALAM', 'আজাদ': 'AZAD',
  'মোবারক': 'MOBARAK', 'ফারুক': 'FARUK', 'কবির': 'KABIR',
  'মোর্শেদ': 'MOSHED', 'সেলিম': 'SELIM', 'জাহিদ': 'ZAHID'
};

export function transliterateBengaliNameToEnglish(bengaliName: string): string {
  if (!bengaliName) return '';
  const words = bengaliName.trim().split(/\s+/);
  const englishWords = words.map(w => {
    const cleanWord = w.replace(/[:,\.]/g, '').trim();
    if (COMMON_BANGLA_NAME_MAP[w]) return COMMON_BANGLA_NAME_MAP[w];
    if (COMMON_BANGLA_NAME_MAP[cleanWord]) return COMMON_BANGLA_NAME_MAP[cleanWord];
    return '';
  }).filter(Boolean);
  return englishWords.join(' ');
}

/**
 * Main parser that translates raw OCR text into structured NID fields
 */
export function parseNidOcrText(rawText: string): {
  data: ExtractedNidData;
  confidence: Partial<FieldConfidence>;
  warnings: string[];
  cardType: 'smart' | 'old' | 'unknown';
} {
  const warnings: string[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !isNoiseLine(l));

  const data: ExtractedNidData = {
    nameBangla: '',
    nameEnglish: '',
    fatherNameBangla: '',
    fatherNameEnglish: '',
    motherNameBangla: '',
    motherNameEnglish: '',
    nidNumber: '',
    dateOfBirth: '',
  };

  const confidence: Partial<FieldConfidence> = {};

  // Detect card type
  const lowerFull = rawText.toLowerCase();
  let cardType: 'smart' | 'old' | 'unknown' = 'unknown';
  if (lowerFull.includes('smart') || lowerFull.includes('government of the people') || lowerFull.includes('national id card')) {
    cardType = 'smart';
  } else if (lowerFull.includes('গণপ্রজাতন্ত্রী') || lowerFull.includes('জাতীয় পরিচয় পত্র')) {
    cardType = 'old';
  }

  // Iterate over lines and match fields
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

    // 1. Bengali Name (নাম / নাম:)
    if (!data.nameBangla) {
      const match = line.match(/(?:^|\s)নাম\s*[:\-\.|\s]?\s*(.*)$/);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isBengaliText(nextLine) && !nextLine.includes('পিতা') && !nextLine.includes('মাতা')) {
          val = cleanFieldText(nextLine);
        }
        if (val && isBengaliText(val)) {
          // Remove any stray "Name" label if stuck
          val = val.replace(/Name\s*:.*$/i, '').trim();
          data.nameBangla = val;
          confidence.nameBangla = 0.9;
        }
      }
    }

    // 2. English Name (Name / Name:)
    if (!data.nameEnglish) {
      const match = line.match(/(?:^|\s)Name\s*[:\-\.|\s]?\s*(.*)$/i);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isEnglishText(nextLine) && !nextLine.toLowerCase().includes('father') && !nextLine.toLowerCase().includes('mother') && !nextLine.toLowerCase().includes('date of birth')) {
          val = cleanFieldText(nextLine);
        }
        if (val && isEnglishText(val)) {
          // Filter out header words if captured
          if (!isNoiseLine(val)) {
            data.nameEnglish = val.toUpperCase();
            confidence.nameEnglish = 0.9;
          }
        }
      }
    }

    // 3. Father's Name (Bangla: পিতা / পিতার নাম)
    if (!data.fatherNameBangla) {
      const match = line.match(/(?:পিতার\s*নাম|পিতা)\s*[:\-\.|\s]?\s*(.*)$/);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isBengaliText(nextLine) && !nextLine.includes('মাতা')) {
          val = cleanFieldText(nextLine);
        }
        if (val && isBengaliText(val)) {
          data.fatherNameBangla = val;
          confidence.fatherNameBangla = 0.85;
        }
      }
    }

    // 4. Father's Name (English: Father / Father's Name)
    if (!data.fatherNameEnglish) {
      const match = line.match(/(?:Father(?:'s)?\s*Name|Father)\s*[:\-\.|\s]?\s*(.*)$/i);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isEnglishText(nextLine) && !nextLine.toLowerCase().includes('mother')) {
          val = cleanFieldText(nextLine);
        }
        if (val && isEnglishText(val) && !isNoiseLine(val)) {
          data.fatherNameEnglish = val.toUpperCase();
          confidence.fatherNameEnglish = 0.85;
        }
      }
    }

    // 5. Mother's Name (Bangla: মাতা / মাতার নাম)
    if (!data.motherNameBangla) {
      const match = line.match(/(?:মাতার\s*নাম|মাতা)\s*[:\-\.|\s]?\s*(.*)$/);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isBengaliText(nextLine)) {
          val = cleanFieldText(nextLine);
        }
        if (val && isBengaliText(val)) {
          data.motherNameBangla = val;
          confidence.motherNameBangla = 0.85;
        }
      }
    }

    // 6. Mother's Name (English: Mother / Mother's Name)
    if (!data.motherNameEnglish) {
      const match = line.match(/(?:Mother(?:'s)?\s*Name|Mother)\s*[:\-\.|\s]?\s*(.*)$/i);
      if (match) {
        let val = cleanFieldText(match[1]);
        if (!val && nextLine && isEnglishText(nextLine)) {
          val = cleanFieldText(nextLine);
        }
        if (val && isEnglishText(val) && !isNoiseLine(val)) {
          data.motherNameEnglish = val.toUpperCase();
          confidence.motherNameEnglish = 0.85;
        }
      }
    }

    // 7. Date of Birth (Date of Birth / জন্ম তারিখ)
    if (!data.dateOfBirth) {
      if (/(?:Date of Birth|DOB|জন্ম\s*তারিখ)/i.test(line)) {
        const parsed = parseAndFormatDate(line);
        if (parsed) {
          data.dateOfBirth = parsed;
          confidence.dateOfBirth = 0.95;
        } else if (nextLine) {
          const parsedNext = parseAndFormatDate(nextLine);
          if (parsedNext) {
            data.dateOfBirth = parsedNext;
            confidence.dateOfBirth = 0.9;
          }
        }
      }
    }

    // 8. NID Number (NID No. / ID NO. / 10, 13, 17 digits)
    if (!data.nidNumber) {
      if (/(?:NID|ID\s*NO|National\s*ID|পরিচয়\s*নম্বর)/i.test(line)) {
        const extracted = extractNidNumber(line);
        if (extracted) {
          data.nidNumber = extracted;
          confidence.nidNumber = 0.95;
        } else if (nextLine) {
          const extractedNext = extractNidNumber(nextLine);
          if (extractedNext) {
            data.nidNumber = extractedNext;
            confidence.nidNumber = 0.9;
          }
        }
      }
    }
  }

  // Fallback scan for Date of Birth if not caught near label
  if (!data.dateOfBirth) {
    const fullDate = parseAndFormatDate(rawText);
    if (fullDate) {
      data.dateOfBirth = fullDate;
      confidence.dateOfBirth = 0.7;
      warnings.push('Date of Birth found without explicit header label.');
    }
  }

  // Fallback scan for NID Number anywhere in raw text
  if (!data.nidNumber) {
    const fullNid = extractNidNumber(rawText);
    if (fullNid) {
      data.nidNumber = fullNid;
      confidence.nidNumber = 0.75;
      warnings.push('NID number matched by digit structure.');
    }
  }

  // Identify card type from NID digit length if unknown
  if (data.nidNumber && cardType === 'unknown') {
    if (data.nidNumber.length === 10) cardType = 'smart';
    else if (data.nidNumber.length === 13 || data.nidNumber.length === 17) cardType = 'old';
  }

  // Check missing required fields and inform without guessing
  if (!data.nameBangla) warnings.push('Full Name (Bangla) could not be identified with certainty.');
  if (!data.nameEnglish) warnings.push('Full Name (English) could not be identified with certainty.');
  if (!data.nidNumber) warnings.push('NID Number could not be identified with certainty.');
  if (!data.dateOfBirth) warnings.push('Date of Birth could not be identified with certainty.');

  return {
    data,
    confidence,
    warnings,
    cardType,
  };
}
