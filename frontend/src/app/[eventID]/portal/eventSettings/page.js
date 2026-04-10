"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdSettings, MdArrowBack, MdAdd, MdDelete } from "react-icons/md";

import { useAuth } from "../../../contexts/AuthContext";
import useEventPermissions from "../../../hooks/useEventPermissions";
import Loading from "../../components/loading";

import styles from "../../styles/portal.module.css";
import settingsStyles from "./EventSettings.module.css";

const EventSettingsPage = () => {
  const router = useRouter();
  const params = useParams();
  const eventID = params.eventID;

  const { session, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "wedding",
    logo_url: "",
    startDate: "",
    endDate: "",
    rsvpDeadline: "",
    location: "",
    maxGuests: "",
    timezone: "",
    isPrivate: false,
    requireRSVP: true,
    allowPlusOnes: false,
    subEvents: [],
  });

  const {
    loading: permissionsLoading,
    canEditEvent,
    userRole,
  } = useEventPermissions(eventID);

  // Fetch event data and populate form
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventID}`);
        if (!res.ok) throw new Error("Failed to load event");
        const data = await res.json();
        setEvent(data);

        const tz =
          data.details?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone;

        setFormData({
          title: data.eventTitle || "",
          description: data.description || "",
          eventType: data.details?.event_type || "wedding",
          logo_url: data.logo || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          rsvpDeadline: data.details?.rsvp_deadline || "",
          location: data.details?.location || "",
          maxGuests: data.capacity || "",
          timezone: tz,
          isPrivate: data.details?.is_private || false,
          requireRSVP: data.details?.require_rsvp !== false,
          allowPlusOnes: data.details?.allow_plus_ones || false,
          subEvents: (data.subevents || []).map((se) => ({
            id: se.id,
            title: se.title || "",
            date: se.event_date || "",
            startTime: se.start_time || "",
            endTime: se.end_time || "",
            location: se.venue_address || "",
            description: se.details?.description || "",
            maxGuests: se.capacity || "",
            timezone: tz,
            isRequired: se.details?.is_required !== false,
          })),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!session) {
        router.push("/login");
        return;
      }
      fetchEvent();
    }
  }, [eventID, session, authLoading, router]);

  // Redirect if no edit permission
  useEffect(() => {
    if (!permissionsLoading && !loading && !canEditEvent) {
      router.push(`/${eventID}/portal`);
    }
  }, [permissionsLoading, canEditEvent, loading, eventID, router]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubEventChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.subEvents];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subEvents: updated };
    });
    const key = `subEvent_${index}_${field}`;
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const addSubEvent = () => {
    setFormData((prev) => ({
      ...prev,
      subEvents: [
        ...prev.subEvents,
        {
          id: null,
          title: "",
          date: "",
          startTime: "",
          endTime: "",
          location: "",
          description: "",
          maxGuests: "",
          timezone: formData.timezone,
          isRequired: false,
        },
      ],
    }));
  };

  const removeSubEvent = (index) => {
    if (formData.subEvents.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      subEvents: prev.subEvents.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = "End date must be on or after start date";
    }

    formData.subEvents.forEach((se, i) => {
      if (!se.title.trim()) {
        newErrors[`subEvent_${i}_title`] = "Sub-event title is required";
      }
    });

    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors below");
      setTimeout(() => {
        const firstError = document.querySelector(
          `.${settingsStyles.errorText}`,
        );
        if (firstError)
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        public_id: eventID,
        status: event?.status === 2 ? "published" : "draft",
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save event");
      }

      toast.success("Event settings saved!");
      router.push(`/${eventID}/portal`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || permissionsLoading) {
    return <Loading />;
  }

  if (!session) {
    return <Loading />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <div className={styles.logoSection}>
              <Link href="/" className={styles.logo}>
                Event-Sync
              </Link>
              <span className={styles.breadcrumb}>
                {"/ "}
                <Link
                  href={`/${eventID}/portal`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {event?.eventTitle || "Event"}
                </Link>
                {" / Settings"}
              </span>
              {userRole && (
                <span className={styles.userRoleBadge}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
            </div>
            <div className={styles.navActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => router.push(`/${eventID}/portal`)}
              >
                <MdArrowBack size={18} /> Back to Portal
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={settingsStyles.settingsLayout}>

            {/* Event Details Section */}
            <div className={settingsStyles.section}>
              <h2 className={settingsStyles.sectionTitle}>
                <MdSettings size={22} /> Event Details
              </h2>
              <div className={settingsStyles.formGrid}>
                <div className={`${settingsStyles.formGroup} ${settingsStyles.fullWidth}`}>
                  <label className={settingsStyles.formLabel}>Event Title *</label>
                  <input
                    className={`${settingsStyles.formInput}${errors.title ? " " + settingsStyles.inputError : ""}`}
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="Enter event title"
                  />
                  {errors.title && (
                    <span className={settingsStyles.errorText}>{errors.title}</span>
                  )}
                </div>

                <div className={`${settingsStyles.formGroup} ${settingsStyles.fullWidth}`}>
                  <label className={settingsStyles.formLabel}>Description</label>
                  <textarea
                    className={settingsStyles.formTextarea}
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Describe your event"
                    rows={3}
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Event Type</label>
                  <select
                    className={settingsStyles.formSelect}
                    value={formData.eventType}
                    onChange={(e) => handleFieldChange("eventType", e.target.value)}
                  >
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="corporate">Corporate</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Logo URL</label>
                  <input
                    className={settingsStyles.formInput}
                    value={formData.logo_url}
                    onChange={(e) => handleFieldChange("logo_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Start Date</label>
                  <input
                    type="date"
                    className={settingsStyles.formInput}
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange("startDate", e.target.value)}
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>End Date</label>
                  <input
                    type="date"
                    className={`${settingsStyles.formInput}${errors.endDate ? " " + settingsStyles.inputError : ""}`}
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange("endDate", e.target.value)}
                  />
                  {errors.endDate && (
                    <span className={settingsStyles.errorText}>{errors.endDate}</span>
                  )}
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>RSVP Deadline</label>
                  <input
                    type="date"
                    className={settingsStyles.formInput}
                    value={formData.rsvpDeadline}
                    onChange={(e) => handleFieldChange("rsvpDeadline", e.target.value)}
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Location</label>
                  <input
                    className={settingsStyles.formInput}
                    value={formData.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    placeholder="Event venue or address"
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Max Guests</label>
                  <input
                    type="number"
                    className={settingsStyles.formInput}
                    value={formData.maxGuests}
                    onChange={(e) => handleFieldChange("maxGuests", e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                <div className={settingsStyles.formGroup}>
                  <label className={settingsStyles.formLabel}>Timezone</label>
                  <input
                    className={settingsStyles.formInput}
                    value={formData.timezone}
                    onChange={(e) => handleFieldChange("timezone", e.target.value)}
                    placeholder="e.g. America/New_York"
                  />
                </div>
              </div>
            </div>

            {/* Event Settings Section */}
            <div className={settingsStyles.section}>
              <h2 className={settingsStyles.sectionTitle}>Event Settings</h2>
              <div className={settingsStyles.checkboxGroup}>
                <label className={settingsStyles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => handleFieldChange("isPrivate", e.target.checked)}
                  />
                  Private Event
                </label>
                <label className={settingsStyles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={formData.requireRSVP}
                    onChange={(e) => handleFieldChange("requireRSVP", e.target.checked)}
                  />
                  Require RSVP
                </label>
                <label className={settingsStyles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={formData.allowPlusOnes}
                    onChange={(e) => handleFieldChange("allowPlusOnes", e.target.checked)}
                  />
                  Allow Plus Ones
                </label>
              </div>
            </div>

            {/* Sub-events Section */}
            <div className={settingsStyles.section}>
              <h2 className={settingsStyles.sectionTitle}>Sub-events</h2>

              {formData.subEvents.map((se, index) => (
                <div key={se.id ?? `new-${index}`} className={settingsStyles.subEventCard}>
                  <div className={settingsStyles.subEventHeader}>
                    <span className={settingsStyles.subEventNum}>
                      Sub-event {index + 1}
                    </span>
                    {formData.subEvents.length > 1 && (
                      <button
                        className={settingsStyles.removeBtn}
                        onClick={() => removeSubEvent(index)}
                        type="button"
                      >
                        <MdDelete size={16} /> Remove
                      </button>
                    )}
                  </div>

                  <div className={settingsStyles.formGrid}>
                    <div className={`${settingsStyles.formGroup} ${settingsStyles.fullWidth}`}>
                      <label className={settingsStyles.formLabel}>Title *</label>
                      <input
                        className={`${settingsStyles.formInput}${errors[`subEvent_${index}_title`] ? " " + settingsStyles.inputError : ""}`}
                        value={se.title}
                        onChange={(e) => handleSubEventChange(index, "title", e.target.value)}
                        placeholder="Sub-event title"
                      />
                      {errors[`subEvent_${index}_title`] && (
                        <span className={settingsStyles.errorText}>
                          {errors[`subEvent_${index}_title`]}
                        </span>
                      )}
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.formLabel}>Date</label>
                      <input
                        type="date"
                        className={settingsStyles.formInput}
                        value={se.date}
                        onChange={(e) => handleSubEventChange(index, "date", e.target.value)}
                      />
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.formLabel}>Start Time</label>
                      <input
                        type="time"
                        className={settingsStyles.formInput}
                        value={se.startTime}
                        onChange={(e) => handleSubEventChange(index, "startTime", e.target.value)}
                      />
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.formLabel}>End Time</label>
                      <input
                        type="time"
                        className={settingsStyles.formInput}
                        value={se.endTime}
                        onChange={(e) => handleSubEventChange(index, "endTime", e.target.value)}
                      />
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.formLabel}>Location</label>
                      <input
                        className={settingsStyles.formInput}
                        value={se.location}
                        onChange={(e) => handleSubEventChange(index, "location", e.target.value)}
                        placeholder="Venue or address"
                      />
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.formLabel}>Capacity</label>
                      <input
                        type="number"
                        className={settingsStyles.formInput}
                        value={se.maxGuests}
                        onChange={(e) => handleSubEventChange(index, "maxGuests", e.target.value)}
                        placeholder="Max attendees"
                        min="1"
                      />
                    </div>

                    <div className={`${settingsStyles.formGroup} ${settingsStyles.fullWidth}`}>
                      <label className={settingsStyles.formLabel}>Description</label>
                      <textarea
                        className={settingsStyles.formTextarea}
                        value={se.description}
                        onChange={(e) => handleSubEventChange(index, "description", e.target.value)}
                        placeholder="Describe this sub-event"
                        rows={2}
                      />
                    </div>

                    <div className={settingsStyles.formGroup}>
                      <label className={settingsStyles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={se.isRequired}
                          onChange={(e) => handleSubEventChange(index, "isRequired", e.target.checked)}
                        />
                        Required attendance
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                className={settingsStyles.addSubEventBtn}
                onClick={addSubEvent}
                type="button"
              >
                <MdAdd size={18} /> Add Sub-event
              </button>
            </div>

            {/* Footer Actions */}
            <div className={settingsStyles.formActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => router.push(`/${eventID}/portal`)}
              >
                <MdArrowBack size={18} /> Back to Portal
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      </main>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        draggable
        theme="colored"
      />
    </div>
  );
};

export default EventSettingsPage;
