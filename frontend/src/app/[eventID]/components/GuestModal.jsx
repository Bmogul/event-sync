"use client";

import styles from "../styles/portal.module.css";
import Select from "react-select";
import { useState, useEffect, useRef} from "react";
import { MdClose, MdEdit, MdAdd } from "react-icons/md";

import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GuestModal = ({
  currentGuest,
  isOpen,
  onClose,
  groups,
  subevents,
  guestList,
  eventID,
  eventPubID,
  updateGuestList,
  onDataRefresh,
  session,
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  
  // useState hooks
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
  const [updatedGuests, setUpdatedGuests] = useState([]);
  const [updatedGroups, setUpdatedGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);
  const [originalGuestRsvpStatus, setOriginalGuestRsvpStatus] = useState({});
  const [rsvpsToDelete, setRsvpsToDelete] = useState([]);

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
    guest_type_id: 1,
    guest_limit: null,
  };
  const [guestFormData, setGuestFormData] = useState(defaultGuest);

  // useRef hooks
  const guestFormRef = useRef(null);
  const reviewModalRef = useRef(null);
  const unsavedChangesModalRef = useRef(null);

  // useParams hook
  const params = useParams();

  // Helper functions needed by useEffect hooks
  const cancelPOCTransfer = () => {
    setShowPOCConfirmation(false);
    setPendingPOCChange(false);
  };

  const cancelSave = () => {
    setShowReviewModal(false);
    setPendingSaveAction(null);
  };

  // useEffect hooks
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showReviewModal) {
          cancelSave();
        } else if (showUnsavedChangesDialog) {
          setShowUnsavedChangesDialog(false);
        } else if (showPOCConfirmation) {
          cancelPOCTransfer();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showReviewModal, showUnsavedChangesDialog, showPOCConfirmation]);

  // Focus management for review modal
  useEffect(() => {
    if (showReviewModal && reviewModalRef.current) {
      const focusableElements = reviewModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [showReviewModal]);

  // Focus management for unsaved changes modal
  useEffect(() => {
    if (showUnsavedChangesDialog && unsavedChangesModalRef.current) {
      const focusableElements = unsavedChangesModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [showUnsavedChangesDialog]);

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
        // Store original RSVP status for tracking deletions
        setOriginalGuestRsvpStatus({ ...currentGuest.rsvp_status || {} });
      }
    } else {
      // Reset for new guests
      setOriginalGuestRsvpStatus({});
    }
  }, [currentGuest, groups, guestList]);

  // CONDITIONAL EARLY RETURN AFTER ALL HOOKS
  if (!isOpen || !currentGuest) return null;

  // Static data arrays (not hooks)
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

  const guestTypeOptions = [
    { value: 1, label: "single" },
    { value: 2, label: "multiple" },
    { value: 3, label: "variable" },
  ];

  // Focus trap for modals
  const handleModalKeyDown = (event, modalRef) => {
    if (event.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  };

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


  // Handle subevent checkbox change
  const handleSubeventChange = (subeventTitle, checked, subeventId) => {
    setGuestFormData((prev) => {
      const newRsvpStatus = { ...prev.rsvp_status };
      if (checked) {
        // Add invitation with default values
        newRsvpStatus[subeventTitle] = {
          subevent_id: subeventId,
          response: 0,
          status_id: 1,
          status_name: "pending",
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

    setUpdatedGroups((prev) => {
      const existingIndex = prev.findIndex((g) => g.id === groupWithTempId.id);
      if (existingIndex !== -1) {
        // Replace existing entry
        const updated = [...prev];
        updated[existingIndex] = groupWithTempId;
        return updated;
      } else {
        // Add new entry
        return [...prev, groupWithTempId];
      }
    });
  };

  // Function to calculate which RSVPs need to be deleted
  const calculateRsvpDeletions = (originalRsvps, currentRsvps, guestId) => {
    const deletions = [];
    
    // Find RSVPs that existed originally but are no longer in current
    Object.keys(originalRsvps).forEach(subeventTitle => {
      if (!currentRsvps[subeventTitle]) {
        // This RSVP was removed
        const originalRsvp = originalRsvps[subeventTitle];
        if (originalRsvp.subevent_id) {
          deletions.push({
            guest_id: guestId,
            subevent_id: originalRsvp.subevent_id
          });
        }
      }
    });
    
    return deletions;
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

    setUpdatedGuests((prev) => {
      const existingIndex = prev.findIndex((g) => g.id === modifiedGuest.id);
      if (existingIndex !== -1) {
        // Replace existing entry
        const updated = [...prev];
        updated[existingIndex] = modifiedGuest;
        return updated;
      } else {
        // Add new entry
        return [...prev, modifiedGuest];
      }
    });

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
    // Track RSVP deletions for existing guests that are being edited
    if (!isNewGuest && editingGuest && originalGuestRsvpStatus) {
      const deletions = calculateRsvpDeletions(
        originalGuestRsvpStatus,
        modifiedGuest.rsvp_status || {},
        modifiedGuest.id
      );
      
      if (deletions.length > 0) {
        setRsvpsToDelete(prev => {
          // Remove any existing deletions for this guest and add new ones
          const filtered = prev.filter(d => d.guest_id !== modifiedGuest.id);
          return [...filtered, ...deletions];
        });
      }
    }

    console.log("Modified Guest", modifiedGuest);
    console.log(groupsStaging);
    console.log(groupOptions);
  };

  // Check if there are unsaved changes in forms
  const hasUnsavedGuestChanges = () => {
    return showGuestForm && (editingGuest || 
      guestFormData.name || 
      guestFormData.email || 
      guestFormData.phone ||
      guestFormData.group_id ||
      Object.keys(guestFormData.rsvp_status || {}).length > 0
    );
  };

  const hasUnsavedGroupChanges = () => {
    return showCreateGroup && (newGroup.title || newGroup.details.description);
  };

  const handleSaveCurrentChanges = () => {
    // Save current guest if there are changes
    if (hasUnsavedGuestChanges()) {
      saveGuest(guestFormData);
      setShowGuestForm(false);
      setEditingGuest(null);
      setGuestFormData(defaultGuest);
    }
    
    // Save current group if there are changes
    if (hasUnsavedGroupChanges()) {
      createGroup(newGroup);
      setCreateGroup(false);
      setNewGroup(defaultGroup);
    }
    
    // Close dialogs
    setShowUnsavedChangesDialog(false);
    
    // Proceed with the pending save action
    if (pendingSaveAction === 'save') {
      setShowReviewModal(true);
    }
  };

  const handleDiscardChanges = () => {
    // Reset form states
    setShowGuestForm(false);
    setEditingGuest(null);
    setGuestFormData(defaultGuest);
    setCreateGroup(false);
    setNewGroup(defaultGroup);
    setShowUnsavedChangesDialog(false);
    
    // Proceed with the pending save action
    if (pendingSaveAction === 'save') {
      setShowReviewModal(true);
    }
  };

  const onSave = () => {
    // Check for unsaved changes
    if (hasUnsavedGuestChanges() || hasUnsavedGroupChanges()) {
      setPendingSaveAction('save');
      setShowUnsavedChangesDialog(true);
      return;
    }
    
    // No unsaved changes, proceed to review
    setShowReviewModal(true);
  };

  const confirmSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setShowReviewModal(false);
    
    try {
      console.log("SAVING", "GuestModal.jsx/onSave()");
      
      // Get auth token from session
      if (!session?.access_token) {
        toast.error('Authentication required. Please log in again.');
        setIsSaving(false);
        return;
      }
      
      const response = await fetch(`/api/${params.eventID}/guestList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          guestList: updatedGuests,
          groups: updatedGroups,
          event: { id: eventID },
          rsvpsToDelete: rsvpsToDelete
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.validated) {
        toast.success('Guest list updated successfully!');
        
        // Clear staging data
        setUpdatedGuests([]);
        setUpdatedGroups([]);
        setRsvpsToDelete([]);
        
        // Refresh data from server
        if (onDataRefresh) {
          await onDataRefresh();
        }
        
        // Close modal after successful save
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to update guest list');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
      setPendingSaveAction(null);
    }
  };

  return (
    <div className={styles.guestFormOverlay}>
      <div className={styles.guestFormModal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Guest Details</h3>
          <button className={styles.closeModal} onClick={onClose} aria-label="Close modal">
            <MdClose size={24} />
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
                <MdAdd size={18} /> Create New Group
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
                            setOriginalGuestRsvpStatus({ ...guest.rsvp_status || {} });
                            setShowGuestForm(true);

                            // Scroll to guest form section after state updates
                            setTimeout(() => {
                              guestFormRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                              });
                            }, 100);
                          }}
                          aria-label="Edit guest"
                        >
                          <MdEdit size={18} /> Edit
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
                  setOriginalGuestRsvpStatus({}); // Reset for new guest
                  setShowGuestForm(true);

                  // Scroll to guest form section after state updates
                  setTimeout(() => {
                    guestFormRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }, 100);
                }}
              >
                <MdAdd size={18} /> Add Guest
              </button>
            </div>
          )}

          {/* Guest Form */}
          {showGuestForm && (
            <div ref={guestFormRef} className={styles.formSectionGroup}>
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

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Guest Type</label>

                  <div style={{ maxWidth: "300px" }}>
                    <Select
                      classNamePrefix="react-select"
                      value={
                        guestTypeOptions.find(
                          (opt) => opt.value === guestFormData.guest_type_id,
                        ) || null
                      }
                      onChange={(selected) => {
                        setGuestFormData((prev) => ({
                          ...prev,
                          guest_type_id: selected?.value || null,
                          guest_limit: null, // Reset guest limit when changing type
                        }));
                      }}
                      options={guestTypeOptions}
                      placeholder="Select guest type..."
                      isClearable
                      isSearchable
                    />
                  </div>
                  <div
                    className={styles.fieldHelp}
                    style={{
                      marginBottom: "8px",
                      fontSize: "0.85em",
                      color: "#666",
                    }}
                  >
                    <strong>Single:</strong> Just one individual •{" "}
                    <strong>Multiple:</strong> Fixed number with dropdown •{" "}
                    <strong>Variable:</strong> Free-form entry
                  </div>
                </div>
                {/* Conditional Guest Limit Field */}
                {guestFormData.guest_type_id === 2 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Guest Limit</label>
                    <div style={{ maxWidth: "150px" }}>
                      <input
                        type="number"
                        className={styles.formInput}
                        min="1"
                        value={guestFormData.guest_limit || ""}
                        onChange={(e) => {
                          setGuestFormData((prev) => ({
                            ...prev,
                            guest_limit: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          }));
                        }}
                        placeholder="e.g. 4"
                      />
                    </div>
                    <div className={styles.fieldHelp}>
                      Maximum number of guests for this entry
                    </div>
                  </div>
                )}
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
                            checked={
                              !!guestFormData.rsvp_status[subevent.title]
                            }
                            onChange={(e) =>
                              handleSubeventChange(
                                subevent.title,
                                e.target.checked,
                                subevent.id
                              )
                            }
                          />
                          <span className={styles.checkboxText}>
                            {subevent.title}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className={styles.fieldHelp}>
                    Select which events this guest should be invited to
                  </div>
                </div>
              )}

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

              {/* Unsaved Changes Dialog */}
              {showUnsavedChangesDialog && (
                <div 
                  className={styles.confirmationOverlay}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="unsaved-changes-title"
                  aria-describedby="unsaved-changes-desc"
                >
                  <div 
                    className={styles.confirmationDialog}
                    ref={unsavedChangesModalRef}
                    onKeyDown={(e) => handleModalKeyDown(e, unsavedChangesModalRef)}
                  >
                    <h4 
                      className={styles.confirmationTitle}
                      id="unsaved-changes-title"
                    >
                      Unsaved Changes Detected
                    </h4>
                    <p 
                      className={styles.confirmationMessage}
                      id="unsaved-changes-desc"
                    >
                      You have unsaved changes in the current form. What would you like to do?
                    </p>
                    <div className={styles.confirmationActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => setShowUnsavedChangesDialog(false)}
                        aria-label="Cancel and return to form"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={handleDiscardChanges}
                        aria-label="Discard unsaved changes and proceed to review"
                      >
                        Discard Changes
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleSaveCurrentChanges}
                        aria-label="Save current changes and proceed to review"
                      >
                        Save & Continue
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
                    setOriginalGuestRsvpStatus({});
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
                    setOriginalGuestRsvpStatus({});
                  }}
                >
                  {editingGuest ? "Update Guest" : "Save Guest"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Review Changes Modal */}
        {showReviewModal && (
          <div 
            className={styles.confirmationOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            aria-describedby="review-modal-desc"
          >
            <div 
              className={styles.reviewModal}
              ref={reviewModalRef}
              onKeyDown={(e) => handleModalKeyDown(e, reviewModalRef)}
            >
              <div className={styles.confirmationContent}>
                <h4 
                  className={styles.confirmationTitle}
                  id="review-modal-title"
                >
                  Review Changes
                </h4>
                <p 
                  className={styles.confirmationMessage}
                  id="review-modal-desc"
                >
                  Please review the changes that will be saved:
                </p>
              </div>
              
              <div className={styles.reviewContent}>
                {/* Updated Groups */}
                {updatedGroups.length > 0 && (
                  <div className={styles.reviewSection}>
                    <h5 
                      className={styles.reviewSectionTitle}
                      id="groups-section"
                    >
                      Groups ({updatedGroups.length}):
                    </h5>
                    <ul 
                      className={styles.reviewList}
                      aria-labelledby="groups-section"
                    >
                      {updatedGroups.map((group, index) => (
                        <li key={group.id || index} className={styles.reviewItem}>
                          <strong>{group.title || 'Untitled Group'}</strong>
                          {group.id < 0 ? ' (New)' : ' (Updated)'}
                          {group.details?.description && (
                            <div className={styles.reviewSubtext}>
                              {group.details.description}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Updated Guests */}
                {updatedGuests.length > 0 && (
                  <div className={styles.reviewSection}>
                    <h5 
                      className={styles.reviewSectionTitle}
                      id="guests-section"
                    >
                      Guests ({updatedGuests.length}):
                    </h5>
                    <ul 
                      className={styles.reviewList}
                      aria-labelledby="guests-section"
                    >
                      {updatedGuests.map((guest, index) => (
                        <li key={guest.id || index} className={styles.reviewItem}>
                          <strong>{guest.name || 'Unnamed Guest'}</strong>
                          {guest.id < 0 ? ' (New)' : ' (Updated)'}
                          <div className={styles.reviewSubtext}>
                            {guest.email && `Email: ${guest.email}`}
                            {guest.phone && `, Phone: ${guest.phone}`}
                            {guest.point_of_contact && ', POC'}
                            {guest.group_id && (
                              `, Group: ${groupsStaging?.find(g => g.id === guest.group_id)?.title || 'Unknown'}`
                            )}
                          </div>
                          {Object.keys(guest.rsvp_status || {}).length > 0 && (
                            <div className={styles.reviewSubtext}>
                              Invited to: {Object.keys(guest.rsvp_status).join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* RSVP Deletions */}
                {rsvpsToDelete.length > 0 && (
                  <div className={styles.reviewSection}>
                    <h5 
                      className={styles.reviewSectionTitle}
                      id="rsvp-deletions-section"
                    >
                      RSVP Invitations to Remove ({rsvpsToDelete.length}):
                    </h5>
                    <ul 
                      className={styles.reviewList}
                      aria-labelledby="rsvp-deletions-section"
                    >
                      {rsvpsToDelete.map((rsvp, index) => {
                        const guest = guestlistStaging?.find(g => g.id === rsvp.guest_id);
                        const subevent = subevents?.find(s => s.id === rsvp.subevent_id);
                        return (
                          <li key={index} className={styles.reviewItem}>
                            <strong>{guest?.name || 'Unknown Guest'}</strong>
                            <div className={styles.reviewSubtext}>
                              Will no longer be invited to: {subevent?.title || 'Unknown Event'}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {updatedGroups.length === 0 && updatedGuests.length === 0 && rsvpsToDelete.length === 0 && (
                  <p 
                    className={styles.noChanges}
                    role="status"
                    aria-live="polite"
                  >
                    No changes to save.
                  </p>
                )}
                
                {/* Screen reader summary */}
                <div 
                  className={styles.srOnly}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {(updatedGroups.length > 0 || updatedGuests.length > 0 || rsvpsToDelete.length > 0) && (
                    (() => {
                      const parts = [];
                      if (updatedGroups.length > 0) {
                        parts.push(`${updatedGroups.length} group${updatedGroups.length === 1 ? '' : 's'}`);
                      }
                      if (updatedGuests.length > 0) {
                        parts.push(`${updatedGuests.length} guest${updatedGuests.length === 1 ? '' : 's'}`);
                      }
                      if (rsvpsToDelete.length > 0) {
                        parts.push(`${rsvpsToDelete.length} RSVP invitation${rsvpsToDelete.length === 1 ? '' : 's'} to remove`);
                      }
                      return `Ready to save ${parts.join(' and ')}`;
                    })()
                  )}
                </div>
              </div>
              
              <div className={styles.confirmationActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={cancelSave}
                  aria-label="Cancel save operation and return to modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={confirmSave}
                  disabled={isSaving}
                  aria-label={isSaving ? 'Currently saving changes to server' : 'Confirm and save all changes to server'}
                >
                  {isSaving ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestModal;
