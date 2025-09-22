"use client";

import styles from "../styles/portal.module.css";
import Select from "react-select";
import { useState } from "react";

const GuestModal = ({ currentGuest, isOpen, onClose, groups, subevents, guestList }) => {
  if (!isOpen || !currentGuest) return null;

  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.title,
  }));
  const [guest, setGuest] = useState({ ...currentGuest });
  const [showCreateGroup, setCreateGroup] = useState(false);
  const defaultGroup = {
    details: {
      description: "",
    },
    event_id: null,
    size_limit: -1,
    status_id: 2,
    title: "",
  };
  const [newGroup, setNewGroup] = useState(defaultGroup);

  const genderOptions = [
    { value: 1, label: 'Male' },
    { value: 2, label: 'Female' },
    { value: 3, label: 'Other/Prefer not to say' },
    { value: 4, label: 'Not specified' }
  ];

  const ageGroupOptions = [
    { value: 1, label: 'Infant (0-2 years)' },
    { value: 2, label: 'Child (3-12 years)' },
    { value: 3, label: 'Teenager (13-17 years)' },
    { value: 4, label: 'Adult (18-64 years)' },
    { value: 5, label: 'Senior (65+ years)' },
    { value: 6, label: 'Age not specified' }
  ];

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
              <label className={styles.formLabel}>Group</label>
              <Select
                classNamePrefix="react-select"
                value={
                  groupOptions.find((opt) => opt.value === guest.group_id) ||
                  null
                }
                onChange={(selected, actionMeta) => {
                  if (actionMeta.action === "clear") {
                    // Revert to the original group_id from currentGuest
                    setGuest((prev) => ({
                      ...prev,
                      group_id: currentGuest.group_id,
                    }));
                  } else {
                    // Normal selection change
                    setGuest((prev) => ({
                      ...prev,
                      group_id: selected?.value || null,
                    }));
                  }
                }}
                options={groupOptions}
                placeholder="Search or select a group…"
                isClearable
                isSearchable
              />
              <div className={styles.fieldHelp}>
                The group this guest belongs to
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  // Add new group functionality here
                  console.log("Add new group clicked");
                  setCreateGroup(true);
                }}
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
                        console.log("Creating new group");
                        setCreateGroup(false);
                      }}
                    >
                      Create Group
                    </button>
                  </div>
                </>
              )}

              {/* Other Guests in Group */}
              {guest.group_id && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Other Guests in Group</label>
                  <div className={styles.guestsList}>
                    {guestList
                      ?.filter(
                        (g) => 
                          g.group_id === guest.group_id && 
                          g.id !== currentGuest.id
                      )
                      .map((otherGuest) => (
                        <div key={otherGuest.id} className={styles.guestItem}>
                          <div className={styles.guestName}>
                            {otherGuest.name}
                            {otherGuest.point_of_contact && (
                              <span className={styles.pocBadge}> (POC)</span>
                            )}
                          </div>
                          <div className={styles.guestDetails}>
                            {otherGuest.email}
                            {otherGuest.phone && ` • ${otherGuest.phone}`}
                          </div>
                        </div>
                      )) || <div className={styles.noGuests}>No other guests in this group</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSectionGroup}>
            <h4 className={styles.formSectionTitle}>Guest Information</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={guest.name || ""}
                  onChange={(e) => {
                    setGuest((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={guest.email || ""}
                  onChange={(e) => {
                    setGuest((prev) => ({
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
                  value={guest.phone || ""}
                  onChange={(e) => {
                    setGuest((prev) => ({
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
                    genderOptions.find((opt) => opt.value === guest.gender_id) ||
                    null
                  }
                  onChange={(selected) => {
                    setGuest((prev) => ({
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
                    ageGroupOptions.find((opt) => opt.value === guest.age_group_id) ||
                    null
                  }
                  onChange={(selected) => {
                    setGuest((prev) => ({
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
                  value={guest.tag || ""}
                  onChange={(e) => {
                    setGuest((prev) => ({
                      ...prev,
                      tag: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Point of Contact Section */}
          <div className={styles.pointOfContactSection}>
            <label className={styles.pointOfContactLabel}>
              <input
                type="checkbox"
                checked={guest.point_of_contact || false}
                readOnly
                disabled
              />
              Point of Contact
            </label>
            <div className={styles.pointOfContactHelp}>
              Point of contact receives important updates and can help
              coordinate with their group
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestModal;
