import React, { useState, useEffect } from "react";
import styles from "../styles/portal.module.css";

const GuestForm = ({
  guest = null,
  eventID,
  session,
  onClose,
  onSuccess,
  toast,
}) => {
  const isEditMode = !!guest;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tag: "",
    gender_id: null,
    age_group_id: null,
    guest_type_id: null,
    guest_limit: null,
    point_of_contact: false,
    group_id: null,
    newGroupName: "",
    selectedSubEvents: [],
  });

  // Loading and options state
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [genders, setGenders] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [guestTypes, setGuestTypes] = useState([]);
  const [subEvents, setSubEvents] = useState([]);
  const [existingGroups, setExistingGroups] = useState([]);
  const [errors, setErrors] = useState({});

  // Load form data and options on mount
  useEffect(() => {
    loadFormData();
  }, [guest]);

  const loadFormData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadLookupTables(),
        loadSubEvents(),
        loadExistingGroups(),
      ]);

      if (isEditMode) {
        populateFormData();
      }
    } catch (error) {
      console.error("Error loading form data:", error);
      toast("Failed to load form data");
    } finally {
      setDataLoading(false);
    }
  };

  const loadLookupTables = async () => {
    try {
      // We'll need to create an endpoint to fetch lookup tables
      // For now, let's use hardcoded options that match the database
      setGenders([
        { id: 1, state: "Male" },
        { id: 2, state: "Female" },
        { id: 3, state: "Other" },
      ]);

      setAgeGroups([
        { id: 1, state: "Infant" },
        { id: 2, state: "Child" },
        { id: 3, state: "Teen" },
        { id: 4, state: "Adult" },
        { id: 5, state: "Senior" },
        { id: 6, state: "Unknown" },
      ]);

      setGuestTypes([
        { id: 1, name: "Single", description: "Simple Yes/No RSVP (1 or 0)" },
        {
          id: 2,
          name: "Multiple",
          description: "Dropdown RSVP up to a fixed number",
        },
        {
          id: 3,
          name: "Variable",
          description: "Free-form RSVP, any number of guests",
        },
      ]);
    } catch (error) {
      console.error("Error loading lookup tables:", error);
    }
  };

  const loadSubEvents = async () => {
    try {
      const response = await fetch(`/api/events/${eventID}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const eventData = await response.json();

        // Extract sub-events from the API response
        const subEventArray = [];
        let funcIndex = 0;
        while (eventData[`func${funcIndex}`]) {
          const func = eventData[`func${funcIndex}`];
          subEventArray.push({
            id: funcIndex + 1, // We'll need real IDs from the database
            title: func.funcTitle,
            date: func.date,
            location: func.location,
          });
          funcIndex++;
        }

        if (subEventArray.length === 0) {
          subEventArray.push({
            id: 1,
            title: "Main Event",
            date: null,
            location: null,
          });
        }

        setSubEvents(subEventArray);
      }
    } catch (error) {
      console.error("Error loading sub-events:", error);
    }
  };

  const loadExistingGroups = async () => {
    try {
      const response = await fetch(`/api/${eventID}/guestList`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.validated && data.allUsers) {
          // Extract unique groups
          const groups = [
            ...new Set(
              data.allUsers
                .map((guest) => guest.group)
                .filter((group) => group && group.trim()),
            ),
          ].map((groupName) => ({
            id: groupName, // Using name as ID for now
            title: groupName,
          }));

          setExistingGroups(groups);
        }
      }
    } catch (error) {
      console.error("Error loading existing groups:", error);
    }
  };

 

const populateFormData = () => {
  if (!guest) return;

  // Parse selected sub-events from rsvpStatus
  const selectedSubEvents = [];
  if (guest.rsvpStatus && subEvents.length > 0) {
    Object.keys(guest.rsvpStatus).forEach((subEventTitle) => {
      const subEvent = subEvents.find(
        (se) =>
          se.title === subEventTitle ||
          se.title.toLowerCase() === subEventTitle.toLowerCase()
      );
      if (subEvent) {
        selectedSubEvents.push(subEvent.id);
      }
    });
  }

  setFormData({
    name: guest.name || "",
    email: guest.email || "",
    phone: guest.phone || "",
    tag: guest.tag || "",
    gender_id: genders.find(
      (g) => g.state.toLowerCase() === (guest.gender || "").toLowerCase()
    )?.id || null,
    age_group_id: ageGroups.find(
      (ag) => ag.state.toLowerCase() === (guest.ageGroup || "").toLowerCase()
    )?.id || null,
    guest_type_id:
      guestTypes.find(
        (gt) => gt.name.toLowerCase() === (guest.guestType || "").toLowerCase()
      )?.id || 1,
    guest_limit: guest.guest_limit || null,
    point_of_contact: guest.isPointOfContact || false,
    group_id: guest.group_id || null,
    newGroupName: "",
    selectedSubEvents,
  });
};

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (
      formData.guest_type_id === 2 &&
      (!formData.guest_limit || formData.guest_limit < 0)
    ) {
      newErrors.guest_limit = "Guest limit is required for Multiple guest type";
    }

    if (!formData.group_id && !formData.newGroupName.trim()) {
      newErrors.group =
        "Please select an existing group or enter a new group name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        tag: formData.tag || null,
        gender: genders.find((g) => g.id === formData.gender_id)?.state || null,
        ageGroup:
          ageGroups.find((ag) => ag.id === formData.age_group_id)?.state ||
          null,
        guestType:
          guestTypes.find((gt) => gt.id === formData.guest_type_id)?.name ||
          "Single",
        guestLimit: formData.guest_limit,
        isPointOfContact: formData.point_of_contact,
        group:
          formData.newGroupName.trim() ||
          existingGroups.find((g) => g.id === formData.group_id)?.title,
        subEventInvitations: formData.selectedSubEvents,
      };

      let response;

      if (isEditMode) {
        // Update existing guest
        response = await fetch(`/api/${eventID}/guests/${guest.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ guest: payload }),
        });
      } else {
        // Create new guest
        response = await fetch(`/api/${eventID}/guests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            guests: [payload],
            event: { eventID },
          }),
        });
      }

      if (response.ok) {
        toast(`Guest ${isEditMode ? "updated" : "created"} successfully!`);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? "update" : "create"} guest`,
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} guest:`,
        error,
      );
      toast(
        `Failed to ${isEditMode ? "update" : "create"} guest. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubEventToggle = (subEventId) => {
    setFormData((prev) => ({
      ...prev,
      selectedSubEvents: prev.selectedSubEvents.includes(subEventId)
        ? prev.selectedSubEvents.filter((id) => id !== subEventId)
        : [...prev.selectedSubEvents, subEventId],
    }));
  };

  if (dataLoading) {
    return (
      <div className={styles.guestFormOverlay}>
        <div className={styles.guestFormModal}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.guestFormOverlay}>
      <div className={styles.guestFormModal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditMode ? "Edit Guest" : "Add New Guest"}
          </h3>
          <button className={styles.closeModal} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.guestForm}>
          <div className={styles.formGrid}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>Basic Information</h4>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Name *
                  <input
                    type="text"
                    className={`${styles.formInput} ${errors.name ? styles.error : ""}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter guest name"
                  />
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Email
                  <input
                    type="email"
                    className={`${styles.formInput} ${errors.email ? styles.error : ""}`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <span className={styles.errorText}>{errors.email}</span>
                  )}
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Phone
                  <input
                    type="tel"
                    className={styles.formInput}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Enter phone number"
                  />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Tag
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tag: e.target.value }))
                    }
                    placeholder="Optional tag or note"
                  />
                </label>
              </div>
            </div>

            {/* Guest Details */}
            <div className={styles.formSection}>
              <h4 className={styles.formSectionTitle}>Guest Details</h4>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Gender
                  <select
                    className={styles.formSelect}
                    value={formData.gender_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <option value="">Select gender</option>
                    {genders.map((gender) => (
                      <option key={gender.id} value={gender.id}>
                        {gender.state}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Age Group
                  <select
                    className={styles.formSelect}
                    value={formData.age_group_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        age_group_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <option value="">Select age group</option>
                    {ageGroups.map((ageGroup) => (
                      <option key={ageGroup.id} value={ageGroup.id}>
                        {ageGroup.state}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Guest Type
                  <select
                    className={styles.formSelect}
                    value={formData.guest_type_id || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guest_type_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                  >
                    {guestTypes.map((guestType) => (
                      <option key={guestType.id} value={guestType.id}>
                        {guestType.name} - {guestType.description}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formData.guest_type_id === 2 && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Guest Limit *
                    <input
                      type="number"
                      min="0"
                      className={`${styles.formInput} ${errors.guest_limit ? styles.error : ""}`}
                      value={formData.guest_limit || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          guest_limit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      placeholder="Enter guest limit"
                    />
                    {errors.guest_limit && (
                      <span className={styles.errorText}>
                        {errors.guest_limit}
                      </span>
                    )}
                  </label>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.point_of_contact}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        point_of_contact: e.target.checked,
                      }))
                    }
                  />
                  <span>Point of Contact</span>
                </label>
              </div>
            </div>
          </div>

          {/* Group Selection */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Group Assignment</h4>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Existing Group
                <select
                  className={`${styles.formSelect} ${errors.group ? styles.error : ""}`}
                  value={formData.group_id || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      group_id: e.target.value || null,
                      newGroupName: "",
                    }))
                  }
                >
                  <option value="">Select existing group</option>
                  {existingGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.formDivider}>OR</div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                New Group Name
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.group ? styles.error : ""}`}
                  value={formData.newGroupName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newGroupName: e.target.value,
                      group_id: null,
                    }))
                  }
                  placeholder="Enter new group name"
                />
                {errors.group && (
                  <span className={styles.errorText}>{errors.group}</span>
                )}
              </label>
            </div>
          </div>

          {/* Sub-Event Invitations */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Sub-Event Invitations</h4>

            {subEvents.length > 0 ? (
              <div className={styles.subEventGrid}>
                {subEvents.map((subEvent) => (
                  <label key={subEvent.id} className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      checked={formData.selectedSubEvents.includes(subEvent.id)}
                      onChange={() => handleSubEventToggle(subEvent.id)}
                    />
                    <span className={styles.checkboxLabel}>
                      {subEvent.title}
                      {subEvent.date && (
                        <span className={styles.subEventDate}>
                          {subEvent.date}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.noSubEvents}>No sub-events available</p>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEditMode
                  ? "Update Guest"
                  : "Add Guest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestForm;
