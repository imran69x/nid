import { createWorker, Worker } from 'tesseract.js';
import { OcrResult } from '@/types/nid';
import { parseNidOcrText } from './banglaParser';

export type OcrProgressCallback = (progress: {
  status: string;
  progress: number;
}) => void;

let cachedWorker: Worker | null = null;
let isInitializingWorker = false;

/**
 * Initializes or reuses a Tesseract.js worker configured with Bengali ('ben') and English ('eng')
 */
export async function getTesseractWorker(onProgress?: OcrProgressCallback): Promise<Worker> {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (isInitializingWorker) {
    // Wait briefly if initialization is already underway
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (cachedWorker) return cachedWorker;
  }

  isInitializingWorker = true;
  try {
    const worker = await createWorker(['ben', 'eng'], 1, {
      logger: (m) => {
        if (onProgress && m) {
          const progressVal = typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0;
          let friendlyStatus = 'Processing image...';
          if (m.status === 'loading tesseract core') friendlyStatus = 'Loading OCR Core...';
          else if (m.status === 'initializing tesseract') friendlyStatus = 'Initializing engine...';
          else if (m.status === 'loading language traineddata') friendlyStatus = 'Downloading Bengali & English OCR models...';
          else if (m.status === 'initializing api') friendlyStatus = 'Preparing recognizer...';
          else if (m.status === 'recognizing text') friendlyStatus = `Recognizing Bengali & English text (${progressVal}%)...`;
          
          onProgress({
            status: friendlyStatus,
            progress: progressVal,
          });
        }
      },
    });

    cachedWorker = worker;
    return worker;
  } finally {
    isInitializingWorker = false;
  }
}

/**
 * Runs client-side OCR on an image and returns parsed NID data
 */
export async function performClientOcr(
  imageSource: string | HTMLCanvasElement | Blob | File,
  onProgress?: OcrProgressCallback
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    const worker = await getTesseractWorker(onProgress);
    
    if (onProgress) {
      onProgress({ status: 'Recognizing text...', progress: 10 });
    }

    const { data: result } = await worker.recognize(imageSource);
    const rawText = result.text || '';

    // Parse the raw recognized text
    const { data, confidence, warnings, cardType } = parseNidOcrText(rawText);

    return {
      success: true,
      data,
      rawText,
      confidence,
      engine: 'tesseract',
      processingTimeMs: Date.now() - startTime,
      warnings,
      cardType,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown OCR failure';
    return {
      success: false,
      data: {
        nameBangla: '',
        nameEnglish: '',
        fatherNameBangla: '',
        fatherNameEnglish: '',
        motherNameBangla: '',
        motherNameEnglish: '',
        nidNumber: '',
        dateOfBirth: '',
      },
      rawText: '',
      engine: 'tesseract',
      processingTimeMs: Date.now() - startTime,
      warnings: [`OCR processing failed: ${errorMessage}`],
    };
  }
}

/**
 * Cleanly terminates the cached worker when component unmounts or resetting
 */
export async function terminateTesseractWorker(): Promise<void> {
  if (cachedWorker) {
    try {
      await cachedWorker.terminate();
    } catch {
      // Ignore cleanup error
    }
    cachedWorker = null;
  }
}
