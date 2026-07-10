"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneOff, MicOff, Mic, Check, Play, User, List, Building, AlertCircle } from "lucide-react";
import { API_URL } from "../config";
import { Lead } from "../types";

interface TeleCallingProps {
  leads: Lead[];
  onLeadsUpdated: () => void;
}

export default function TeleCalling({ leads, onLeadsUpdated }: TeleCallingProps) {
  // Filters queue to GOOD_LEAD_FOLLOW_UP and DID_NOT_CONNECT
  const dialQueue = leads.filter(l => l.crm_status === "GOOD_LEAD_FOLLOW_UP" || l.crm_status === "DID_NOT_CONNECT");
  
  const [activeLeadIndex, setActiveLeadIndex] = useState(0);
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "disconnected">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [dispositionStatus, setDispositionStatus] = useState<Lead["crm_status"]>("GOOD_LEAD_FOLLOW_UP");
  const [callNote, setCallNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Call timer effect
  useEffect(() => {
    let timerInterval: any = null;
    if (callStatus === "connected") {
      timerInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      clearInterval(timerInterval);
    }
    return () => clearInterval(timerInterval);
  }, [callStatus]);

  const activeLead = dialQueue[activeLeadIndex] || null;

  // Watch for active lead change to reset form
  useEffect(() => {
    if (activeLead) {
      setDispositionStatus(activeLead.crm_status);
      setCallNote(activeLead.crm_note ? activeLead.crm_note.replace(/^Call Note: /, "") : "");
    }
  }, [activeLeadIndex, activeLead]);

  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleStartCall = () => {
    if (!activeLead) return;
    setCallStatus("dialing");
    setSuccessBanner(false);
    setError(null);

    // Simulate ring delay
    setTimeout(() => {
      setCallStatus("connected");
    }, 1500);
  };

  const handleHangUp = () => {
    setCallStatus("disconnected");
  };

  const handleSaveDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    setIsSaving(true);
    setError(null);

    const formattedNote = callNote.trim() ? `Call Note: ${callNote.trim()}` : activeLead.crm_note;

    try {
      const res = await fetch(`${API_URL}/api/leads/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: activeLead.email,
          mobile_without_country_code: activeLead.mobile_without_country_code,
          crm_status: dispositionStatus,
          crm_note: formattedNote
        })
      });

      if (!res.ok) throw new Error("Failed to save lead updates in database.");
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(true);
        setCallStatus("idle");
        onLeadsUpdated(); // update list globally
        
        // Auto advance or reset index
        if (dialQueue.length > 1) {
          // If we are at the last index, roll back to 0
          if (activeLeadIndex >= dialQueue.length - 1) {
            setActiveLeadIndex(0);
          }
        }
        
        setTimeout(() => setSuccessBanner(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="calling-view animate-fade-in">
      <div className="calling-header">
        <div className="header-titles">
          <h1>Tele-Calling Dialer Panel</h1>
          <p className="subtitle">Execute inside-sales calling campaigns and update CRM lead details on-the-fly.</p>
        </div>
      </div>

      {dialQueue.length === 0 ? (
        <div className="card text-center empty-queue-card">
          <PhoneOff size={36} className="text-muted" style={{ marginBottom: "1rem" }} />
          <h3>Dialer queue is currently empty</h3>
          <p className="subtitle" style={{ margin: "0.5rem auto 1.5rem", maxWidth: "450px" }}>
            All imported or generated leads have been processed. Add new leads with status <strong>Good Lead</strong> or <strong>Did Not Connect</strong> to dial.
          </p>
        </div>
      ) : (
        <div className="calling-grid">
          {/* LEFT COLUMN: DIALER QUEUE LIST */}
          <div className="card queue-card">
            <div className="queue-card-header">
              <h3>Dialer Queue ({dialQueue.length} Pending)</h3>
              <span className="queue-desc">Select a lead below to load into softphone</span>
            </div>

            <div className="queue-list">
              {dialQueue.map((lead, idx) => {
                const isActive = idx === activeLeadIndex;
                return (
                  <button
                    key={idx}
                    className={`queue-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveLeadIndex(idx);
                      setCallStatus("idle");
                    }}
                    disabled={callStatus === "connected" || callStatus === "dialing"}
                  >
                    <div className="queue-avatar">
                      <User size={14} />
                    </div>
                    <div className="queue-details">
                      <strong className="queue-name">{lead.name}</strong>
                      <span className="queue-sub text-muted">
                        {lead.company || lead.city || "No company info"}
                      </span>
                    </div>
                    <span className={`badge ${lead.crm_status === "GOOD_LEAD_FOLLOW_UP" ? "badge-good-lead" : "badge-did-not-connect"}`}>
                      {lead.crm_status === "GOOD_LEAD_FOLLOW_UP" ? "Follow Up" : "No Connect"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: SOFTPHONE DIALER */}
          <div className="right-column">
            {activeLead && (
              <div className="card dialer-card">
                <div className="dialer-head">
                  <div className="active-user-info">
                    <div className="user-icon-lg">
                      <User size={28} />
                    </div>
                    <div>
                      <h2>{activeLead.name}</h2>
                      <p className="company-info"><Building size={12} /> {activeLead.company || "Independent Buyer"}</p>
                    </div>
                  </div>
                  <div className="dialer-contact">
                    <span>Email: <strong>{activeLead.email || "N/A"}</strong></span>
                    <span>Mobile: <strong>+{activeLead.country_code} {activeLead.mobile_without_country_code}</strong></span>
                  </div>
                </div>

                {/* CALL STATE CONSOLE */}
                <div className={`call-console ${callStatus}`}>
                  <div className="pulse-indicator">
                    {callStatus === "dialing" && <div className="ring-pulse"></div>}
                    {callStatus === "connected" && <div className="conn-pulse"></div>}
                    <Phone className="console-phone-icon" size={24} />
                  </div>

                  <div className="console-status-text">
                    {callStatus === "idle" && "Ready to Dial"}
                    {callStatus === "dialing" && "Ringing lead number..."}
                    {callStatus === "connected" && `Connected - Call Active`}
                    {callStatus === "disconnected" && "Call Disconnected"}
                  </div>

                  {callStatus === "connected" && (
                    <div className="console-timer">{formatTime(callDuration)}</div>
                  )}

                  {/* CALL BUTTONS */}
                  <div className="console-buttons">
                    {callStatus === "idle" || callStatus === "disconnected" ? (
                      <button className="btn btn-call-start" onClick={handleStartCall}>
                        <PhoneCall size={16} /> Start Call
                      </button>
                    ) : (
                      <button className="btn btn-call-stop" onClick={handleHangUp}>
                        <PhoneOff size={16} /> Hang Up
                      </button>
                    )}

                    <button
                      className={`btn-call-mute ${isMuted ? "muted" : ""}`}
                      onClick={() => setIsMuted(!isMuted)}
                      disabled={callStatus !== "connected"}
                    >
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  </div>
                </div>

                {/* DISPOSITION FORM */}
                <form onSubmit={handleSaveDisposition} className="disposition-form">
                  <h3>Log Call Outcome</h3>
                  
                  <div className="input-group">
                    <label className="input-label">Select CRM Status</label>
                    <select
                      className="input-field"
                      value={dispositionStatus}
                      onChange={e => setDispositionStatus(e.target.value as Lead["crm_status"])}
                      required
                    >
                      <option value="GOOD_LEAD_FOLLOW_UP">Good Lead (Requires Follow-Up)</option>
                      <option value="SALE_DONE">Sale Done (Closed Deal)</option>
                      <option value="DID_NOT_CONNECT">Did Not Connect (Ringing / Switched Off)</option>
                      <option value="BAD_LEAD">Bad Lead (Not Interested / Spam)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Call Discussion Notes</label>
                    <textarea
                      className="input-field note-textarea"
                      placeholder="E.g., Interested in a commercial plot near Sarjapur. Budget fits, wants layout designs via WhatsApp."
                      value={callNote}
                      onChange={e => setCallNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-teal save-dispo-btn"
                    disabled={isSaving || callStatus === "connected" || callStatus === "dialing"}
                  >
                    {isSaving ? (
                      <>
                        <div className="spinner"></div> Saving outcome...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Save Outcome & Load Next
                      </>
                    )}
                  </button>
                  
                  {(callStatus === "connected" || callStatus === "dialing") && (
                    <span className="form-warning-hint">You must hang up the phone call before saving the disposition.</span>
                  )}
                </form>
              </div>
            )}

            {successBanner && (
              <div className="alert alert-success animate-fade-in" style={{ marginTop: "1rem" }}>
                <Check size={16} />
                <span>Call disposition saved. Queue automatically updated.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .calling-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .calling-header {
          margin-bottom: 0.5rem;
        }

        .calling-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .calling-grid {
            grid-template-columns: 1fr;
          }
        }

        .queue-card {
          display: flex;
          flex-direction: column;
          height: 520px;
        }

        .queue-card-header {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .queue-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .queue-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-right: 0.25rem;
        }

        .queue-item {
          display: flex;
          align-items: center;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          gap: 0.75rem;
          width: 100%;
        }

        .queue-item:hover {
          background-color: var(--bg-secondary);
          border-color: var(--text-muted);
        }

        .queue-item.active {
          background-color: var(--accent-teal-light);
          border-color: var(--accent-teal);
        }

        .queue-item.active .queue-name {
          color: var(--accent-teal);
        }

        .queue-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }

        .queue-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .queue-name {
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .queue-sub {
          font-size: 0.75rem;
        }

        /* Phone card right column */
        .dialer-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          border-color: var(--border-color);
        }

        .dialer-head {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }

        .active-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-icon-lg {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-info {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.813rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .dialer-contact {
          display: flex;
          justify-content: space-between;
          font-size: 0.813rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* Call Status console widget */
        .call-console {
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          border: 1px solid var(--border-color);
          position: relative;
          transition: all var(--transition-normal);
        }

        .call-console.idle {
          background-color: var(--bg-primary);
        }

        .call-console.dialing {
          background-color: #fef3c7; /* light amber */
          border-color: #f59e0b;
        }

        .call-console.connected {
          background-color: #d1fae5; /* light green */
          border-color: #10b981;
        }

        .call-console.disconnected {
          background-color: #fee2e2; /* light red */
          border-color: #ef4444;
        }

        .pulse-indicator {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .console-phone-icon {
          color: var(--text-secondary);
        }

        .call-console.connected .console-phone-icon {
          color: #10b981;
        }

        .call-console.dialing .console-phone-icon {
          color: #f59e0b;
        }

        .ring-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #f59e0b;
          opacity: 0.5;
          animation: ringPulse 1.5s infinite ease-out;
          z-index: -1;
        }

        .conn-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #10b981;
          opacity: 0.5;
          animation: ringPulse 2s infinite ease-out;
          z-index: -1;
        }

        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .console-status-text {
          font-size: 0.813rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .call-console.connected .console-status-text {
          color: #065f46;
        }

        .call-console.dialing .console-status-text {
          color: #92400e;
        }

        .console-timer {
          font-family: 'Geist Mono', monospace;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .console-buttons {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          max-width: 250px;
          margin-top: 0.25rem;
        }

        .btn-call-start {
          background-color: #10b981;
          color: #ffffff;
          flex: 1;
        }

        .btn-call-start:hover {
          background-color: #059669;
        }

        .btn-call-stop {
          background-color: #ef4444;
          color: #ffffff;
          flex: 1;
        }

        .btn-call-stop:hover {
          background-color: #dc2626;
        }

        .btn-call-mute {
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border-radius: 8px;
          cursor: pointer;
          padding: 0 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-call-mute:hover:not(:disabled) {
          background-color: var(--bg-primary);
        }

        .btn-call-mute.muted {
          background-color: #fca5a5;
          border-color: #ef4444;
          color: #b91c1c;
        }

        /* Disposition form outcomes */
        .disposition-form {
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

        .note-textarea {
          resize: vertical;
        }

        .save-dispo-btn {
          height: 42px;
          width: 100%;
        }

        .form-warning-hint {
          font-size: 0.75rem;
          color: #f59e0b;
          text-align: center;
          margin-top: -0.5rem;
        }

        .empty-queue-card {
          padding: 4rem 2rem;
        }

        /* Alert styling */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
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
      `}</style>
    </div>
  );
}
