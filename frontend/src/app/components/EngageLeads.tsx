"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Check, Mail, Phone, List, Sparkles } from "lucide-react";
import { Lead } from "../types";

interface EngageLeadsProps {
  leads: Lead[];
}

interface Template {
  id: string;
  name: string;
  type: "email" | "whatsapp";
  subject?: string;
  body: string;
}

interface EngageLog {
  timestamp: string;
  leadName: string;
  type: "email" | "whatsapp";
  campaign: string;
  status: "Delivered" | "Opened" | "Replied";
}

const templates: Template[] = [
  {
    id: "welcome",
    name: "Welcome Onboarding Sequence",
    type: "email",
    subject: "Exciting real estate opportunities for {{company}}",
    body: "Hi {{name}},\n\nThank you for expressing interest in our premium real estate listings. We have compiled a curated catalog of properties in your preferred area that align perfectly with {{company}}'s investment profile.\n\nAre you available for a brief 10-minute discovery call this week?\n\nBest regards,\nCRM Sales Team"
  },
  {
    id: "site_visit",
    name: "Eden Park Site Visit Invite",
    type: "whatsapp",
    body: "Hello {{name}}! 🌟 We are scheduling private preview walk-throughs for the Eden Park Phase II premium villas this Sunday. Since you requested info on possession dates, we'd love to host you. Reply 'YES' to book a VIP slot. - GrowEasy Property Sales"
  },
  {
    id: "reengage",
    name: "Commercial Plots Launch Offer",
    type: "email",
    subject: "Exclusive Pre-Launch Pricing for {{name}}",
    body: "Dear {{name}},\n\nWe are launching new zoning plots near Sarjapur next month. As an active investor in our CRM database, you are eligible for pre-launch discounts of up to 12% before the public release.\n\nLet me know if you would like me to email the brochure and plot layouts.\n\nSincerely,\nLead Relations Manager"
  }
];

export default function EngageLeads({ leads }: EngageLeadsProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [selectedLeadEmail, setSelectedLeadEmail] = useState(leads[0]?.email || "");
  const [subject, setSubject] = useState(templates[0].subject || "");
  const [body, setBody] = useState(templates[0].body || "");
  const [isSending, setIsSending] = useState(false);
  const [sentLogs, setSentLogs] = useState<EngageLog[]>([
    {
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
      leadName: "Rahul Sharma",
      type: "email",
      campaign: "Welcome Onboarding Sequence",
      status: "Opened"
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString(),
      leadName: "Amit Patil",
      type: "whatsapp",
      campaign: "Eden Park Site Visit Invite",
      status: "Replied"
    }
  ]);
  const [successMsg, setSuccessMsg] = useState(false);

  // Sync edit boxes when template changes
  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const temp = templates.find(t => t.id === id);
    if (temp) {
      setSubject(temp.subject || "");
      setBody(temp.body);
    }
  };

  const getActiveLead = () => {
    return leads.find(l => l.email === selectedLeadEmail) || leads[0];
  };

  const getInterpolatedText = (text: string) => {
    const lead = getActiveLead();
    if (!lead) return text;
    return text
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, lead.company || "your company")
      .replace(/{{city}}/g, lead.city || "your city");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = getActiveLead();
    if (!lead) return;

    setIsSending(true);
    setSuccessMsg(false);

    setTimeout(() => {
      setIsSending(false);
      setSuccessMsg(true);
      const activeTemplate = templates.find(t => t.id === selectedTemplateId);
      
      const newLog: EngageLog = {
        timestamp: new Date().toLocaleTimeString(),
        leadName: lead.name,
        type: activeTemplate?.type || "email",
        campaign: activeTemplate?.name || "Custom Campaign",
        status: "Delivered"
      };

      setSentLogs(prev => [newLog, ...prev]);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(false), 4000);
    }, 1200);
  };

  return (
    <div className="engage-view animate-fade-in">
      <div className="engage-header">
        <div className="header-titles">
          <h1>Lead Engagement Center</h1>
          <p className="subtitle">Execute personalized cold-outreach and trigger onboarding campaigns via Email & WhatsApp.</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="card text-center empty-leads-card">
          <MessageSquare size={36} className="text-muted" style={{ marginBottom: "1rem" }} />
          <h3>No CRM leads available for outreach</h3>
          <p className="subtitle" style={{ margin: "0.5rem auto 1.5rem", maxWidth: "450px" }}>
            Import a dataset using the CSV Importer or generate dynamic leads with AI before starting outreach.
          </p>
        </div>
      ) : (
        <div className="engage-grid">
          {/* LEFT: OUTBOX BUILDER */}
          <div className="card campaign-card">
            <h3>Orchestrate Campaign</h3>
            <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Configure and personalize your delivery channel.</p>

            <form onSubmit={handleSend} className="campaign-form">
              <div className="input-group">
                <label className="input-label">Select Template</label>
                <select
                  className="input-field"
                  value={selectedTemplateId}
                  onChange={e => handleTemplateChange(e.target.value)}
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Recipient Lead</label>
                <select
                  className="input-field"
                  value={selectedLeadEmail}
                  onChange={e => setSelectedLeadEmail(e.target.value)}
                >
                  {leads.map((l, idx) => (
                    <option key={idx} value={l.email}>
                      {l.name} ({l.email || `Phone: ${l.mobile_without_country_code}`})
                    </option>
                  ))}
                </select>
              </div>

              {templates.find(t => t.id === selectedTemplateId)?.type === "email" && (
                <div className="input-group">
                  <label className="input-label">Subject Line</label>
                  <input
                    type="text"
                    className="input-field"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Message Body</label>
                <textarea
                  className="input-field textarea-field"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={6}
                  required
                />
                <span className="editor-hint">Supports dynamic variables: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{city}}"}</code></span>
              </div>

              <button type="submit" className="btn btn-primary send-btn" disabled={isSending}>
                {isSending ? (
                  <>
                    <div className="spinner"></div>
                    Executing outreach...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Trigger Dispatch
                  </>
                )}
              </button>

              {successMsg && (
                <div className="alert alert-success animate-fade-in">
                  <Check size={16} />
                  <span>Outbound campaign successfully triggered for target lead!</span>
                </div>
              )}
            </form>
          </div>

          {/* RIGHT: PREVIEW & LIVE LOGS */}
          <div className="right-column">
            {/* LIVE PREVIEW */}
            <div className="card preview-card" style={{ marginBottom: "1.5rem" }}>
              <div className="preview-card-header">
                <h3>Live Dispatch Preview</h3>
                <span className="badge-type">
                  {templates.find(t => t.id === selectedTemplateId)?.type === "email" ? (
                    <><Mail size={12} /> Email Mode</>
                  ) : (
                    <><MessageSquare size={12} /> WhatsApp Mode</>
                  )}
                </span>
              </div>
              <p className="subtitle" style={{ marginBottom: "1rem" }}>Fully compiled message visualizer with lead tokens parsed.</p>

              <div className="compiled-visualizer">
                {templates.find(t => t.id === selectedTemplateId)?.type === "email" && (
                  <div className="email-meta">
                    <div><strong>To:</strong> {getActiveLead()?.name} &lt;{getActiveLead()?.email}&gt;</div>
                    <div><strong>Subject:</strong> {getInterpolatedText(subject)}</div>
                    <hr className="divider" />
                  </div>
                )}
                <div className="compiled-body">
                  {getInterpolatedText(body).split("\n").map((line, idx) => (
                    <p key={idx} style={{ marginBottom: "0.5rem" }}>{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* ENGAGEMENT LOGS */}
            <div className="card log-card">
              <h3>Campaign Deliveries</h3>
              <p className="subtitle" style={{ marginBottom: "1rem" }}>Recent automated outreach tracking status.</p>

              <div className="logs-list">
                {sentLogs.map((log, idx) => (
                  <div key={idx} className="log-item">
                    <div className="log-channel-icon">
                      {log.type === "email" ? <Mail size={16} className="text-blue" /> : <MessageSquare size={16} className="text-green" />}
                    </div>
                    <div className="log-details">
                      <div className="log-main-line">
                        <strong>{log.leadName}</strong>
                        <span className="log-campaign-name">({log.campaign})</span>
                      </div>
                      <span className="log-time">{log.timestamp}</span>
                    </div>
                    <div className="log-status">
                      <span className={`badge ${
                        log.status === "Replied" ? "badge-good-lead" : (log.status === "Opened" ? "badge-sale-done" : "badge-did-not-connect")
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .engage-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .engage-header {
          margin-bottom: 0.5rem;
        }

        .engage-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .engage-grid {
            grid-template-columns: 1fr;
          }
        }

        .campaign-card {
          display: flex;
          flex-direction: column;
        }

        .campaign-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
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
          min-height: 120px;
          font-family: inherit;
          line-height: 1.5;
        }

        .editor-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .editor-hint code {
          background-color: var(--bg-primary);
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-family: 'Geist Mono', monospace;
          color: var(--primary);
        }

        .send-btn {
          margin-top: 0.5rem;
          height: 42px;
        }

        /* Preview visualizer */
        .preview-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .badge-type {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .compiled-visualizer {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          min-height: 180px;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        }

        .email-meta {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.813rem;
        }

        .divider {
          border: 0;
          border-top: 1px solid var(--border-color);
          margin-top: 0.75rem;
        }

        .compiled-body {
          line-height: 1.5;
          white-space: pre-wrap;
          color: var(--text-primary);
        }

        /* Logs list styling */
        .log-card {
          flex: 1;
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 220px;
          overflow-y: auto;
        }

        .log-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          gap: 0.75rem;
        }

        .log-channel-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }

        .log-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .log-main-line {
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .log-campaign-name {
          font-weight: 400;
          color: var(--text-secondary);
          font-size: 0.813rem;
          margin-left: 0.375rem;
        }

        .log-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .empty-leads-card {
          padding: 4rem 2rem;
        }

        /* Alert success */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.813rem;
          background-color: var(--status-good-lead-bg);
          color: #065f46;
          border: 1px solid #d1fae5;
          margin-top: 1rem;
        }

        .text-blue {
          color: #3b82f6;
        }

        .text-green {
          color: #10b981;
        }
      `}</style>
    </div>
  );
}
