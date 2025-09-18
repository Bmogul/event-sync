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
            <button className={styles.btnOutlineSmall}>Add Guest</button>
            <button className={styles.btnPrimarySmall}>Import List</button>
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
    </>
  );
};

export default EmailPortal;
