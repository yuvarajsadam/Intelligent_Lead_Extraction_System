import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface CRMLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE";
  crm_note: string;
  data_source: "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots" | "";
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  raw_record: Record<string, any>;
  reason: string;
}

export interface BatchResult {
  valid_records: CRMLead[];
  skipped_records: SkippedRecord[];
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    valid_records: {
      type: SchemaType.ARRAY,
      description: "Array of successfully mapped and normalized CRM records.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          created_at: {
            type: SchemaType.STRING,
            description: "ISO 8601 string or date format parseable by JS new Date(). E.g. '2026-06-29T10:00:00Z'. If not specified or invalid, use the current timestamp provided."
          },
          name: { type: SchemaType.STRING, description: "Lead name. Cleaned and properly capitalized." },
          email: { type: SchemaType.STRING, description: "Primary email address. Cleaned and lowercased. Empty string if no email exists." },
          country_code: { type: SchemaType.STRING, description: "Phone country code (e.g. '91', '1'). Do not include '+' symbol. Empty if unknown." },
          mobile_without_country_code: { type: SchemaType.STRING, description: "Cleaned phone number without country code, spaces, dashes, or formatting. Empty if no phone exists." },
          company: { type: SchemaType.STRING, description: "Company name. Empty if unknown." },
          city: { type: SchemaType.STRING, description: "City name. Empty if unknown." },
          state: { type: SchemaType.STRING, description: "State name. Empty if unknown." },
          country: { type: SchemaType.STRING, description: "Country name. Empty if unknown." },
          lead_owner: { type: SchemaType.STRING, description: "Lead owner or representative name. Empty if unknown." },
          crm_status: {
            type: SchemaType.STRING,
            description: "Status must be exactly: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, or SALE_DONE. Default to GOOD_LEAD_FOLLOW_UP if missing.",
          },
          crm_note: {
            type: SchemaType.STRING,
            description: "Store extra info, unrecognized columns, or duplicate/additional emails/mobiles here formatted as: 'Key: Value'. Make sure all source data columns not matched by schema are saved here.",
          },
          data_source: {
            type: SchemaType.STRING,
            description: "Data source. Must be exactly one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Else return empty string.",
          },
          possession_time: { type: SchemaType.STRING, description: "Possession time preference or details, if available." },
          description: { type: SchemaType.STRING, description: "Short description or context about the lead." }
        },
        required: [
          "created_at", "name", "email", "country_code", "mobile_without_country_code",
          "company", "city", "state", "country", "lead_owner", "crm_status",
          "crm_note", "data_source", "possession_time", "description"
        ]
      }
    },
    skipped_records: {
      type: SchemaType.ARRAY,
      description: "Array of rows skipped. Each must contain the exact original raw object and a clear reason.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          raw_record: {
            type: SchemaType.OBJECT,
            description: "The original raw object from the CSV."
          },
          reason: {
            type: SchemaType.STRING,
            description: "The reason why this record was skipped (e.g. 'No email and no mobile number found')."
          }
        },
        required: ["raw_record", "reason"]
      }
    }
  },
  required: ["valid_records", "skipped_records"]
};

const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.1,
  }
});

/**
 * Process a batch of raw records using Gemini structured output
 */
export async function processBatchWithAI(
  rows: Record<string, any>[],
  currentDateString: string,
  retries = 3
): Promise<BatchResult> {
  const prompt = `You are a senior CRM AI architect. Normalize this batch of raw CSV rows into structured CRM Lead records.
Current system time is: ${currentDateString}.

STRICT NORMALIZATION RULES:
1. **Skipping Criterion**: A row MUST be skipped (placed in skipped_records with a detailed reason) if it has NO email AND NO mobile number.
2. **Multiple Values**:
   - Extract the first valid email as the primary "email" field. Append any additional emails to "crm_note" (e.g., "Alternate Email: test@example.com").
   - Extract the first valid phone number as the primary phone. Append any additional phone numbers to "crm_note" (e.g., "Alternate Mobile: +919876543210").
3. **Phone Format**:
   - Strip all spaces, dashes, brackets, and extra characters from the phone number.
   - Separate the number into "country_code" (e.g., "91" or "1") and "mobile_without_country_code".
   - If country code is not found or is ambiguous, leave "country_code" empty "".
4. **CRM Status mapping**:
   - MUST map raw status values to EXACTLY one of these four options:
     - GOOD_LEAD_FOLLOW_UP (e.g., 'interested', 'hot', 'warm', 'follow up', 'callback', 'connected', 'new')
     - DID_NOT_CONNECT (e.g., 'not reachable', 'ringing', 'switch off', 'invalid number', 'did not connect')
     - BAD_LEAD (e.g., 'not interested', 'fake lead', 'junk', 'invalid', 'bad')
     - SALE_DONE (e.g., 'closed', 'sale', 'done', 'won', 'converted')
   - Default to GOOD_LEAD_FOLLOW_UP if the status is missing or ambiguous.
5. **Data Source mapping**:
   - MUST map to EXACTLY one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots.
   - If not present or matches none of these, return empty string "".
6. **Date Formatting**:
   - Convert the date into a format parseable by JS new Date(created_at).
   - If no date exists or it is invalid, use the current system time: ${currentDateString}.
7. **CRM Note construction**:
   - Store ALL extra info from unrecognized column names (like "Budget", "Property Size", "Looking for", "Location preference", "Alternate Contact") in "crm_note" formatted as: "Column Name: Column Value".
   - Include any extra emails or phone numbers.
   - Keep notes organized and clean.
8. **Fields normalization**:
   - "name": Clean and capitalize. E.g. "rahil mohammad" -> "Rahil Mohammad".
   - "city", "state", "country", "company": Clean and trim.

Input CSV Rows JSON:
${JSON.stringify(rows, null, 2)}`;

  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      if (!text) {
        throw new Error("Empty response received from AI model.");
      }
      const parsed: BatchResult = JSON.parse(text);
      return parsed;
    } catch (error: any) {
      attempt++;
      console.error(`AI batch processing error (Attempt ${attempt}/${retries}):`, error.message || error);
      if (attempt >= retries) {
        throw error;
      }
      // Wait with exponential backoff before retrying
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to process batch with AI after retries.");
}
