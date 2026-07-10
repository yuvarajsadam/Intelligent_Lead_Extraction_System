# AI-Powered CRM CSV Importer System

An enterprise-grade, full-stack AI-driven CRM lead ingestion system. It parses **any** arbitrary CSV structure, interprets ambiguous headers using Gemini AI reasoning, cleans/normalizes the records to fit standard CRM schema constraints, filters bad/incomplete leads, and streams progress in real-time.

---

## 🎯 System Features
- **Zero Configuration Schema Matching**: Accept files with column names like `"Mobile No"`, `"Whatsapp"`, `"WhatsApp No"`, `"Contact Number"` and map them automatically to a standard schema.
- **Batched AI Normalization**: Combines records and processes them using a custom schema-enforced prompt via Gemini API.
- **Server-Sent Events (SSE) Streaming**: Stream batch results dynamically during parsing, allowing instant visual feedback in the UI for large datasets.
- **Live Preview Modal**: PapaParse-powered local browser parsing allows users to preview CSV tables (sticky headers, scrollable columns) prior to triggering imports.
- **SaaS Dashboard & Lead Panel**: Features dashboard conversion metrics, distribution timelines, filtering/searching of leads, and an inspector panel.
- **Premium Aesthetics**: Dark/light mode theme toggling, custom scrollbars, animations, and typography (Outfit & Inter fonts).

---

## 🏗️ Folder Structure
```
c:\Users\yuvar\Desktop\New folder/
├── backend/
│   ├── src/
│   │   ├── index.ts                     # Express server & memory database
│   │   ├── controllers/
│   │   │   └── upload.controller.ts     # SSE stream file parser & chunk pipeline
│   │   └── services/
│   │       └── ai.service.ts            # Gemini API integration & schema mapping
│   ├── .env                             # Environment configuration
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   ├── Sidebar.tsx          # Navigation sidebar & theme toggle
│   │       │   ├── CSVImporterModal.tsx # Drag-and-drop, preview table & SSE listener
│   │       │   └── LeadTable.tsx        # CRM Grid, filtering & Lead details panel
│   │       ├── styles/
│   │       │   └── globals.css          # Core SaaS colors, fonts, scrollbars & badges
│   │       ├── page.tsx                 # Coordinate view state
│   │       └── layout.tsx
│   ├── package.json
│   └── tsconfig.json
└── test_data/
    └── leads_messy.csv                  # Multi-value, messy test data CSV file
```

---

## 🔧 AI Mapping Rules & Constraints

The backend AI service uses a structured JSON output model enforced by Gemini API. The prompt instructs the AI to apply these strict parsing rules:
1. **Validation Filter**: If a record has **NO email AND NO mobile number**, it is automatically sent to the `skipped_records` bucket with a detailed reason.
2. **Multiple Values**:
   - The first email/mobile extracted is mapped to the primary `email` or `mobile_without_country_code` field.
   - Additional values are formatted and appended to the `crm_note` field.
3. **Phone Formatting**:
   - Phone values are stripped of dashes, brackets, and spaces.
   - Separates the country dial code (e.g. `91`, `1`) from the number.
4. **CRM Status Mapping**:
   - Maps raw status columns semantically to exactly: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`.
5. **Data Source Mapping**:
   - Maps inputs to exactly: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`. If unknown, sets to an empty string.
6. **Date Parsing**:
   - Standardizes time stamps to ISO string. Fallback to current system time if date is missing.
7. **CRM Note Construction**:
   - Appends all extra columns (like property budget, timeline, looking for, location preference) as key-value pairs in the `crm_note` field.

---

## 🚀 Get Started

### 1. Configure the Backend Environment
Create or edit `backend/.env` and insert your Gemini API Key:
```env
PORT=5001
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 2. Start the Backend API
Navigate to the `backend/` folder, install packages (if not done already), and start the developer build:
```bash
cd backend
npm install
npm run dev
```
The backend starts running on: `http://localhost:5001`.

### 3. Start the Frontend Application
Navigate to the `frontend/` folder, run npm install, and start Next.js:
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`.

---

## 📊 Testing with Messy Data
We have provided a sample messy dataset in `test_data/leads_messy.csv`. It features:
- Inconsistent headers (`Client`, `WhatsApp No`, `Source Name`, `Comments`, `Possession Timeline`).
- Inconsistent formatting (dashes in phone numbers, multiple emails/numbers like `amit@test.com / amit2@test.com`).
- Missing cells and values that should trigger record skips (empty email and empty mobile).
- Unstructured status words (`interested`, `sale done`, `followup`, `ringing`, `connected`).

Upload this file in the modal to watch the AI normalize it in real-time!
