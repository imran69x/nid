import { GoogleGenerativeAI } from '@google/generative-ai';
import { OcrResult, ExtractedNidData, DocumentType } from '@/types/nid';
import { isValidCalendarDate, isValidNidNumber } from '@/lib/validation/nidSchema';
import { parseAndFormatDate } from './banglaParser';

const SYSTEM_INSTRUCTION = `You are a Bangladeshi National ID (NID) and Birth Registration Certificate document extractor.
Analyze the image and return a JSON object with visible details.

== DOCUMENT TYPE ==
- "nid_smart": Smart NID Card (English header, chip, 10-digit NID No.)
- "nid_old": Old laminated NID (Bengali header "জাতীয় পরিচয় পত্র", 13 or 17 digit ID)
- "birth_certificate": Birth Registration Certificate ("জন্ম নিবন্ধন সনদপত্র", 17-digit reg number)

== FIELD EXTRACTION ==
- nameBangla: Full name in Bengali script exactly as visible.
- nameEnglish: Full name in English capital letters exactly as visible on card.
- fatherNameBangla: Father name in Bengali script.
- fatherNameEnglish: Use English from card if present. Otherwise TRANSLITERATE from Bengali using PREFIX RULES below. NEVER leave blank if Bengali name exists.
- motherNameBangla: Mother name in Bengali script.
- motherNameEnglish: Use English from card if present. Otherwise TRANSLITERATE from Bengali using PREFIX RULES below. NEVER leave blank if Bengali name exists.
- nidNumber: Exact digits only. Smart=10 digits. Old=13 or 17 digits. Birth cert=17 digits. Strip spaces/hyphens.
- dateOfBirth: ALWAYS "DD-MM-YYYY" format (two-digit day, two-digit month, four-digit year). "10 Jan 2001" → "10-01-2001". "10/1/2001" → "10-01-2001".

== MANDATORY BANGLADESHI PREFIX TRANSLITERATION RULES ==
These are OFFICIAL standardized mappings. You MUST use the standard English form — NOT phonetic spelling.

FEMALE PREFIXES (critical — do NOT spell phonetically):
  মোছাঃ      → MST.    (WRONG: MOSA:, MOSA, MOSHA:)
  মোছা       → MST.    (WRONG: MOSA, MOSHA)
  মোসাম্মৎ   → MST.    (WRONG: MOSAMMENT, MOSAMMAT)
  মোসাম্মাৎ  → MST.
  মোসাঃ      → MST.
  মোছামৎ     → MST.
  মোছামত     → MST.
  মোসামমত    → MST.
  মিসেস      → MRS.

MALE PREFIXES (critical — do NOT spell phonetically):
  মোঃ        → MD.     (WRONG: MO:, MOH., MOHA.)
  মো.        → MD.
  মোহাম্মদ   → MD.     (WRONG: MOHAMMAD, MOHAMMED — only use MD.)
  মুহাম্মদ   → MD.
  মুহম্মদ    → MD.
  মোহাম্মাদ  → MD.
  শেখ        → SHEIKH
  মিঃ        → MR.
  জনাব       → MR.

COMMON WORD STANDARDS (use these exact spellings):
  আক্তার / আকতার / আখতার → AKTER   (NOT: AKTAR, AKTHAR, AKHTER, AKTHER)
  হোসেন / হোসাইন / হুসাইন → HOSSAIN (NOT: HUSSAIN, HOSSEIN)
  বেগম    → BEGUM
  খানম    → KHANAM
  খানুম   → KHANAM
  রহমান   → RAHMAN
  ইসলাম   → ISLAM
  আলী     → ALI
  মিয়া    → MIA
  মিঞা    → MIA
  উদ্দিন   → UDDIN
  উদ্দীন   → UDDIN
  আহমেদ   → AHMED
  আহমদ    → AHMED
  আহম্মেদ  → AHMED
  সুলতানা  → SULTANA
  পারভীন   → PARVIN
  নাহার    → NAHAR
  বিবি     → BIBI

TRANSLITERATION EXAMPLES — memorize these:
  "মোছাঃ রেহানা খাতুন"    → "MST. REHANA KHATUN"     (NOT "MOSA: REHANA KHATUN")
  "মোছা সুমাইয়া আক্তার"  → "MST. SUMAIYA AKTER"     (NOT "MOSA SUMAIYA AKTER")
  "মোসাম্মৎ লাভলী বেগম"  → "MST. LOVELY BEGUM"      (NOT "MOSAMMENT LOVELY BEGUM")
  "মোছাঃ মর্জিনা বেগম"    → "MST. MORJINA BEGUM"     (NOT "MOSA: MORJINA BEGUM")
  "মোঃ মাশরুর রেজা"       → "MD. MASHRUR REZA"       (NOT "MO: MASHRUR REZA")
  "মোঃ আবুল হোসেন"       → "MD. ABUL HOSSAIN"       (NOT "MO: ABUL HUSSAIN")
  "মোহাম্মদ কামরুল ইসলাম" → "MD. KAMRUL ISLAM"       (NOT "MOHAMMAD KAMRUL ISLAM")
  "বেগম রোকেয়া"            → "BEGUM ROKEYA"
  "শিরিন আক্তার"            → "SHIRIN AKTER"
  "শেখ রাসেল"               → "SHEIKH RASEL"

== STRICT RULES ==
- Numbers: extract ALL digits exactly, never drop any.
- Return ONLY a valid JSON object. No markdown. No code fences.

OUTPUT JSON SCHEMA:
{
  "documentType": "nid_smart" | "nid_old" | "birth_certificate" | "unknown",
  "nameBangla": "...",
  "nameEnglish": "...",
  "fatherNameBangla": "...",
  "fatherNameEnglish": "...",
  "motherNameBangla": "...",
  "motherNameEnglish": "...",
  "nidNumber": "...",
  "dateOfBirth": "DD-MM-YYYY",
  "placeOfBirth": "...",
  "rawText": "full line-by-line transcription",
  "confidence": {
    "nameBangla": 0.95,
    "nameEnglish": 0.95,
    "fatherNameBangla": 0.9,
    "fatherNameEnglish": 0.9,
    "motherNameBangla": 0.9,
    "motherNameEnglish": 0.9,
    "nidNumber": 0.98,
    "dateOfBirth": 0.98
  },
  "warnings": []
}`;

/**
 * Normalizes date into DD-MM-YYYY with numeric day and month
 */
function normalizeDateToDdMmYyyy(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // If already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  // Try banglaParser date normalizer
  const parsed = parseAndFormatDate(trimmed);
  if (parsed) return parsed;
  return trimmed;
}

/**
 * Fast Gemini Extraction with optimized timeout and fallback
 */
export async function extractNidWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const startTime = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);

  // Clean base64 payload
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  // Models in priority order: gemini-3.5-flash-lite is the fastest
  const models = ['gemini-3.5-flash-lite', 'gemini-flash-latest'];
  let lastError: Error | null = null;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.05, // very low temperature for maximum factual precision
          responseMimeType: 'application/json',
        },
      });

      // Call Gemini with inline image data
      const result = await model.generateContent([
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
        {
          text: SYSTEM_INSTRUCTION,
        },
      ]);

      const text = result.response.text();
      if (!text) throw new Error('Empty response from model');

      const cleanedJson = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const parsed = JSON.parse(cleanedJson);

      // Clean NID / Registration Number (remove any spaces, dashes, or non-digits)
      const cleanNid = (parsed.nidNumber || '').replace(/[^\d]/g, '');

      // Normalize Date of Birth to DD-MM-YYYY
      const cleanDob = normalizeDateToDdMmYyyy(parsed.dateOfBirth || '');

      const docType: DocumentType =
        parsed.documentType === 'birth_certificate'
          ? 'birth_certificate'
          : parsed.documentType === 'nid_old'
          ? 'nid_old'
          : parsed.documentType === 'nid_smart'
          ? 'nid_smart'
          : cleanNid.length === 17 && (parsed.rawText?.includes('জন্ম') || parsed.rawText?.includes('Birth'))
          ? 'birth_certificate'
          : cleanNid.length === 10
          ? 'nid_smart'
          : cleanNid.length === 13 || cleanNid.length === 17
          ? 'nid_old'
          : 'unknown';

      const data: ExtractedNidData = {
        nameBangla: (parsed.nameBangla || '').trim(),
        nameEnglish: (parsed.nameEnglish || '').toUpperCase().trim(),
        fatherNameBangla: (parsed.fatherNameBangla || '').trim(),
        fatherNameEnglish: (parsed.fatherNameEnglish || '').toUpperCase().trim(),
        motherNameBangla: (parsed.motherNameBangla || '').trim(),
        motherNameEnglish: (parsed.motherNameEnglish || '').toUpperCase().trim(),
        nidNumber: cleanNid,
        dateOfBirth: cleanDob,
        documentType: docType,
        placeOfBirth: (parsed.placeOfBirth || '').trim(),
      };

      const warnings: string[] = Array.isArray(parsed.warnings) ? [...parsed.warnings] : [];

      if (cleanDob && !isValidCalendarDate(cleanDob)) {
        warnings.push(`Date "${cleanDob}" may need manual verification.`);
      }

      if (cleanNid && !isValidNidNumber(cleanNid)) {
        warnings.push(`ID Number "${cleanNid}" has unusual length (${cleanNid.length} digits).`);
      }

      return {
        success: true,
        data,
        rawText: parsed.rawText || text,
        confidence: parsed.confidence || {},
        engine: 'gemini',
        processingTimeMs: Date.now() - startTime,
        warnings,
        cardType: docType === 'birth_certificate' ? 'birth_certificate' : docType === 'nid_smart' ? 'smart' : docType === 'nid_old' ? 'old' : 'unknown',
        documentType: docType,
      };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      lastError = e;
      console.warn(`Model ${modelName} error, falling to next candidate:`, e.message);
    }
  }

  throw lastError || new Error('Gemini OCR extraction failed.');
}
