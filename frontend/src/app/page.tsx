"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CSVImporterModal from "./components/CSVImporterModal";
import LeadTable from "./components/LeadTable";
import GenerateLeads from "./components/GenerateLeads";
import EngageLeads from "./components/EngageLeads";
import AdAccounts from "./components/AdAccounts";
import TeamMembers from "./components/TeamMembers";
import TeleCalling from "./components/TeleCalling";
import { Share2, Users, FileSpreadsheet, Percent, Plus, ShieldCheck, ArrowRight, BarChart3 } from "lucide-react";
import { API_URL } from "./config";
import { Lead } from "./types";

export default function Home() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [modalOpen, setModalOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronization of theme attribute
  useEffect(() => {
    const savedTheme = localStorage.getItem("crm-theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTimeout(() => {
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    }, 0);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("crm-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Fetch leads from Express backend
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to fetch leads from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchLeads();
    }, 0);
  }, []);

  // Clear leads database on backend
  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to clear all leads in the CRM database? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leads/clear`, {
        method: "POST"
      });
      if (res.ok) {
        setLeads([]);
      }
    } catch (err) {
      console.error("Failed to clear database:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock static data sources
  const leadSources = [
    {
      id: "leads_on_demand",
      name: "Leads On Demand",
      description: "Direct API integration matching user queries and buyer intent.",
      status: "Active",
      count: leads.filter(l => l.data_source === "leads_on_demand").length,
    },
    {
      id: "meridian_tower",
      name: "Meridian Tower Project",
      description: "Organic inbound campaigns for high-rise commercial properties.",
      status: "Active",
      count: leads.filter(l => l.data_source === "meridian_tower").length,
    },
    {
      id: "eden_park",
      name: "Eden Park Phase II",
      description: "Social media advertisement campaigns targeting premium villa developments.",
      status: "Active",
      count: leads.filter(l => l.data_source === "eden_park").length,
    },
    {
      id: "varah_swamy",
      name: "Varah Swamy Enclave",
      description: "Referral partners and direct offline registration forms.",
      status: "Active",
      count: leads.filter(l => l.data_source === "varah_swamy").length,
    },
    {
      id: "sarjapur_plots",
      name: "Sarjapur Residential Plots",
      description: "Search engine landing pages highlighting smart township zoning plots.",
      status: "Active",
      count: leads.filter(l => l.data_source === "sarjapur_plots").length,
    }
  ];

  // Calculated Stats
  const totalCount = leads.length;
  const salesClosed = leads.filter(l => l.crm_status === "SALE_DONE").length;
  const goodLeads = leads.filter(l => l.crm_status === "GOOD_LEAD_FOLLOW_UP").length;
  const badLeads = leads.filter(l => l.crm_status === "BAD_LEAD").length;
  const notDialed = leads.filter(l => l.crm_status === "DID_NOT_CONNECT").length;

  const getConversionRate = () => {
    if (totalCount === 0) return 0;
    return Math.round((salesClosed / totalCount) * 100);
  };

  const getGoodLeadPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round(((goodLeads + salesClosed) / totalCount) * 100);
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="main-content">
        
        {/* VIEW 1: DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="dashboard-view animate-fade-in">
            <div className="dashboard-header">
              <div className="header-titles">
                <h1>Overview Dashboard</h1>
                <p className="subtitle">Real-time Lead Ingestion metrics & Conversion analytics.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                Import Leads
              </button>
            </div>

            {/* STATS GRID */}
            <div className="stats-grid">
              <div className="card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total CRM Leads</span>
                  <Users className="stat-card-icon text-teal" />
                </div>
                <div className="stat-card-value">{totalCount}</div>
                <div className="stat-card-change">
                  <span>Processed by AI mapping</span>
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Sales Closed</span>
                  <ShieldCheck className="stat-card-icon text-blue" />
                </div>
                <div className="stat-card-value">{salesClosed}</div>
                <div className="stat-card-change text-blue">
                  <strong>{getConversionRate()}%</strong> closed deals rate
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Good Leads / Active</span>
                  <BarChart3 className="stat-card-icon text-green" />
                </div>
                <div className="stat-card-value">{goodLeads}</div>
                <div className="stat-card-change text-green">
                  <strong>{getGoodLeadPercentage()}%</strong> qualified target audience
                </div>
              </div>

              <div className="card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Messy / Skipped Info</span>
                  <Percent className="stat-card-icon text-orange" />
                </div>
                <div className="stat-card-value">{notDialed + badLeads}</div>
                <div className="stat-card-change">
                  <span>Invalid numbers & bad matches</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD SECTIONS */}
            <div className="dashboard-content-split">
              
              {/* SOURCE DISTRIBUTION CARD */}
              <div className="card distribution-card">
                <h3>Ingestion Source Split</h3>
                <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Where are your AI-mapped leads coming from?</p>
                <div className="source-distribution-list">
                  {leadSources.map(source => {
                    const pct = totalCount > 0 ? Math.round((source.count / totalCount) * 100) : 0;
                    return (
                      <div key={source.id} className="distribution-item">
                        <div className="dist-info">
                          <span className="dist-name">{source.name}</span>
                          <span className="dist-count">{source.count} leads ({pct}%)</span>
                        </div>
                        <div className="dist-bar-bg">
                          <div className="dist-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {totalCount === 0 && (
                    <div className="empty-distribution">
                      <FileSpreadsheet size={24} className="text-muted" />
                      <span>No leads to chart. Click &quot;Import Leads&quot; to begin.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT INGESTS CARD */}
              <div className="card recent-activity-card">
                <h3>Latest Imports Activity</h3>
                <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Recently normalized leads in CRM</p>
                <div className="activity-list">
                  {leads.slice(0, 5).map((lead, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-details">
                        <span className="activity-text">
                          <strong>{lead.name}</strong> was imported from <em>{lead.data_source || "Unspecified Source"}</em>
                        </span>
                        <span className="activity-time">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "Just now"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <div className="empty-activity">
                      <span>No recent activity found.</span>
                    </div>
                  )}
                </div>
                {leads.length > 0 && (
                  <button className="btn btn-secondary view-all-btn" onClick={() => setCurrentView("manage")}>
                    View All Leads
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LEAD SOURCES */}
        {currentView === "sources" && (
          <div className="sources-view animate-fade-in">
            <div className="sources-header">
              <div className="header-titles">
                <h1>Lead Sources</h1>
                <p className="subtitle">Connect, manage, and control all your lead channels from one dashboard.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                Import Leads via CSV
              </button>
            </div>

            <div className="sources-grid">
              {leadSources.map((source) => (
                <div key={source.id} className="card source-card">
                  <div className="source-card-header">
                    <div className="source-avatar">
                      <Share2 size={20} />
                    </div>
                    <span className="source-status-badge">{source.status}</span>
                  </div>
                  <div className="source-card-body">
                    <h4>{source.name}</h4>
                    <p className="source-desc">{source.description}</p>
                  </div>
                  <div className="source-card-footer">
                    <div className="source-count-info">
                      <span className="count-label">Normalized leads</span>
                      <span className="count-value">{source.count}</span>
                    </div>
                    <button className="btn btn-secondary import-leads-btn" onClick={() => setModalOpen(true)}>
                      Import
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: MANAGE LEADS */}
        {currentView === "manage" && (
          <LeadTable 
            leads={leads} 
            loading={loading} 
            onRefresh={fetchLeads} 
            onClear={handleClearDatabase}
          />
        )}

        {/* VIEW: GENERATE LEADS */}
        {currentView === "generate" && (
          <GenerateLeads onLeadsUpdated={fetchLeads} />
        )}

        {/* VIEW: ENGAGE LEADS */}
        {currentView === "engage" && (
          <EngageLeads leads={leads} />
        )}

        {/* VIEW: AD ACCOUNTS */}
        {currentView === "ads" && (
          <AdAccounts />
        )}

        {/* VIEW: TEAM MEMBERS */}
        {currentView === "members" && (
          <TeamMembers />
        )}

        {/* VIEW: TELE CALLING */}
        {currentView === "calling" && (
          <TeleCalling leads={leads} onLeadsUpdated={fetchLeads} />
        )}

        {/* FALLBACK FOR OTHER VIEW SHIMS */}
        {currentView !== "dashboard" &&
         currentView !== "sources" &&
         currentView !== "manage" &&
         currentView !== "generate" &&
         currentView !== "engage" &&
         currentView !== "ads" &&
         currentView !== "members" &&
         currentView !== "calling" && (
          <div className="shim-view animate-fade-in">
            <div className="card text-center">
              <h3>{currentView.toUpperCase()} feature is currently disabled</h3>
              <p className="subtitle" style={{ marginTop: "0.5rem" }}>
                This is a placeholder page for the &quot;{currentView}&quot; menu item. The active functional parts are:
              </p>
              <div className="active-routes-list">
                <button className="btn btn-secondary" onClick={() => setCurrentView("dashboard")}>Dashboard</button>
                <button className="btn btn-secondary" onClick={() => setCurrentView("sources")}>Lead Sources (Import Modal)</button>
                <button className="btn btn-secondary" onClick={() => setCurrentView("manage")}>Manage Leads (CRM Data Grid)</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CSV IMPORTER MODAL */}
      {modalOpen && (
        <CSVImporterModal 
          onClose={() => setModalOpen(false)} 
          onImportComplete={fetchLeads}
        />
      )}

      <style jsx>{`
        .dashboard-header, .sources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-titles h1 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-card-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .stat-card-icon {
          width: 18px;
          height: 18px;
        }

        .text-teal { color: var(--accent-teal); }
        .text-blue { color: var(--status-sale-done); }
        .text-green { color: var(--status-good-lead); }
        .text-orange { color: var(--primary); }

        .stat-card-value {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Outfit', sans-serif;
        }

        .stat-card-change {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Split layouts */
        .dashboard-content-split {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 1.5rem;
        }

        @media (max-width: 900px) {
          .dashboard-content-split {
            grid-template-columns: 1fr;
          }
        }

        .distribution-card h3, .recent-activity-card h3 {
          font-size: 1.125rem;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .source-distribution-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .distribution-item {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .dist-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.813rem;
        }

        .dist-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .dist-count {
          color: var(--text-secondary);
        }

        .dist-bar-bg {
          height: 8px;
          border-radius: 4px;
          background-color: var(--bg-primary);
          overflow: hidden;
        }

        .dist-bar-fill {
          height: 100%;
          background-color: var(--accent-teal);
          border-radius: 4px;
        }

        .empty-distribution {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        /* Recent Activity Ingestion Card */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .activity-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--primary);
          margin-top: 0.375rem;
          flex-shrink: 0;
        }

        .activity-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .activity-text {
          font-size: 0.813rem;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .activity-time {
          font-size: 0.688rem;
          color: var(--text-muted);
        }

        .empty-activity {
          padding: 2rem 0;
          color: var(--text-muted);
          font-size: 0.813rem;
          text-align: center;
        }

        .view-all-btn {
          width: 100%;
          margin-top: 1.5rem;
          font-size: 0.813rem;
          padding: 0.5rem;
        }

        /* Sources Grid styling */
        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .source-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          gap: 1rem;
        }

        .source-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .source-avatar {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .source-status-badge {
          background-color: var(--status-good-lead-bg);
          color: var(--status-good-lead);
          font-weight: 600;
          font-size: 0.688rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .source-card-body h4 {
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 0.375rem;
        }

        .source-desc {
          font-size: 0.813rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .source-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .source-count-info {
          display: flex;
          flex-direction: column;
        }

        .count-label {
          font-size: 0.688rem;
          color: var(--text-muted);
        }

        .count-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .import-leads-btn {
          font-size: 0.75rem;
          padding: 0.375rem 0.75rem;
        }

        /* Shim / Disabled Views styling */
        .shim-view {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 4rem;
        }

        .shim-view h3 {
          font-size: 1.125rem;
        }

        .active-routes-list {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 1.25rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
