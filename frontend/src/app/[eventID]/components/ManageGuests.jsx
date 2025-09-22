"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../styles/portal.module.css";
import GuestModal from "./GuestModal";

const ManageGuests = ({ event, guests, groups }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("group");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    console.log("MANAGE GUEST LIST", guests, event);
  }, []);

  // Get subevents from event object (all items starting with func)
  const getSubevents = () => {
    if (!event || !event.func) return [];
    return Object.keys(event.func).filter((key) => key.startsWith("func"));
  };

  const subevents = getSubevents();

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
              ✏️
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.btnGhost} ${styles.btnIcon}`}
              title="Delete guest"
            >
              🗑️
            </button>
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
        {subevents.map((subevent) => (
          <td key={subevent}>{guest[subevent] || "-"}</td>
        ))}
      </tr>
    );
  };

  return (
    <div className={styles.emailSection}>
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
          style={{marginBottom:"15px"}}
          title="Add new guest"
          onClick={()=>handleCreateGuest()}
        >
          ➕ Add Guest
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
                    key={subevent}
                    className={styles.resizableColumn}
                    style={{ width: "120px" }}
                  >
                    {subevent}
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
      />
    </div>
  );
};

export default ManageGuests;
