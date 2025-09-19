import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styles from "../../create-event/components/sections/EmailTemplateCreator.module.css";

const EmailTemplateEditor = ({
  event,
  session,
  setCurrentView
}) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [errors, setErrors] = useState({});
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch email templates from database
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      if (!event?.eventID || !session?.access_token) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/events?public_id=${event.eventID}`, {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.event?.emailTemplates) {
            setEmailTemplates(data.event.emailTemplates);
          } else {
            // Create default template if none exist
            const defaultTemplate = {
              title: "Wedding Invitation",
              subtitle: "Join us for our special day",
              body: "We're excited to celebrate this special moment with you. Please join us for an unforgettable celebration filled with love, laughter, and joy.",
              greeting: "Dear Guest,",
              signoff: "With love and excitement,",
              sender_name: "",
              sender_email: "sender@event-sync.com",
              reply_to: "reply@event-sync.com",
              subject_line: `Invitation: ${event.title || "Your Event"}`,
              template_key: "invitation_default",
              category: "invitation",
              status: "draft",
              primary_color: "#ffffff",
              secondary_color: "#e1c0b7",
              text_color: "#333333",
            };
            setEmailTemplates([defaultTemplate]);
          }
        }
      } catch (error) {
        console.error("Error fetching email templates:", error);
        toast.error("Failed to load email templates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailTemplates();
  }, [event?.eventID, session?.access_token]);

  const currentTemplate = emailTemplates[currentTemplateIndex] || {};

  const handleTemplateChange = (field, value) => {
    const updatedTemplates = [...emailTemplates];
    updatedTemplates[currentTemplateIndex] = {
      ...updatedTemplates[currentTemplateIndex],
      [field]: value,
    };

    setEmailTemplates(updatedTemplates);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addNewTemplate = () => {
    const categoryOptions = ["invitation", "reminder", "update"];
    const existingCategories = emailTemplates.map((t) => t.category);
    const availableCategory =
      categoryOptions.find((cat) => !existingCategories.includes(cat)) ||
      "invitation";

    const newTemplate = {
      title: `${availableCategory.charAt(0).toUpperCase() + availableCategory.slice(1)} Template`,
      subtitle: "Join us for our special event",
      body: "Thank you for being part of our celebration.",
      greeting: "Dear Guest,",
      signoff: "Best regards,",
      sender_name: currentTemplate.sender_name || "",
      sender_email: "sender@event-sync.com",
      reply_to: "reply@event-sync.com",
      subject_line: `${availableCategory.charAt(0).toUpperCase() + availableCategory.slice(1)}: ${event.title || "Your Event"}`,
      template_key: `${availableCategory}_${Date.now()}`,
      category: availableCategory,
      status: "draft",
      primary_color: currentTemplate.primary_color || "#ffffff",
      secondary_color: currentTemplate.secondary_color || "#e1c0b7",
      text_color: currentTemplate.text_color || "#333333",
    };

    const updatedTemplates = [...emailTemplates, newTemplate];
    setEmailTemplates(updatedTemplates);

    setCurrentTemplateIndex(updatedTemplates.length - 1);
    toast.success("New template added!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const deleteTemplate = (templateIndex) => {
    if (emailTemplates.length <= 1) {
      toast.error("You must have at least one template", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const updatedTemplates = emailTemplates.filter(
      (_, index) => index !== templateIndex,
    );
    setEmailTemplates(updatedTemplates);

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

  const validateForm = () => {
    const newErrors = {};

    // Validate current template
    if (!currentTemplate.title?.trim()) {
      newErrors.title = "Template title is required";
    }
    if (!currentTemplate.subject_line?.trim()) {
      newErrors.subject_line = "Subject line is required";
    }
    if (!currentTemplate.body?.trim()) {
      newErrors.body = "Email body is required";
    }
    if (!currentTemplate.sender_name?.trim()) {
      newErrors.sender_name = "Sender name is required";
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
      // Ensure at least one active template
      const hasActiveTemplate = emailTemplates.some(
        (template) => template.status === "active",
      );
      let templatesToSave = [...emailTemplates];
      if (!hasActiveTemplate && emailTemplates.length > 0) {
        templatesToSave[0].status = "active";
      }

      // Save templates by updating the event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          public_id: event.eventID,
          title: event.title,
          emailTemplates: templatesToSave,
          // Include other required fields to avoid validation errors
          status: 'draft'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("Email templates saved successfully!", {
            position: "top-center",
            autoClose: 2000,
          });
          // Update local state with any IDs assigned by the database
          if (result.event?.emailTemplates) {
            setEmailTemplates(result.event.emailTemplates);
          }
        } else {
          throw new Error(result.error || "Failed to save templates");
        }
      } else {
        throw new Error("Failed to save templates");
      }
    } catch (error) {
      console.error("Error saving templates:", error);
      toast.error("Failed to save templates. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewContent = () => {
    if (!currentTemplate.body) return "";

    const eventName = event?.title || "Your Event";
    const eventDate = event?.start_date
      ? new Date(event.start_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date TBD";
    const guestName = "John Smith";
    const eventDescription = event?.description || "";
    const rsvpLink = `${process.env.NEXT_PUBLIC_HOST || "http://localhost:3000"}/${event.eventID}/rsvp?guestId=sample-guest-id`;

    return {
      eventName,
      eventDate,
      eventDescription,
      logoLink: event.logo_url || "",
      greeting: currentTemplate.greeting || "Dear Guest,",
      body: currentTemplate.body || "",
      signoff: currentTemplate.signoff || "Best regards,",
      senderName: currentTemplate.sender_name || "Event Organizer",
      guestName,
      rsvpLink,
    };
  };

  const renderEmailPreview = () => {
    const templateData = getPreviewContent();

    return (
      <div className={styles.emailPreview}>
        <div className={styles.emailHeader}>
          <div className={styles.emailMeta}>
            <strong>Subject:</strong>{" "}
            {currentTemplate.subject_line ||
              `Invitation: ${event?.title || "Your Event"}`}
          </div>
          <div className={styles.emailMeta}>
            <strong>From:</strong>{" "}
            {currentTemplate.sender_name || "Event Organizer"} &lt;
            {currentTemplate.sender_email || "sender@event-sync.com"}&gt;
          </div>
          <div className={styles.emailMeta}>
            <strong>To:</strong> John Smith &lt;john.smith@example.com&gt;
          </div>
        </div>

        <div className={styles.emailBody}>
          <div
            className={styles.emailContent}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: "#1f2937",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              margin: 0,
              padding: "40px 20px",
              lineHeight: 1.6,
            }}
          >
            {/* Main Container */}
            <div
              style={{
                maxWidth: "640px",
                width: "100%",
                margin: "0 auto",
                background: "#ffffff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Logo Section */}
              {templateData.logoLink && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 40px 20px 40px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <img
                    src={templateData.logoLink}
                    alt={`${templateData.eventName} Logo`}
                    style={{
                      maxWidth: "200px",
                      height: "auto",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </div>
              )}

              {/* Header Section */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${currentTemplate.secondary_color || "#e1c0b7"} 0%, ${currentTemplate.secondary_color || "#e1c0b7"}dd 100%)`,
                  padding: "50px 40px",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", zIndex: 2 }}>
                  <h1
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: currentTemplate.text_color || "#333333",
                      margin: "0 0 16px 0",
                      letterSpacing: "-0.5px",
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {templateData.eventName}
                  </h1>
                  {templateData.eventDate && (
                    <div
                      style={{
                        display: "inline-block",
                        background: "rgba(255, 255, 255, 0.2)",
                        padding: "12px 24px",
                        borderRadius: "50px",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        marginBottom: "16px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: currentTemplate.text_color || "#333333",
                          margin: "0",
                          textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        📅 {templateData.eventDate}
                      </p>
                    </div>
                  )}
                  {templateData.eventDescription && (
                    <p
                      style={{
                        fontSize: "18px",
                        color: currentTemplate.text_color || "#333333",
                        margin: "20px auto 0 auto",
                        maxWidth: "500px",
                        opacity: "0.95",
                        lineHeight: "1.7",
                      }}
                    >
                      {templateData.eventDescription}
                    </p>
                  )}
                </div>
                {/* Decorative elements */}
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    width: "60px",
                    height: "60px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    opacity: "0.6",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "30px",
                    right: "30px",
                    width: "40px",
                    height: "40px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    opacity: "0.4",
                  }}
                ></div>
              </div>

              {/* Main Content */}
              <div
                style={{
                  background: currentTemplate.primary_color || "#ffffff",
                  padding: "50px 40px",
                }}
              >
                {/* Message Content */}
                <div style={{ marginBottom: "40px" }}>
                  <p
                    style={{
                      fontSize: "20px",
                      color: currentTemplate.text_color || "#333333",
                      margin: "0 0 24px 0",
                      fontWeight: "500",
                    }}
                  >
                    {templateData.greeting}
                  </p>

                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.02)",
                      padding: "30px",
                      borderRadius: "12px",
                      borderLeft: `4px solid ${currentTemplate.secondary_color || "#e1c0b7"}`,
                      margin: "30px 0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "18px",
                        color: currentTemplate.text_color || "#333333",
                        margin: "0",
                        lineHeight: "1.8",
                        fontStyle: "italic",
                      }}
                    >
                      {templateData.body}
                    </p>
                  </div>

                  <p
                    style={{
                      fontSize: "18px",
                      color: currentTemplate.text_color || "#333333",
                      margin: "24px 0 16px 0",
                    }}
                  >
                    {templateData.signoff}
                  </p>

                  {templateData.senderName && (
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: currentTemplate.text_color || "#333333",
                        margin: "0",
                      }}
                    >
                      {templateData.senderName}
                    </p>
                  )}
                </div>

                {/* CTA Section */}
                <div style={{ textAlign: "center", margin: "50px 0" }}>
                  <p
                    style={{
                      fontSize: "18px",
                      color: currentTemplate.text_color || "#333333",
                      margin: "0 0 30px 0",
                      fontWeight: "500",
                    }}
                  >
                    Please RSVP to help us plan this special celebration
                  </p>

                  <a
                    href={templateData.rsvpLink}
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#ffffff",
                      textDecoration: "none",
                      padding: "18px 40px",
                      borderRadius: "50px",
                      fontWeight: "700",
                      fontSize: "18px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      boxShadow: "0 10px 25px rgba(102, 126, 234, 0.4)",
                      transition: "all 0.3s ease",
                      border: "2px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    RSVP Now
                  </a>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "24px 0 0 0",
                      fontStyle: "italic",
                    }}
                  >
                    You can update your response anytime before the event
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${currentTemplate.secondary_color || "#e1c0b7"} 0%, ${currentTemplate.secondary_color || "#e1c0b7"}cc 100%)`,
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#6b7280",
                      margin: "0 0 8px 0",
                      fontWeight: "500",
                    }}
                  >
                    Questions? We're here to help!
                  </p>
                  <a
                    href="mailto:info@event-sync.com"
                    style={{
                      color: currentTemplate.text_color || "#333333",
                      textDecoration: "none",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    info@event-sync.com
                  </a>
                </div>

                <div
                  style={{
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(107, 114, 128, 0.3)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Can't click the button? Copy and paste this link:
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: "0 0 16px 0",
                      wordBreak: "break-all",
                      fontFamily: '"Courier New", monospace',
                      background: "rgba(0, 0, 0, 0.05)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      display: "inline-block",
                      maxWidth: "100%",
                    }}
                  >
                    {templateData.rsvpLink}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(107, 114, 128, 0.2)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9ca3af",
                      margin: "0 0 8px 0",
                    }}
                  >
                    You received this invitation because you were invited to{" "}
                    {templateData.eventName}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9ca3af",
                      margin: "0",
                    }}
                  >
                    Powered by <strong>Event-Sync</strong> © 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading email templates...</div>
      </div>
    );
  }

  return (
    <div className={styles.formSection + " " + styles.emailTemplateCreator}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>📧</div>
        <div>
          <h2 className={styles.sectionTitle}>Email Template Editor</h2>
          <p className={styles.sectionDescription}>
            Edit and customize email templates for invitations, reminders, and
            updates.
          </p>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Left Panel - Controls */}
        <div className={styles.controlsPanel}>
          {/* Template Tabs */}
          <div className={styles.templateTabs}>
            <div className={styles.tabsContainer}>
              {emailTemplates.map((template, index) => (
                <button
                  key={template.id || index}
                  type="button"
                  className={`${styles.templateTab} ${
                    currentTemplateIndex === index ? styles.active : ""
                  } ${styles[template.category]}`}
                  onClick={() => setCurrentTemplateIndex(index)}
                >
                  <span className={styles.tabIcon}>
                    {template.category === "invitation" && "💌"}
                    {template.category === "reminder" && "⏰"}
                    {template.category === "update" && "📢"}
                  </span>
                  <span className={styles.tabLabel}>{template.title}</span>
                  {emailTemplates.length > 1 && (
                    <button
                      type="button"
                      className={styles.deleteTab}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(index);
                      }}
                      title="Delete template"
                    >
                      ×
                    </button>
                  )}
                </button>
              ))}

              <button
                type="button"
                className={styles.addTemplateBtn}
                onClick={addNewTemplate}
                title="Add new template"
              >
                +
              </button>
            </div>
          </div>

          {/* Template Configuration */}
          <div className={styles.templateConfig}>
            {/* Basic Information */}
            <div className={styles.controlSection}>
              <h3 className={styles.controlTitle}>📝 Template Information</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Template Title *</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.title ? styles.error : ""}`}
                  value={currentTemplate.title || ""}
                  onChange={(e) =>
                    handleTemplateChange("title", e.target.value)
                  }
                  placeholder="Wedding Invitation"
                />
                {errors.title && (
                  <div className={styles.errorText}>{errors.title}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  className={styles.formSelect}
                  value={currentTemplate.category || "invitation"}
                  onChange={(e) =>
                    handleTemplateChange("category", e.target.value)
                  }
                >
                  <option value="invitation">Invitation</option>
                  <option value="reminder">Reminder</option>
                  <option value="update">Update</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select
                  className={styles.formSelect}
                  value={currentTemplate.status || "draft"}
                  onChange={(e) =>
                    handleTemplateChange("status", e.target.value)
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archive">Archive</option>
                </select>
              </div>
            </div>

            {/* Email Content */}
            <div className={styles.controlSection}>
              <h3 className={styles.controlTitle}>✉️ Email Content</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject Line *</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.subject_line ? styles.error : ""}`}
                  value={currentTemplate.subject_line || ""}
                  onChange={(e) =>
                    handleTemplateChange("subject_line", e.target.value)
                  }
                  placeholder={`Invitation: ${event?.title || "Your Event"}`}
                />
                {errors.subject_line && (
                  <div className={styles.errorText}>{errors.subject_line}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Greeting</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={currentTemplate.greeting || ""}
                  onChange={(e) =>
                    handleTemplateChange("greeting", e.target.value)
                  }
                  placeholder="Dear Guest,"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Body *</label>
                <textarea
                  className={`${styles.formTextarea} ${errors.body ? styles.error : ""}`}
                  value={currentTemplate.body || ""}
                  onChange={(e) => handleTemplateChange("body", e.target.value)}
                  placeholder="Write your email message here..."
                  rows="6"
                />
                {errors.body && (
                  <div className={styles.errorText}>{errors.body}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Sign-off</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={currentTemplate.signoff || ""}
                  onChange={(e) =>
                    handleTemplateChange("signoff", e.target.value)
                  }
                  placeholder="Best regards,"
                />
              </div>
            </div>

            {/* Sender Information */}
            <div className={styles.controlSection}>
              <h3 className={styles.controlTitle}>👤 Sender Information</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sender Name *</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.sender_name ? styles.error : ""}`}
                  value={currentTemplate.sender_name || ""}
                  onChange={(e) =>
                    handleTemplateChange("sender_name", e.target.value)
                  }
                  placeholder="John & Jane Smith"
                />
                {errors.sender_name && (
                  <div className={styles.errorText}>{errors.sender_name}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reply to Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={
                    currentTemplate.reply_to || "reply@event-sync.com"
                  }
                  onChange={(e) =>
                    handleTemplateChange("reply_to", e.target.value)
                  }
                  placeholder="reply@event-sync.com"
                />
                <div className={styles.formHelp}>
                  For security reasons, all emails are sent from our platform, but you can add your own email for email responses (not required)
                </div>
              </div>
            </div>

            {/* Color Customization */}
            <div className={styles.controlSection}>
              <h3 className={styles.controlTitle}>🎨 Color Theme</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Primary Color (Background)
                </label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={currentTemplate.primary_color || "#ffffff"}
                    onChange={(e) =>
                      handleTemplateChange("primary_color", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.colorTextInput}
                    value={currentTemplate.primary_color || "#ffffff"}
                    onChange={(e) =>
                      handleTemplateChange("primary_color", e.target.value)
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Secondary Color (Header/Footer)
                </label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={currentTemplate.secondary_color || "#e1c0b7"}
                    onChange={(e) =>
                      handleTemplateChange("secondary_color", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.colorTextInput}
                    value={currentTemplate.secondary_color || "#e1c0b7"}
                    onChange={(e) =>
                      handleTemplateChange("secondary_color", e.target.value)
                    }
                    placeholder="#e1c0b7"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Text Color</label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={currentTemplate.text_color || "#333333"}
                    onChange={(e) =>
                      handleTemplateChange("text_color", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.colorTextInput}
                    value={currentTemplate.text_color || "#333333"}
                    onChange={(e) =>
                      handleTemplateChange("text_color", e.target.value)
                    }
                    placeholder="#333333"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <h3>Email Preview</h3>
            <div className={styles.previewControls}>
              <div className={styles.deviceToggle}>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "mobile" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  📱
                </button>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "tablet" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("tablet")}
                >
                  📱
                </button>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "desktop" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  💻
                </button>
              </div>
            </div>
          </div>

          <div className={`${styles.previewFrame} ${styles[previewDevice]}`}>
            {renderEmailPreview()}
          </div>

          <div className={styles.previewNote}>
            <p>
              This preview shows how your email will appear to recipients. The
              actual email will include professional formatting and your event's
              branding.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={() => setCurrentView("email")}
        >
          ← Back to Email Portal
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={saveTemplates}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Templates"}
        </button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;