import { z } from 'zod';

/**
 * Validates whether a DD-MM-YYYY string is a real calendar date
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  
  const match = dateStr.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;
  if (month < 1 || month > 12) return false;

  // Days per month check including leap years
  const daysInMonth = [
    31,
    (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];

  if (day < 1 || day > daysInMonth[month - 1]) return false;

  return true;
}

/**
 * Validates Bangladeshi NID format (10 digit smart card, 13 or 17 digit old NID)
 */
export function isValidNidNumber(nid: string): boolean {
  if (!nid) return false;
  const cleaned = nid.replace(/[\s-]/g, '');
  return /^(?:\d{10}|\d{13}|\d{17})$/.test(cleaned);
}

/**
 * Zod schema for editing/saving NID data
 */
export const nidDataSchema = z.object({
  nameBangla: z.string().trim(),
  nameEnglish: z.string().trim(),
  fatherNameBangla: z.string().trim(),
  fatherNameEnglish: z.string().trim(),
  motherNameBangla: z.string().trim(),
  motherNameEnglish: z.string().trim(),
  nidNumber: z.string().trim().refine((val) => {
    if (!val) return true; // allow empty if unread
    return isValidNidNumber(val);
  }, {
    message: 'NID must be 10 digits (Smart Card), or 13/17 digits (Old NID)',
  }),
  dateOfBirth: z.string().trim().refine((val) => {
    if (!val) return true; // allow empty if unread
    return isValidCalendarDate(val);
  }, {
    message: 'Date of Birth must be a valid calendar date in DD-MM-YYYY format',
  }),
});

export type NidFormData = z.infer<typeof nidDataSchema>;
