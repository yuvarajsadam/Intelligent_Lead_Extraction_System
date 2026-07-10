"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check, Plus, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { API_URL } from "../config";

interface AdAccount {
  id: string;
  name: string;
  connected: boolean;
  spend: number;
  leads: number;
  cpl: number;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  leads: number;
  spend: number;
  active: boolean;
}

export default function AdAccounts() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal form states
  const [newPlatform, setNewPlatform] = useState("meta");
  const [newName, setNewName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ads`);
      if (!res.ok) throw new Error("Failed to load ad accounts data.");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setCampaigns(data.campaigns || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch ad details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCampaign = async (id: string) => {
    // Optimistic UI update
    setCampaigns(prev =>
      prev.map(c => (c.id === id ? { ...c, active: !c.active } : c))
    );

    try {
      const res = await fetch(`${API_URL}/api/ads/campaigns/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch (err) {
      // Revert if error
      setCampaigns(prev =>
        prev.map(c => (c.id === id ? { ...c, active: !c.active } : c))
      );
      setError("Failed to toggle campaign sync status on backend.");
    }
  };

  const handleConnectAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Simulate connecting a new account locally (for UI response)
    const newAccId = newPlatform + "_" + Date.now();
    const newAccount: AdAccount = {
      id: newAccId,
      name: newName,
      connected: true,
      spend: 0,
      leads: 0,
      cpl: 0,
      status: "Active"
    };

    setAccounts(prev => [...prev, newAccount]);
    setShowModal(false);
    setNewName("");
  };

  const handleDisconnect = (id: string) => {
    setAccounts(prev =>
      prev.map(a => (a.id === id ? { ...a, connected: false, spend: 0, leads: 0, cpl: 0, status: "Inactive" } : a))
    );
  };

  const handleConnectExisting = (id: string) => {
    setAccounts(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              connected: true,
              spend: Math.floor(Math.random() * 800 + 100),
              leads: Math.floor(Math.random() * 50 + 5),
              cpl: parseFloat((Math.random() * 10 + 10).toFixed(2)),
              status: "Active"
            }
          : a
      )
    );
  };

  return (
    <div className="ads-view animate-fade-in">
      <div className="ads-header">
        <div className="header-titles">
          <h1>Ad Integrations Dashboard</h1>
          <p className="subtitle">Connect and sync Lead Generation ads from social and search networks straight into the CRM pipeline.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Link Ad Account
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-dark"></div>
          <span>Loading connected advertising integrations...</span>
        </div>
      ) : (
        <div className="ads-content-split">
          {/* TOP SECTION: PLATFORMS LIST */}
          <div className="platforms-grid">
            {accounts.map(acc => {
              const platformName = acc.id.includes("meta") ? "Meta Ads" : acc.id.includes("google") ? "Google Ads" : "LinkedIn Ads";
              return (
                <div key={acc.id} className={`card platform-card ${acc.connected ? "connected" : "disconnected"}`}>
                  <div className="platform-header">
                    <div>
                      <span className="platform-tag">{platformName}</span>
                      <h4>{acc.name}</h4>
                    </div>
                    <span className={`status-pill ${acc.connected ? "active" : "inactive"}`}>
                      {acc.status}
                    </span>
                  </div>

                  {acc.connected ? (
                    <div className="platform-metrics">
                      <div className="metric-row">
                        <div className="metric-col">
                          <span className="metric-lbl">Total Spend</span>
                          <span className="metric-val">${acc.spend}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-lbl">Leads Normalised</span>
                          <span className="metric-val">{acc.leads}</span>
                        </div>
                      </div>
                      <div className="metric-row" style={{ marginTop: "1rem" }}>
                        <div className="metric-col">
                          <span className="metric-lbl">Avg CPL</span>
                          <span className="metric-val">${acc.cpl}</span>
                        </div>
                        <div className="metric-col">
                          <button className="btn-disconnect" onClick={() => handleDisconnect(acc.id)}>
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="disconnected-overlay">
                      <span className="not-connected-msg">Not currently synced.</span>
                      <button className="btn btn-secondary btn-connect-action" onClick={() => handleConnectExisting(acc.id)}>
                        Connect Account
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* LOWER SECTION: ACTIVE CAMPAIGNS AND MAPPINGS */}
          <div className="card campaigns-card">
            <div className="campaigns-card-header">
              <div>
                <h3>Active Campaign Sync Streams</h3>
                <p className="subtitle">Select which ad agency forms automatically push incoming raw leads intoGrowEasy.</p>
              </div>
              <button className="btn btn-secondary btn-refresh" onClick={fetchData}>
                <RefreshCw size={14} />
                Refresh List
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="table-container" style={{ marginTop: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Campaign ID</th>
                    <th>Campaign Name</th>
                    <th>Platform</th>
                    <th>Generated Leads</th>
                    <th>Ad Spend</th>
                    <th>CRM Automatic Ingestion</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(camp => (
                    <tr key={camp.id}>
                      <td><code>{camp.id.toUpperCase()}</code></td>
                      <td><strong>{camp.name}</strong></td>
                      <td>
                        <span className="platform-label">
                          {camp.platform.toUpperCase()}
                        </span>
                      </td>
                      <td>{camp.leads} leads</td>
                      <td>${camp.spend}</td>
                      <td>
                        <button
                          className={`btn-toggle-sync ${camp.active ? "sync-on" : "sync-off"}`}
                          onClick={() => handleToggleCampaign(camp.id)}
                        >
                          {camp.active ? (
                            <>
                              <ToggleRight size={32} className="text-teal" />
                              <span className="toggle-label text-teal">Ingesting</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={32} className="text-muted" />
                              <span className="toggle-label text-muted">Paused</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONNECT AD ACCOUNT MODAL */}
      {showModal && (
        <div className="overlay">
          <div className="card modal-content animate-fade-in" style={{ width: "400px" }}>
            <div className="modal-header">
              <h3>Connect Ad Account</h3>
            </div>
            
            <form onSubmit={handleConnectAccount} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="input-group">
                <label className="input-label">Ad Network Platform</label>
                <select className="input-field" value={newPlatform} onChange={e => setNewPlatform(e.target.value)}>
                  <option value="meta">Meta Lead Generation Ads</option>
                  <option value="google">Google Search Lead Ads</option>
                  <option value="linkedin">LinkedIn Lead Gen Forms</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Account Name / ID</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="E.g. Commercial Leads Account"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-buttons" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Connect & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .ads-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .ads-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ads-content-split {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .platforms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .platform-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 200px;
          justify-content: space-between;
        }

        .platform-card.connected {
          border-left: 4px solid var(--accent-teal);
        }

        .platform-card.disconnected {
          border-left: 4px solid var(--text-muted);
          background-color: var(--bg-primary);
        }

        .platform-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .platform-tag {
          font-size: 0.688rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-pill {
          font-size: 0.688rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .status-pill.active {
          background-color: var(--status-good-lead-bg);
          color: var(--status-good-lead);
        }

        .status-pill.inactive {
          background-color: var(--status-did-not-connect-bg);
          color: var(--status-did-not-connect);
        }

        .platform-metrics {
          display: flex;
          flex-direction: column;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
        }

        .metric-col {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .metric-lbl {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .metric-val {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .btn-disconnect {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.813rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
          align-self: flex-start;
          margin-top: 0.5rem;
        }

        .btn-disconnect:hover {
          text-decoration: underline;
        }

        .disconnected-overlay {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 1rem 0;
        }

        .not-connected-msg {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .btn-connect-action {
          width: 100%;
        }

        /* Campaign list layout */
        .campaigns-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .platform-label {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Geist Mono', monospace;
        }

        .btn-toggle-sync {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0;
        }

        .toggle-label {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .text-teal {
          color: var(--accent-teal);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          gap: 1rem;
          color: var(--text-secondary);
        }

        /* Alerts */
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

        /* Modal styling overrides */
        .modal-content {
          box-shadow: var(--shadow-xl);
          background: var(--bg-secondary);
          z-index: 101;
        }

        .modal-header h3 {
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}
