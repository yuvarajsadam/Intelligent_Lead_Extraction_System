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

/**
 * Generate mock leads procedural fallback
 */
function generateMockLeads(count: number, industry: string, location: string): CRMLead[] {
  const currentISO = new Date().toISOString();
  
  const names = [
    "Arjun Patel", "Aditya Sharma", "Vikram Malhotra", "Rahul Verma", "Karan Singhal",
    "Pooja Hegde", "Ananya Sen", "Meera Iyer", "Deepak Rao", "Siddharth Nair",
    "Rohan Deshmukh", "Sneha Kulkarni", "Amit Patil", "Neha Reddy", "Divya Pillai",
    "Sarah Jenkins", "Michael Chang", "Emily Watson", "David Miller", "Jessica Taylor"
  ];
  
  const companySuffix = ["Solutions", "Tech", "Ventures", "Enterprises", "Consulting", "Group", "Digital"];
  const propertyTypes = ["Commercial Office Space", "Premium 3BHK Villa", "2BHK Smart Apartment", "Commercial Retail Plot", "Industrial Warehouse Space"];
  const timelines = ["Immediate (1-3 months)", "Mid-term (6-12 months)", "Planning phase (12+ months)"];

  const leads: CRMLead[] = [];
  for (let i = 0; i < count; i++) {
    const rawName = names[Math.floor(Math.random() * names.length)];
    const name = `${rawName} (Mock #${Math.floor(Math.random() * 900 + 100)})`;
    const firstName = rawName.split(" ")[0].toLowerCase();
    const email = `${firstName}.${Math.floor(Math.random() * 900 + 100)}@groweasy-mock.ai`;
    
    // Generate clean 10 digit phone
    const phone = "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
    
    const company = firstName.charAt(0).toUpperCase() + firstName.slice(1) + " " + companySuffix[Math.floor(Math.random() * companySuffix.length)];
    const city = location || "Bangalore";
    const state = city === "Bangalore" ? "Karnataka" : (city === "Mumbai" ? "Maharashtra" : "Delhi NCR");
    
    const lead: CRMLead = {
      created_at: currentISO,
      name,
      email,
      country_code: "91",
      mobile_without_country_code: phone,
      company,
      city,
      state,
      country: "India",
      lead_owner: "AI Generator",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
      crm_note: `Generated lead for industry: ${industry || "Real Estate"}. Location preference: ${city}. Budget: INR ${Math.floor(Math.random() * 150 + 50)} Lakhs.`,
      data_source: "leads_on_demand",
      possession_time: timelines[Math.floor(Math.random() * timelines.length)],
      description: `Prospecting buyer interested in ${propertyTypes[Math.floor(Math.random() * propertyTypes.length)]} within ${city}.`
    };
    leads.push(lead);
  }
  return leads;
}

const generateResponseSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "Array of generated CRM Lead records based on the target criteria.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      created_at: { type: SchemaType.STRING },
      name: { type: SchemaType.STRING },
      email: { type: SchemaType.STRING },
      country_code: { type: SchemaType.STRING },
      mobile_without_country_code: { type: SchemaType.STRING },
      company: { type: SchemaType.STRING },
      city: { type: SchemaType.STRING },
      state: { type: SchemaType.STRING },
      country: { type: SchemaType.STRING },
      lead_owner: { type: SchemaType.STRING },
      crm_status: { type: SchemaType.STRING },
      crm_note: { type: SchemaType.STRING },
      data_source: { type: SchemaType.STRING },
      possession_time: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING }
    },
    required: [
      "created_at", "name", "email", "country_code", "mobile_without_country_code",
      "company", "city", "state", "country", "lead_owner", "crm_status",
      "crm_note", "data_source", "possession_time", "description"
    ]
  }
};

/**
 * Generate leads with Gemini based on prompt configuration
 */
export async function generateLeadsWithAI(
  promptText: string,
  count: number,
  industry: string,
  location: string
): Promise<CRMLead[]> {
  if (!GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY configured; returning fallback procedural mock leads.");
    return generateMockLeads(count, industry, location);
  }

  const modelForGeneration = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: generateResponseSchema,
      temperature: 0.7,
    }
  });

  const prompt = `You are a growth marketing and lead generation AI. Generate exactly ${count} realistic B2B or B2C customer leads for a business targeting:
Target Audience: ${promptText}
Industry/Sector: ${industry}
Geographic Location: ${location}

STRICT GENERATION RULES:
1. Provide realistic but fictitious names, emails, and phone numbers.
2. Set "data_source" to "leads_on_demand".
3. Set "crm_status" to "GOOD_LEAD_FOLLOW_UP".
4. Set "created_at" to the current ISO timestamp: ${new Date().toISOString()}.
5. "country_code" should be a valid dial code like "91" (for India) or "1" (for US). Do not prepend "+".
6. "mobile_without_country_code" should be a clean 10-digit number.
7. Fill in other fields with realistic values: company, city, state, country, lead_owner (set to "AI Generator"), possession_time, and description.

Return ONLY a JSON array matching the schema.`;

  try {
    const response = await modelForGeneration.generateContent(prompt);
    const text = response.response.text();
    if (!text) {
      throw new Error("Empty response received from AI model.");
    }
    const parsed: CRMLead[] = JSON.parse(text);
    return parsed;
  } catch (error: any) {
    console.error("AI Lead Generation failed, falling back to mock leads:", error.message || error);
    return generateMockLeads(count, industry, location);
  }
}

