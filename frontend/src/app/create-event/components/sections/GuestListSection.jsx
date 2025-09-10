import { useState } from "react";
import { toast } from "react-toastify";
import styles from "./GuestListSection.module.css";

const GuestListSection = ({
  eventData,
  updateEventData,
  onNext,
  onPrevious,
  isLoading,
}) => {
  // Form states
  const [addMode, setAddMode] = useState("individual"); // 'individual' or 'group'
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    tag: "",
    subEventRSVPs: {},
    isPointOfContact: false,
  });
  const [newGroup, setNewGroup] = useState({
    name: "",
    members: [],
  });
  const [tempGroupMembers, setTempGroupMembers] = useState([]);
  const [editingMemberIndex, setEditingMemberIndex] = useState(-1);
  const [importMethod, setImportMethod] = useState("manual"); // 'manual' or 'upload'
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  // Color palette for groups
  const groupColors = [
    "#7c3aed",
    "#059669",
    "#dc2626",
    "#d97706",
    "#0891b2",
    "#9333ea",
    "#16a34a",
    "#ea580c",
  ];

  // Statistics calculations
  const totalGuests = eventData.guests?.length || 0;
  const totalGroups = eventData.guestGroups?.length || 0;

  // Get default sub-events if not defined
  const getSubEvents = () => {
    return (
      eventData.subEvents || [
        { id: "welcome-dinner", name: "Welcome Dinner" },
        { id: "main-ceremony", name: "Main Ceremony" },
        { id: "reception", name: "Reception" },
        { id: "farewell-brunch", name: "Farewell Brunch" },
      ]
    );
  };

  const subEvents = getSubEvents();

  // Calculate guests per sub-event
  const getSubEventGuestCount = (subEventId) => {
    return (
      eventData.guests?.filter(
        (guest) => guest.subEventRSVPs?.[subEventId] === "invited",
      ).length || 0
    );
  };

  // Handle adding member to temp group list
  const handleAddMemberToGroup = () => {
    if (!newGuest.name.trim()) {
      toast.error("Member name is required", { position: "top-center" });
      return;
    }

    if (!newGuest.email.trim()) {
      toast.error("Member email is required", { position: "top-center" });
      return;
    }

    const memberData = {
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || "",
      gender: newGuest.gender || "",
      tag: newGuest.tag || "",
      subEventRSVPs: { ...newGuest.subEventRSVPs },
      isPointOfContact: newGuest.isPointOfContact || false,
    };

    if (editingMemberIndex >= 0) {
      const updatedMembers = [...tempGroupMembers];
      updatedMembers[editingMemberIndex] = memberData;
      setTempGroupMembers(updatedMembers);
      setEditingMemberIndex(-1);
      toast.success("Member updated!", {
        position: "top-center",
        autoClose: 1500,
      });
    } else {
      setTempGroupMembers([...tempGroupMembers, memberData]);
      toast.success("Member added to group!", {
        position: "top-center",
        autoClose: 1500,
      });
    }

    // Reset form
    setNewGuest({
      name: "",
      email: "",
      phone: "",
      gender: "",
      tag: "",
      subEventRSVPs: {},
      isPointOfContact: false,
    });
  };

  // Handle editing a member in temp list
  const handleEditMember = (index) => {
    const member = tempGroupMembers[index];
    setNewGuest({
      name: member.name,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      tag: member.tag,
      subEventRSVPs: { ...member.subEventRSVPs },
      isPointOfContact: member.isPointOfContact,
    });
    setEditingMemberIndex(index);
  };

  // Handle removing a member from temp list
  const handleRemoveMember = (index) => {
    setTempGroupMembers(tempGroupMembers.filter((_, i) => i !== index));
    if (editingMemberIndex === index) {
      setEditingMemberIndex(-1);
      setNewGuest({
        name: "",
        email: "",
        phone: "",
        gender: "",
        tag: "",
        subEventRSVPs: {},
        isPointOfContact: false,
      });
    }
    toast.success("Member removed from group", {
      position: "top-center",
      autoClose: 1500,
    });
  };

  // Handle creating the entire group
  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error("Group name is required", { position: "top-center" });
      return;
    }

    if (tempGroupMembers.length === 0) {
      toast.error("Please add at least one member to the group", {
        position: "top-center",
      });
      return;
    }

    const pointOfContacts = tempGroupMembers.filter(
      (member) => member.isPointOfContact,
    );
    if (pointOfContacts.length === 0) {
      toast.error("Please select at least one member as point of contact", {
        position: "top-center",
      });
      return;
    }

    const groupId = Date.now();
    const groupColor =
      groupColors[(eventData.guestGroups?.length || 0) % groupColors.length];

    const newGroupData = {
      id: groupId,
      event_id: eventData.id || null,
      title: newGroup.name,
      size: tempGroupMembers.length,
      invite_sent_at: null,
      invite_sent_by: null,
      status: "draft",
      details: {
        color: groupColor,
        description: "Family/Group",
      },
      point_of_contact: null,
    };

    const newGuests = tempGroupMembers.map((member, index) => {
      const guestId = Date.now() + index;
      if (member.isPointOfContact && !newGroupData.point_of_contact) {
        newGroupData.point_of_contact = guestId;
      }

      return {
        id: guestId,
        order: index + 1,
        name: member.name,
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        tag: member.tag,
        group: newGroup.name,
        rsvpStatus: "pending",
        plusOne: false,
        subEventRSVPs: member.subEventRSVPs,
        invitedAt: null,
        respondedAt: null,
      };
    });

    updateEventData({
      guests: [...(eventData.guests || []), ...newGuests],
      guestGroups: [...(eventData.guestGroups || []), newGroupData],
    });

    // Reset all forms
    setNewGroup({ name: "", members: [] });
    setTempGroupMembers([]);
    setNewGuest({
      name: "",
      email: "",
      phone: "",
      gender: "",
      tag: "",
      subEventRSVPs: {},
      isPointOfContact: false,
    });
    setEditingMemberIndex(-1);
    setShowGuestForm(false);

    toast.success(
      `Group "${newGroup.name}" created with ${tempGroupMembers.length} members!`,
      {
        position: "top-center",
        autoClose: 3000,
      },
    );
  };

  // Handle adding a new individual guest
  const handleAddIndividualGuest = () => {
    if (!newGuest.name.trim()) {
      toast.error("Guest name is required", { position: "top-center" });
      return;
    }

    if (!newGuest.email.trim()) {
      toast.error("Guest email is required", { position: "top-center" });
      return;
    }

    const groupTitle = `${newGuest.name} (Individual)`;
    const groupId = Date.now();
    const updatedGroups = [...(eventData.guestGroups || [])];

    const individualGroup = {
      id: groupId,
      event_id: eventData.id || null,
      title: groupTitle,
      size: 1,
      invite_sent_at: null,
      invite_sent_by: null,
      status: "draft",
      details: {
        color: groupColors[updatedGroups.length % groupColors.length],
        description: "Individual guest",
      },
      point_of_contact: null,
    };
    updatedGroups.push(individualGroup);

    const guestId = Date.now() + Math.random();
    const guest = {
      id: guestId,
      order:
        (eventData.guests?.filter((g) => g.group === groupTitle).length || 0) +
        1,
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || "",
      gender: newGuest.gender || "",
      tag: newGuest.tag || "",
      group: groupTitle,
      rsvpStatus: "pending",
      plusOne: false,
      subEventRSVPs: newGuest.subEventRSVPs,
      invitedAt: null,
      respondedAt: null,
    };

    const groupToUpdate = updatedGroups.find((g) => g.id === groupId);
    if (groupToUpdate) {
      groupToUpdate.point_of_contact = guestId;
    }

    updateEventData({
      guests: [...(eventData.guests || []), guest],
      guestGroups: updatedGroups,
    });

    setNewGuest({
      name: "",
      email: "",
      phone: "",
      gender: "",
      tag: "",
      subEventRSVPs: {},
      isPointOfContact: false,
    });
    setShowGuestForm(false);
    toast.success("Individual guest added successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Handle removing a guest
  const handleRemoveGuest = (guestId) => {
    const guest = eventData.guests?.find((g) => g.id === guestId);
    if (!guest) return;

    const updatedGuests = eventData.guests.filter((g) => g.id !== guestId);
    let updatedGroups = [...(eventData.guestGroups || [])];

    const group = updatedGroups.find((g) => g.title === guest.group);
    if (group) {
      group.size = (group.size || 1) - 1;

      if (group.size <= 0) {
        updatedGroups = updatedGroups.filter((g) => g.id !== group.id);
      } else if (group.point_of_contact === guestId) {
        const remainingGroupMembers = updatedGuests.filter(
          (g) => g.group === group.title,
        );
        if (remainingGroupMembers.length > 0) {
          group.point_of_contact = remainingGroupMembers[0].id;
        }
      }
    }

    updateEventData({
      guests: updatedGuests,
      guestGroups: updatedGroups,
    });

    toast.success("Guest removed successfully", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Handle editing a guest
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setAddMode("individual"); // Always edit as individual for simplicity

    setNewGuest({
      name: guest.name,
      email: guest.email,
      phone: guest.phone || "",
      gender: guest.gender || "",
      tag: guest.tag || "",
      subEventRSVPs: guest.subEventRSVPs || {},
      isPointOfContact: false,
    });
    setShowGuestForm(true);
  };

  // Handle saving edited guest
  const handleSaveEdit = () => {
    if (!editingGuest) return;
    handleRemoveGuest(editingGuest.id);
    handleAddIndividualGuest();
    setEditingGuest(null);
  };

  // Handle updating sub-event RSVP
  const handleUpdateSubEventRSVP = (guestId, subEventId, isInvited) => {
    const updatedGuests =
      eventData.guests?.map((guest) => {
        if (guest.id === guestId) {
          const updatedRSVPs = { ...guest.subEventRSVPs };
          if (isInvited) {
            updatedRSVPs[subEventId] = "invited";
          } else {
            delete updatedRSVPs[subEventId];
          }
          return { ...guest, subEventRSVPs: updatedRSVPs };
        }
        return guest;
      }) || [];

    updateEventData({ guests: updatedGuests });
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    toast.info(`Processing file: ${file.name}...`, {
      position: "top-center",
      autoClose: 3000,
    });

    setTimeout(() => {
      toast.success("File upload functionality coming soon!", {
        position: "top-center",
      });
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (eventData.guests?.length === 0) {
      toast.error("Please add at least one guest to continue", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    toast.success("Guest list configured successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
    onNext();
  };

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>👥</div>
        <div>
          <h2 className={styles.sectionTitle}>Guest List</h2>
          <p className={styles.sectionDescription}>
            Add your guests and organize them into groups. Groups are
            automatically created based on your selection.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{totalGuests}</div>
          <div className={styles.statLabel}>Total Guests</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{totalGroups}</div>
          <div className={styles.statLabel}>Total Groups</div>
        </div>
        {subEvents.map((subEvent) => (
          <div key={subEvent.id} className={styles.statCard}>
            <div className={styles.statNumber}>
              {getSubEventGuestCount(subEvent.id)}
            </div>
            <div className={styles.statLabel}>{subEvent.name}</div>
          </div>
        ))}
      </div>

      {/* Add Guest Options */}
      <div className={styles.addGuestSection}>
        <div className={styles.subsectionHeader}>
          <h3 className={styles.subsectionTitle}>Add Guests</h3>
        </div>

        <div className={styles.importMethods}>
          <div
            className={`${styles.importCard} ${importMethod === "upload" ? styles.active : ""}`}
            onClick={() => setImportMethod("upload")}
          >
            <div className={styles.importIcon}>📤</div>
            <div className={styles.importTitle}>Import from Spreadsheet</div>
            <div className={styles.importDescription}>
              Upload a CSV or Excel file with your guest information
            </div>
          </div>
          <div
            className={`${styles.importCard} ${importMethod === "manual" ? styles.active : ""}`}
            onClick={() => setImportMethod("manual")}
          >
            <div className={styles.importIcon}>✏️</div>
            <div className={styles.importTitle}>Add Manually</div>
            <div className={styles.importDescription}>
              Enter guest details and create groups automatically
            </div>
          </div>
        </div>

        {/* Upload Section */}
        {importMethod === "upload" && (
          <div className={styles.uploadSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Upload Guest List</label>
              <input
                type="file"
                className={styles.formInput}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <div className={styles.fieldHelp}>
                Expected format: Name, Email, Phone, Gender, Tag, Group,
                [Sub-Event Names]
                <br />
                Leave Group empty for individual guests, or use same Group name
                for families
              </div>
            </div>
          </div>
        )}

        {/* Manual Add Options */}
        {importMethod === "manual" && (
          <div className={styles.manualAddSection}>
            <div className={styles.addButtonsContainer}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  setAddMode("individual");
                  setShowGuestForm(true);
                }}
              >
                Add Individual Guest
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  setAddMode("group");
                  setShowGuestForm(true);
                }}
              >
                Create Group & Add Members
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guest Form Modal */}
      {showGuestForm && (
        <div className={styles.guestFormOverlay}>
          <div className={styles.guestFormModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingGuest
                  ? "Edit Guest"
                  : addMode === "group"
                    ? "Create Group & Add Members"
                    : "Add Individual Guest"}
              </h3>

              <button
                className={styles.closeModal}
                onClick={() => {
                  setShowGuestForm(false);
                  setEditingGuest(null);
                  setNewGuest({
                    name: "",
                    email: "",
                    phone: "",
                    gender: "",
                    tag: "",
                    subEventRSVPs: {},
                    isPointOfContact: false,
                  });
                  setNewGroup({ name: "", members: [] });
                  setTempGroupMembers([]);
                  setEditingMemberIndex(-1);
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalContent}>
              {addMode === "individual" ? (
                <>
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Guest Information
                    </h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Full Name *</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={newGuest.name}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, name: e.target.value })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email *</label>
                        <input
                          type="email"
                          className={styles.formInput}
                          value={newGuest.email}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, email: e.target.value })
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Phone</label>
                        <input
                          type="tel"
                          className={styles.formInput}
                          value={newGuest.phone}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, phone: e.target.value })
                          }
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Gender</label>
                        <select
                          className={styles.formSelect}
                          value={newGuest.gender}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, gender: e.target.value })
                          }
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tag/Side</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={newGuest.tag}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, tag: e.target.value })
                          }
                          placeholder="e.g., Bride's Side, College Friend"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub-Event Selection */}
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Sub-Event Invitations
                    </h4>
                    <div className={styles.subEventGrid}>
                      {subEvents.map((subEvent) => (
                        <label
                          key={subEvent.id}
                          className={styles.checkboxOption}
                        >
                          <input
                            type="checkbox"
                            checked={
                              newGuest.subEventRSVPs[subEvent.id] === "invited"
                            }
                            onChange={(e) => {
                              const updated = { ...newGuest.subEventRSVPs };
                              if (e.target.checked) {
                                updated[subEvent.id] = "invited";
                              } else {
                                delete updated[subEvent.id];
                              }
                              setNewGuest({
                                ...newGuest,
                                subEventRSVPs: updated,
                              });
                            }}
                          />
                          <span>{subEvent.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>Group Details</h4>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Group Name *</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newGroup.name}
                        onChange={(e) =>
                          setNewGroup({ ...newGroup, name: e.target.value })
                        }
                        placeholder="e.g., Smith Family, College Friends"
                      />
                    </div>
                  </div>

                  {/* Member Addition Form */}
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Add Group Members
                    </h4>

                    <div className={styles.memberForm}>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Name *</label>
                          <input
                            type="text"
                            className={styles.formInput}
                            value={newGuest.name}
                            onChange={(e) =>
                              setNewGuest({ ...newGuest, name: e.target.value })
                            }
                            placeholder="Member name"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Email *</label>
                          <input
                            type="email"
                            className={styles.formInput}
                            value={newGuest.email}
                            onChange={(e) =>
                              setNewGuest({
                                ...newGuest,
                                email: e.target.value,
                              })
                            }
                            placeholder="member@example.com"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Phone</label>
                          <input
                            type="tel"
                            className={styles.formInput}
                            value={newGuest.phone}
                            onChange={(e) =>
                              setNewGuest({
                                ...newGuest,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Gender</label>
                          <select
                            className={styles.formSelect}
                            value={newGuest.gender}
                            onChange={(e) =>
                              setNewGuest({
                                ...newGuest,
                                gender: e.target.value,
                              })
                            }
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Tag/Side</label>
                          <input
                            type="text"
                            className={styles.formInput}
                            value={newGuest.tag}
                            onChange={(e) =>
                              setNewGuest({ ...newGuest, tag: e.target.value })
                            }
                            placeholder="e.g., Bride's Side"
                          />
                        </div>
                      </div>

                      <div className={styles.memberFormActions}>
                        <div className={styles.formGroup}>
                          <label className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={newGuest.isPointOfContact}
                              onChange={(e) =>
                                setNewGuest({
                                  ...newGuest,
                                  isPointOfContact: e.target.checked,
                                })
                              }
                            />
                            <span>Point of Contact</span>
                          </label>
                        </div>
                        {/* Sub-Event Selection for Group */}
                        <div className={styles.formSectionGroup}>
                          <h4 className={styles.formSectionTitle}>
                            Sub-Event Invitations
                          </h4>
                          <div className={styles.subEventGrid}>
                            {subEvents.map((subEvent) => (
                              <label
                                key={subEvent.id}
                                className={styles.checkboxOption}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    newGuest.subEventRSVPs[subEvent.id] ===
                                    "invited"
                                  }
                                  onChange={(e) => {
                                    const updated = {
                                      ...newGuest.subEventRSVPs,
                                    };
                                    if (e.target.checked) {
                                      updated[subEvent.id] = "invited";
                                    } else {
                                      delete updated[subEvent.id];
                                    }
                                    setNewGuest({
                                      ...newGuest,
                                      subEventRSVPs: updated,
                                    });
                                  }}
                                />
                                <span>{subEvent.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={handleAddMemberToGroup}
                        >
                          {editingMemberIndex >= 0
                            ? "Update Member"
                            : "Add to Group"}
                        </button>
                      </div>
                    </div>

                    {/* Members List */}
                    {tempGroupMembers.length > 0 && (
                      <div className={styles.membersList}>
                        <h5 className={styles.membersListTitle}>
                          Group Members ({tempGroupMembers.length})
                        </h5>
                        {tempGroupMembers.map((member, index) => (
                          <div key={index} className={styles.memberCard}>
                            <div className={styles.memberInfo}>
                              <div className={styles.memberName}>
                                {member.name}
                                {member.isPointOfContact && (
                                  <span className={styles.pocBadge}>POC</span>
                                )}
                              </div>
                              <div className={styles.memberDetails}>
                                {member.email} • {member.phone || "No phone"} •{" "}
                                {member.gender || "No gender"}
                              </div>
                              {member.tag && (
                                <div className={styles.memberTag}>
                                  {member.tag}
                                </div>
                              )}
                            </div>
                            <div className={styles.memberActions}>
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnGhost} ${styles.btnXs}`}
                                onClick={() => handleEditMember(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger} ${styles.btnXs}`}
                                onClick={() => handleRemoveMember(index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  setShowGuestForm(false);
                  setEditingGuest(null);
                  setNewGuest({
                    name: "",
                    email: "",
                    phone: "",
                    gender: "",
                    tag: "",
                    subEventRSVPs: {},
                    isPointOfContact: false,
                  });
                  setNewGroup({ name: "", members: [] });
                  setTempGroupMembers([]);
                  setEditingMemberIndex(-1);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  if (editingGuest) {
                    handleSaveEdit();
                  } else if (addMode === "individual") {
                    handleAddIndividualGuest();
                  } else {
                    handleCreateGroup();
                  }
                }}
                disabled={addMode === "group" && tempGroupMembers.length === 0}
              >
                {editingGuest
                  ? "Save Changes"
                  : addMode === "individual"
                    ? "Add Guest"
                    : `Create Group (${tempGroupMembers.length} members)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest List Table */}
      {totalGuests > 0 && (
        <div className={styles.guestListSection}>
          <div className={styles.subsectionHeader}>
            <h3 className={styles.subsectionTitle}>
              All Guests ({totalGuests})
            </h3>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.guestTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Group</th>
                  <th>Gender</th>
                  <th>Tag</th>
                  {subEvents.map((subEvent) => (
                    <th key={subEvent.id} className={styles.subEventColumn}>
                      {subEvent.name}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(eventData.guests || []).map((guest) => {
                  const group = eventData.guestGroups?.find(
                    (g) => g.title === guest.group,
                  );
                  const isPointOfContact = group?.point_of_contact === guest.id;

                  return (
                    <tr
                      key={guest.id}
                      className={
                        isPointOfContact ? styles.pointOfContactRow : ""
                      }
                    >
                      <td>
                        <div className={styles.guestName}>
                          {guest.name}
                          {isPointOfContact && (
                            <span className={styles.pocBadge}>POC</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.guestEmail}>{guest.email}</div>
                        {guest.phone && (
                          <div className={styles.guestPhone}>{guest.phone}</div>
                        )}
                      </td>
                      <td>
                        <div className={styles.groupInfo}>
                          {group && (
                            <>
                              <div
                                className={styles.groupColorDot}
                                style={{
                                  backgroundColor:
                                    group.details?.color || "#7c3aed",
                                }}
                              />
                              <span>{guest.group}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>{guest.gender || "-"}</td>
                      <td>{guest.tag || "-"}</td>
                      {subEvents.map((subEvent) => (
                        <td key={subEvent.id} className={styles.eventCheckbox}>
                          <input
                            type="checkbox"
                            checked={
                              guest.subEventRSVPs?.[subEvent.id] === "invited"
                            }
                            onChange={(e) =>
                              handleUpdateSubEventRSVP(
                                guest.id,
                                subEvent.id,
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                      ))}
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                            onClick={() => handleEditGuest(guest)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                            onClick={() => handleRemoveGuest(guest.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.formActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onPrevious}
        >
          ← Previous
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Continue to Launch →"}
        </button>
      </div>
    </div>
  );
};

export default GuestListSection;
