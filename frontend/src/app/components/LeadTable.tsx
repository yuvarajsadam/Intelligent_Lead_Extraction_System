"use client";

import React, { useState } from "react";
import { Search, Filter, RefreshCw, Trash2, Eye, MapPin, Building, Calendar, Info, X } from "lucide-react";

interface Lead {
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
  data_source: string;
  possession_time: string;
  description: string;
}

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  onRefresh: () => void;
  onClear: () => void;
}

export default function LeadTable({ leads, loading, onRefresh, onClear }: LeadTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  
  // Selected lead for detail slide-out or detail row expansion
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SALE_DONE": return "badge badge-sale-done";
      case "GOOD_LEAD_FOLLOW_UP": return "badge badge-good-lead";
      case "DID_NOT_CONNECT": return "badge badge-did-not-connect";
      case "BAD_LEAD": return "badge badge-bad-lead";
      default: return "badge";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "SALE_DONE": return "Sale Done";
      case "GOOD_LEAD_FOLLOW_UP": return "Good Lead";
      case "DID_NOT_CONNECT": return "Not Connected";
      case "BAD_LEAD": return "Bad Lead";
      default: return status.replace(/_/g, " ");
    }
  };

  const getSourceDisplay = (source: string) => {
    if (!source) return "-";
    return source.replace(/_/g, " ");
  };

  // Filter leads client-side (or let parent handle it - but client side search is super fast!)
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile_without_country_code.includes(searchTerm) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.crm_note.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? lead.crm_status === statusFilter : true;
    const matchesSource = sourceFilter ? lead.data_source === sourceFilter : true;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="lead-table-section animate-fade-in">
      <div className="section-header">
        <div className="section-titles">
          <h2>Manage Your Leads</h2>
          <p className="subtitle">Monitor lead status, assign tasks, and close deals faster.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>
          <button className="btn btn-secondary delete-btn" onClick={onClear} disabled={leads.length === 0 || loading}>
            <Trash2 size={16} />
            Clear CRM
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter email, name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-btn">
            <Search size={18} />
          </button>
        </div>

        <div className="filters-group">
          <div className="select-container">
            <Filter size={14} className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="GOOD_LEAD_FOLLOW_UP">Good Lead (Follow Up)</option>
              <option value="DID_NOT_CONNECT">Not Connected</option>
              <option value="BAD_LEAD">Bad Lead</option>
              <option value="SALE_DONE">Sale Done</option>
            </select>
          </div>

          <div className="select-container">
            <Filter size={14} className="filter-icon" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Sources</option>
              <option value="leads_on_demand">Leads On Demand</option>
              <option value="meridian_tower">Meridian Tower</option>
              <option value="eden_park">Eden Park</option>
              <option value="varah_swamy">Varah Swamy</option>
              <option value="sarjapur_plots">Sarjapur Plots</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="dashboard-layout">
        <div className="table-wrapper">
          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner spinner-dark"></div>
                <span>Fetching leads...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="empty-state">
                <Info size={32} className="text-muted" style={{ marginBottom: "1rem" }} />
                <h4>No Leads Found</h4>
                <p className="subtitle">
                  {leads.length === 0 
                    ? "Click 'Import Leads' above to load data from a CSV file." 
                    : "Try adjusting your search query or filter tags."}
                </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Lead Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Date Created</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Lead Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, idx) => (
                    <tr 
                      key={idx} 
                      className={selectedLead === lead ? "row-selected" : ""}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="bold-text lead-name-cell">{lead.name}</td>
                      <td>{lead.email || "-"}</td>
                      <td>
                        {lead.country_code ? `+${lead.country_code} ` : ""}
                        {lead.mobile_without_country_code || "-"}
                      </td>
                      <td>
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td>{lead.company || "-"}</td>
                      <td>
                        <span className={getStatusBadgeClass(lead.crm_status)}>
                          {getStatusDisplay(lead.crm_status)}
                        </span>
                      </td>
                      <td>
                        <span className="source-tag">
                          {getSourceDisplay(lead.data_source)}
                        </span>
                      </td>
                      <td>{lead.lead_owner || "-"}</td>
                      <td>
                        <button className="action-link-btn" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}>
                          <Eye size={14} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="table-footer-summary">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>

        {/* DETAILS SIDE-PANEL */}
        {selectedLead && (
          <div className="details-panel animate-fade-in">
            <div className="panel-header">
              <h3>Lead Intelligence Info</h3>
              <button className="panel-close-btn" onClick={() => setSelectedLead(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="panel-body">
              <div className="panel-section font-outfit">
                <h4>{selectedLead.name}</h4>
                <span className={getStatusBadgeClass(selectedLead.crm_status)}>
                  {getStatusDisplay(selectedLead.crm_status)}
                </span>
              </div>

              <div className="panel-divider"></div>

              <div className="panel-field">
                <span className="field-label">Email Address</span>
                <span className="field-val">{selectedLead.email || "No Email"}</span>
              </div>

              <div className="panel-field">
                <span className="field-label">Mobile Contact</span>
                <span className="field-val">
                  {selectedLead.country_code ? `+${selectedLead.country_code} ` : ""}
                  {selectedLead.mobile_without_country_code || "No Phone"}
                </span>
              </div>

              <div className="panel-field">
                <span className="field-label">Lead Owner</span>
                <span className="field-val">{selectedLead.lead_owner || "-"}</span>
              </div>

              <div className="panel-divider"></div>

              <div className="icon-details">
                {selectedLead.company && (
                  <div className="icon-detail-item">
                    <Building size={16} className="detail-icon" />
                    <span>Works at <strong>{selectedLead.company}</strong></span>
                  </div>
                )}
                
                {(selectedLead.city || selectedLead.state || selectedLead.country) && (
                  <div className="icon-detail-item">
                    <MapPin size={16} className="detail-icon" />
                    <span>
                      Located in {[selectedLead.city, selectedLead.state, selectedLead.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                {selectedLead.created_at && (
                  <div className="icon-detail-item">
                    <Calendar size={16} className="detail-icon" />
                    <span>Imported Date: {new Date(selectedLead.created_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="panel-divider"></div>

              {selectedLead.description && (
                <div className="panel-note-group">
                  <span className="field-label">Context / Description</span>
                  <p className="description-text">{selectedLead.description}</p>
                </div>
              )}

              {selectedLead.possession_time && (
                <div className="panel-note-group">
                  <span className="field-label">Timeline / Possession Time</span>
                  <p className="possession-text">{selectedLead.possession_time}</p>
                </div>
              )}

              <div className="panel-note-group">
                <span className="field-label">AI Notes & Extra Data Columns</span>
                <div className="notes-box">
                  {selectedLead.crm_note ? (
                    selectedLead.crm_note.split("\n").map((noteLine, lIdx) => (
                      <div key={lIdx} className="note-line">
                        {noteLine}
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">No additional remarks.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .lead-table-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-titles h2 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .delete-btn:hover {
          background-color: #fee2e2;
          color: #ef4444;
          border-color: #fca5a5;
        }

        /* Filter bar styling */
        .filter-bar {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          max-width: 420px;
          width: 100%;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--bg-secondary);
          transition: border-color var(--transition-fast);
        }

        .search-box:focus-within {
          border-color: var(--accent-teal);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: none;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          font-family: inherit;
        }

        .search-btn {
          border: none;
          background-color: var(--accent-teal);
          color: #ffffff;
          padding: 0 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-btn:hover {
          opacity: 0.9;
        }

        .filters-group {
          display: flex;
          gap: 1rem;
        }

        .select-container {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-secondary);
          padding-left: 0.75rem;
          overflow: hidden;
        }

        .filter-icon {
          color: var(--text-secondary);
        }

        .filter-select {
          border: none;
          background: none;
          outline: none;
          padding: 0.625rem 2rem 0.625rem 0.5rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          font-family: inherit;
          cursor: pointer;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='%2364748b' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 18px;
        }

        /* Layout & Table styling */
        .dashboard-layout {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .table-wrapper {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .table-container {
          max-height: 520px;
          overflow-y: auto;
        }

        .loading-state, .empty-state {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          border-radius: 12px;
          text-align: center;
        }

        .table-footer-summary {
          font-size: 0.75rem;
          color: var(--text-secondary);
          padding-left: 0.5rem;
        }

        .lead-name-cell {
          color: var(--text-primary);
        }

        tr {
          cursor: pointer;
        }

        .row-selected td {
          background-color: var(--bg-primary);
          border-left: 3px solid var(--accent-teal);
        }

        .source-tag {
          font-family: monospace;
          background-color: var(--bg-primary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .action-link-btn {
          border: 1px solid var(--border-color);
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-link-btn:hover {
          color: var(--accent-teal);
          border-color: var(--accent-teal);
          background-color: var(--bg-primary);
        }

        /* Detail Panel */
        .details-panel {
          width: 320px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
          overflow: hidden;
          position: sticky;
          top: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .panel-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-primary);
        }

        .panel-header h3 {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .panel-close-btn {
          border: none;
          background: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.125rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .panel-close-btn:hover {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .panel-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .panel-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-section h4 {
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .panel-divider {
          height: 1px;
          background-color: var(--border-color);
        }

        .panel-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .field-label {
          font-size: 0.688rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .field-val {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .icon-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .icon-detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .detail-icon {
          color: var(--text-muted);
        }

        .panel-note-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .description-text, .possession-text {
          font-size: 0.813rem;
          color: var(--text-secondary);
          line-height: 1.4;
          background-color: var(--bg-primary);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
        }

        .notes-box {
          background-color: var(--bg-primary);
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          max-height: 150px;
          overflow-y: auto;
          font-family: inherit;
          font-size: 0.813rem;
          color: var(--text-secondary);
        }

        .note-line {
          margin-bottom: 0.25rem;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 0.25rem;
        }

        .note-line:last-child {
          margin-bottom: 0;
          border-bottom: none;
          padding-bottom: 0;
        }

        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .dashboard-layout {
            flex-direction: column;
          }
          
          .details-panel {
            width: 100%;
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
