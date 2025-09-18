import React, { useEffect, useState, useCallback } from "react";
import styles from "../styles/portal.module.css";

const EmailPortal = ({
  event,
  toast,
  params,
  setLoading,
  guestList,
  password,
  getGuestList,
  updateGuestList,
}) => {
  const [reminderDate, setReminderDate] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [filterValue, setFilterValue] = useState("");

  // Guest management states
  const [addMode, setAddMode] = useState("individual"); // 'individual' or 'group'
  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    ageGroup: "",
    tag: "",
    selectedGroup: "",
    subEventRSVPs: {},
    isPointOfContact: true,
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
  const [showPOCConfirmation, setShowPOCConfirmation] = useState(false);
  const [pocTransferData, setPocTransferData] = useState(null);

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

  // Age group options
  const ageGroups = [
    { value: "infant", label: "Infant (0-2 years)", order: 1 },
    { value: "child", label: "Child (3-12 years)", order: 2 },
    { value: "teen", label: "Teenager (13-17 years)", order: 3 },
    { value: "adult", label: "Adult (18-64 years)", order: 4 },
    { value: "senior", label: "Senior (65+ years)", order: 5 },
    { value: "unknown", label: "Age not specified", order: 6 },
  ];

  // Transform guest list to match API response structure
  const transformedGuestList = guestList?.map(guest => {
    return {
      // Core guest information
      id: guest.id,
      public_id: guest.public_id,
      name: guest.name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      tag: guest.tag || "",
      
      // Group information
      group: guest.group || "",
      group_id: guest.group_id,
      
      // Lookup table data
      gender: guest.gender || "",
      ageGroup: guest.ageGroup || "",
      
      // Contact designation
      isPointOfContact: guest.point_of_contact === true,
      
      // RSVP data organized by subevent
      rsvpStatus: guest.rsvp_status || {},
      total_rsvps: guest.total_rsvps || 0,
      
      // Email status (derived)
      inviteStatus: guest.total_rsvps > 0 ? "Invited" : "Not Invited",
      responseStatus: Object.keys(guest.rsvp_status || {}).length > 0 ? "Responded" : "Pending",
      
      // Legacy fields for email functionality
      GUID: guest.public_id,
      UID: guest.id,
      Name: guest.name || "",
      Email: guest.email || "",
      MainResponse: guest.total_rsvps > 0 ? "1" : "",
      Sent: guest.total_rsvps > 0 ? "Yes" : "No",
      FamilyOrder: 1
    };
  }) || [];

  // Get all unique subevents from the guest data
  const getAllSubevents = () => {
    const subevents = new Set();
    transformedGuestList.forEach(guest => {
      Object.keys(guest.rsvpStatus || {}).forEach(subeventTitle => {
        subevents.add(subeventTitle);
      });
    });
    return Array.from(subevents).sort();
  };

  const subevents = getAllSubevents();

  // Filter guests based on search term and filters
  const getFilteredGuests = () => {
    let filtered = transformedGuestList;
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(guest => 
        guest.name.toLowerCase().includes(search) ||
        guest.email.toLowerCase().includes(search) ||
        (guest.phone && guest.phone.toLowerCase().includes(search)) ||
        (guest.group && guest.group.toLowerCase().includes(search)) ||
        (guest.tag && guest.tag.toLowerCase().includes(search))
      );
    }
    
    // Apply additional filters
    if (filterBy !== "all" && filterValue) {
      switch (filterBy) {
        case "gender":
          filtered = filtered.filter(guest => guest.gender === filterValue);
          break;
        case "ageGroup":
          filtered = filtered.filter(guest => guest.ageGroup === filterValue);
          break;
        case "group":
          filtered = filtered.filter(guest => guest.group === filterValue);
          break;
        case "status":
          if (filterValue === "invited") {
            filtered = filtered.filter(guest => guest.Sent === "Yes");
          } else if (filterValue === "responded") {
            filtered = filtered.filter(guest => guest.MainResponse === "1");
          } else if (filterValue === "pending") {
            filtered = filtered.filter(guest => guest.Sent === "Yes" && guest.MainResponse === "");
          }
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };

  const filteredGuests = getFilteredGuests();

  // Get unique filter options
  const getFilterOptions = () => {
    return {
      genders: [...new Set(transformedGuestList.map(g => g.gender).filter(Boolean))],
      ageGroups: [...new Set(transformedGuestList.map(g => g.ageGroup).filter(Boolean))],
      groups: [...new Set(transformedGuestList.map(g => g.group).filter(Boolean))],
    };
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterBy("all");
    setFilterValue("");
  };

  // Handle row selection
  const handleRowSelection = (guest, isSelected) => {
    setSelectedRows(prev => {
      if (isSelected) {
        return [...prev, guest];
      } else {
        return prev.filter(g => g.id !== guest.id);
      }
    });
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedRows(filteredGuests);
    } else {
      setSelectedRows([]);
    }
  };

  // Check if guest is selected
  const isGuestSelected = (guest) => {
    return selectedRows.some(g => g.id === guest.id);
  };

  // Get CSS class for RSVP status
  const getStatusClass = (statusName) => {
    const statusMap = {
      'pending': styles.statusPending,
      'opened': styles.statusOpened,
      'attending': styles.statusAttending,
      'not_attending': styles.statusNotAttending,
      'maybe': styles.statusMaybe,
      'no_response': styles.statusNoResponse,
    };
    return statusMap[statusName] || styles.statusPending;
  };

  // Send Mail
  const SendMail = async () => {
    console.log(password);
    toast("Sending Mail");
    const res = await fetch(`/api/${params.eventID}/sendMail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: selectedRows,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Mail sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Reminder
  const SendReminder = async () => {
    console.log(password);
    toast("Sending Reminder");
    console.log(selectedRows);
    const res = await fetch(`/api/${params.eventID}/sendReminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: selectedRows,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Reminders sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Reminder
  const SendReminderAll = async () => {
    console.log(password);
    toast("Sending Reminder");
    const reminderList = guestList.filter(
      (user) => user.Sent === "Yes" && user.MainResponse === "",
    );
    console.log(reminderList);
    const res = await fetch(`/api/${params.eventID}/sendReminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: reminderList,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Reminders sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };
  // Send Update
  const SendUpdateAll = async () => {
    console.log(password);
    toast("Sending Update");
    const reminderList = guestList.filter(
      (user) => user.MainResponse === "1" || user.MainResponse == 1,
    );
    console.log(reminderList);
    const res = await fetch(`/api/${params.eventID}/sendUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guestList: reminderList,
        password: password,
        event: event,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.validated) {
      toast("Updates sent!");
      updateGuestList(result.guestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };

  // Guest Management Helper Functions
  
  // Get existing groups for dropdown
  const getExistingGroups = () => {
    const groups = [...new Set(transformedGuestList.map(g => g.group).filter(Boolean))];
    return groups.map(groupName => ({
      title: groupName,
      size: transformedGuestList.filter(g => g.group === groupName).length
    }));
  };

  // Check if a group already has a point of contact
  const groupHasPOC = (groupTitle) => {
    const groupGuests = transformedGuestList.filter(guest => guest.group === groupTitle);
    return groupGuests.some(guest => guest.isPointOfContact === true);
  };

  // Get the current POC name for a group
  const getCurrentPOCName = (groupTitle) => {
    const groupGuests = transformedGuestList.filter(guest => guest.group === groupTitle);
    const pocGuest = groupGuests.find(guest => guest.isPointOfContact === true);
    return pocGuest?.name || null;
  };

  // Handle group selection change
  const handleGroupSelectionChange = (selectedGroup) => {
    setNewGuest(prev => ({
      ...prev,
      selectedGroup,
      isPointOfContact: selectedGroup ? 
        (editingGuest && selectedGroup === editingGuest.group ? prev.isPointOfContact : false) : 
        true
    }));
  };

  // Handle POC checkbox change with confirmation
  const handlePOCChange = (checked) => {
    if (checked && newGuest.selectedGroup && groupHasPOC(newGuest.selectedGroup)) {
      if (editingGuest && newGuest.selectedGroup === editingGuest.group) {
        setNewGuest(prev => ({
          ...prev,
          isPointOfContact: checked
        }));
        return;
      }
      
      const currentPOCName = getCurrentPOCName(newGuest.selectedGroup);
      setPocTransferData({
        fromName: currentPOCName,
        toName: newGuest.name,
        groupName: newGuest.selectedGroup
      });
      setShowPOCConfirmation(true);
    } else {
      setNewGuest(prev => ({
        ...prev,
        isPointOfContact: checked
      }));
    }
  };

  // Handle POC transfer confirmation
  const handlePOCTransferConfirm = () => {
    setNewGuest(prev => ({
      ...prev,
      isPointOfContact: true
    }));
    setShowPOCConfirmation(false);
    setPocTransferData(null);
  };

  // Handle POC transfer cancellation
  const handlePOCTransferCancel = () => {
    setShowPOCConfirmation(false);
    setPocTransferData(null);
  };

  // Handle adding/editing individual guest
  const handleAddIndividualGuest = async () => {
    if (!newGuest.name.trim()) {
      toast("Guest name is required");
      return;
    }

    // Create guest payload
    const guestPayload = {
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone,
      gender: newGuest.gender,
      ageGroup: newGuest.ageGroup,
      tag: newGuest.tag,
      group: newGuest.selectedGroup || `${newGuest.name} (Individual)`,
      isPointOfContact: newGuest.isPointOfContact || false,
      subEventRSVPs: newGuest.subEventRSVPs,
    };

    try {
      let response;
      
      if (editingGuest) {
        // Update existing guest
        response = await fetch(`/api/${params.eventID}/guests/${editingGuest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guest: guestPayload
          }),
        });
      } else {
        // Create new guest
        response = await fetch(`/api/${params.eventID}/guests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guests: [guestPayload],
            event: event
          }),
        });
      }

      if (response.ok) {
        toast(editingGuest ? "Guest updated successfully!" : "Guest added successfully!");
        await getGuestList(event); // Refresh guest list
        setShowGuestForm(false);
        setEditingGuest(null);
        setNewGuest({
          name: "",
          email: "",
          phone: "",
          gender: "",
          ageGroup: "",
          tag: "",
          selectedGroup: "",
          subEventRSVPs: {},
          isPointOfContact: true,
        });
      } else {
        throw new Error(editingGuest ? "Failed to update guest" : "Failed to add guest");
      }
    } catch (error) {
      console.error(editingGuest ? "Error updating guest:" : "Error adding guest:", error);
      toast(editingGuest ? "Failed to update guest. Please try again." : "Failed to add guest. Please try again.");
    }
  };

  // Handle editing a guest
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setAddMode("individual");
    setNewGuest({
      name: guest.name,
      email: guest.email,
      phone: guest.phone || "",
      gender: guest.gender || "",
      ageGroup: guest.ageGroup || "",
      tag: guest.tag || "",
      selectedGroup: guest.group || "",
      subEventRSVPs: guest.rsvpStatus || {},
      isPointOfContact: guest.isPointOfContact || false,
    });
    setShowGuestForm(true);
  };

  // Handle removing a guest
  const handleRemoveGuest = async (guestId) => {
    if (!window.confirm("Are you sure you want to remove this guest?")) {
      return;
    }

    try {
      const response = await fetch(`/api/${params.eventID}/guests/${guestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast("Guest removed successfully");
        await getGuestList(event); // Refresh guest list
      } else {
        throw new Error("Failed to remove guest");
      }
    } catch (error) {
      console.error("Error removing guest:", error);
      toast("Failed to remove guest. Please try again.");
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    toast.info(`Processing file: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast("CSV file must have at least a header row and one data row");
          return;
        }

        // Parse CSV and create guests
        const headers = lines[0].split(',').map(h => h.trim());
        const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
        const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
        const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
        const genderIndex = headers.findIndex(h => h.toLowerCase().includes('gender'));
        const tagIndex = headers.findIndex(h => h.toLowerCase().includes('tag'));

        const guestPayloads = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (nameIndex !== -1 && values[nameIndex]) {
            const guest = {
              name: values[nameIndex],
              email: emailIndex !== -1 ? values[emailIndex] || "" : "",
              phone: phoneIndex !== -1 ? values[phoneIndex] || "" : "",
              gender: genderIndex !== -1 ? values[genderIndex] || "" : "",
              tag: tagIndex !== -1 ? values[tagIndex] || "" : "",
              group: `${values[nameIndex]} (Individual)`,
              isPointOfContact: true,
              subEventRSVPs: {},
            };
            guestPayloads.push(guest);
          }
        }

        if (guestPayloads.length > 0) {
          const response = await fetch(`/api/${params.eventID}/guests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              guests: guestPayloads,
              event: event
            }),
          });

          if (response.ok) {
            toast(`Successfully imported ${guestPayloads.length} guests!`);
            await getGuestList(event); // Refresh guest list
          } else {
            throw new Error("Failed to import guests");
          }
        }

      } catch (error) {
        console.error('CSV parsing error:', error);
        toast("Error parsing CSV file. Please check the format and try again.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      {/* Quick Actions */}
      <div className={styles.actionButtons}>
        <button 
          className={styles.actionBtn} 
          onClick={SendMail}
          title="Send invite to selected guests"
        >
          <div className={styles.actionBtnIcon}>📮</div>
          <div>
            <div>Send Invites</div>
            <div className={styles.actionBtnSubtitle}>
              Send to selected guests
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendReminder}
          title="Send reminders to selected guests"
        >
          <div className={styles.actionBtnIcon}>⏰</div>
          <div>
            <div>Send Reminders</div>
            <div className={styles.actionBtnSubtitle}>
              Remind selected guests
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendReminderAll}
          title="Send reminders to all non-responders"
        >
          <div className={styles.actionBtnIcon}>📢</div>
          <div>
            <div>Send Reminder All</div>
            <div className={styles.actionBtnSubtitle}>
              Remind non-responders
            </div>
          </div>
        </button>
        <button 
          className={styles.actionBtn} 
          onClick={SendUpdateAll}
          title="Send updates to all respondents"
        >
          <div className={styles.actionBtnIcon}>🔄</div>
          <div>
            <div>Send Update All</div>
            <div className={styles.actionBtnSubtitle}>
              Event updates
            </div>
          </div>
        </button>
      </div>

      {/* Guest List Section */}
      <div className={styles.guestSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Guest Management</h2>
          <div className={styles.sectionControls}>
            <div className={styles.addGuestActions}>
              <button 
                className={styles.btnOutlineSmall}
                onClick={() => {
                  setAddMode("individual");
                  setShowGuestForm(true);
                }}
              >
                <span>👤</span>
                Add Guest
              </button>
              <button 
                className={styles.btnSecondarySmall}
                onClick={() => {
                  setAddMode("group");
                  setShowGuestForm(true);
                }}
              >
                <span>👥</span>
                Create Group
              </button>
              <label className={styles.btnPrimarySmall} style={{cursor: 'pointer'}}>
                <span>📁</span>
                Import CSV
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{display: 'none'}}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>{selectedRows.length} guests selected</span>
            <button className={styles.btnPrimarySmall} onClick={SendMail}>Send Invites</button>
            <button className={styles.btnOutlineSmall} onClick={SendReminder}>Send Reminders</button>
            <button className={styles.btnSecondarySmall}>Export Selected</button>
          </div>
        )}

        {/* Filter Controls */}
        <div className={styles.filterControls}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search guests by name, email, phone, group, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.advancedFilters}>
            <select
              className={styles.filterSelect}
              value={filterBy}
              onChange={(e) => {
                setFilterBy(e.target.value);
                setFilterValue("");
              }}
            >
              <option value="all">All Guests</option>
              <option value="status">Filter by Status</option>
              <option value="gender">Filter by Gender</option>
              <option value="ageGroup">Filter by Age Group</option>
              <option value="group">Filter by Group</option>
            </select>

            {filterBy !== "all" && (
              <select
                className={styles.filterSelect}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">Select {filterBy === "status" ? "status" : filterBy}...</option>
                {filterBy === "status" && (
                  <>
                    <option value="invited">Invited</option>
                    <option value="responded">Responded</option>
                    <option value="pending">Pending</option>
                  </>
                )}
                {filterBy === "gender" && 
                  getFilterOptions().genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))
                }
                {filterBy === "ageGroup" && 
                  getFilterOptions().ageGroups.map(ageGroup => (
                    <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
                  ))
                }
                {filterBy === "group" && 
                  getFilterOptions().groups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))
                }
              </select>
            )}

            {(searchTerm || filterBy !== "all") && (
              <button
                className={`${styles.btnSecondarySmall}`}
                onClick={clearFilters}
                title="Clear all filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Guest Table */}
        {filteredGuests.length === 0 ? (
          <div className={styles.noResultsContainer}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h4 className={styles.noResultsTitle}>No guests found</h4>
            <p className={styles.noResultsText}>
              {searchTerm || filterBy !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No guests have been added yet"}
            </p>
            {(searchTerm || filterBy !== "all") && (
              <button
                className={`${styles.btnPrimarySmall}`}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableScrollWrapper}>
              <table className={styles.guestTable}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === filteredGuests.length && filteredGuests.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Actions</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Group</th>
                  <th>Gender</th>
                  <th>Age Group</th>
                  <th>Tag</th>
                  {subevents.map(subevent => (
                    <th key={subevent}>{subevent}</th>
                  ))}
                  <th>Invite Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const isPointOfContact = guest.isPointOfContact === true;
                  const isSelected = isGuestSelected(guest);

                  return (
                    <tr
                      key={guest.id}
                      className={`${isPointOfContact ? styles.pointOfContactRow : ""} ${isSelected ? styles.selectedRow : ""}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelection(guest, e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={`${styles.btnGhost} ${styles.btnIcon}`}
                            onClick={() => handleEditGuest(guest)}
                            title="Edit guest"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className={`${styles.btnDanger} ${styles.btnIcon}`}
                            onClick={() => handleRemoveGuest(guest.id)}
                            title="Remove guest"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.guestName}>
                          {guest.name || "-"}
                          {isPointOfContact && (
                            <span className={styles.pocBadge}>POC</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.guestEmail}>{guest.email || "-"}</div>
                      </td>
                      <td>
                        <div className={styles.guestPhone}>{guest.phone || "-"}</div>
                      </td>
                      <td>
                        <div className={styles.groupInfo}>
                          {guest.group ? (
                            <>
                              <div
                                className={styles.groupColorDot}
                                style={{
                                  backgroundColor: "#7c3aed",
                                }}
                              />
                              <span>{guest.group}</span>
                            </>
                          ) : "-"}
                        </div>
                      </td>
                      <td>{guest.gender || "-"}</td>
                      <td>{guest.ageGroup || "-"}</td>
                      <td>{guest.tag || "-"}</td>
                      {subevents.map(subevent => {
                        const rsvp = guest.rsvpStatus[subevent];
                        return (
                          <td key={subevent}>
                            {rsvp ? (
                              <div className={styles.rsvpCell}>
                                <span className={`${styles.statusBadge} ${getStatusClass(rsvp.status_name)}`}>
                                  {rsvp.status_name}
                                </span>
                                {rsvp.response && (
                                  <div className={styles.responseCount}>+{rsvp.response}</div>
                                )}
                              </div>
                            ) : (
                              <span className={`${styles.statusBadge} ${styles.statusNotInvited}`}>
                                Not Invited
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <span className={`${styles.statusBadge} ${
                          guest.inviteStatus === "Invited" ? styles.statusInvited : styles.statusNotInvited
                        }`}>
                          {guest.inviteStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
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
                    ageGroup: "",
                    tag: "",
                    selectedGroup: "",
                    subEventRSVPs: {},
                    isPointOfContact: true,
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
                    <h4 className={styles.formSectionTitle}>Guest Information</h4>
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
                        <label className={styles.formLabel}>Email</label>
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
                        <label className={styles.formLabel}>Age Group</label>
                        <select
                          className={styles.formSelect}
                          value={newGuest.ageGroup}
                          onChange={(e) =>
                            setNewGuest({ ...newGuest, ageGroup: e.target.value })
                          }
                        >
                          <option value="">Select age group</option>
                          {ageGroups.map((group) => (
                            <option key={group.value} value={group.value}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Group</label>
                        <select
                          className={styles.formSelect}
                          value={newGuest.selectedGroup}
                          onChange={(e) => handleGroupSelectionChange(e.target.value)}
                        >
                          <option value="">Create new individual group</option>
                          {getExistingGroups().map((group) => (
                            <option key={group.title} value={group.title}>
                              {group.title} ({group.size} members)
                            </option>
                          ))}
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

                  {/* Point of Contact Section */}
                  <div className={styles.pointOfContactSection}>
                    <label className={styles.pointOfContactLabel}>
                      <input
                        type="checkbox"
                        checked={newGuest.isPointOfContact}
                        onChange={(e) => handlePOCChange(e.target.checked)}
                      />
                      Mark as Point of Contact
                      {newGuest.selectedGroup && groupHasPOC(newGuest.selectedGroup) && (
                        <span className={styles.pocWarning}> (Group already has a POC)</span>
                      )}
                    </label>
                    <div className={styles.pointOfContactHelp}>
                      Point of contact will receive important updates and can help coordinate with their group
                      {newGuest.selectedGroup && groupHasPOC(newGuest.selectedGroup) && (
                        <div className={styles.pocWarningText}>
                          This group already has a POC ({getCurrentPOCName(newGuest.selectedGroup)}). 
                          Checking this box will transfer POC status to this guest.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.groupFormPlaceholder}>
                  <h4>Group Creation Feature</h4>
                  <p>Group creation functionality would be implemented here.</p>
                  <p>For now, please use individual guest creation.</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btnSecondary}`}
                onClick={() => {
                  setShowGuestForm(false);
                  setEditingGuest(null);
                  setNewGuest({
                    name: "",
                    email: "",
                    phone: "",
                    gender: "",
                    ageGroup: "",
                    tag: "",
                    selectedGroup: "",
                    subEventRSVPs: {},
                    isPointOfContact: true,
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btnPrimary}`}
                onClick={() => {
                  if (editingGuest || addMode === "individual") {
                    handleAddIndividualGuest();
                  }
                }}
                disabled={!newGuest.name.trim()}
              >
                {editingGuest ? "Save Changes" : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POC Transfer Confirmation Modal */}
      {showPOCConfirmation && pocTransferData && (
        <div className={styles.guestFormOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Transfer Point of Contact</h3>
            </div>
            
            <div className={styles.confirmationContent}>
              <div className={styles.confirmationIcon}>👥</div>
              <div className={styles.confirmationMessage}>
                <p>
                  This will transfer the point of contact role from{" "}
                  <strong>{pocTransferData.fromName}</strong> to{" "}
                  <strong>{pocTransferData.toName}</strong> for the group{" "}
                  <strong>{pocTransferData.groupName}</strong>.
                </p>
                <p className={styles.confirmationSubtext}>
                  The previous point of contact will no longer receive important updates for this group.
                </p>
              </div>
            </div>

            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={`${styles.btnSecondary}`}
                onClick={handlePOCTransferCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btnPrimary}`}
                onClick={handlePOCTransferConfirm}
              >
                Transfer POC Role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailPortal;
