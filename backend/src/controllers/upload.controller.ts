import { Request, Response } from "express";
import Papa from "papaparse";
import { processBatchWithAI, CRMLead } from "../services/ai.service";

// Simple in-memory lead database to act as the backend CRM store
export const leadsDb: CRMLead[] = [];

export async function handleUploadStream(req: Request, res: Response) {
  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    if (!req.file) {
      res.write(`data: ${JSON.stringify({ error: "No file uploaded" })}\n\n`);
      res.end();
      return;
    }

    const csvContent = req.file.buffer.toString("utf-8");
    
    // Parse CSV
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const rows = parsed.data as Record<string, any>[];
    const totalRows = rows.length;

    console.log(`Starting upload parsing: ${totalRows} rows to process.`);
    res.write(`data: ${JSON.stringify({ type: "start", total: totalRows })}\n\n`);

    if (totalRows === 0) {
      res.write(`data: ${JSON.stringify({ type: "done", message: "Empty CSV file" })}\n\n`);
      res.end();
      return;
    }

    // Process in batches
    const batchSize = 15; // Moderate size for Gemini API to ensure quick response and avoid timeout
    const currentDateString = new Date().toISOString();
    let processedCount = 0;

    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalRows / batchSize)} (size: ${batch.length})...`);
      
      try {
        // Send batch to AI
        const result = await processBatchWithAI(batch, currentDateString);
        
        // Add valid records to in-memory DB
        leadsDb.push(...result.valid_records);
        
        processedCount += batch.length;
        
        // Stream progress & records back to frontend
        res.write(`data: ${JSON.stringify({
          type: "batch",
          valid_records: result.valid_records,
          skipped_records: result.skipped_records,
          processed: processedCount,
          total: totalRows
        })}\n\n`);
      } catch (batchError: any) {
        console.error(`Error processing batch starting at row ${i}:`, batchError);
        
        // Treat as skipped due to failure
        const failedRecords = batch.map(row => ({
          raw_record: row,
          reason: `AI execution failure: ${batchError.message || batchError}`
        }));
        
        processedCount += batch.length;
        
        res.write(`data: ${JSON.stringify({
          type: "batch_error",
          skipped_records: failedRecords,
          processed: processedCount,
          total: totalRows
        })}\n\n`);
      }
    }

    console.log(`Import completed. Total leads in DB: ${leadsDb.length}`);
    res.write(`data: ${JSON.stringify({ type: "done", totalLeadsInDb: leadsDb.length })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error("Upload streaming handler error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`);
    res.end();
  }
}
