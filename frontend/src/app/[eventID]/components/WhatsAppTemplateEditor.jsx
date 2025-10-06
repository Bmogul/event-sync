"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styles from "../../create-event/components/sections/EmailTemplateCreator.module.css";
import { MdContentCopy, MdDelete, MdEdit, MdLightbulb } from "react-icons/md";

const WhatsAppTemplateEditor = ({ event, session, setCurrentView }) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate available variables based on event subevents
  const getAvailableVariables = () => {
    const allVariables = [
      { key: "{rsvp_link}", description: "RSVP link for the guest" },
      { key: "{event_title}", description: "Name of the event" },
      { key: "{guest_name}", description: "Name of the guest" },
    ];

    // Add subevent-specific variables if they have the respective data
    if (event?.subevents) {
      event.subevents.forEach(subevent => {
        const cleanTitle = subevent.title.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanTitle) {
          // Always add title variable since every subevent has a title
          allVariables.push({ key: `{${cleanTitle}_title}`, description: `Title of ${subevent.title}` });
          
          // Only add variables for data that exists
          if (subevent.event_date) {
            allVariables.push({ key: `{${cleanTitle}_date}`, description: `Date of ${subevent.title}` });
          }
          if (subevent.start_time) {
            allVariables.push({ key: `{${cleanTitle}_time}`, description: `Start time of ${subevent.title}` });
          }
          if (subevent.end_time) {
            allVariables.push({ key: `{${cleanTitle}_endtime}`, description: `End time of ${subevent.title}` });
          }
          if (subevent.venue_address) {
            allVariables.push({ key: `{${cleanTitle}_location}`, description: `Location of ${subevent.title}` });
          }
        }
      });
    }
    
    return { allVariables };
  };

  const { allVariables } = getAvailableVariables();

  // Fetch WhatsApp templates from database
  useEffect(() => {
    const fetchWhatsAppTemplates = async () => {
      if (!event?.eventID || !session?.access_token) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/events?public_id=${event.eventID}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.event?.whatsappTemplates) {
            setWhatsappTemplates(data.event.whatsappTemplates);
          } else {
            // Create default template if none exist
            const defaultTemplate = {
              id: "default_invitation",
              name: "Default Invitation",
              message: "You're invited to our special event! Please RSVP: {rsvp_link}",
              created_at: new Date().toISOString(),
              is_default: true,
            };
            setWhatsappTemplates([defaultTemplate]);
          }
        }
      } catch (error) {
        console.error("Error fetching WhatsApp templates:", error);
        toast.error("Failed to load WhatsApp templates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWhatsAppTemplates();
  }, [event?.eventID, session?.access_token]);

  const currentTemplate = whatsappTemplates[currentTemplateIndex] || {};

  const updateCurrentTemplate = (field, value) => {
    const updatedTemplates = [...whatsappTemplates];
    updatedTemplates[currentTemplateIndex] = {
      ...updatedTemplates[currentTemplateIndex],
      [field]: value,
    };
    setWhatsappTemplates(updatedTemplates);
  };

  const addNewTemplate = () => {
    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Template ${whatsappTemplates.length + 1}`,
      message: "Enter your WhatsApp message here. Use variables like {rsvp_link} to personalize messages.",
      created_at: new Date().toISOString(),
      is_default: false,
    };

    const updatedTemplates = [...whatsappTemplates, newTemplate];
    setWhatsappTemplates(updatedTemplates);
    setCurrentTemplateIndex(updatedTemplates.length - 1);
    
    toast.success("New WhatsApp template added!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const deleteTemplate = (templateIndex) => {
    if (whatsappTemplates.length <= 1) {
      toast.error("You must have at least one template", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const updatedTemplates = whatsappTemplates.filter(
      (_, index) => index !== templateIndex,
    );
    setWhatsappTemplates(updatedTemplates);

    // Adjust current template index if necessary
    if (templateIndex === currentTemplateIndex) {
      setCurrentTemplateIndex(Math.max(0, templateIndex - 1));
    } else if (templateIndex < currentTemplateIndex) {
      setCurrentTemplateIndex(currentTemplateIndex - 1);
    }

    toast.success("Template deleted", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const duplicateTemplate = (templateIndex) => {
    const templateToDuplicate = whatsappTemplates[templateIndex];
    const newTemplate = {
      ...templateToDuplicate,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${templateToDuplicate.name} (Copy)`,
      created_at: new Date().toISOString(),
      is_default: false,
    };

    const updatedTemplates = [...whatsappTemplates, newTemplate];
    setWhatsappTemplates(updatedTemplates);
    setCurrentTemplateIndex(updatedTemplates.length - 1);

    toast.success("Template duplicated", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const setAsDefault = (templateIndex) => {
    const updatedTemplates = whatsappTemplates.map((template, index) => ({
      ...template,
      is_default: index === templateIndex,
    }));
    setWhatsappTemplates(updatedTemplates);

    toast.success("Default template updated", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById("whatsapp-message");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentMessage = currentTemplate.message || "";
      const newMessage = currentMessage.substring(0, start) + variable + currentMessage.substring(end);
      
      updateCurrentTemplate("message", newMessage);
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 10);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!currentTemplate.name?.trim()) {
      newErrors.name = "Template name is required";
    }
    if (!currentTemplate.message?.trim()) {
      newErrors.message = "Message content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveTemplates = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors below", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Ensure at least one default template
      const hasDefaultTemplate = whatsappTemplates.some(
        (template) => template.is_default,
      );
      let templatesToSave = [...whatsappTemplates];
      if (!hasDefaultTemplate && whatsappTemplates.length > 0) {
        templatesToSave[0].is_default = true;
      }

      // Save templates by updating the event
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          public_id: event.eventID,
          title: event.eventTitle,
          logo_url: event.logo,
          whatsappTemplates: templatesToSave,
          // Include other required fields to avoid validation errors
          status: "draft",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save WhatsApp templates");
      }

      toast.success("WhatsApp templates saved successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error saving WhatsApp templates:", error);
      toast.error("Failed to save WhatsApp templates", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewMessage = () => {
    const message = currentTemplate.message || "";
    let previewMessage = message
      .replace(/{rsvp_link}/g, "https://event-sync.com/ABC123/rsvp")
      .replace(/{event_title}/g, event.eventTitle || "Your Event")
      .replace(/{guest_name}/g, "John Doe");
    
    // Replace subevent variables with sample data
    if (event?.subevents) {
      event.subevents.forEach(subevent => {
        const cleanTitle = subevent.title.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanTitle) {
          previewMessage = previewMessage
            .replace(new RegExp(`{${cleanTitle}_title}`, 'g'), subevent.title || "Subevent Title")
            .replace(new RegExp(`{${cleanTitle}_date}`, 'g'), subevent.event_date || "Dec 25, 2024")
            .replace(new RegExp(`{${cleanTitle}_location}`, 'g'), subevent.venue_address || "Beautiful Venue")
            .replace(new RegExp(`{${cleanTitle}_time}`, 'g'), subevent.start_time || "14:00")
            .replace(new RegExp(`{${cleanTitle}_endtime}`, 'g'), subevent.end_time || "16:00");
        }
      });
    }
    
    // Handle old variables for backward compatibility
    const firstSubevent = event?.subevents?.[0];
    previewMessage = previewMessage
      .replace(/{event_date}/g, firstSubevent?.event_date || "December 25, 2024")
      .replace(/{event_location}/g, firstSubevent?.venue_address || "Beautiful Venue");
    
    return previewMessage;
  };

  const getCharacterCount = () => {
    return currentTemplate.message?.length || 0;
  };

  const getCharacterLimit = () => {
    return 4096; // WhatsApp character limit
  };

  const isOverLimit = () => {
    return getCharacterCount() > getCharacterLimit();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "18px", color: "#6b7280" }}>
          Loading WhatsApp templates...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "600px", gap: "32px" }}>
      {/* Template List Sidebar */}
      <div style={{ 
        width: "300px", 
        borderRight: "1px solid #e5e7eb", 
        paddingRight: "24px",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            Templates ({whatsappTemplates.length})
          </h3>
          <button
            onClick={addNewTemplate}
            style={{
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {whatsappTemplates.map((template, index) => (
            <div
              key={template.id}
              style={{
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "8px",
                background: index === currentTemplateIndex ? "#f0f9ff" : "white",
                borderColor: index === currentTemplateIndex ? "#7c3aed" : "#e5e7eb",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => setCurrentTemplateIndex(index)}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                marginBottom: "4px"
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: "#111827"
                }}>
                  {template.name}
                  {template.is_default && (
                    <span style={{
                      marginLeft: "6px",
                      background: "#10b981",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}>
                      DEFAULT
                    </span>
                  )}
                </h4>
                
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTemplate(index);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      fontSize: "12px",
                    }}
                    title="Duplicate"
                  >
                    <MdContentCopy size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(index);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      fontSize: "12px",
                      color: "#ef4444",
                    }}
                    title="Delete"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>
              
              <p style={{ 
                margin: 0, 
                fontSize: "12px", 
                color: "#6b7280",
                lineHeight: "1.4"
              }}>
                {template.message?.substring(0, 80) || "No message"}
                {template.message?.length > 80 && "..."}
              </p>
              
              <div style={{ 
                fontSize: "10px", 
                color: "#9ca3af", 
                marginTop: "4px"
              }}>
                {template.message?.length || 0} characters
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {whatsappTemplates.length > 0 && (
          <>
            {/* Template Header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "6px", 
                  fontWeight: 600,
                  fontSize: "14px"
                }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name || ""}
                  onChange={(e) => updateCurrentTemplate("name", e.target.value)}
                  placeholder="Enter template name"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${errors.name ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                {errors.name && (
                  <span style={{ color: "#ef4444", fontSize: "12px" }}>
                    {errors.name}
                  </span>
                )}
              </div>

              <div style={{ 
                display: "flex", 
                gap: "8px", 
                alignItems: "center",
                marginBottom: "16px"
              }}>
                {!currentTemplate.is_default && (
                  <button
                    onClick={() => setAsDefault(currentTemplateIndex)}
                    style={{
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Set as Default
                  </button>
                )}
              </div>

              {/* Variable Usage Help */}
              {event?.subEvents && event.subEvents.length > 0 && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "16px",
                  fontSize: "12px"
                }}>
                  <div style={{ fontWeight: 600, color: "#374151", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MdEdit size={16} /> Variable Usage Guide:
                  </div>
                  <div style={{ color: "#6b7280", lineHeight: "1.4" }}>
                    <div><strong>Basic:</strong> {"{guest_name}, {event_title}, {rsvp_link}"}</div>
                    <div><strong>Subevent-specific:</strong> Use {"{SubeventName_property}"} format</div>
                    <div><strong>Available properties:</strong> _date, _location, _time, _endtime</div>
                    <div style={{ marginTop: "4px" }}>
                      <strong>Example:</strong> For "{event.subEvents[0]?.title || "Ceremony"}" → 
                      {" " + `{${event.subEvents[0]?.title.replace(/[^a-zA-Z0-9]/g, '') || "Ceremony"}_date}, {${event.subEvents[0]?.title.replace(/[^a-zA-Z0-9]/g, '') || "Ceremony"}_location}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Variable Helper */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: 600,
                fontSize: "14px"
              }}>
                Insert Variables
              </label>
              
              {/* All Variables */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ 
                  display: "flex", 
                  gap: "6px", 
                  flexWrap: "wrap"
                }}>
                  {allVariables.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        cursor: "pointer",
                        color: "#374151",
                      }}
                      title={variable.description}
                    >
                      {variable.key}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ 
                fontSize: "12px", 
                color: "#6b7280", 
                margin: 0,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "8px"
              }}>
                <p style={{ margin: "0 0 4px 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><MdLightbulb size={16} /> Variable Usage Tips:</p>
                <p style={{ margin: "0 0 2px 0" }}>• Click any button above to insert that variable</p>
                <p style={{ margin: "0 0 2px 0" }}>• Basic variables: {"{rsvp_link}, {guest_name}, {event_title}"}</p>
                <p style={{ margin: "0 0 2px 0" }}>• Subevent variables: {"{SubeventName_date}, {SubeventName_time}, {SubeventName_location}"}</p>
                <p style={{ margin: "0" }}>• Only shows variables for subevents that have the respective data</p>
              </div>
            </div>

            {/* Message Editor */}
            <div style={{ flex: 1, marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "6px", 
                fontWeight: 600,
                fontSize: "14px"
              }}>
                Message Content
              </label>
              <textarea
                id="whatsapp-message"
                value={currentTemplate.message || ""}
                onChange={(e) => updateCurrentTemplate("message", e.target.value)}
                placeholder="Enter your WhatsApp message here. Use variables like {rsvp_link}, {guest_name}, and {event_title} for basic info, or {SubeventName_date}, {SubeventName_location} for specific subevent details."
                style={{
                  width: "100%",
                  height: "200px",
                  padding: "12px",
                  border: `1px solid ${errors.message ? "#ef4444" : "#d1d5db"}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "monospace",
                }}
              />
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginTop: "4px"
              }}>
                {errors.message && (
                  <span style={{ color: "#ef4444", fontSize: "12px" }}>
                    {errors.message}
                  </span>
                )}
                <span style={{ 
                  fontSize: "12px", 
                  color: isOverLimit() ? "#ef4444" : "#6b7280",
                  marginLeft: "auto"
                }}>
                  {getCharacterCount()}/{getCharacterLimit()} characters
                  {isOverLimit() && " (Over limit!)"}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "6px", 
                fontWeight: 600,
                fontSize: "14px"
              }}>
                Preview (with sample data)
              </label>
              <div style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "14px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                maxHeight: "120px",
                overflowY: "auto",
              }}>
                {getPreviewMessage() || "Enter a message to see preview"}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              justifyContent: "flex-end",
              paddingTop: "16px",
              borderTop: "1px solid #e5e7eb"
            }}>
              <button
                onClick={() => setCurrentView && setCurrentView("analytics")}
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveTemplates}
                disabled={isSaving || isOverLimit()}
                style={{
                  background: isSaving || isOverLimit() ? "#9ca3af" : "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: isSaving || isOverLimit() ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {isSaving ? "Saving..." : "Save Templates"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppTemplateEditor;
