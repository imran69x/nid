export type DocumentType = 'nid_smart' | 'nid_old' | 'birth_certificate' | 'unknown';

export interface ExtractedNidData {
  nameBangla: string;         // নাম (বাংলা)
  nameEnglish: string;        // Name (English)
  fatherNameBangla: string;   // পিতার নাম (বাংলা)
  fatherNameEnglish: string;  // Father's Name (English)
  motherNameBangla: string;   // মাতার নাম (বাংলা)
  motherNameEnglish: string;  // Mother's Name (English)
  nidNumber: string;          // NID Number (10, 13, 17 digits) or Birth Certificate (17 digits)
  dateOfBirth: string;        // Date of Birth (DD-MM-YYYY format)
  documentType?: DocumentType;
  placeOfBirth?: string;      // জন্মস্থান (optional, common on birth certificates)
}

export interface FieldConfidence {
  nameBangla: number;
  nameEnglish: number;
  fatherNameBangla: number;
  fatherNameEnglish: number;
  motherNameBangla: number;
  motherNameEnglish: number;
  nidNumber: number;
  dateOfBirth: number;
}

export interface OcrResult {
  success: boolean;
  data: ExtractedNidData;
  rawText: string;
  confidence?: Partial<FieldConfidence>;
  engine: 'gemini' | 'tesseract' | 'google-vision';
  processingTimeMs?: number;
  warnings?: string[];
  cardType?: 'smart' | 'old' | 'birth_certificate' | 'unknown';
  documentType?: DocumentType;
}

export interface FamilyMember {
  id: string;
  memberIndex: number; // 1, 2, 3...
  label: string;       // "সদস্য ১", "সদস্য ২"
  documentType: DocumentType;
  data: ExtractedNidData;
  confidence?: Partial<FieldConfidence>;
  rawText?: string;
}

export interface SavedNidRecord {
  id: string;
  ownerUid: string;
  extractedFields: ExtractedNidData;
  familyMembers?: FamilyMember[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  cardType?: 'smart' | 'old' | 'birth_certificate' | 'unknown';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  createdAt: string;
}

export interface ScanStats {
  totalScans: number;
  savedCount: number;
  lastScanAt?: string;
}
