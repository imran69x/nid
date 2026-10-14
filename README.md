# Bangladesh NID Smart Scanner & OCR Web Application
### গণপ্রজাতন্ত্রী বাংলাদেশ জাতীয় পরিচয়পত্র স্ক্যান ও তথ্য নিষ্কাশন সিস্টেম

A complete, modern, responsive web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase** that captures or uploads Bangladeshi National Identity Card (NID) images, recognizes Bengali & English text via a dual-engine OCR pipeline, and extracts the visible information into separate editable fields with dedicated Copy controls.

---

## 🌟 Key Features

### 1. Multi-Device Camera Scanner (Mobile, Tablet & PC)
- **Device-Adaptive Camera Stream**: Automatically selects the rear camera (`facingMode: { ideal: "environment" }`) on smartphones and tablets, and webcam on desktop PCs.
- **Card-Shaped Scanning Guide**: Real-time 85.6mm × 53.98mm aspect-ratio framing guide with an animated laser scan-beam and corner alignment brackets.
- **Mobile Touch Shutter & Haptics**: Large thumb-reachable shutter button with physical haptic vibration (`navigator.vibrate`) on capture.
- **Lens & Flashlight Controls**: One-tap camera flip (front/back lens) and flashlight/torch toggle on supported mobile hardware.
- **Image File Uploader**: Drag-and-drop or select JPEG, PNG, and WebP images up to 10MB with instant client-side validation.

### 2. Image Preprocessing & Enhancement Studio
- **Rotation Controls**: Rotate 90° clockwise or counter-clockwise before processing.
- **Intelligent Bangladeshi NID Presets**:
  - *Crisp Bengali Text (Recommended)*: Enhances Bengali conjunct characters and removes glossy glare.
  - *High Contrast*: Removes shadows and dark backgrounds on laminated cards.
  - *Clean Grayscale*: Eliminates holographic reflections.
- **Fine-Tune Sliders**: Custom brightness and contrast sliders with real-time canvas preview.
- **Adaptive Edge Binarization**: High-contrast black-and-white thresholding for degraded or low-contrast cards.

### 3. Dual-Engine Bengali & English OCR Pipeline
- **Zero-Setup Local OCR**: Integrated **Tesseract.js** pre-configured with Bengali (`ben`) and English (`eng`) language models. Operates entirely in the browser/client without requiring external paid accounts.
- **Cloud OCR Route**: Server-side Next.js route handler (`/api/ocr`) integrated with **Google Cloud Vision API** (`TEXT_DETECTION` with `['bn', 'en']` language hints).
- **Bangla NID Regex & Spatial Parser**:
  1. **Smart NID Card (10 Digits)**: Extracts Bengali Name, English Name, Father's Name, Mother's Name, 10-digit NID, and English date of birth (`DD MMM YYYY`).
  2. **Old Laminated NID (13 or 17 Digits)**: Extracts Bengali details and 13/17-digit ID numbers with birth-year prefix.
- **Strict Privacy & Anti-Hallucination Policy**: If a field has low confidence or is absent, it is left empty with a verification flag rather than guessed or translated.

### 4. Extracted Information Dashboard
- **8 Distinct Fields**:
  1. নাম (বাংলা) — Full Name (Bangla)
  2. Name (English)
  3. পিতার নাম (বাংলা) — Father's Name (Bangla)
  4. Father's Name (English)
  5. মাতার নাম (বাংলা) — Mother's Name (Bangla)
  6. Mother's Name (English)
  7. NID Number (with Smart Card / Old NID digit validation badge)
  8. Date of Birth (validated calendar date in `DD-MM-YYYY` format)
- **Separate Copy Buttons**: Dedicated Copy button with instant visual checkmark feedback beside every field.
- **Copy All Button**: Formats all 8 fields into a clean line-by-line formatted text block.
- **Explicit Consent Saving**: Explicit consent dialog before writing personal data to the database.
- **Export Options**: One-click download as JSON or TXT.

### 5. Firebase Authentication & Firestore
- **Authentication**: Email & Password registration, login, logout, password reset, and user account profiles.
- **Data Isolation**: Strict user-isolated collections (`users/{userId}` and `extractionRecords/{recordId}`).
- **Data Erasure**: Individual delete record option and one-click "Delete All Saved Records".
- **Zero Image Retention**: Card images are processed in-memory and discarded upon exit; only user-approved text is saved.

### 6. Mobile, Tablet & PC Responsive Layout
- **PC Mode**: Full sidebar navigation with brand identity, quick status badges, and split preview/form layouts.
- **Tablet Mode**: Adaptive 2-column grids with comfortable touch targets.
- **Mobile Mode**: Floating action button (FAB) scanner in bottom navigation bar, touch-friendly inputs, and notch-safe insets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, Vanilla CSS utilities |
| **Typography** | Google Fonts: Noto Sans Bengali & Inter |
| **Icons** | Lucide React |
| **OCR Engines** | Tesseract.js (ben+eng) & Google Cloud Vision API |
| **Auth & Database** | Firebase Authentication & Cloud Firestore |
| **Validation** | Zod |
| **Notifications** | Sonner Toasts |

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone <repository-url>
cd "famely card"
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Firebase Client Configuration (Live Project: famely-card)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyAnx9yfDEZgUaN_FLToItwyxte84So3LsM"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="famely-card.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="famely-card"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="famely-card.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="451166484614"
NEXT_PUBLIC_FIREBASE_APP_ID="1:451166484614:web:34afe6f7b742e487dab907"

# Firebase Admin SDK Configuration (Server-Side Secrets ONLY)
FIREBASE_PROJECT_ID="famely-card"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@famely-card.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Google Gemini Vision API (Free-Tier Multimodal OCR - Server-Side Secret)
GEMINI_API_KEY="AQ.Ab8RN6I-Db2pC98R-nIaOuycmS4MiakhXijFfsOc_885MJnJ4A"
GEMINI_MODEL="gemini-3.5-flash-lite"

# Default OCR Engine ("gemini", "tesseract", or "google-vision")
NEXT_PUBLIC_DEFAULT_OCR_ENGINE="gemini"
```

### 3. Google Gemini Vision API Setup & Free-Tier Specifications

The application uses Google's latest multimodal vision models for ultra-high accuracy extraction of both Bengali Unicode (`বাংলা`) and English text from Bangladeshi Smart and Old NID cards.

- **Recommended Free-Tier Models**:
  - `gemini-3.5-flash-lite`: Optimized for low-latency visual document extraction.
  - `gemini-flash-latest`: Fallback high-throughput vision model.
- **Free-Tier Limits**:
  - **15 RPM** (Requests Per Minute)
  - **1,000,000 TPM** (Tokens Per Minute)
  - **1,500 RPD** (Requests Per Day)
  - Completely free with zero credit card requirements via Google AI Studio.
- **Resilient Fallback Pipeline**:
  If Gemini encounters a temporary high-demand spike (HTTP 503) or rate limit (HTTP 429), the Next.js server route responds with `{ requiresLocalOcr: true }`, and the client instantly continues processing with local in-browser **Tesseract.js (`ben+eng`)** without interrupting the user.
- **Data Privacy & Zero Image Retention**:
  Image frames are dispatched to the Gemini endpoint strictly in memory as Base64 inline data. Neither Google Cloud nor the Next.js server retains or caches the NID images. No personal identity numbers or names are logged.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To access from mobile or tablet on the same Wi-Fi network, navigate to `http://<your-ip>:3000` (e.g. `http://192.168.1.133:3000`).

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## 🔒 Firestore Security Rules

Deploy the restrictive rules provided in `firestore.rules` to your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    match /extractionRecords/{recordId} {
      allow create: if isAuthenticated() 
                    && request.resource.data.ownerUid == request.auth.uid;
      allow read, update, delete: if isAuthenticated() 
                                  && resource.data.ownerUid == request.auth.uid;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📋 Bangladeshi NID Field Specifications

| # | Field Name | Label (Bengali) | Format / Validation |
|---|---|---|---|
| 1 | Full Name (Bangla) | নাম (বাংলা) | Bengali Unicode text (`[\u0980-\u09FF]`) |
| 2 | Full Name (English) | Name (English) | Uppercase Latin text |
| 3 | Father's Name (Bangla) | পিতার নাম (বাংলা) | Bengali Unicode text |
| 4 | Father's Name (English) | Father's Name (English) | Uppercase Latin text |
| 5 | Mother's Name (Bangla) | মাতার নাম (বাংলা) | Bengali Unicode text |
| 6 | Mother's Name (English) | Mother's Name (English) | Uppercase Latin text |
| 7 | NID Number | জাতীয় পরিচয় নম্বর | 10 digits (Smart Card) or 13/17 digits (Old NID) |
| 8 | Date of Birth | জন্ম তারিখ | Valid calendar date in `DD-MM-YYYY` |

---

## 🧪 Testing with Built-In Sample Cards

If you do not have a physical NID card immediately at hand, click **"Try Sample NID / ডেমো কার্ড"** on the `/scanner` page to load a high-fidelity synthetic Bangladeshi Smart Card or Traditional Laminated NID rendered directly on canvas to test OCR extraction, editing, and copying.
