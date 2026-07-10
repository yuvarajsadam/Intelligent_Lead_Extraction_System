"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield, UserCheck, AlertCircle, Mail } from "lucide-react";
import { API_URL } from "../config";

interface Member {
  name: string;
  email: string;
  role: string;
  leadsCount: number;
  status: string;
}

export default function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Agent");

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/members`);
      if (!res.ok) throw new Error("Failed to load CRM members directory.");
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load team directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, status: "Active" })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add member.");
      }

      if (data.success) {
        setSuccess(`Successfully added ${name} to CRM seats.`);
        setName("");
        setEmail("");
        setRole("Agent");
        setShowAddForm(false);
        fetchMembers(); // refresh
      }
    } catch (err: any) {
      setError(err.message || "Could not save teammate details.");
    }
  };

  const handleDeleteMember = async (targetEmail: string) => {
    if (!window.confirm("Are you sure you want to remove this seat? They will lose access to lead listings.")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/members/${targetEmail}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete teammate.");

      if (data.success) {
        setSuccess(`Removed member license: ${targetEmail}`);
        fetchMembers(); // refresh
      }
    } catch (err: any) {
      setError(err.message || "Could not delete teammate.");
    }
  };

  return (
    <div className="members-view animate-fade-in">
      <div className="members-header">
        <div className="header-titles">
          <h1>Team Members & Seat Licenses</h1>
          <p className="subtitle">Manage agent access, monitor assigned CRM leads, and configure workspace roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} />
          {showAddForm ? "Hide Form" : "Add Team Member"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginTop: "1rem" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success animate-fade-in" style={{ marginTop: "1rem" }}>
          <UserCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* ADD MEMBER DRAWER/FORM */}
      {showAddForm && (
        <div className="card add-member-card animate-fade-in" style={{ marginTop: "1.5rem" }}>
          <h3>Add New Team Member</h3>
          <p className="subtitle" style={{ marginBottom: "1.25rem" }}>Allocate a new CRM seat and set operational authorization.</p>

          <form onSubmit={handleAddMember} className="member-form">
            <div className="form-row">
              <div className="input-group flex-1">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="E.g. Priya Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group flex-1">
                <label className="input-label">Work Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="E.g. priya@groweasy.ai"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group width-180">
                <label className="input-label">Role</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Agent">Agent (Can only dial)</option>
                  <option value="Admin">Admin (Can edit layouts)</option>
                  <option value="Owner">Owner (Full access)</option>
                </select>
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Activate Seat License
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-dark"></div>
          <span>Syncing team listings...</span>
        </div>
      ) : (
        <div className="table-container" style={{ marginTop: "2.5rem" }}>
          <table>
            <thead>
              <tr>
                <th>Teammate Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Assigned Leads Count</th>
                <th>Status</th>
                <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="member-name-cell">
                      <div className="member-avatar">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <strong>{member.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <Mail size={12} className="text-muted" />
                      <span>{member.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="role-cell">
                      {member.role === "Owner" || member.role === "Admin" ? (
                        <Shield size={14} className="text-orange" />
                      ) : (
                        <Users size={14} className="text-muted" />
                      )}
                      <span>{member.role}</span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: "var(--accent-teal)" }}>{member.leadsCount} leads</strong> assigned
                  </td>
                  <td>
                    <span className="status-badge active">
                      {member.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {member.role !== "Owner" ? (
                      <button className="btn-delete" onClick={() => handleDeleteMember(member.email)}>
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .members-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .members-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .add-member-card {
          border-color: var(--primary);
        }

        .member-form {
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

        .width-180 {
          width: 220px;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }
          .width-180 {
            width: 100%;
          }
        }

        .input-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .member-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.813rem;
          border: 1px solid var(--border-color);
        }

        .email-cell, .role-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          background-color: var(--status-good-lead-bg);
          color: var(--status-good-lead);
        }

        .btn-delete {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.375rem;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-delete:hover {
          color: #ef4444;
          background-color: var(--status-bad-lead-bg);
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

        /* Alert styles */
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

        .text-orange {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
