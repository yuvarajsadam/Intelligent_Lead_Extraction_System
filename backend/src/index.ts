import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import { handleUploadStream, leadsDb } from "./controllers/upload.controller";
import { generateLeadsWithAI, CRMLead } from "./services/ai.service";

const app = express();
const PORT = process.env.PORT || 5001;

// Configure middleware
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({
  origin: FRONTEND_URL,
}));
app.use(express.json());

// Configure Multer for memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date() });
});

// GET all processed leads
app.get("/api/leads", (req, res) => {
  const { status, source, search } = req.query;
  let result = [...leadsDb];

  // Apply filters if provided
  if (status) {
    result = result.filter(lead => lead.crm_status === status);
  }
  if (source) {
    result = result.filter(lead => lead.data_source === source);
  }
  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter(lead => 
      lead.name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.mobile_without_country_code.includes(term) ||
      lead.company.toLowerCase().includes(term) ||
      lead.crm_note.toLowerCase().includes(term) ||
      lead.description.toLowerCase().includes(term)
    );
  }

  // Sort by date descending
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    count: result.length,
    leads: result
  });
});

// Clear all leads from the database
app.post("/api/leads/clear", (req, res) => {
  leadsDb.length = 0;
  res.json({ success: true, message: "CRM Lead Database cleared." });
});

// Memory databases for team members and ad accounts
export const membersDb = [
  { name: "VK Test", email: "vk@groweasy.ai", role: "Owner", status: "Active" },
  { name: "Rahul Sharma", email: "rahul@groweasy.ai", role: "Agent", status: "Active" },
  { name: "Priya Patel", email: "priya@groweasy.ai", role: "Agent", status: "Active" }
];

export const adAccountsDb = [
  { id: "meta", name: "Meta Ads (GrowEasy)", connected: true, spend: 1240, leads: 84, cpl: 14.76, status: "Active" },
  { id: "google", name: "Google Search Ads", connected: true, spend: 850, leads: 52, cpl: 16.34, status: "Active" },
  { id: "linkedin", name: "LinkedIn Campaign Manager", connected: false, spend: 0, leads: 0, cpl: 0, status: "Inactive" }
];

export const adCampaignsDb = [
  { id: "c1", name: "LeadGen - Commercial Plots Bangalore", platform: "meta", leads: 43, spend: 650, active: true },
  { id: "c2", name: "Remarketing - Eden Park Villas", platform: "meta", leads: 41, spend: 590, active: true },
  { id: "c3", name: "Search - Commercial Real Estate", platform: "google", leads: 52, spend: 850, active: true }
];

// POST /api/leads/generate - generate leads via Gemini AI or fallback mock
app.post("/api/leads/generate", async (req, res) => {
  const { prompt, count, industry, location } = req.body;
  try {
    const generated = await generateLeadsWithAI(
      prompt || "General target",
      Number(count) || 5,
      industry || "Real Estate",
      location || "Bangalore"
    );
    res.json({ success: true, leads: generated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || error });
  }
});

// POST /api/leads - save multiple leads to CRM in-memory DB
app.post("/api/leads", (req, res) => {
  const newLeads: CRMLead[] = Array.isArray(req.body.leads) ? req.body.leads : [req.body.lead];
  if (!newLeads || newLeads.length === 0) {
    return res.status(400).json({ success: false, error: "No leads provided to save" });
  }
  
  // Push into leadsDb
  leadsDb.push(...newLeads);
  res.json({ success: true, count: newLeads.length, total: leadsDb.length });
});

// PUT /api/leads/update - update single lead status and/or crm note
app.put("/api/leads/update", (req, res) => {
  const { email, mobile_without_country_code, crm_status, crm_note } = req.body;
  
  // Find lead by email or phone
  const leadIndex = leadsDb.findIndex(l => 
    (email && l.email === email) || 
    (mobile_without_country_code && l.mobile_without_country_code === mobile_without_country_code)
  );

  if (leadIndex === -1) {
    return res.status(404).json({ success: false, error: "Lead not found in database" });
  }

  if (crm_status) {
    leadsDb[leadIndex].crm_status = crm_status;
  }
  if (crm_note !== undefined) {
    leadsDb[leadIndex].crm_note = crm_note;
  }

  res.json({ success: true, lead: leadsDb[leadIndex] });
});

// GET /api/members - get CRM team members
app.get("/api/members", (req, res) => {
  // Compute dynamically assigned leads count for display
  const computedMembers = membersDb.map(m => {
    const leadsCount = m.role === "Owner" 
      ? leadsDb.length 
      : leadsDb.filter(l => l.lead_owner.toLowerCase().includes(m.name.toLowerCase())).length;
    return { ...m, leadsCount };
  });
  res.json({ success: true, members: computedMembers });
});

// POST /api/members - add new CRM team member
app.post("/api/members", (req, res) => {
  const { name, email, role, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: "Name and email are required" });
  }
  // Check if already exists
  if (membersDb.some(m => m.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: "Member with this email already exists" });
  }
  const newMember = { name, email, role: role || "Agent", status: status || "Active" };
  membersDb.push(newMember);
  res.json({ success: true, member: newMember });
});

// DELETE /api/members/:email - remove team member
app.delete("/api/members/:email", (req, res) => {
  const email = req.params.email;
  const index = membersDb.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Member not found" });
  }
  const removed = membersDb.splice(index, 1);
  res.json({ success: true, member: removed[0] });
});

// GET /api/ads - get connected ad account details and campaigns
app.get("/api/ads", (req, res) => {
  res.json({ success: true, accounts: adAccountsDb, campaigns: adCampaignsDb });
});

// POST /api/ads/campaigns/toggle - toggle campaign sync active status
app.post("/api/ads/campaigns/toggle", (req, res) => {
  const { id } = req.body;
  const index = adCampaignsDb.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Campaign not found" });
  }
  adCampaignsDb[index].active = !adCampaignsDb[index].active;
  res.json({ success: true, campaign: adCampaignsDb[index] });
});

// POST Route for file upload
app.post("/api/upload", upload.single("file"), handleUploadStream);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AI CRM Importer Backend running on http://localhost:${PORT}`);
});
