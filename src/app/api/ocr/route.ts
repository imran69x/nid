import { NextRequest, NextResponse } from 'next/server';
import { parseNidOcrText } from '@/lib/ocr/banglaParser';
import { extractNidWithGemini } from '@/lib/ocr/geminiService';
import { OcrResult } from '@/types/nid';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    let imageBase64 = '';
    let mimeType = 'image/jpeg';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file uploaded' },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Image file size exceeds the 10MB limit' },
          { status: 413 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Unsupported file type. Only JPEG, PNG, and WebP are accepted.' },
          { status: 415 }
        );
      }

      mimeType = file.type;
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString('base64');
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.imageBase64) {
        return NextResponse.json(
          { success: false, error: 'Missing imageBase64 in request body' },
          { status: 400 }
        );
      }
      const cleanBase64 = body.imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      imageBase64 = cleanBase64;
      if (body.mimeType && ALLOWED_MIME_TYPES.includes(body.mimeType)) {
        mimeType = body.mimeType;
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid Content-Type' },
        { status: 400 }
      );
    }

    // 1. Primary Cloud AI Engine: Google Gemini Vision API
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await extractNidWithGemini(imageBase64, mimeType);
        return NextResponse.json(geminiResult);
      } catch (geminiError: unknown) {
        const msg = geminiError instanceof Error ? geminiError.message : 'Gemini extraction error';
        console.warn('Gemini vision extraction failed, evaluating fallback:', msg);
        // Fall through to Google Cloud Vision or local Tesseract
      }
    }

    // 2. Secondary Cloud Engine: Google Cloud Vision API (if configured)
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    if (visionApiKey) {
      try {
        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: imageBase64 },
                  features: [{ type: 'TEXT_DETECTION' }],
                  imageContext: { languageHints: ['bn', 'en'] },
                },
              ],
            }),
          }
        );

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const fullTextAnnotation = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
          const { data, confidence, warnings, cardType } = parseNidOcrText(fullTextAnnotation);

          const result: OcrResult = {
            success: true,
            data,
            rawText: fullTextAnnotation,
            confidence,
            engine: 'google-vision',
            processingTimeMs: Date.now() - startTime,
            warnings,
            cardType,
          };

          return NextResponse.json(result);
        }
      } catch (err) {
        console.warn('Google Cloud Vision failed:', err);
      }
    }

    // 3. Fallback to Local Tesseract.js in client
    return NextResponse.json(
      {
        success: false,
        requiresLocalOcr: true,
        message: 'Cloud AI services are offline or reached temporary quota limits. Client will process using local Tesseract.js engine.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: `Server processing failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
