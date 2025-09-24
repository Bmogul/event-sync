"use client";

import styles from "../styles/portal.module.css";
import Select from "react-select";
import { useState, useEffect } from "react";

const GuestModal = ({
  currentGuest,
  isOpen,
  onClose,
  groups,
  subevents,
  guestList,
  eventID,
  updateGuestList
}) => {
  if (!isOpen || !currentGuest) return null;

  const [groupOptions, setGroupOptions] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setCreateGroup] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [showPOCConfirmation, setShowPOCConfirmation] = useState(false);
  const [pendingPOCChange, setPendingPOCChange] = useState(false);

  const defaultGroup = {
    details: {
      description: "",
    },
    event_id: null,
    id: null,
    size_limit: -1,
    status_id: 2,
    title: "",
  };
  const [newGroup, setNewGroup] = useState(defaultGroup);
  const [guestlistStaging, setguestlistStaging] = useState(null);
  const [groupsStaging, setGroupsStaging] = useState(null);

  const defaultGuest = {
    name: "",
    email: "",
    phone: "",
    gender_id: null,
    age_group_id: null,
    tag: "",
    point_of_contact: false,
    group_id: null,
    id: null,
    rsvp_status: {},
  };
  const [guestFormData, setGuestFormData] = useState(defaultGuest);

  const genderOptions = [
    { value: 1, label: "Male" },
    { value: 2, label: "Female" },
    { value: 3, label: "Other/Prefer not to say" },
    { value: 4, label: "Not specified" },
  ];

  const ageGroupOptions = [
    { value: 1, label: "Infant (0-2 years)" },
    { value: 2, label: "Child (3-12 years)" },
    { value: 3, label: "Teenager (13-17 years)" },
    { value: 4, label: "Adult (18-64 years)" },
    { value: 5, label: "Senior (65+ years)" },
    { value: 6, label: "Age not specified" },
  ];

  // Load the current guest's group when modal opens
  useEffect(() => {
    if (groups) {
      setGroupsStaging([...groups]);
      setGroupOptions(
        groups.map((group) => ({
          value: group.id,
          label: group.title,
        })),
      );
    }
    if (guestList) {
      setguestlistStaging([...guestList]);
    }
    if (currentGuest && currentGuest.group_id) {
      const guestGroup = groups.find((g) => g.id === currentGuest.group_id);
      if (guestGroup) {
        setSelectedGroup(guestGroup);
        setShowGuestForm(true);
        setEditingGuest(true);
        setGuestFormData({ ...currentGuest });
      }
    }
  }, [currentGuest, groups, guestList]);

  // Helper function to find POC in a group
  const getGroupPOC = (groupId) => {
    return guestlistStaging?.find(
      (g) => g.group_id === groupId && g.point_of_contact === true,
    );
  };

  // Handle POC checkbox change with confirmation logic
  const handlePOCChange = (checked) => {
    if (!checked) {
      // If unchecking POC, no confirmation needed
      setGuestFormData((prev) => ({
        ...prev,
        point_of_contact: false,
      }));
      return;
    }

    // If checking POC, check if there's already a POC in this group
    const groupId = guestFormData.group_id;
    const existingPOC = getGroupPOC(groupId);

    // If no existing POC or the existing POC is this same guest, set directly
    if (!existingPOC || existingPOC.id === guestFormData.id) {
      setGuestFormData((prev) => ({
        ...prev,
        point_of_contact: true,
      }));
    } else {
      // There's another POC, show confirmation
      setPendingPOCChange(true);
      setShowPOCConfirmation(true);
    }
  };

  // Confirm POC transfer
  const confirmPOCTransfer = () => {
    setGuestFormData((prev) => ({
      ...prev,
      point_of_contact: true,
    }));
    setShowPOCConfirmation(false);
    setPendingPOCChange(false);
  };

  // Cancel POC transfer
  const cancelPOCTransfer = () => {
    setShowPOCConfirmation(false);
    setPendingPOCChange(false);
  };

  // Handle subevent checkbox change
  const handleSubeventChange = (subeventTitle, checked) => {
    setGuestFormData((prev) => {
      const newRsvpStatus = { ...prev.rsvp_status };
      if (checked) {
        // Add invitation with default values
        newRsvpStatus[subeventTitle] = {
          response: 0,
          status_id: 1,
          status_name: "pending"
        };
      } else {
        // Remove invitation
        delete newRsvpStatus[subeventTitle];
      }
      return { ...prev, rsvp_status: newRsvpStatus };
    });
  };

  const createGroup = (group) => {
    // Generate temporary negative ID for new groups
    const tempId = -Date.now();
    console.log("EVENT DATA", eventID, subevents);
    const groupWithTempId = { ...group, id: tempId };
    groupWithTempId.event_id = eventID;
    console.log("new group", groupWithTempId);
    const newGroupOption = { value: tempId, label: group.title };

    setGroupsStaging((prev) => [...prev, groupWithTempId]);
    setGroupOptions((prev) => [...prev, newGroupOption]);

    setSelectedGroup(groupWithTempId);
  };

  const saveGuest = (guest) => {
    // Determine if this is a new guest or existing guest
    const isNewGuest = !guest.id; // Only truly new if no ID at all

    let modifiedGuest;

    if (isNewGuest) {
      // For brand new guests: assign temp ID and use form's selected group
      modifiedGuest = {
        ...guest,
        id: -Date.now(), // Generate new temporary ID
        group_id: guest.group_id || null, // Use group from form
      };
    } else {
      // For existing guests (real ID or temp ID): preserve the existing ID
      modifiedGuest = {
        ...guest,
        id: guest.id, // ALWAYS preserve existing ID (real or temp)
        group_id: guest.group_id || null, // Use group from form
      };
    }

    setguestlistStaging((prev) => {
      let updated = [...prev];

      // If this guest is becoming POC, remove POC from other guests in the same group
      if (modifiedGuest.point_of_contact) {
        updated = updated.map((g) =>
          g.group_id === modifiedGuest.group_id && g.id !== modifiedGuest.id
            ? { ...g, point_of_contact: false }
            : g,
        );
      }

      const existingIndex = updated.findIndex((g) => g.id === modifiedGuest.id);
      if (existingIndex !== -1) {
        // Update existing guest (works for both real IDs and temp IDs)
        updated[existingIndex] = modifiedGuest;
        return updated;
      } else {
        // Add new guest (only for truly new guests with no ID)
        return [...updated, modifiedGuest];
      }
    });

    if (guest.group_id !== selectedGroup.id) {
      console.log(
        "CHANGE STAGING",
        groupsStaging.find((item) => item.id === guest.group_id),
      );
      setSelectedGroup(
        groupsStaging.find((item) => item.id === guest.group_id),
      );
    }
    console.log("Modified Guest", modifiedGuest);
    console.log(groupsStaging);
    console.log(groupOptions);
  };

  const onSave = () => { 
    console.log("SAVING", "GuestModal.jsx/onSave()")
    updateGuestList(guestlistStaging, groupsStaging)
  };

  return (
    <div className={styles.guestFormOverlay}>
      <div className={styles.guestFormModal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Guest Details</h3>
          <button className={styles.closeModal} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Group Section */}
          <div className={styles.formSectionGroup}>
            <h4 className={styles.formSectionTitle}>Group Information</h4>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Group</label>
              <Select
                classNamePrefix="react-select"
                value={
                  selectedGroup
                    ? { value: selectedGroup.id, label: selectedGroup.title }
                    : null
                }
                onChange={(selected) => {
                  const group = groupsStaging.find(
                    (g) => g.id === selected?.value,
                  );
                  setSelectedGroup(group || null);
                }}
                options={groupOptions}
                placeholder="Search or select a group…"
                isClearable
                isSearchable
              />
              <div className={styles.fieldHelp}>
                Select an existing group or create a new one
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setCreateGroup(true)}
              >
                Create New Group
              </button>

              {/* Create New Group Fields */}
              {showCreateGroup && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Group Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Enter group name..."
                      value={newGroup.title}
                      onChange={(e) =>
                        setNewGroup((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Group Description
                    </label>
                    <textarea
                      className={styles.formInput}
                      placeholder="Enter group description..."
                      rows={3}
                      value={newGroup.details.description}
                      onChange={(e) =>
                        setNewGroup((prev) => ({
                          ...prev,
                          details: {
                            ...prev.details,
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => setCreateGroup(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => {
                        // Add create group logic here
                        createGroup(newGroup);
                        console.log("Creating new group", newGroup);
                        setCreateGroup(false);
                        setNewGroup(defaultGroup);
                      }}
                    >
                      Create Group
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Guests Section */}
          {selectedGroup && (
            <div className={styles.formSectionGroup}>
              <h4 className={styles.formSectionTitle}>Guests in Group</h4>
              <div className={styles.guestsGrid}>
                {guestlistStaging
                  ?.filter((g) => g.group_id === selectedGroup.id)
                  .map((guest) => (
                    <div key={guest.id} className={styles.guestCard}>
                      <div className={styles.guestInfo}>
                        <div className={styles.guestName}>
                          {guest.name}
                          {guest.point_of_contact && (
                            <span className={styles.pocBadge}> (POC)</span>
                          )}
                        </div>
                        <div className={styles.guestDetails}>
                          {guest.email}
                          {guest.phone && ` • ${guest.phone}`}
                        </div>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnGhost} ${styles.btnIcon}`}
                          onClick={() => {
                            setEditingGuest(guest);
                            setGuestFormData(guest);
                            setShowGuestForm(true);
                          }}
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  )) || (
                    <div className={styles.noGuests}>No guests in this group</div>
                  )}
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  setEditingGuest(null);
                  // Check if group has existing POC to set default
                  const existingPOC = getGroupPOC(selectedGroup.id);
                  setGuestFormData({
                    ...defaultGuest,
                    group_id: selectedGroup.id,
                    point_of_contact: !existingPOC, // Default to POC if no one else is
                  });
                  setShowGuestForm(true);
                }}
              >
                Add Guest
              </button>
            </div>
          )}

          {/* Guest Form */}
          {showGuestForm && (
            <div className={styles.formSectionGroup}>
              <h4 className={styles.formSectionTitle}>
                {editingGuest ? "Edit Guest" : "Add New Guest"}
              </h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={guestFormData.name || ""}
                    onChange={(e) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Group</label>
                  <Select
                    classNamePrefix="react-select"
                    value={
                      groupOptions?.find(
                        (opt) => opt.value === guestFormData.group_id,
                      ) || null
                    }
                    onChange={(selected) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        group_id: selected?.value || null,
                      }));
                    }}
                    options={groupOptions}
                    placeholder="Select a group..."
                    isClearable
                    isSearchable
                  />
                  <div className={styles.fieldHelp}>
                    Choose which group this guest belongs to
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={guestFormData.email || ""}
                    onChange={(e) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }));
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    value={guestFormData.phone || ""}
                    onChange={(e) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }));
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gender</label>
                  <Select
                    classNamePrefix="react-select"
                    value={
                      genderOptions.find(
                        (opt) => opt.value === guestFormData.gender_id,
                      ) || null
                    }
                    onChange={(selected) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        gender_id: selected?.value || null,
                      }));
                    }}
                    options={genderOptions}
                    placeholder="Select gender..."
                    isClearable
                    isSearchable
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Age Group</label>
                  <Select
                    classNamePrefix="react-select"
                    value={
                      ageGroupOptions.find(
                        (opt) => opt.value === guestFormData.age_group_id,
                      ) || null
                    }
                    onChange={(selected) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        age_group_id: selected?.value || null,
                      }));
                    }}
                    options={ageGroupOptions}
                    placeholder="Select age group..."
                    isClearable
                    isSearchable
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tag/Side</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={guestFormData.tag || ""}
                    onChange={(e) => {
                      setGuestFormData((prev) => ({
                        ...prev,
                        tag: e.target.value,
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Point of Contact Section */}
              <div className={styles.pointOfContactSection}>
                <label className={styles.pointOfContactLabel}>
                  <input
                    type="checkbox"
                    checked={guestFormData.point_of_contact || false}
                    onChange={(e) => handlePOCChange(e.target.checked)}
                  />
                  Point of Contact
                </label>
                <div className={styles.pointOfContactHelp}>
                  Point of contact receives important updates and can help
                  coordinate with their group
                </div>
              </div>

              {/* Subevent Invitations Section */}
              {subevents && subevents.length > 0 && (
                <div className={styles.formSectionGroup}>
                  <h4 className="">Event Invitations</h4>
                  <div className={styles.formGrid}>
                    {subevents.map((subevent) => (
                      <div key={subevent.id} className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={!!guestFormData.rsvp_status[subevent.title]}
                            onChange={(e) => handleSubeventChange(subevent.title, e.target.checked)}
                          />
                          <span className={styles.checkboxText}>{subevent.title}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className={styles.fieldHelp}>
                    Select which events this guest should be invited to
                  </div>
                </div>
              )}
              {showPOCConfirmation && (
                <div className={styles.confirmationOverlay}>
                  <div className={styles.confirmationDialog}>
                    <h4 className={styles.confirmationTitle}>
                      Transfer Point of Contact?
                    </h4>
                    <p className={styles.confirmationMessage}>
                      Another guest in this group is already the Point of
                      Contact. Making this guest the POC will remove POC status
                      from the other guest.
                      <br />
                      <br />
                      Do you want to proceed?
                    </p>
                    <div className={styles.confirmationActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={cancelPOCTransfer}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={confirmPOCTransfer}
                      >
                        Transfer POC
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => {
                    setShowGuestForm(false);
                    setEditingGuest(null);
                    setGuestFormData(defaultGuest);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    // Add save guest logic here
                    //
                    saveGuest(guestFormData);
                    console.log(
                      editingGuest ? "Updating guest" : "Creating guest",
                      guestFormData,
                    );
                    setShowGuestForm(false);
                    setEditingGuest(null);
                    setGuestFormData(defaultGuest);
                  }}
                >
                  {editingGuest ? "Update Guest" : "Save Guest"}
                </button>
              </div>
            </div>
          )}

          {/* POC Confirmation Dialog */}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestModal;
