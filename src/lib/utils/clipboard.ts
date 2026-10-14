import { ExtractedNidData } from '@/types/nid';

/**
 * Copies text to clipboard using navigator.clipboard with fallback to document.execCommand
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text && text !== '') return false;

  // Modern async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback using textarea execCommand
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Make it invisible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Formats all extracted NID fields into a neat, human-readable text block,
 * one field per line, preserving Bengali Unicode characters.
 */
export function formatAllFieldsForCopy(data: ExtractedNidData): string {
  const lines: string[] = [
    `নাম (বাংলা): ${data.nameBangla || 'N/A'}`,
    `Name (English): ${data.nameEnglish || 'N/A'}`,
    `পিতার নাম (বাংলা): ${data.fatherNameBangla || 'N/A'}`,
    `Father's Name (English): ${data.fatherNameEnglish || 'N/A'}`,
    `মাতার নাম (বাংলা): ${data.motherNameBangla || 'N/A'}`,
    `Mother's Name (English): ${data.motherNameEnglish || 'N/A'}`,
    `NID Number: ${data.nidNumber || 'N/A'}`,
    `Date of Birth: ${data.dateOfBirth || 'N/A'}`,
  ];

  return lines.join('\n');
}
