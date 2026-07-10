"use client";

import React from "react";
import {
  LayoutDashboard,
  Zap,
  Users,
  MessageSquare,
  Share2,
  CreditCard,
  Phone,
  Grid,
  Code,
  Briefcase,
  Sun,
  Moon,
  TrendingUp,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Sidebar({ currentView, onViewChange, theme, onToggleTheme }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "MAIN" },
    { id: "generate", label: "Generate Leads", icon: Zap, section: "MAIN" },
    { id: "manage", label: "Manage Leads", icon: Users, section: "MAIN" },
    { id: "engage", label: "Engage Leads", icon: MessageSquare, section: "MAIN" },
    
    { id: "members", label: "Team Members", icon: Users, section: "CONTROL CENTER" },
    { id: "sources", label: "Lead Sources", icon: Share2, section: "CONTROL CENTER" },
    { id: "ads", label: "Ad Accounts", icon: CreditCard, section: "CONTROL CENTER" },
    { id: "whatsapp", label: "WhatsApp Account", icon: MessageSquare, section: "CONTROL CENTER" },
    { id: "calling", label: "Tele Calling", icon: Phone, section: "CONTROL CENTER" },
    { id: "fields", label: "CRM Fields", icon: Grid, section: "CONTROL CENTER" },
    { id: "api", label: "API Center", icon: Code, section: "CONTROL CENTER" },
  ];

  // Group items by section
  const sections = ["MAIN", "CONTROL CENTER"];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <TrendingUp className="logo-icon" />
          <span className="logo-text">GrowEasy</span>
        </div>
        <div className="workspace-selector">
          <div className="workspace-avatar">VT</div>
          <div className="workspace-info">
            <span className="workspace-name">VK Test</span>
            <span className="workspace-role">OWNER</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section} className="nav-section">
            <span className="nav-section-title">{section}</span>
            <div className="nav-section-items">
              {menuItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`nav-item ${isActive ? "active" : ""}`}
                    >
                      <Icon className="nav-item-icon" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          {theme === "light" ? (
            <>
              <Moon size={16} />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={16} />
              <span>Light Mode</span>
            </>
          )}
        </button>
        <div className="footer-workspace">
          <Briefcase size={16} />
          <span>Business Center</span>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 50;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          color: var(--primary);
          width: 24px;
          height: 24px;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .workspace-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--bg-primary);
          padding: 0.625rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .workspace-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: var(--primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .workspace-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .workspace-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .workspace-role {
          font-size: 0.688rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-section-title {
          font-size: 0.688rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          padding-left: 0.5rem;
        }

        .nav-section-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .nav-item.active {
          background-color: var(--accent-teal-light);
          color: var(--accent-teal);
          font-weight: 600;
        }

        .nav-item-icon {
          width: 18px;
          height: 18px;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .theme-toggle, .footer-workspace {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
        }

        .theme-toggle:hover, .footer-workspace:hover {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        @media (max-width: 1024px) {
          .sidebar {
            display: none; /* In a real layout, add responsive toggle */
          }
        }
      `}</style>
    </aside>
  );
}
