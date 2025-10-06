import React, { useEffect, useState, useCallback } from "react";
import styles from "../styles/portal.module.css";
import { MdContentCopy, MdDelete, MdPeople, MdEmail, MdCheckCircle, MdSend, MdCampaign, MdRefresh, MdPerson, MdFolder, MdClose, MdBuild, MdExpandMore, MdExpandLess, MdSearch, MdMessage, MdPhone, MdStar } from "react-icons/md";

const EmailPortal = ({
  event,
  toast,
  params,
  setLoading,
  guestList,
  session,
  getGuestList,
  setGuestList,
  setCurrentView,
  initialFilters,
  clearInitialFilters,
}) => {
  const [reminderDate, setReminderDate] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState([]);

  // Enhanced sorting and filtering states
  const [sortBy, setSortBy] = useState("group"); // Default to group sorting
  const [sortDirection, setSortDirection] = useState("asc");
  const [secondarySortBy, setSecondarySortBy] = useState("name");
  const [groupFilters, setGroupFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState({});
  const [genderFilters, setGenderFilters] = useState([]);
  const [ageGroupFilters, setAgeGroupFilters] = useState([]);
  const [contactFilters, setContactFilters] = useState([]);
  const [groupStatusFilters, setGroupStatusFilters] = useState([]);
  const [groupContactFilters, setGroupContactFilters] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [showPOCConfirmation, setShowPOCConfirmation] = useState(false);
  const [pocTransferData, setPocTransferData] = useState(null);
  const [showAreaCodeModal, setShowAreaCodeModal] = useState(false);
  const [areaCodeModalData, setAreaCodeModalData] = useState(null);
  const [areaCodeInput, setAreaCodeInput] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [selectedWhatsappTemplateId, setSelectedWhatsappTemplateId] = useState("");

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

  // Handle guest type change
  const handleGuestTypeChange = (guestType) => {
    setNewGuest((prev) => ({
      ...prev,
      guestType,
      guestLimit: guestType === "multiple" ? 1 : null, // Set default limit for multiple type
    }));
  };

  // Function to replace variables in WhatsApp templates
  const replaceWhatsAppVariables = (message, guest, rsvpLink, eventData) => {
    let processedMessage = message;
    
    // Replace basic variables
    processedMessage = processedMessage
      .replace(/{rsvp_link}/g, rsvpLink)
      .replace(/{event_title}/g, eventData?.eventTitle || "Your Event")
      .replace(/{guest_name}/g, guest?.name || "Guest");
    
    // Replace subevent-specific variables
    if (eventData?.subevents) {
      eventData.subevents.forEach(subevent => {
        const cleanTitle = subevent.title.replace(/[^a-zA-Z0-9]/g, ''); // Remove spaces/special chars
        if (cleanTitle) {
          processedMessage = processedMessage
            .replace(new RegExp(`{${cleanTitle}_title}`, 'g'), subevent.title || "TBD")
            .replace(new RegExp(`{${cleanTitle}_date}`, 'g'), subevent.event_date || "TBD")
            .replace(new RegExp(`{${cleanTitle}_location}`, 'g'), subevent.venue_address || "TBD")
            .replace(new RegExp(`{${cleanTitle}_time}`, 'g'), subevent.start_time || "TBD")
            .replace(new RegExp(`{${cleanTitle}_endtime}`, 'g'), subevent.end_time || "TBD");
        }
      });
    }
    
    // Keep old variables for backward compatibility
    const firstSubevent = eventData?.subevents?.[0];
    processedMessage = processedMessage
      .replace(/{event_date}/g, firstSubevent?.event_date || eventData?.startDate || "Event Date")
      .replace(/{event_location}/g, firstSubevent?.venue_address || eventData?.location || "Event Location");
    
    return processedMessage;
  };

  // Fetch available email templates for this event
  useEffect(() => {
    console.log("FETCHING TEMPLATES");
    const fetchEmailTemplates = async () => {
      console.log("valid event", event);
      if (!event?.eventID || !session?.access_token) return;

      try {
        const response = await fetch(`/api/events?public_id=${event.eventID}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("EVENT TAMPLATES", data.event.emailTemplates);
          if (data.success && data.event?.emailTemplates) {
            setAvailableTemplates(data.event.emailTemplates);
            // Auto-select first template if available
            if (data.event.emailTemplates.length > 0) {
              setSelectedTemplateId(data.event.emailTemplates[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching email templates:", error);
      }
    };

    fetchEmailTemplates();
  }, [event?.public_id, session?.access_token]);

  // Fetch WhatsApp templates
  useEffect(() => {
    const fetchWhatsAppTemplates = async () => {
      if (!event?.eventID || !session?.access_token) return;

      try {
        const response = await fetch(`/api/events?public_id=${event.eventID}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.event?.whatsappTemplates) {
            setWhatsappTemplates(data.event.whatsappTemplates);
            // Set default template as selected
            const defaultTemplate = data.event.whatsappTemplates.find(t => t.is_default) || data.event.whatsappTemplates[0];
            if (defaultTemplate) {
              setSelectedWhatsappTemplateId(defaultTemplate.id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching WhatsApp templates:", error);
      }
    };

    fetchWhatsAppTemplates();
  }, [event?.eventID, session?.access_token]);
  
  // Apply initial filters when passed from Analytics
  useEffect(() => {
    if (initialFilters) {
      console.log("Applying initial filters:", initialFilters);
      
      // Apply filters
      if (initialFilters.statusFilters) {
        setStatusFilters(initialFilters.statusFilters);
      }
      if (initialFilters.groupFilters) {
        setGroupFilters(initialFilters.groupFilters);
      }
      if (initialFilters.genderFilters) {
        setGenderFilters(initialFilters.genderFilters);
      }
      if (initialFilters.ageGroupFilters) {
        setAgeGroupFilters(initialFilters.ageGroupFilters);
      }
      if (initialFilters.contactFilters) {
        setContactFilters(initialFilters.contactFilters);
      }
      if (initialFilters.groupStatusFilters) {
        setGroupStatusFilters(initialFilters.groupStatusFilters);
      }
      if (initialFilters.groupContactFilters) {
        setGroupContactFilters(initialFilters.groupContactFilters);
      }

      // Show advanced filters if any filters are applied
      const hasFilters = Object.keys(initialFilters.statusFilters || {}).length > 0 ||
                        initialFilters.groupFilters?.length > 0 ||
                        initialFilters.genderFilters?.length > 0 ||
                        initialFilters.ageGroupFilters?.length > 0 ||
                        initialFilters.contactFilters?.length > 0 ||
                        initialFilters.groupStatusFilters?.length > 0 ||
                        initialFilters.groupContactFilters?.length > 0;
      
      if (hasFilters) {
        setShowAdvancedFilters(true);
      }

      // Clear the initial filters after applying
      if (clearInitialFilters) {
        clearInitialFilters();
      }

      // Show toast notification (reduced verbosity to avoid multiple toasts)
      toast.info("Filters applied", { autoClose: 1000 });
    }
  }, [initialFilters, clearInitialFilters, toast]);

  // Transform guest list to match API response structure
  const transformedGuestList =
    guestList?.map((guest) => {
      // Contact information flags
      const hasEmail = !!(guest.email && guest.email.trim());
      const hasPhone = !!(guest.phone && guest.phone.trim());
      const hasContactInfo = hasEmail && hasPhone;

      // Map group status from group_status.status_id to readable status
      const getGroupStatusName = (statusId) => {
        const statusMap = {
          1: "draft",
          2: "pending",
          3: "invited",
          4: "responded",
          5: "completed",
          6: "cancelled",
        };
        return statusMap[statusId] || "unknown";
      };

      const groupStatusName = getGroupStatusName(guest.group_status_id);

      return {
        // Core guest information
        id: guest.id,
        public_id: guest.public_id,
        name: guest.name || "",
        email: guest.email || "",
        phone: guest.phone || "",
        tag: guest.tag || "",

        // Contact information flags
        hasEmail,
        hasPhone,
        hasContactInfo,
        contactStatus: hasContactInfo
          ? "Complete"
          : hasEmail
            ? "Email Only"
            : hasPhone
              ? "Phone Only"
              : "No Contact",

        // Group information
        group: guest.group || "",
        group_id: guest.group_id,
        groupStatus: groupStatusName,
        group_status_id: guest.group_status_id,

        // Lookup table data
        gender: guest.gender || "",
        ageGroup: guest.ageGroup || "",

        // Contact designation
        isPointOfContact: guest.point_of_contact === true,

        // RSVP data organized by subevent
        rsvpStatus: guest.rsvp_status || {},
        total_rsvps: guest.total_rsvps || 0,

        // Email status (derived from both RSVP and group status)
        inviteStatus: guest.total_rsvps > 0 ? "Invited" : "Not Invited",
        responseStatus:
          Object.keys(guest.rsvp_status || {}).length > 0
            ? "Responded"
            : "Pending",

        // Legacy fields for email functionality
        GUID: guest.group_id,
        UID: guest.id,
        Name: guest.name || "",
        Email: guest.email || "",
        MainResponse: guest.total_rsvps > 0 ? "1" : "",
        Sent: guest.total_rsvps > 0 ? "Yes" : "No",
        FamilyOrder: 1,
      };
    }) || [];

  // Helper function to analyze group contact status
  const getGroupContactStatus = (groupName) => {
    const groupMembers = transformedGuestList.filter(guest => guest.group === groupName);
    if (groupMembers.length === 0) return {};
    
    const hasAnyEmail = groupMembers.some(member => member.hasEmail);
    const hasAllEmails = groupMembers.every(member => member.hasEmail);
    const hasNoEmails = groupMembers.every(member => !member.hasEmail);
    
    const hasAnyPhone = groupMembers.some(member => member.hasPhone);
    const hasAllPhones = groupMembers.every(member => member.hasPhone);
    const hasNoPhones = groupMembers.every(member => !member.hasPhone);
    
    const hasCompleteContactInfo = groupMembers.every(member => member.hasContactInfo);
    const hasAnyContactInfo = groupMembers.some(member => member.hasContactInfo);
    
    return {
      hasAnyEmail,
      hasAllEmails,
      hasNoEmails,
      hasAnyPhone,
      hasAllPhones,
      hasNoPhones,
      hasCompleteContactInfo,
      hasAnyContactInfo,
      memberCount: groupMembers.length
    };
  };

  // Get all unique subevents from the guest data
  const getAllSubevents = () => {
    const subevents = new Set();
    transformedGuestList.forEach((guest) => {
      Object.keys(guest.rsvpStatus || {}).forEach((subeventTitle) => {
        subevents.add(subeventTitle);
      });
    });
    return Array.from(subevents).sort();
  };

  const subevents = getAllSubevents();

  // Enhanced sorting function
  const sortGuests = (
    guests,
    primarySort,
    direction,
    secondarySort = "name",
  ) => {
    return [...guests].sort((a, b) => {
      let primaryA = a[primarySort] || "";
      let primaryB = b[primarySort] || "";

      // Handle special cases for sorting
      if (primarySort === "group") {
        primaryA = a.group || `${a.name} (Individual)`;
        primaryB = b.group || `${b.name} (Individual)`;
      } else if (primarySort === "inviteStatus") {
        primaryA = a.total_rsvps > 0 ? "Invited" : "Not Invited";
        primaryB = b.total_rsvps > 0 ? "Invited" : "Not Invited";
      } else if (primarySort === "groupStatus") {
        // Sort by group status using hierarchy: draft < pending < invited < responded < completed < cancelled
        const statusOrder = {
          draft: 1,
          pending: 2,
          invited: 3,
          responded: 4,
          completed: 5,
          cancelled: 6,
          unknown: 7,
        };
        primaryA = statusOrder[a.groupStatus] || 7;
        primaryB = statusOrder[b.groupStatus] || 7;
      } else if (primarySort === "hasEmail") {
        primaryA = a.hasEmail ? 1 : 0;
        primaryB = b.hasEmail ? 1 : 0;
      } else if (primarySort === "hasPhone") {
        primaryA = a.hasPhone ? 1 : 0;
        primaryB = b.hasPhone ? 1 : 0;
      } else if (primarySort === "hasContactInfo") {
        primaryA = a.hasContactInfo ? 1 : 0;
        primaryB = b.hasContactInfo ? 1 : 0;
      } else if (primarySort === "contactStatus") {
        // Sort by contact completeness: Complete > Email Only > Phone Only > No Contact
        const contactOrder = {
          Complete: 1,
          "Email Only": 2,
          "Phone Only": 3,
          "No Contact": 4,
        };
        primaryA = contactOrder[a.contactStatus] || 4;
        primaryB = contactOrder[b.contactStatus] || 4;
      }

      // Primary sort comparison
      let comparison = 0;
      if (primaryA < primaryB) {
        comparison = -1;
      } else if (primaryA > primaryB) {
        comparison = 1;
      }

      // If primary values are equal, use secondary sort
      if (comparison === 0 && secondarySort) {
        const secondaryA = a[secondarySort] || "";
        const secondaryB = b[secondarySort] || "";
        if (secondaryA < secondaryB) {
          comparison = -1;
        } else if (secondaryA > secondaryB) {
          comparison = 1;
        }
      }

      return direction === "desc" ? -comparison : comparison;
    });
  };

  // Enhanced filter guests function with advanced filtering
  const getFilteredGuests = () => {
    let filtered = transformedGuestList;

    // Apply search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (guest) =>
          guest.name.toLowerCase().includes(search) ||
          guest.email.toLowerCase().includes(search) ||
          (guest.phone && guest.phone.toLowerCase().includes(search)) ||
          (guest.group && guest.group.toLowerCase().includes(search)) ||
          (guest.tag && guest.tag.toLowerCase().includes(search)),
      );
    }

    // Apply legacy single filters for backward compatibility
    if (filterBy !== "all" && filterValue) {
      switch (filterBy) {
        case "gender":
          filtered = filtered.filter((guest) => guest.gender === filterValue);
          break;
        case "ageGroup":
          filtered = filtered.filter((guest) => guest.ageGroup === filterValue);
          break;
        case "group":
          filtered = filtered.filter((guest) => guest.group === filterValue);
          break;
        case "status":
          if (filterValue === "invited") {
            filtered = filtered.filter((guest) => guest.Sent === "Yes");
          } else if (filterValue === "responded") {
            filtered = filtered.filter((guest) => guest.MainResponse === "1");
          } else if (filterValue === "pending") {
            filtered = filtered.filter(
              (guest) => guest.Sent === "Yes" && guest.MainResponse === "",
            );
          }
          break;
        default:
          break;
      }
    }

    // Apply advanced multi-select filters
    if (groupFilters.length > 0) {
      filtered = filtered.filter((guest) =>
        groupFilters.includes(guest.group || `${guest.name} (Individual)`),
      );
    }

    if (Object.keys(statusFilters).length > 0) {
      filtered = filtered.filter((guest) => {
        // Check if guest matches any of the selected subevent status filters
        return Object.entries(statusFilters).some(([subeventName, selectedStatuses]) => {
          if (!selectedStatuses || selectedStatuses.length === 0) return false;
          
          const rsvpForSubevent = guest.rsvpStatus?.[subeventName];
          if (!rsvpForSubevent) {
            // Guest has no RSVP entry for this subevent - they are not invited
            // Check if "not invited" status (0) is selected
            return selectedStatuses.includes(0);
          }
          
          // Check if the guest's status for this subevent matches any selected status
          return selectedStatuses.includes(rsvpForSubevent.status_id);
        });
      });
    }

    if (genderFilters.length > 0) {
      filtered = filtered.filter((guest) =>
        genderFilters.includes(guest.gender),
      );
    }

    if (ageGroupFilters.length > 0) {
      filtered = filtered.filter((guest) =>
        ageGroupFilters.includes(guest.ageGroup),
      );
    }

    if (contactFilters.length > 0) {
      filtered = filtered.filter((guest) =>
        contactFilters.includes(guest.contactStatus),
      );
    }

    if (groupStatusFilters.length > 0) {
      filtered = filtered.filter((guest) =>
        groupStatusFilters.includes(guest.groupStatus),
      );
    }

    // Apply group contact filters
    if (groupContactFilters.length > 0) {
      // Get unique groups from current filtered list
      const groupsToInclude = new Set();
      
      // Check each unique group against group contact filters
      const uniqueGroups = [...new Set(filtered.map(guest => guest.group).filter(Boolean))];
      
      uniqueGroups.forEach(groupName => {
        const groupContactStatus = getGroupContactStatus(groupName);
        
        const shouldIncludeGroup = groupContactFilters.some(filter => {
          switch (filter) {
            case "has_any_email":
              return groupContactStatus.hasAnyEmail;
            case "has_all_emails":
              return groupContactStatus.hasAllEmails;
            case "has_no_emails":
              return groupContactStatus.hasNoEmails;
            case "has_any_phone":
              return groupContactStatus.hasAnyPhone;
            case "has_all_phones":
              return groupContactStatus.hasAllPhones;
            case "has_no_phones":
              return groupContactStatus.hasNoPhones;
            case "has_complete_contact":
              return groupContactStatus.hasCompleteContactInfo;
            case "has_any_contact":
              return groupContactStatus.hasAnyContactInfo;
            default:
              return false;
          }
        });
        
        if (shouldIncludeGroup) {
          groupsToInclude.add(groupName);
        }
      });
      
      // Filter guests to only include those from qualifying groups
      filtered = filtered.filter((guest) =>
        groupsToInclude.has(guest.group) || !guest.group // Include individuals if no group
      );
    }

    // Apply sorting (default to group-based sorting)
    filtered = sortGuests(filtered, sortBy, sortDirection, secondarySortBy);

    return filtered;
  };

  const filteredGuests = getFilteredGuests();

  // Get unique filter options
  const getFilterOptions = () => {
    return {
      genders: [
        ...new Set(transformedGuestList.map((g) => g.gender).filter(Boolean)),
      ],
      ageGroups: [
        ...new Set(transformedGuestList.map((g) => g.ageGroup).filter(Boolean)),
      ],
      groups: [
        ...new Set(transformedGuestList.map((g) => g.group).filter(Boolean)),
      ],
      contactStatuses: [
        ...new Set(transformedGuestList.map((g) => g.contactStatus)),
      ],
      groupStatuses: [
        ...new Set(
          transformedGuestList.map((g) => g.groupStatus).filter(Boolean),
        ),
      ],
    };
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterBy("all");
    setFilterValue("");
    setGroupFilters([]);
    setStatusFilters({});
    setGenderFilters([]);
    setAgeGroupFilters([]);
    setContactFilters([]);
    setGroupStatusFilters([]);
    setGroupContactFilters([]);
  };

  // Handle multi-select filter changes
  const handleMultiSelectFilter = (filterType, value, checked) => {
    const setFilter = {
      group: setGroupFilters,
      gender: setGenderFilters,
      ageGroup: setAgeGroupFilters,
      contact: setContactFilters,
      groupStatus: setGroupStatusFilters,
      groupContact: setGroupContactFilters,
    }[filterType];

    if (setFilter) {
      setFilter((prev) => {
        if (checked) {
          return [...prev, value];
        } else {
          return prev.filter((item) => item !== value);
        }
      });
    }
  };

  // Handle per-subevent status filter changes
  const handleSubeventStatusFilter = (subeventName, statusId, checked) => {
    setStatusFilters((prev) => {
      const updated = { ...prev };
      if (!updated[subeventName]) {
        updated[subeventName] = [];
      }
      
      if (checked) {
        updated[subeventName] = [...updated[subeventName], statusId];
      } else {
        updated[subeventName] = updated[subeventName].filter((id) => id !== statusId);
        // Remove the subevent key if no statuses are selected
        if (updated[subeventName].length === 0) {
          delete updated[subeventName];
        }
      }
      
      return updated;
    });
  };

  // Get sorting indicator for table headers
  const getSortIndicator = (column) => {
    if (sortBy !== column) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Check if any advanced filters are active
  const hasAdvancedFilters = () => {
    return (
      groupFilters.length > 0 ||
      Object.values(statusFilters).some(filters => filters && filters.length > 0) ||
      genderFilters.length > 0 ||
      ageGroupFilters.length > 0 ||
      contactFilters.length > 0 ||
      groupStatusFilters.length > 0 ||
      groupContactFilters.length > 0
    );
  };

  // Handle column header clicks for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Group guests by their group name
  const groupGuestsByGroup = (guests) => {
    const grouped = {};
    guests.forEach((guest) => {
      const groupName = guest.group || `${guest.name} (Individual)`;
      if (!grouped[groupName]) {
        grouped[groupName] = {
          name: groupName,
          members: [],
          totalMembers: 0,
          invitedCount: 0,
          respondedCount: 0,
        };
      }
      grouped[groupName].members.push(guest);
      grouped[groupName].totalMembers++;
      if (guest.total_rsvps > 0) grouped[groupName].invitedCount++;
      if (Object.keys(guest.rsvpStatus || {}).length > 0)
        grouped[groupName].respondedCount++;
    });
    return grouped;
  };

  // Toggle group collapse
  const toggleGroupCollapse = (groupName) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Select/deselect entire group
  const handleGroupSelection = (groupName, isSelected) => {
    const groupGuests = filteredGuests.filter(
      (guest) => (guest.group || `${guest.name} (Individual)`) === groupName,
    );

    setSelectedRows((prev) => {
      if (isSelected) {
        // Add all group members to selection
        const newSelected = [...prev];
        groupGuests.forEach((guest) => {
          if (!newSelected.some((g) => g.id === guest.id)) {
            newSelected.push(guest);
          }
        });
        return newSelected;
      } else {
        // Remove all group members from selection
        return prev.filter(
          (guest) =>
            !groupGuests.some((groupGuest) => groupGuest.id === guest.id),
        );
      }
    });
  };

  // Check if entire group is selected
  const isGroupSelected = (groupName) => {
    const groupGuests = filteredGuests.filter(
      (guest) => (guest.group || `${guest.name} (Individual)`) === groupName,
    );
    if (groupGuests.length === 0) return false;
    return groupGuests.every((guest) =>
      selectedRows.some((selected) => selected.id === guest.id),
    );
  };

  // Get group statistics
  const getGroupStats = (groupName) => {
    const groupGuests = transformedGuestList.filter(
      (guest) => (guest.group || `${guest.name} (Individual)`) === groupName,
    );

    return {
      total: groupGuests.length,
      invited: groupGuests.filter((g) => g.total_rsvps > 0).length,
      responded: groupGuests.filter(
        (g) => Object.keys(g.rsvpStatus || {}).length > 0,
      ).length,
      pending: groupGuests.filter(
        (g) =>
          g.total_rsvps > 0 && Object.keys(g.rsvpStatus || {}).length === 0,
      ).length,
    };
  };

  // Render individual guest row
  const renderGuestRow = (guest, isGroupMember = false) => {
    const isPointOfContact = guest.isPointOfContact === true;
    const isSelected = isGuestSelected(guest);

    return (
      <tr
        key={guest.id}
        className={`${isPointOfContact ? styles.pointOfContactRow : ""} ${isSelected ? styles.selectedRow : ""
          } ${isGroupMember ? styles.groupMemberRow : ""}`}
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
              onClick={() => handleCopyRSVPLink(guest)}
              title="Copy RSVP link"
            >
              <MdContentCopy size={20} />
            </button>
            {/*<button
              type="button"
              className={`${styles.btnDanger} ${styles.btnIcon}`}
              onClick={() => handleRemoveGuest(guest.id)}
              title="Remove guest"
            >
              <MdDelete size={20} />
            </button>*/}
            <button
              type="button"
              className={`${styles.btnGhost} ${styles.btnIcon}`}
              onClick={() => handleShareWhatsApp(guest)}
              title="Share RSVP via WhatsApp"
              aria-label="Share RSVP via WhatsApp"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                role="img"
                aria-hidden="false"
              >
                <path
                  d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.373 0 .01 4.99.01 11.17c0 1.962.51 3.882 1.478 5.58L0 24l7.57-1.99A11.87 11.87 0 0 0 12 22.34c6.627 0 12-4.99 12-11.17 0-1.95-.51-3.85-1.48-5.7z"
                  fill="#25D366"
                />
                <path
                  d="M17.21 14.03c-.28-.14-1.64-.8-1.9-.89-.26-.09-.45-.14-.64.14-.19.28-.73.89-.9 1.07-.17.19-.34.21-.63.07-.29-.14-1.23-.45-2.34-1.45-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.12-.59.12-.12.26-.34.39-.51.13-.18.17-.31.26-.51.09-.19.04-.36-.02-.5-.06-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.45s1.03 2.85 1.17 3.05c.13.2 2.02 3.08 4.9 4.3 1.01.44 1.8.7 2.42.9.99.32 1.89.27 2.6.16.79-.13 2.43-.99 2.77-1.95.34-.95.34-1.76.24-1.95-.1-.19-.35-.31-.73-.45z"
                  fill="#fff"
                />
              </svg>
            </button>
          </div>
        </td>
        <td>
          <div className={styles.guestName}>
            {guest.name || "-"}
            {isPointOfContact && <span className={styles.pocBadge}>POC</span>}
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
                    backgroundColor:
                      groupColors[
                      Math.abs(guest.group.charCodeAt(0)) % groupColors.length
                      ],
                  }}
                />
                <span>{guest.group}</span>
              </>
            ) : (
              "-"
            )}
          </div>
        </td>
        <td>{guest.gender || "-"}</td>
        <td>{guest.ageGroup || "-"}</td>
        <td>{guest.tag || "-"}</td>
        {subevents.map((subevent) => {
          const rsvp = guest.rsvpStatus[subevent];
          return (
            <td key={subevent}>
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
        <td>
          <span
            className={`${styles.statusBadge} ${[3, 4, 5].includes(guest.group_status_id) 
                ? styles.statusInvited
                : styles.statusNotInvited
              }`}
          >
            {[3, 4, 5].includes(guest.group_status_id) ? "invited" : "pending"}
          </span>
        </td>
      </tr>
    );
  };

  // Render grouped table content
  const renderGroupedTable = () => {
    if (sortBy !== "group") {
      // Render flat table when not sorted by group
      return filteredGuests.map((guest) => renderGuestRow(guest));
    }

    // Group guests and render with group headers
    const grouped = groupGuestsByGroup(filteredGuests);
    const groupNames = Object.keys(grouped).sort();

    return groupNames.map((groupName) => {
      const groupData = grouped[groupName];
      const isCollapsed = collapsedGroups.has(groupName);
      const groupStats = getGroupStats(groupName);
      const isGroupFullySelected = isGroupSelected(groupName);

      return (
        <React.Fragment key={groupName}>
          {/* Group Header Row */}
          <tr className={styles.groupHeaderRow}>
            <td
              colSpan={subevents.length + 10}
              className={styles.groupHeaderCell}
            >
              <div className={styles.groupHeader}>
                <div className={styles.groupInfo}>
                  <button
                    className={styles.groupToggle}
                    onClick={() => toggleGroupCollapse(groupName)}
                    title={isCollapsed ? "Expand group" : "Collapse group"}
                  >
                    {isCollapsed ? "▶️" : "▼️"}
                  </button>

                  <input
                    type="checkbox"
                    checked={isGroupFullySelected}
                    onChange={(e) =>
                      handleGroupSelection(groupName, e.target.checked)
                    }
                    title="Select/deselect entire group"
                  />

                  <div
                    className={styles.groupColorDot}
                    style={{
                      backgroundColor:
                        groupColors[
                        Math.abs(groupName.charCodeAt(0)) % groupColors.length
                        ],
                    }}
                  />

                  <strong className={styles.groupName}>{groupName}</strong>

                  <div className={styles.groupStats}>
                    <span className={styles.groupStatBadge}>
                      <MdPeople size={16} /> {groupStats.total}
                    </span>
                    <span className={styles.groupStatBadge}>
                      <MdEmail size={16} /> {groupStats.invited}
                    </span>
                    <span className={styles.groupStatBadge}>
                      <MdCheckCircle size={16} /> {groupStats.responded}
                    </span>
                    <span className={styles.groupStatBadge}>
                      ⏳ {groupStats.pending}
                    </span>
                  </div>
                </div>

                <div className={styles.groupActions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => {
                      const groupGuests = filteredGuests.filter(
                        (guest) =>
                          (guest.group || `${guest.name} (Individual)`) ===
                          groupName,
                      );
                      setSelectedRows(groupGuests);
                    }}
                    title="Select group for email"
                  >
                    <MdEmail size={16} /> Select for Email
                  </button>
                </div>
              </div>
            </td>
          </tr>

          {/* Group Members */}
          {!isCollapsed &&
            groupData.members.map((guest) => renderGuestRow(guest, true))}
        </React.Fragment>
      );
    });
  };

  // Handle row selection
  const handleRowSelection = (guest, isSelected) => {
    setSelectedRows((prev) => {
      if (isSelected) {
        return [...prev, guest];
      } else {
        return prev.filter((g) => g.id !== guest.id);
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

  // Handle select all POCs
  const handleSelectAllPOCs = () => {
    const pocGuests = filteredGuests.filter(
      (guest) => guest.isPointOfContact === true,
    );
    setSelectedRows(pocGuests);
    toast(`Selected ${pocGuests.length} Point of Contact guests`);
  };

  // Check if guest is selected
  const isGuestSelected = (guest) => {
    return selectedRows.some((g) => g.id === guest.id);
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

  // Send Mail
  const SendMail = async () => {
    if (!session?.access_token) {
      toast("Authentication required");
      return;
    }

    if (!selectedTemplateId) {
      toast("Please select an email template");
      return;
    }

    toast("Sending Mail");
    const res = await fetch(`/api/${params.eventID}/sendMail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        guestList: selectedRows,
        templateId: selectedTemplateId,
      }),
    });
    const result = await res.json();

    if (res.status === 200 && result.success) {
      toast(
        `Mail sent! ${result.results.successful} successful, ${result.results.failed} did not have emails`,
      );
      if (result.guestList) {
        // Merge updated guests with existing guest list
        const updatedGuestList = guestList.map(guest => {
          const updatedGuest = result.guestList.find(updated => updated.id === guest.id);
          return updatedGuest || guest;
        });
        setGuestList(updatedGuestList);
      }
    } else {
      console.log(res.status, result);
      toast(
        `Failed to send mail: ${result.message || result.error || "Unknown error"}`,
      );
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
      // Merge updated guests with existing guest list
      const updatedGuestList = guestList.map(guest => {
        const updatedGuest = result.guestList.find(updated => updated.id === guest.id);
        return updatedGuest || guest;
      });
      setGuestList(updatedGuestList);
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
      // Merge updated guests with existing guest list
      const updatedGuestList = guestList.map(guest => {
        const updatedGuest = result.guestList.find(updated => updated.id === guest.id);
        return updatedGuest || guest;
      });
      setGuestList(updatedGuestList);
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
      // Merge updated guests with existing guest list
      const updatedGuestList = guestList.map(guest => {
        const updatedGuest = result.guestList.find(updated => updated.id === guest.id);
        return updatedGuest || guest;
      });
      setGuestList(updatedGuestList);
    } else {
      console.log(res.status, result.validated);
      toast("Failed to send invites, try again");
    }
  };

  // Handle removing a guest
  const handleRemoveGuest = async (guestId) => {
    if (!window.confirm("Are you sure you want to remove this guest?")) {
      return;
    }

    try {
      const response = await fetch(`/api/${params.eventID}/guests/${guestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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

  const handleShareWhatsApp = async (guest) => {
    try {
      console.log("WHATSAPP, ", guest);

      // Build the RSVP link
      const rsvpLink = `${window.location.origin}/${params.eventID}/rsvp?guestId=${guest.group_id}`;
      
      // Get the selected template or default
      const selectedTemplate = whatsappTemplates.find(t => t.id === selectedWhatsappTemplateId) || 
                              whatsappTemplates.find(t => t.is_default) || 
                              whatsappTemplates[0];
      
      // Set initial message with template variables replaced
      let initialMessage = "You are invited!";
      if (selectedTemplate) {
        initialMessage = replaceWhatsAppVariables(selectedTemplate.message, guest, rsvpLink, event);
      } else {
        // Fallback to old method if no templates
        initialMessage = `${event.details?.whatsapp_msg || 'You are invited!'}: ${rsvpLink}`;
      }
      
      setWhatsappMessage(initialMessage);

      // Clean the phone number (remove non-digits)
      let phoneNumber = guest.phone?.replace(/\D/g, "") || "";

      // Store guest data and show modal (always show modal now for message editing)
      setAreaCodeModalData({
        guest,
        phoneNumber,
        originalPhone: guest.phone,
        rsvpLink
      });
      setAreaCodeInput("");
      setShowAreaCodeModal(true);
    } catch (err) {
      console.error("Error opening WhatsApp share:", err);
      toast.error("Unable to open WhatsApp share.");
    }
  };

  const proceedWithWhatsAppShare = async (guest, finalPhoneNumber) => {
    try {
      // Use the edited message from the modal
      const message = whatsappMessage;

      // Construct WhatsApp URL
      const url = finalPhoneNumber
        ? `https://wa.me/${finalPhoneNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;

      console.log("WHATSAPP URL:", url);

      // Open WhatsApp
      window.open(url, "_blank", "noopener,noreferrer");

      // Update group status to "invited" (status_id: 3) after sharing
      if (session?.access_token && guest.group_id) {
        try {
          const response = await fetch(`/api/${params.eventID}/updateGroupStatus`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              group_id: guest.group_id,
              status_id: 3, // "invited" status
              invite_method: "whatsapp"
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            toast(`WhatsApp invitation sent to ${guest.name}! Group status updated to ${result.new_status}.`);
            // Refresh guest list to show updated status
            if (getGuestList && event) {
              await getGuestList(event);
            }
          } else {
            console.error("Failed to update group status:", result);
            toast(`WhatsApp shared with ${guest.name}, but status update failed.`);
          }
        } catch (statusError) {
          console.error("Error updating group status:", statusError);
          toast(`WhatsApp shared with ${guest.name}, but status update failed.`);
        }
      } else {
        toast(`WhatsApp shared with ${guest.name}!`);
      }
    } catch (err) {
      console.error("Error in WhatsApp share:", err);
      toast.error("Unable to open WhatsApp share.");
    }
  };

  const handleSendWhatsApp = () => {
    if (!areaCodeModalData) return;

    let finalPhoneNumber = areaCodeModalData.phoneNumber;

    // If there's a phone number and area code input, combine them
    if (finalPhoneNumber && areaCodeInput.trim()) {
      // Clean area code (remove non-digits)
      const cleanAreaCode = areaCodeInput.replace(/[^\d]/g, "");
      finalPhoneNumber = cleanAreaCode + areaCodeModalData.phoneNumber;
    }

    // Close modal and proceed
    const guest = areaCodeModalData.guest;
    setShowAreaCodeModal(false);
    setAreaCodeModalData(null);
    setAreaCodeInput("");
    
    // Encode phone number if it exists, otherwise empty string for general share
    const encodedPhoneNumber = finalPhoneNumber ? encodeURIComponent(finalPhoneNumber) : "";
    proceedWithWhatsAppShare(guest, encodedPhoneNumber);
  };

  const handleAreaCodeCancel = () => {
    setShowAreaCodeModal(false);
    setAreaCodeModalData(null);
    setAreaCodeInput("");
    setWhatsappMessage("");
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    toast(`Processing file: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast("CSV file must have at least a header row and one data row");
          return;
        }

        // Parse CSV and create guests
        const headers = lines[0].split(",").map((h) => h.trim());
        const nameIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("name"),
        );
        const emailIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("email"),
        );
        const phoneIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("phone"),
        );
        const genderIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("gender"),
        );
        const tagIndex = headers.findIndex((h) =>
          h.toLowerCase().includes("tag"),
        );

        const guestPayloads = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());

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
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              guests: guestPayloads,
              event: event,
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
        console.error("CSV parsing error:", error);
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
          disabled={!selectedTemplateId || selectedRows.length === 0}
          title="Send invite to selected guests"
        >
          <div className={styles.actionBtnIcon}><MdSend size={24} /></div>
          <div>
            <div>Send Invites</div>
            <div className={styles.actionBtnSubtitle}>
              Send to selected guests
            </div>
          </div>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.disabledBtn}`}
          disabled
          title="Feature temporarily disabled"
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <div className={styles.actionBtnIcon}>⏰</div>
          <div>
            <div>Send Reminders</div>
            <div className={styles.actionBtnSubtitle}>Coming soon</div>
          </div>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.disabledBtn}`}
          disabled
          title="Feature temporarily disabled"
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <div className={styles.actionBtnIcon}><MdCampaign size={24} /></div>
          <div>
            <div>Send Reminder All</div>
            <div className={styles.actionBtnSubtitle}>Coming soon</div>
          </div>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.disabledBtn}`}
          disabled
          title="Feature temporarily disabled"
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <div className={styles.actionBtnIcon}><MdRefresh size={24} /></div>
          <div>
            <div>Send Update All</div>
            <div className={styles.actionBtnSubtitle}>Coming soon</div>
          </div>
        </button>
      </div>

      {/* Guest List Section */}
      <div className={styles.guestSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Send Email</h2>
          <div className={styles.sectionControls}>
            <div className={styles.addGuestActions}>
              {/*              <button
                className={styles.btnOutlineSmall}
                onClick={() => {
                  setAddMode("individual");
                  setShowGuestForm(true);
                }}
              >
                <span><MdPerson size={18} /></span>
                Add Guest
              </button>
              <button
                className={styles.btnSecondarySmall}
                onClick={() => {
                  setAddMode("group");
                  setShowGuestForm(true);
                }}
              >
                <span><MdPeople size={18} /></span>
                Create Group
              </button>
              <label
                className={styles.btnPrimarySmall}
                style={{ cursor: "pointer" }}
              >
                <span><MdFolder size={18} /></span>
                Import CSV
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>*/}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>
              {selectedRows.length} guests selected
            </span>

            {/* Email Template Selection */}
            <div className={styles.templateSelection}>
              <label htmlFor="template-select" className={styles.templateLabel}>
                Email Template:
              </label>
              <select
                id="template-select"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className={styles.templateSelect}
              >
                <option value="">Select a template...</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title} ({template.category})
                  </option>
                ))}
              </select>
            </div>

            <button
              className={styles.btnPrimarySmall}
              onClick={SendMail}
              disabled={!selectedTemplateId}
            >
              Send Invites
            </button>
            <button
              className={styles.btnOutlineSmall}
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title="Feature temporarily disabled"
            >
              Send Reminders
            </button>
            <button className={styles.btnSecondarySmall}>
              Export Selected
            </button>
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
                <MdClose size={20} />
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
                <option value="">
                  Select {filterBy === "status" ? "status" : filterBy}...
                </option>
                {filterBy === "status" && (
                  <>
                    <option value="invited">Invited</option>
                    <option value="responded">Responded</option>
                    <option value="pending">Pending</option>
                  </>
                )}
                {filterBy === "gender" &&
                  getFilterOptions().genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                {filterBy === "ageGroup" &&
                  getFilterOptions().ageGroups.map((ageGroup) => (
                    <option key={ageGroup} value={ageGroup}>
                      {ageGroup}
                    </option>
                  ))}
                {filterBy === "group" &&
                  getFilterOptions().groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
              </select>
            )}

            {(searchTerm || filterBy !== "all" || hasAdvancedFilters()) && (
              <button
                className={`${styles.btnSecondarySmall}`}
                onClick={clearFilters}
                title="Clear all filters"
              >
                Clear Filters
              </button>
            )}

            <button
              className={`${styles.btnSecondarySmall} ${showAdvancedFilters ? styles.active : ""}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title="Toggle advanced filters"
            >
              <MdBuild size={18} /> Advanced Filters {showAdvancedFilters ? <MdExpandMore size={18} /> : <MdExpandLess size={18} />}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className={styles.advancedFiltersPanel}>
              <h4 className={styles.advancedFiltersTitle}>Advanced Filters</h4>

              <div className={styles.advancedFiltersGrid}>
                {/* Group Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>Groups:</label>
                  <div className={styles.checkboxGrid}>
                    {getFilterOptions().groups.map((group) => (
                      <label key={group} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={groupFilters.includes(group)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "group",
                              group,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{group}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Per-Subevent Status Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>Status by Sub-Event:</label>
                  {subevents.length === 0 ? (
                    <div style={{ color: "#666", fontStyle: "italic" }}>
                      No sub-events available
                    </div>
                  ) : (
                    subevents.map((subeventName) => (
                      <div key={subeventName} className={styles.subEventFilterGroup}>
                        <div className={styles.subEventLabel}>{subeventName}:</div>
                        <div className={styles.checkboxGrid}>
                          {[
                            { id: 0, label: "Not Invited" },
                            { id: 1, label: "Pending" },
                            { id: 3, label: "Attending" },
                            { id: 4, label: "Not Attending" },
                          ].map((status) => (
                            <label
                              key={`${subeventName}-${status.id}`}
                              className={styles.checkboxLabel}
                            >
                              <input
                                type="checkbox"
                                checked={statusFilters[subeventName]?.includes(status.id) || false}
                                onChange={(e) =>
                                  handleSubeventStatusFilter(
                                    subeventName,
                                    status.id,
                                    e.target.checked,
                                  )
                                }
                              />
                              <span>{status.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Gender Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>Gender:</label>
                  <div className={styles.checkboxGrid}>
                    {getFilterOptions().genders.map((gender) => (
                      <label key={gender} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={genderFilters.includes(gender)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "gender",
                              gender,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Group Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>Age Groups:</label>
                  <div className={styles.checkboxGrid}>
                    {getFilterOptions().ageGroups.map((ageGroup) => (
                      <label key={ageGroup} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={ageGroupFilters.includes(ageGroup)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "ageGroup",
                              ageGroup,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{ageGroup}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Contact Info Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>
                    Contact Info:
                  </label>
                  <div className={styles.checkboxGrid}>
                    {getFilterOptions().contactStatuses.map((contactStatus) => (
                      <label
                        key={contactStatus}
                        className={styles.checkboxLabel}
                      >
                        <input
                          type="checkbox"
                          checked={contactFilters.includes(contactStatus)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "contact",
                              contactStatus,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{contactStatus}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group Status Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>
                    Group Status:
                  </label>
                  <div className={styles.checkboxGrid}>
                    {getFilterOptions().groupStatuses.map((groupStatus) => (
                      <label key={groupStatus} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={groupStatusFilters.includes(groupStatus)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "groupStatus",
                              groupStatus,
                              e.target.checked,
                            )
                          }
                        />
                        <span className="capitalize">{groupStatus}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group Contact Filters */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterGroupLabel}>
                    Group Contact Info:
                  </label>
                  <div className={styles.checkboxGrid}>
                    {[
                      { value: "has_any_email", label: "Groups with Any Email" },
                      { value: "has_all_emails", label: "Groups with All Emails" },
                      { value: "has_no_emails", label: "Groups with No Emails" },
                      { value: "has_any_phone", label: "Groups with Any Phone" },
                      { value: "has_all_phones", label: "Groups with All Phones" },
                      { value: "has_no_phones", label: "Groups with No Phones" },
                      { value: "has_complete_contact", label: "Groups with Complete Contact" },
                      { value: "has_any_contact", label: "Groups with Any Contact Info" },
                    ].map((option) => (
                      <label key={option.value} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={groupContactFilters.includes(option.value)}
                          onChange={(e) =>
                            handleMultiSelectFilter(
                              "groupContact",
                              option.value,
                              e.target.checked,
                            )
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.filterQuickActions}>
                <button
                  className={styles.btnOutlineSmall}
                  onClick={() => {
                    setGroupFilters(getFilterOptions().groups);
                    setStatusFilters([
                      "invited",
                      "not_invited",
                      "responded",
                      "pending",
                    ]);
                    setGenderFilters(getFilterOptions().genders);
                    setAgeGroupFilters(getFilterOptions().ageGroups);
                    setContactFilters(getFilterOptions().contactStatuses);
                    setGroupStatusFilters(getFilterOptions().groupStatuses);
                    setGroupContactFilters([
                      "has_any_email",
                      "has_all_emails", 
                      "has_no_emails",
                      "has_any_phone",
                      "has_all_phones",
                      "has_no_phones", 
                      "has_complete_contact",
                      "has_any_contact"
                    ]);
                  }}
                >
                  Select All
                </button>
                <button
                  className={styles.btnOutlineSmall}
                  onClick={() => {
                    setGroupFilters([]);
                    setStatusFilters({});
                    setGenderFilters([]);
                    setAgeGroupFilters([]);
                    setContactFilters([]);
                    setGroupStatusFilters([]);
                    setGroupContactFilters([]);
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div className={styles.sortControls}>
          <div className={styles.sortInfo}>
            <span>Showing {filteredGuests.length} guests</span>
            <span>
              • Sorted by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} (
              {sortDirection === "asc" ? "A-Z" : "Z-A"})
            </span>
            {secondarySortBy && (
              <span>
                • Then by:{" "}
                {secondarySortBy.charAt(0).toUpperCase() +
                  secondarySortBy.slice(1)}
              </span>
            )}
          </div>
          <div className={styles.sortPresets}>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "group" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("group");
                setSecondarySortBy("name");
                setSortDirection("asc");
              }}
            >
              <MdFolder size={16} /> Group → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "inviteStatus" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("inviteStatus");
                setSecondarySortBy("name");
                setSortDirection("asc");
              }}
            >
              <MdEmail size={16} /> Status → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "groupStatus" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("groupStatus");
                setSecondarySortBy("name");
                setSortDirection("asc");
              }}
            >
              <MdCheckCircle size={16} /> Group Status → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "contactStatus" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("contactStatus");
                setSecondarySortBy("name");
                setSortDirection("asc");
              }}
            >
              <MdPhone size={16} /> Contact Info → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "hasEmail" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("hasEmail");
                setSecondarySortBy("name");
                setSortDirection("desc");
              }}
            >
              <MdEmail size={16} /> Has Email → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "hasPhone" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("hasPhone");
                setSecondarySortBy("name");
                setSortDirection("desc");
              }}
            >
              <MdPhone size={16} /> Has Phone → Name
            </button>
            <button
              className={`${styles.btnOutlineSmall} ${sortBy === "ageGroup" && secondarySortBy === "name" ? styles.active : ""}`}
              onClick={() => {
                setSortBy("ageGroup");
                setSecondarySortBy("name");
                setSortDirection("asc");
              }}
            >
              <MdPeople size={16} /> Age → Name
            </button>
            <button
              className={styles.btnPrimarySmall}
              onClick={handleSelectAllPOCs}
              title="Select all Point of Contact guests"
            >
              <MdStar size={16} /> Select All POCs
            </button>
          </div>
        </div>

        {/* Guest Table */}
        {filteredGuests.length === 0 ? (
          <div className={styles.noResultsContainer}>
            <div className={styles.noResultsIcon}><MdSearch size={48} /></div>
            <h4 className={styles.noResultsTitle}>No guests found</h4>
            <p className={styles.noResultsText}>
              {searchTerm || filterBy !== "all" || hasAdvancedFilters()
                ? "Try adjusting your search or filter criteria"
                : "No guests have been added yet"}
            </p>
            {(searchTerm || filterBy !== "all" || hasAdvancedFilters()) && (
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
                        checked={
                          selectedRows.length === filteredGuests.length &&
                          filteredGuests.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Actions</th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("name")}
                      title="Click to sort by name"
                    >
                      Name {getSortIndicator("name")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("email")}
                      title="Click to sort by email"
                    >
                      Email {getSortIndicator("email")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("phone")}
                      title="Click to sort by phone"
                    >
                      Phone {getSortIndicator("phone")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("group")}
                      title="Click to sort by group"
                    >
                      Group {getSortIndicator("group")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("gender")}
                      title="Click to sort by gender"
                    >
                      Gender {getSortIndicator("gender")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("ageGroup")}
                      title="Click to sort by age group"
                    >
                      Age Group {getSortIndicator("ageGroup")}
                    </th>
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("tag")}
                      title="Click to sort by tag"
                    >
                      Tag {getSortIndicator("tag")}
                    </th>
                    {subevents.map((subevent) => (
                      <th key={subevent}>{subevent}</th>
                    ))}
                    <th
                      className={styles.sortableHeader}
                      onClick={() => handleSort("inviteStatus")}
                      title="Click to sort by invite status"
                    >
                      Invite Status {getSortIndicator("inviteStatus")}
                    </th>
                  </tr>
                </thead>
                <tbody>{renderGroupedTable()}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Guest Form Modal - REMOVED */}
      {false && (
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
                    guestType: "single",
                    guestLimit: null,
                  });
                  setNewGroup({ name: "", members: [] });
                  setTempGroupMembers([]);
                  setEditingMemberIndex(-1);
                }}
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className={styles.modalContent}>
              {addMode === "individual" ? (
                <>
                  {/* Guest Information Section */}
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Guest Information
                    </h4>
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
                          placeholder="Guest name"
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
                          placeholder="guest@example.com"
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
                            setNewGuest({
                              ...newGuest,
                              ageGroup: e.target.value,
                            })
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
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Group</label>
                        <select
                          className={styles.formSelect}
                          value={newGuest.selectedGroup}
                          onChange={(e) =>
                            handleGroupSelectionChange(e.target.value)
                          }
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
                        <label className={styles.formLabel}>Guest Type</label>
                        <select
                          className={styles.formSelect}
                          value={newGuest.guestType}
                          onChange={(e) =>
                            handleGuestTypeChange(e.target.value)
                          }
                        >
                          {guestTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <div className={styles.fieldHelp}>
                          {
                            guestTypes.find(
                              (t) => t.value === newGuest.guestType,
                            )?.description
                          }
                        </div>
                      </div>
                      {newGuest.guestType === "multiple" && (
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Guest Limit *
                          </label>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={newGuest.guestLimit || ""}
                            onChange={(e) =>
                              setNewGuest({
                                ...newGuest,
                                guestLimit: parseInt(e.target.value) || null,
                              })
                            }
                            placeholder="Enter maximum number of guests"
                            min="0"
                            required
                          />
                          <div className={styles.fieldHelp}>
                            Maximum number of guests this person can bring
                            (including themselves)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Point of Contact Section */}
                  <div className={styles.formSectionGroup}>
                    <label className={styles.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={newGuest.isPointOfContact}
                        onChange={(e) => handlePOCChange(e.target.checked)}
                      />
                      <span>Point of Contact</span>
                    </label>
                    <div className={styles.fieldHelp}>
                      Point of contact will receive important updates and can
                      help coordinate with their group
                      {newGuest.selectedGroup &&
                        groupHasPOC(newGuest.selectedGroup) && (
                          <div className={styles.pocWarningText}>
                            This group already has a POC (
                            {getCurrentPOCName(newGuest.selectedGroup)}).
                            Checking this box will transfer POC status to this
                            guest.
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Sub-Event Selection */}
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Sub-Event Invitations
                    </h4>
                    {loadingSubEvents ? (
                      <div className={styles.loadingIndicator}>
                        Loading sub-events...
                      </div>
                    ) : (
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
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Group Name Section */}
                  <div className={styles.formSectionGroup}>
                    <h4 className={styles.formSectionTitle}>
                      Group Information
                    </h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Group Name *</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={newGroup.name}
                          onChange={(e) =>
                            setNewGroup({ ...newGroup, name: e.target.value })
                          }
                          placeholder="Enter group name"
                          required
                        />
                      </div>
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
                          <label className={styles.formLabel}>Email</label>
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
                          <label className={styles.formLabel}>Age Group</label>
                          <select
                            className={styles.formSelect}
                            value={newGuest.ageGroup}
                            onChange={(e) =>
                              setNewGuest({
                                ...newGuest,
                                ageGroup: e.target.value,
                              })
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
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Guest Type</label>
                          <select
                            className={styles.formSelect}
                            value={newGuest.guestType}
                            onChange={(e) =>
                              handleGuestTypeChange(e.target.value)
                            }
                          >
                            {guestTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <div className={styles.fieldHelp}>
                            {
                              guestTypes.find(
                                (t) => t.value === newGuest.guestType,
                              )?.description
                            }
                          </div>
                        </div>
                        {newGuest.guestType === "multiple" && (
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Guest Limit *
                            </label>
                            <input
                              type="number"
                              className={styles.formInput}
                              value={newGuest.guestLimit || ""}
                              onChange={(e) =>
                                setNewGuest({
                                  ...newGuest,
                                  guestLimit: parseInt(e.target.value) || null,
                                })
                              }
                              placeholder="Enter maximum number of guests"
                              min="0"
                              required
                            />
                            <div className={styles.fieldHelp}>
                              Maximum number of guests this person can bring
                              (including themselves)
                            </div>
                          </div>
                        )}
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
                          {loadingSubEvents ? (
                            <div className={styles.loadingIndicator}>
                              Loading sub-events...
                            </div>
                          ) : (
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
                          )}
                        </div>

                        <button
                          type="button"
                          className={styles.btnSecondary}
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
                                {member.email} • {member.phone || "No phone"} •
                                {member.gender || "No gender"} •
                                {member.ageGroup
                                  ? ageGroups.find(
                                    (group) =>
                                      group.value === member.ageGroup,
                                  )?.label || member.ageGroup
                                  : "No age group"}
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
                                className={styles.btnGhost}
                                onClick={() => handleEditMember(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.btnDanger}
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
                    guestType: "single",
                    guestLimit: null,
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
                  } else if (addMode === "group") {
                    handleCreateGroup();
                  }
                }}
                disabled={
                  addMode === "group"
                    ? !newGroup.name.trim() || tempGroupMembers.length === 0
                    : !newGuest.name.trim()
                }
              >
                {editingGuest
                  ? "Save Changes"
                  : addMode === "group"
                    ? "Create Group"
                    : "Add Guest"}
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
              <div className={styles.confirmationIcon}><MdPeople size={48} /></div>
              <div className={styles.confirmationMessage}>
                <p>
                  This will transfer the point of contact role from{" "}
                  <strong>{pocTransferData.fromName}</strong> to{" "}
                  <strong>{pocTransferData.toName}</strong> for the group{" "}
                  <strong>{pocTransferData.groupName}</strong>.
                </p>
                <p className={styles.confirmationSubtext}>
                  The previous point of contact will no longer receive important
                  updates for this group.
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

      {/* Area Code Modal */}
      {showAreaCodeModal && areaCodeModalData && (
        <div className={styles.guestFormOverlay}>
          <div className={styles.areaCodeModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.whatsappIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.373 0 .01 4.99.01 11.17c0 1.962.51 3.882 1.478 5.58L0 24l7.57-1.99A11.87 11.87 0 0 0 12 22.34c6.627 0 12-4.99 12-11.17 0-1.95-.51-3.85-1.48-5.7z" fill="#25D366"/>
                    <path d="M17.21 14.03c-.28-.14-1.64-.8-1.9-.89-.26-.09-.45-.14-.64.14-.19.28-.73.89-.9 1.07-.17.19-.34.21-.63.07-.29-.14-1.23-.45-2.34-1.45-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.12-.59.12-.12.26-.34.39-.51.13-.18.17-.31.26-.51.09-.19.04-.36-.02-.5-.06-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.45s1.03 2.85 1.17 3.05c.13.2 2.02 3.08 4.9 4.3 1.01.44 1.8.7 2.42.9.99.32 1.89.27 2.6.16.79-.13 2.43-.99 2.77-1.95.34-.95.34-1.76.24-1.95-.1-.19-.35-.31-.73-.45z" fill="#fff"/>
                  </svg>
                </span>
                WhatsApp Invitation
              </h3>
              <button
                className={styles.closeModal}
                onClick={handleAreaCodeCancel}
                title="Close"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className={styles.areaCodeContent}>
              <div className={styles.guestInfo}>
                <div className={styles.guestAvatar}>
                  {areaCodeModalData.guest.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.guestDetails}>
                  <h4 className={styles.guestName}>{areaCodeModalData.guest.name}</h4>
                  <p className={styles.guestPhone}>{areaCodeModalData.originalPhone}</p>
                </div>
              </div>

              <div className={styles.areaCodeForm}>
                {/* Template Selection Section */}
                {whatsappTemplates.length > 0 && (
                  <div className={styles.templateSection}>
                    <label className={styles.inputLabel}>Choose Template</label>
                    <select
                      className={styles.formInput}
                      value={selectedWhatsappTemplateId}
                      onChange={(e) => {
                        setSelectedWhatsappTemplateId(e.target.value);
                        const template = whatsappTemplates.find(t => t.id === e.target.value);
                        if (template && areaCodeModalData) {
                          const rsvpLink = areaCodeModalData.rsvpLink;
                          const replacedMessage = replaceWhatsAppVariables(template.message, areaCodeModalData.guest, rsvpLink, event);
                          setWhatsappMessage(replacedMessage);
                        }
                      }}
                      style={{ marginBottom: "8px" }}
                    >
                      {whatsappTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                          {template.is_default && " (Default)"}
                        </option>
                      ))}
                    </select>
                    <div style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "16px"
                    }}>
                      Templates can be managed in the "Edit Templates" section
                    </div>
                  </div>
                )}

                {/* Message Preview Section */}
                <div className={styles.messageSection}>
                  <label className={styles.inputLabel}>Message Preview</label>
                  <div className={styles.messagePreview}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageIcon}><MdMessage size={16} /></span>
                      <span>WhatsApp Message</span>
                    </div>
                    <textarea
                      className={styles.messageTextarea}
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Enter your WhatsApp message..."
                      rows="4"
                    />
                    <div className={styles.messageFooter}>
                      <span className={styles.characterCount}>
                        {whatsappMessage.length} characters
                      </span>
                      <div style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        marginTop: "4px"
                      }}>
                        <div>Basic: {"{rsvp_link}"}, {"{event_title}"}, {"{guest_name}"}</div>
                        {event?.subEvents && event.subEvents.length > 0 && (
                          <div style={{ marginTop: "2px" }}>
                            Subevents: {event.subEvents.map(se => {
                              const cleanTitle = se.title.replace(/[^a-zA-Z0-9]/g, '');
                              return cleanTitle ? `{${cleanTitle}_date}, {${cleanTitle}_location}, {${cleanTitle}_time}` : '';
                            }).filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Number Section */}
                {areaCodeModalData.phoneNumber && (
                  <>
                    <div className={styles.formDescription}>
                      <p>Do you want to add a country code to this phone number?</p>
                      <p className={styles.formHint}>This helps ensure the WhatsApp link works internationally</p>
                    </div>

                    <div className={styles.areaCodeInput}>
                      <label className={styles.inputLabel}>Country Code (optional)</label>
                      <div className={styles.inputContainer}>
                        <span className={styles.inputPrefix}>+</span>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={areaCodeInput}
                          onChange={(e) => setAreaCodeInput(e.target.value)}
                          placeholder="1, 44, 91, etc."
                          maxLength="4"
                        />
                      </div>
                      <div className={styles.inputHelp}>
                        Examples: +1 (US/CA), +44 (UK), +91 (India), +49 (Germany)
                      </div>
                    </div>

                    <div className={styles.phonePreview}>
                      <span className={styles.previewLabel}>Final number:</span>
                      <span className={styles.previewNumber}>
                        {areaCodeInput.trim() 
                          ? `+${areaCodeInput.replace(/[^\d]/g, "")}${areaCodeModalData.phoneNumber}`
                          : areaCodeModalData.originalPhone
                        }
                      </span>
                    </div>
                  </>
                )}

                {/* No Phone Number Message */}
                {!areaCodeModalData.phoneNumber && (
                  <div className={styles.noPhoneMessage}>
                    <div className={styles.noPhoneIcon}><MdPhone size={24} /></div>
                    <p>No phone number available for this guest.</p>
                    <p className={styles.formHint}>The message will be opened as a general WhatsApp share.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.areaCodeActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleAreaCodeCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSendWhatsApp}
                disabled={!whatsappMessage.trim()}
              >
                <span className={styles.whatsappIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.373 0 .01 4.99.01 11.17c0 1.962.51 3.882 1.478 5.58L0 24l7.57-1.99A11.87 11.87 0 0 0 12 22.34c6.627 0 12-4.99 12-11.17 0-1.95-.51-3.85-1.48-5.7z" fill="currentColor"/>
                    <path d="M17.21 14.03c-.28-.14-1.64-.8-1.9-.89-.26-.09-.45-.14-.64.14-.19.28-.73.89-.9 1.07-.17.19-.34.21-.63.07-.29-.14-1.23-.45-2.34-1.45-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.12-.59.12-.12.26-.34.39-.51.13-.18.17-.31.26-.51.09-.19.04-.36-.02-.5-.06-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.45s1.03 2.85 1.17 3.05c.13.2 2.02 3.08 4.9 4.3 1.01.44 1.8.7 2.42.9.99.32 1.89.27 2.6.16.79-.13 2.43-.99 2.77-1.95.34-.95.34-1.76.24-1.95-.1-.19-.35-.31-.73-.45z" fill="#fff"/>
                  </svg>
                </span>
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailPortal;
