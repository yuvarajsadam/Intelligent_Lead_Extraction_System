"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, AlertTriangle, Play, HelpCircle } from "lucide-react";
import Papa from "papaparse";
import { API_URL } from "../config";
import { Lead, SkippedRecord } from "../types";

interface CSVImporterModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export default function CSVImporterModal({ onClose, onImportComplete }: CSVImporterModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
  const [file, setFile] = useState<File | null>(null);
  
  // Client-side preview data
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  
  // Streaming progress states
  const [totalRows, setTotalRows] = useState<number>(0);
  const [processedRows, setProcessedRows] = useState<number>(0);
  const [validLeads, setValidLeads] = useState<Lead[]>([]);
  const [skippedLeads, setSkippedLeads] = useState<SkippedRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"valid" | "skipped">("valid");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Client-side parsing using PapaParse for quick preview
  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMsg("Please select a valid CSV file.");
      return;
    }
    setFile(selectedFile);
    setErrorMsg(null);

    Papa.parse(selectedFile, {
      preview: 6, // Parse 6 rows (header + 5 sample rows) for preview
      skipEmptyLines: "greedy",
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = results.data[0] as string[];
          const rows = results.data.slice(1) as string[][];
          setPreviewHeaders(headers);
          setPreviewRows(rows);
          setStep("preview");
        } else {
          setErrorMsg("The CSV file seems to be empty.");
        }
      },
      error: (error) => {
        setErrorMsg(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  // Start the server-side streaming import
  const handleStartImport = async () => {
    if (!file) return;
    setStep("importing");
    setProcessedRows(0);
    setValidLeads([]);
    setSkippedLeads([]);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("Streaming is not supported by your browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last incomplete block in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.substring(6);
            try {
              const data = JSON.parse(dataStr);
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.type === "start") {
                setTotalRows(data.total);
              } else if (data.type === "batch") {
                if (data.valid_records) {
                  setValidLeads((prev) => [...prev, ...data.valid_records]);
                }
                if (data.skipped_records) {
                  setSkippedLeads((prev) => [...prev, ...data.skipped_records]);
                }
                setProcessedRows(data.processed);
              } else if (data.type === "batch_error") {
                if (data.skipped_records) {
                  setSkippedLeads((prev) => [...prev, ...data.skipped_records]);
                }
                setProcessedRows(data.processed);
              } else if (data.type === "done") {
                setStep("results");
                onImportComplete();
              }
            } catch (err: unknown) {
              console.error("Error parsing stream line:", err);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("Import error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorMsg(errMsg || "Something went wrong during data import.");
      setStep("preview");
    }
  };

  const getProgressPercentage = () => {
    if (totalRows === 0) return 0;
    return Math.min(Math.round((processedRows / totalRows) * 100), 100);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SALE_DONE": return "badge badge-sale-done";
      case "GOOD_LEAD_FOLLOW_UP": return "badge badge-good-lead";
      case "DID_NOT_CONNECT": return "badge badge-did-not-connect";
      case "BAD_LEAD": return "badge badge-bad-lead";
      default: return "badge";
    }
  };

  const getSourceDisplay = (source: string) => {
    if (!source) return "-";
    return source.replace(/_/g, " ");
  };

  return (
    <div className="overlay">
      <div className={`modal-card ${step === "results" || step === "preview" ? "modal-large" : ""}`}>
        <div className="modal-header">
          <h3>Import Leads via CSV</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD ZONE */}
        {step === "upload" && (
          <div className="modal-body">
            <p className="subtitle">Upload a CSV file to bulk import leads into your system. AI will intelligently extract and normalize your fields.</p>
            <div 
              className="dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <Upload className="upload-icon" />
              <div className="dropzone-text">
                <span className="bold-text">Click to upload</span> or drag and drop
              </div>
              <span className="file-hint">CSV file up to 10MB</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                style={{ display: "none" }}
              />
            </div>
            
            <div className="schema-info-card">
              <div className="schema-info-header">
                <HelpCircle size={16} />
                <span>Standard CRM Destination Fields</span>
              </div>
              <div className="schema-fields-grid">
                <div>name</div>
                <div>email</div>
                <div>mobile</div>
                <div>company</div>
                <div>city/state/country</div>
                <div>crm_status</div>
                <div>data_source</div>
                <div>crm_note</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === "preview" && file && (
          <div className="modal-body">
            <p className="subtitle">Previewing raw data before triggering AI extraction. Headers and rows are shown exactly as in the file.</p>
            
            <div className="file-info-bar">
              <div className="file-details">
                <FileText className="file-icon" />
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                </div>
              </div>
              <button className="change-file-btn" onClick={() => setStep("upload")}>Change File</button>
            </div>

            <div className="table-container preview-table-container">
              <table>
                <thead>
                  <tr>
                    {previewHeaders.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((val, cIdx) => (
                        <td key={cIdx}>{val !== undefined ? String(val) : ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStartImport}>
                <Play size={16} />
                Confirm Import (Start AI Mapping)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: IMPORTING STREAM */}
        {step === "importing" && (
          <div className="modal-body importing-body">
            <div className="importing-status">
              <div className="spinner spinner-dark spinner-large"></div>
              <h4>AI Processing & Data Normalizing</h4>
              <p className="progress-details">Processed {processedRows} of {totalRows} records...</p>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            <div className="stream-stats">
              <div className="stat-pill valid-stat">
                <span className="stat-label">Valid leads found</span>
                <span className="stat-val">{validLeads.length}</span>
              </div>
              <div className="stat-pill skipped-stat">
                <span className="stat-label">Records skipped</span>
                <span className="stat-val">{skippedLeads.length}</span>
              </div>
            </div>

            <div className="streaming-logs">
              <p className="logs-header">Live Processing Logs:</p>
              <div className="logs-container">
                {validLeads.slice(-3).map((lead, idx) => (
                  <div key={`valid-${idx}`} className="log-line log-valid">
                    ✓ Mapped lead: <span className="log-highlight">{lead.name}</span> ({lead.email || lead.mobile_without_country_code})
                  </div>
                ))}
                {skippedLeads.slice(-3).map((skip, idx) => (
                  <div key={`skip-${idx}`} className="log-line log-skip">
                    ⚠ Skipped row: <span className="log-highlight">{skip.raw_record.name || skip.raw_record.Name || "Row"}</span> - {skip.reason}
                  </div>
                ))}
                {processedRows === 0 && (
                  <div className="log-line text-muted">Awaiting connection to AI agent...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTS SUMMARY */}
        {step === "results" && (
          <div className="modal-body results-body">
            <div className="results-summary-banner">
              <CheckCircle2 className="success-banner-icon" />
              <div>
                <h4>Import Process Completed!</h4>
                <p>
                  Successfully normalized <strong>{validLeads.length}</strong> leads. 
                  Skipped <strong>{skippedLeads.length}</strong> records that didn&apos;t meet the validation criteria.
                </p>
              </div>
            </div>

            <div className="results-tabs">
              <button 
                className={`tab-btn ${activeTab === "valid" ? "active" : ""}`}
                onClick={() => setActiveTab("valid")}
              >
                Processed Leads ({validLeads.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === "skipped" ? "active" : ""}`}
                onClick={() => setActiveTab("skipped")}
              >
                Skipped Records ({skippedLeads.length})
              </button>
            </div>

            {activeTab === "valid" ? (
              <div className="table-container results-table-container">
                {validLeads.length === 0 ? (
                  <div className="empty-state">No valid leads were imported.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Lead Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Status</th>
                        <th>Company</th>
                        <th>Source</th>
                        <th>Created At</th>
                        <th>AI Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validLeads.map((lead, idx) => (
                        <tr key={idx}>
                          <td className="bold-text">{lead.name}</td>
                          <td>{lead.email || "-"}</td>
                          <td>
                            {lead.country_code ? `+${lead.country_code} ` : ""}
                            {lead.mobile_without_country_code || "-"}
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(lead.crm_status)}>
                              {lead.crm_status.replace(/_/g, " ").toLowerCase()}
                            </span>
                          </td>
                          <td>{lead.company || "-"}</td>
                          <td>
                            <span className="source-tag">
                              {getSourceDisplay(lead.data_source)}
                            </span>
                          </td>
                          <td>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}</td>
                          <td className="note-cell" title={lead.crm_note}>{lead.crm_note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="table-container results-table-container">
                {skippedLeads.length === 0 ? (
                  <div className="empty-state">No skipped records. All data was successfully imported!</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Raw Data</th>
                        <th>Skip Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedLeads.map((skip, idx) => (
                        <tr key={idx}>
                          <td className="raw-data-cell">
                            <pre>{JSON.stringify(skip.raw_record, null, 2)}</pre>
                          </td>
                          <td className="skip-reason-cell">
                            <span className="reason-pill">{skip.reason}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onClose}>Done & Close</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-card {
          width: 100%;
          max-width: 540px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          animation: fadeIn 0.25s ease-out;
          overflow: hidden;
        }

        .modal-large {
          max-width: 950px;
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h3 {
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .alert {
          margin: 1rem 1.5rem 0 1.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        .alert-error {
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          color: #ef4444;
        }

        .dropzone {
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          background-color: var(--bg-primary);
          transition: all var(--transition-fast);
        }

        .dropzone:hover {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }

        .upload-icon {
          color: var(--text-secondary);
          width: 40px;
          height: 40px;
        }

        .dropzone-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .bold-text {
          font-weight: 600;
          color: var(--text-primary);
        }

        .file-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .schema-info-card {
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-primary);
          padding: 1rem;
        }

        .schema-info-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .schema-fields-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        @media (max-width: 600px) {
          .schema-fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .file-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-primary);
        }

        .file-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-icon {
          color: var(--accent-teal);
        }

        .file-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .change-file-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .preview-table-container {
          max-height: 250px;
          border-radius: 8px;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        /* Importing UI styles */
        .importing-body {
          align-items: center;
          padding: 3rem 1.5rem;
          gap: 1.5rem;
        }

        .importing-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .progress-details {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background-color: var(--border-color);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: var(--primary);
          transition: width 0.2s ease;
        }

        .stream-stats {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .stat-pill {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .valid-stat {
          background-color: var(--status-good-lead-bg);
          border-color: var(--status-good-lead);
        }

        .skipped-stat {
          background-color: var(--bg-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .stat-val {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 0.25rem;
        }

        .streaming-logs {
          width: 100%;
          text-align: left;
        }

        .logs-header {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .logs-container {
          background-color: #0f172a;
          color: #f8fafc;
          font-family: monospace;
          font-size: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          height: 100px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .log-line {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .log-valid {
          color: #34d399;
        }

        .log-skip {
          color: #f87171;
        }

        .log-highlight {
          font-weight: 600;
          text-decoration: underline;
        }

        /* Results UI Styles */
        .results-body {
          gap: 1.5rem;
        }

        .results-summary-banner {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          background-color: var(--status-good-lead-bg);
          border: 1px solid var(--status-good-lead);
          color: var(--status-good-lead);
          padding: 1.25rem;
          border-radius: 12px;
        }

        .success-banner-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .results-summary-banner h4 {
          color: var(--text-primary);
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .results-summary-banner p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .results-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          gap: 1rem;
        }

        .tab-btn {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem 0.25rem 0.75rem 0.25rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--accent-teal);
          border-color: var(--accent-teal);
        }

        .results-table-container {
          max-height: 350px;
          border-radius: 8px;
        }

        .source-tag {
          font-family: monospace;
          background-color: var(--bg-primary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .note-cell {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .raw-data-cell {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          max-width: 450px;
          overflow-x: auto;
          white-space: pre-wrap;
          vertical-align: top;
        }

        .skip-reason-cell {
          vertical-align: top;
        }

        .reason-pill {
          display: inline-block;
          background-color: #fee2e2;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
