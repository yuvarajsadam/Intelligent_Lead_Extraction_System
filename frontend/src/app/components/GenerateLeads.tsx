"use client";

import React, { useState } from "react";
import { Zap, Play, Check, AlertCircle, Sparkles, Building, MapPin, List } from "lucide-react";
import { API_URL } from "../config";
import { Lead } from "../types";

interface GenerateLeadsProps {
  onLeadsUpdated: () => void;
}

export default function GenerateLeads({ onLeadsUpdated }: GenerateLeadsProps) {
  const [promptText, setPromptText] = useState("");
  const [count, setCount] = useState(5);
  const [industry, setIndustry] = useState("Real Estate");
  const [location, setLocation] = useState("Bangalore");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const simulateLogs = (generatedLeadsResult: Lead[]) => {
    const logs = [
      "Initializing AI Agent pipeline...",
      "Analyzing target audience demographics and search parameters...",
      `Connecting to ${industry} intent databases and directory indexes...`,
      `Scanning public registries in ${location} region...`,
      "Filtering candidates with missing contact details (Email/Phone)...",
      "Running 10 candidate profiles through Gemini schema normalizer...",
      "Validating phone formatting and dial codes mapping...",
      "Structuring response records into standardized CRM format...",
      `Success! Generated ${generatedLeadsResult.length} high-intent leads.`
    ];

    let logIndex = 0;
    setGenerationLogs([]);
    setProgressPercent(0);

    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setGenerationLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[logIndex]}`]);
        setProgressPercent(Math.min(Math.round(((logIndex + 1) / logs.length) * 100), 100));
        logIndex++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setGeneratedLeads(generatedLeadsResult);
      }
    }, 800);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) {
      setError("Please describe your target audience.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSavedCount(null);
    setGeneratedLeads([]);
    setGenerationLogs(["Starting lead generation campaign..."]);
    setProgressPercent(5);

    try {
      const res = await fetch(`${API_URL}/api/leads/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          count,
          industry,
          location
        })
      });

      if (!res.ok) {
        throw new Error("Failed to generate leads. Check backend console.");
      }

      const data = await res.json();
      if (data.success && data.leads) {
        simulateLogs(data.leads);
      } else {
        throw new Error(data.error || "Failed to generate leads.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setIsGenerating(false);
    }
  };

  const handleSaveToCrm = async () => {
    if (generatedLeads.length === 0) return;
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: generatedLeads })
      });

      if (!res.ok) {
        throw new Error("Failed to save leads to CRM database.");
      }

      const data = await res.json();
      if (data.success) {
        setSavedCount(generatedLeads.length);
        setGeneratedLeads([]);
        onLeadsUpdated();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save leads to CRM.");
    }
  };

  return (
    <div className="generate-view animate-fade-in">
      <div className="generate-header">
        <div className="header-titles">
          <h1>AI Lead Generator</h1>
          <p className="subtitle">Synthesize high-intent targeted sales leads instantly using Gemini AI models.</p>
        </div>
      </div>

      <div className="generate-grid">
        {/* LEFT COLUMN: FORM */}
        <div className="card form-card">
          <h3>Lead Parameters</h3>
          <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Configure targeting rules for the generator agent.</p>
          
          <form onSubmit={handleGenerate} className="param-form">
            <div className="input-group">
              <label className="input-label">Target Audience Description</label>
              <textarea
                className="input-field textarea-field"
                placeholder="E.g., Tech founders in Bangalore raised Seed/Series A looking for commercial office leasing..."
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                disabled={isGenerating}
                rows={4}
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group flex-1">
                <label className="input-label">Industry</label>
                <select
                  className="input-field select-field"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="Real Estate">Real Estate</option>
                  <option value="SaaS & Tech">SaaS & Tech</option>
                  <option value="Finance & Insurance">Finance & Insurance</option>
                  <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                  <option value="Retail & E-commerce">Retail & E-commerce</option>
                </select>
              </div>

              <div className="input-group width-120">
                <label className="input-label">Location</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="E.g. Bangalore"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Number of Leads to Generate ({count})</label>
              <input
                type="range"
                min="1"
                max="15"
                className="range-input"
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                disabled={isGenerating}
              />
              <span className="range-hint">Gemini works best with 5-15 leads per batch.</span>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary generate-btn" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="spinner"></div>
                  Generating leads...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run AI Generator
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE STATUS CONSOLE */}
        <div className="card console-card">
          <h3>Agent Logs & Progress</h3>
          <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Live generation output and pipeline execution steps.</p>

          <div className="console-wrapper">
            <div className="console-progress">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span className="progress-text">{progressPercent}%</span>
            </div>

            <div className="console-terminal">
              {generationLogs.length === 0 && (
                <div className="empty-console">
                  <Zap size={28} className="text-muted text-pulse" />
                  <span>Configure parameters and click &quot;Run AI Generator&quot; to initiate the process.</span>
                </div>
              )}
              {generationLogs.map((log, idx) => (
                <div key={idx} className="terminal-line animate-fade-in-short">
                  {log}
                </div>
              ))}
              {isGenerating && <div className="terminal-cursor">█</div>}
            </div>
          </div>
        </div>
      </div>

      {/* GENERATED REVIEW PANEL */}
      {generatedLeads.length > 0 && (
        <div className="card review-card animate-fade-in">
          <div className="review-header">
            <div>
              <h3>AI Generated Leads Review</h3>
              <p className="subtitle">Verify normalizations and details below before inserting them into your active CRM list.</p>
            </div>
            <button className="btn btn-teal save-to-crm-btn" onClick={handleSaveToCrm}>
              <Check size={16} />
              Confirm & Save {generatedLeads.length} Leads to CRM
            </button>
          </div>

          <div className="table-container" style={{ marginTop: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Contact info</th>
                  <th>Location</th>
                  <th>Assigned Owner</th>
                  <th>AI Notes</th>
                </tr>
              </thead>
              <tbody>
                {generatedLeads.map((lead, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="lead-name-cell">
                        <strong>{lead.name}</strong>
                        <span className="lead-tag">leads_on_demand</span>
                      </div>
                    </td>
                    <td>{lead.company || <span className="text-muted">N/A</span>}</td>
                    <td>
                      <div className="contact-cell">
                        <span>{lead.email}</span>
                        <span className="contact-phone">+{lead.country_code} {lead.mobile_without_country_code}</span>
                      </div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <MapPin size={12} className="text-muted" />
                        <span>{lead.city}, {lead.country}</span>
                      </div>
                    </td>
                    <td>{lead.lead_owner}</td>
                    <td className="note-cell">{lead.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {savedCount && (
        <div className="alert alert-success animate-fade-in" style={{ marginTop: "2rem" }}>
          <Check size={18} />
          <div>
            <strong>Success!</strong> Saved {savedCount} leads into the active CRM database. You can find them in the <strong>Manage Leads</strong> tab or check stats in the <strong>Dashboard</strong>.
          </div>
        </div>
      )}

      <style jsx>{`
        .generate-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .generate-header {
          margin-bottom: 0.5rem;
        }

        .generate-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.3fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .generate-grid {
            grid-template-columns: 1fr;
          }
        }

        .param-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .flex-1 {
          flex: 1;
        }

        .width-120 {
          width: 150px;
        }

        .input-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .textarea-field {
          resize: vertical;
          min-height: 100px;
        }

        .select-field {
          cursor: pointer;
        }

        .range-input {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--border-color);
          outline: none;
          margin-top: 0.5rem;
        }

        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .range-input::-webkit-slider-thumb:hover {
          background: var(--primary-hover);
        }

        .range-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .generate-btn {
          margin-top: 0.5rem;
          width: 100%;
          height: 42px;
        }

        /* Console Card styling */
        .console-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 330px;
        }

        .console-progress {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progress-bar-bg {
          flex: 1;
          height: 8px;
          background: var(--border-color);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-teal) 0%, var(--primary) 100%);
          transition: width 0.3s ease;
          border-radius: 999px;
        }

        .progress-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 35px;
          text-align: right;
        }

        .console-terminal {
          flex: 1;
          background: #020617;
          border-radius: 12px;
          padding: 1rem;
          font-family: 'Geist Mono', Courier, monospace;
          font-size: 0.813rem;
          color: #38bdf8; /* light blue */
          overflow-y: auto;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          border: 1px solid #1e293b;
        }

        .empty-console {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          text-align: center;
          gap: 0.75rem;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .terminal-line {
          word-break: break-all;
          line-height: 1.4;
        }

        .terminal-cursor {
          display: inline-block;
          color: var(--primary);
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        /* Review Card layout */
        .review-card {
          border-color: var(--accent-teal);
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .lead-name-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .lead-tag {
          font-size: 0.688rem;
          font-weight: 600;
          color: var(--accent-teal);
          background-color: var(--accent-teal-light);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          width: max-content;
        }

        .contact-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .contact-phone {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .location-cell {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .note-cell {
          white-space: normal;
          max-width: 250px;
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        /* Alerts */
        .alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .alert-error {
          background-color: var(--status-bad-lead-bg);
          color: #991b1b;
          border: 1px solid #fee2e2;
        }

        .alert-success {
          background-color: var(--status-good-lead-bg);
          color: #065f46;
          border: 1px solid #d1fae5;
        }

        .text-pulse {
          animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }

        .animate-fade-in-short {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
