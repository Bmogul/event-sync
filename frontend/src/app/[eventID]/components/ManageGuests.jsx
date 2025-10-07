"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../styles/portal.module.css";
import GuestModal from "./GuestModal";
import { MdEdit, MdContentCopy, MdDelete, MdAdd } from "react-icons/md";

import { useParams } from "next/navigation";

const ManageGuests = ({
  event,
  guests,
  groups,
  updateGuestList,
  onDataRefresh,
  session,
  toast,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("group");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [subevents, setSubevents] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const params = useParams();

  useEffect(() => {
    // Get subevents from event object (all items starting with func)
    const getSubevents = () => {
      if (!event || event.numberOfFunctions <= 0) {
        return [];
      }
      return Object.keys(event)
        .filter((key) => key.startsWith("func"))
        .map((key) => event[key]);
    };

    setSubevents(event.subevents);
  }, [event]);

  // Filter guests based on search term
  const getFilteredGuests = () => {
    let filtered = guests || [];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (guest) =>
          (guest.name || "").toLowerCase().includes(search) ||
          (guest.email || "").toLowerCase().includes(search) ||
          (guest.phone || "").toLowerCase().includes(search) ||
          (guest.group || "").toLowerCase().includes(search),
      );
    }

    return filtered;
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Sort guests
  const getSortedGuests = (guests) => {
    return [...guests].sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getSortIndicator = (column) => {
    if (sortBy !== column) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Get CSS class for RSVP status
  const getStatusClass = (statusName) => {
    const statusMap = {
      pending: styles.statusPending,
      opened: styles.statusOpened,
      attending: styles.statusAttending,
      not_attending: styles.statusNotAttending,
      maybe: styles.statusMaybe,
      no_response: styles.statusNoResponse,
    };
    return statusMap[statusName] || styles.statusPending;
  };

  const filteredGuests = getFilteredGuests();
  const sortedGuests = getSortedGuests(filteredGuests);

  // Handle opening guest modal
  const handleEditGuest = (guest) => {
    setSelectedGuest(guest);
    setShowGuestModal(true);
  };

  // Handle opening guest modal
  const handleCreateGuest = () => {
    setSelectedGuest({});
    setShowGuestModal(true);
  };

  const handleCloseModal = () => {
    setShowGuestModal(false);
    setSelectedGuest(null);
  };

  // Handle delete guest button click - show confirmation
  const handleDeleteGuest = (guest) => {
    setGuestToDelete(guest);
    setShowDeleteConfirmation(true);
  };

  // Handle confirming deletion
  const confirmDeleteGuest = async () => {
    if (!guestToDelete) return;

    try {
      // Use guestList POST endpoint with deletedGuests array
      const remainingGuests = guests.filter(g => g.id !== guestToDelete.id);

      const response = await fetch(`/api/${params.eventID}/guestList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          guestList: remainingGuests,
          groups: groups,
          deletedGuests: [{ id: guestToDelete.id, name: guestToDelete.name }],
          rsvpsToDelete: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      toast(`Guest ${guestToDelete.name} deleted successfully`);
      setShowDeleteConfirmation(false);
      setGuestToDelete(null);

      // Refresh the data
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast('Failed to delete guest. Please try again.');
    }
  };

  // Handle canceling deletion
  const cancelDeleteGuest = () => {
    setShowDeleteConfirmation(false);
    setGuestToDelete(null);
  };

  // Handle copying RSVP link to clipboard
  const handleCopyRSVPLink = async (guest) => {
    const rsvpLink = `${window.location.origin}/${params.eventID}/rsvp?guestId=${guest.group_id}`;

    try {
      await navigator.clipboard.writeText(rsvpLink);
      toast(`RSVP link copied for ${guest.name}`);
    } catch (error) {
      console.error("Failed to copy RSVP link:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = rsvpLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast(`RSVP link copied for ${guest.name}`);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        toast("Failed to copy RSVP link. Please copy manually.");
        // Show the link in a prompt as final fallback
        prompt("Copy this RSVP link:", rsvpLink);
      }
      document.body.removeChild(textArea);
    }
  };

  const renderGuestRow = (guest) => {
    const isPointOfContact = guest.point_of_contact === true;

    return (
      <tr
        key={guest.UID || guest.id}
        className={isPointOfContact ? styles.pointOfContactRow : ""}
      >
        <td>
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.btnGhost} ${styles.btnIcon}`}
              title="Edit guest"
              onClick={() => handleEditGuest(guest)}
            >
              <MdEdit size={18} />
            </button>
            <button
              type="button"
              className={`${styles.btnGhost} ${styles.btnIcon}`}
              onClick={() => handleCopyRSVPLink(guest)}
              title="Copy RSVP link"
            >
              <MdContentCopy size={18} />
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.btnGhost} ${styles.btnIcon}`}
              title="Delete guest"
              onClick={() => handleDeleteGuest(guest)}
            >
              <MdDelete size={18} />
            </button>*/}

          </div>
        </td>
        <td>
          <div className={styles.guestName}>
            {guest.name || "-"}
            {isPointOfContact && <span className={styles.pocBadge}>POC</span>}
          </div>
        </td>
        <td>{guest.group || "-"}</td>
        <td>{guest.email || "-"}</td>
        <td>{guest.phone || "-"}</td>
        <td>{guest.gender || "-"}</td>
        <td>{guest.ageGroup || "-"}</td>
        <td>{guest.tag || "-"}</td>
        {subevents.map((subevent) => {
          const rsvp = guest.rsvp_status?.[subevent.title];
          return (
            <td key={subevent.id || subevent.title}>
              {rsvp ? (
                <div className={styles.rsvpCell}>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(rsvp.status_name)}`}
                  >
                    {rsvp.status_name}
                  </span>
                  {rsvp.response && (
                    <div className={styles.responseCount}>+{rsvp.response}</div>
                  )}
                </div>
              ) : (
                <span
                  className={`${styles.statusBadge} ${styles.statusNotInvited}`}
                >
                  Not Invited
                </span>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className={styles.emailSection}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && guestToDelete && (
        <div
          className={styles.confirmationOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirmation-title"
          style={{ zIndex: 9999 }}
        >
          <div className={styles.confirmationDialog}>
            <h4
              className={styles.confirmationTitle}
              id="delete-confirmation-title"
            >
              Delete Guest?
            </h4>
            <p className={styles.confirmationMessage}>
              Are you sure you want to delete <strong>{guestToDelete.name}</strong>?
              <br />
              <br />
              This will permanently remove the guest and all their RSVP responses.
              This action cannot be undone.
            </p>
            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={cancelDeleteGuest}
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={confirmDeleteGuest}
                aria-label="Confirm deletion"
              >
                Delete Guest
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Guest List Management</h2>
        <p className={styles.sectionDescription}>
          View and manage all guests for your event
        </p>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <button
          type="button"
          className={`${styles.btnOutline}`}
          style={{ marginBottom: "15px" }}
          title="Add new guest"
          onClick={() => handleCreateGuest()}
        >
          <MdAdd size={18} /> Add Guest
        </button>
        <input
          type="text"
          placeholder="Search guests by name, email, phone, or group..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Guest Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableScrollWrapper}>
          <table className={`${styles.guestTable} ${styles.resizableTable}`}>
            <thead>
              <tr>
                <th
                  className={styles.resizableColumn}
                  style={{ width: "100px" }}
                >
                  Actions
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn} ${styles.resizableLarge}`}
                  onClick={() => handleSort("name")}
                  title="Click to sort by name"
                  style={{ width: "420px" }}
                >
                  Name {getSortIndicator("name")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn} ${styles.resizableMed}`}
                  onClick={() => handleSort("group")}
                  title="Click to sort by group"
                  style={{ width: "150px" }}
                >
                  Group Name {getSortIndicator("group")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn} ${styles.resizableLarge}`}
                  onClick={() => handleSort("email")}
                  title="Click to sort by email"
                  style={{ width: "290px", overflow: "hidden" }}
                >
                  Email {getSortIndicator("email")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn} ${styles.resizableMed}`}
                  onClick={() => handleSort("phone")}
                  title="Click to sort by phone"
                  style={{ width: "200px" }}
                >
                  Phone {getSortIndicator("phone")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn}`}
                  onClick={() => handleSort("gender")}
                  title="Click to sort by gender"
                  style={{ width: "100px" }}
                >
                  Gender {getSortIndicator("gender")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn}`}
                  onClick={() => handleSort("ageGroup")}
                  title="Click to sort by age group"
                  style={{ width: "110px" }}
                >
                  Age Group {getSortIndicator("ageGroup")}
                </th>
                <th
                  className={`${styles.sortableHeader} ${styles.resizableColumn}`}
                  onClick={() => handleSort("tag")}
                  title="Click to sort by tag"
                  style={{ width: "100px" }}
                >
                  Tag {getSortIndicator("tag")}
                </th>
                {subevents.map((subevent, index) => (
                  <th
                    key={subevent.id || index}
                    className={styles.resizableColumn}
                    style={{ width: "250px" }}
                  >
                    {subevent.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{sortedGuests.map((guest) => renderGuestRow(guest))}</tbody>
          </table>
        </div>
      </div>

      {filteredGuests.length === 0 && searchTerm && (
        <div className={styles.noResults}>
          <p>No guests found matching "{searchTerm}"</p>
        </div>
      )}

      <GuestModal
        currentGuest={selectedGuest}
        isOpen={showGuestModal}
        onClose={handleCloseModal}
        groups={groups}
        subevents={subevents}
        guestList={guests}
        eventID={event.id}
        eventPubID={event.public_id}
        updateGuestList={updateGuestList}
        onDataRefresh={onDataRefresh}
        session={session}
      />
    </div>
  );
};

export default ManageGuests;
