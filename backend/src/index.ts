import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import { handleUploadStream, leadsDb } from "./controllers/upload.controller";

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

// POST Route for file upload
app.post("/api/upload", upload.single("file"), handleUploadStream);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AI CRM Importer Backend running on http://localhost:${PORT}`);
});
