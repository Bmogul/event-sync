"use client";

import React, { useState } from "react";
import EmailTemplateEditor from "./EmailTemplateEditor";
import WhatsAppTemplateEditor from "./WhatsAppTemplateEditor";
import styles from "../styles/portal.module.css";
import { MdPalette, MdEmail, MdMessage } from "react-icons/md";

const TemplateEditor = ({ event, session, setCurrentView, toast, params }) => {
  const [activeTab, setActiveTab] = useState("email");

  const tabButtonStyle = (isActive) => ({
    padding: "12px 24px",
    border: "none",
    borderRadius: "8px 8px 0 0",
    background: isActive ? "#7c3aed" : "#f3f4f6",
    color: isActive ? "white" : "#6b7280",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  });

  const handleTabHover = (e, isActive) => {
    if (!isActive) {
      e.target.style.background = "#e5e7eb";
      e.target.style.color = "#374151";
    }
  };

  const handleTabLeave = (e, isActive) => {
    if (!isActive) {
      e.target.style.background = "#f3f4f6";
      e.target.style.color = "#6b7280";
    }
  };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className={styles.sectionTitle}><MdPalette size={24} /> Edit Templates</h2>
        <p className={styles.sectionDescription}>
          Create and manage email and WhatsApp message templates for your event communications
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        borderBottom: "2px solid #e5e7eb", 
        marginBottom: "32px",
        display: "flex",
        gap: "4px"
      }}>
        <button
          style={tabButtonStyle(activeTab === "email")}
          onClick={() => setActiveTab("email")}
          onMouseEnter={(e) => handleTabHover(e, activeTab === "email")}
          onMouseLeave={(e) => handleTabLeave(e, activeTab === "email")}
        >
          <MdEmail size={18} />
          Email Templates
        </button>
        
        <button
          style={tabButtonStyle(activeTab === "whatsapp")}
          onClick={() => setActiveTab("whatsapp")}
          onMouseEnter={(e) => handleTabHover(e, activeTab === "whatsapp")}
          onMouseLeave={(e) => handleTabLeave(e, activeTab === "whatsapp")}
        >
          <MdMessage size={18} />
          WhatsApp Templates
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ 
        background: "white",
        borderRadius: "0 12px 12px 12px",
        padding: "32px",
        border: "1px solid #e5e7eb",
        minHeight: "600px"
      }}>
        {activeTab === "email" ? (
          <EmailTemplateEditor
            event={event}
            session={session}
            setCurrentView={setCurrentView}
            toast={toast}
            params={params}
          />
        ) : (
          <WhatsAppTemplateEditor
            event={event}
            session={session}
            setCurrentView={setCurrentView}
            toast={toast}
            params={params}
          />
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;