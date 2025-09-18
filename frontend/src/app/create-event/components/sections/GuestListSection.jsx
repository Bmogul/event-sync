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
    ageGroup: "",
    tag: "",
    selectedGroup: "", // New field for group selection
    subEventRSVPs: {},
    isPointOfContact: true, // Default to true for individual guests
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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, gender, ageGroup, group, subEvent
  const [filterValue, setFilterValue] = useState("");

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

  // Filter guests based on search term and filters
  const getFilteredGuests = () => {
    let filtered = eventData.guests || [];
    
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
        case "subEvent":
          filtered = filtered.filter(guest => guest.subEventRSVPs?.[filterValue] === "invited");
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };

  const filteredGuests = getFilteredGuests();

  // Statistics calculations
  const totalGuests = eventData.guests?.length || 0;
  const filteredGuestsCount = filteredGuests.length;
  const totalGroups = eventData.guestGroups?.length || 0;

  // Get sub-events from event data with proper title mapping
  const getSubEvents = () => {
    if (eventData.subEvents && eventData.subEvents.length > 0) {
      return eventData.subEvents.map(subEvent => ({
        id: subEvent.id,
        name: subEvent.title || `Sub-Event ${subEvent.id}` // Use title field
      }));
    }
    // Fallback if no sub-events defined
    return [
      { id: 1, name: "Main Event" }
    ];
  };

  const subEvents = getSubEvents();

  // Get existing groups for dropdown
  const getExistingGroups = () => {
    return eventData.guestGroups?.filter(group => group.size > 0) || [];
  };

  // Get unique filter options
  const getFilterOptions = () => {
    const guests = eventData.guests || [];
    return {
      genders: [...new Set(guests.map(g => g.gender).filter(Boolean))],
      ageGroups: [...new Set(guests.map(g => g.ageGroup).filter(Boolean))],
      groups: [...new Set(guests.map(g => g.group).filter(Boolean))],
    };
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterBy("all");
    setFilterValue("");
  };

  // Check if a group already has a point of contact
  const groupHasPOC = (groupTitle) => {
    const groupGuests = eventData.guests?.filter(guest => guest.group === groupTitle) || [];
    return groupGuests.some(guest => guest.isPointOfContact === true);
  };

  // Get the current POC name for a group
  const getCurrentPOCName = (groupTitle) => {
    const groupGuests = eventData.guests?.filter(guest => guest.group === groupTitle) || [];
    const pocGuest = groupGuests.find(guest => guest.isPointOfContact === true);
    return pocGuest?.name || null;
  };

  // Handle group selection change
  const handleGroupSelectionChange = (selectedGroup) => {
    setNewGuest(prev => ({
      ...prev,
      selectedGroup,
      // Auto-uncheck POC when selecting a group, unless it's the same group they're already in
      isPointOfContact: selectedGroup ? 
        (editingGuest && selectedGroup === editingGuest.group ? prev.isPointOfContact : false) : 
        true
    }));
  };

  // Handle POC checkbox change with confirmation
  const handlePOCChange = (checked) => {
    if (checked && newGuest.selectedGroup && groupHasPOC(newGuest.selectedGroup)) {
      // Check if we're editing and it's their current group - no transfer needed
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

    // Check POC validation for group members
    if (newGuest.isPointOfContact) {
      const hasPOC = tempGroupMembers.some(member => member.isPointOfContact);
      if (hasPOC && editingMemberIndex === -1) {
        toast.error("This group already has a point of contact. Please uncheck 'Point of Contact' for this member.", {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
      if (hasPOC && editingMemberIndex >= 0 && !tempGroupMembers[editingMemberIndex].isPointOfContact) {
        toast.error("This group already has a point of contact. Please uncheck 'Point of Contact' for this member.", {
          position: "top-center",
          autoClose: 4000,
        });
        return;
      }
    }

    const memberData = {
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || "",
      gender: newGuest.gender || "",
      ageGroup: newGuest.ageGroup || "",
      tag: newGuest.tag || "",
      subEventRSVPs: { ...newGuest.subEventRSVPs },
      isPointOfContact: newGuest.isPointOfContact,
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
      ageGroup: "",
      tag: "",
      selectedGroup: "",
      subEventRSVPs: {},
      isPointOfContact: false, // Keep false for group members
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
      ageGroup: member.ageGroup,
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
        ageGroup: "",
        tag: "",
        selectedGroup: "",
        subEventRSVPs: {},
        isPointOfContact: false, // Keep false for group members
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
    };

    const newGuests = tempGroupMembers.map((member, index) => {
      const guestId = Date.now() + index;
      const guestPublicId = crypto.randomUUID();

      return {
        id: guestId,
        public_id: guestPublicId,
        order: index + 1,
        name: member.name,
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        ageGroup: member.ageGroup,
        tag: member.tag,
        group: newGroup.name,
        rsvpStatus: "pending",
        plusOne: false,
        subEventRSVPs: member.subEventRSVPs,
        invitedAt: null,
        respondedAt: null,
        isPointOfContact: member.isPointOfContact || false, // Store POC as boolean on guest
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
      ageGroup: "",
      tag: "",
      selectedGroup: "",
      subEventRSVPs: {},
      isPointOfContact: true, // Default to true after creating group
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

    // No need for POC validation here as it's handled by confirmation dialog

    let groupTitle, groupId, updatedGroups = [...(eventData.guestGroups || [])];
    
    if (newGuest.selectedGroup) {
      // Adding to existing group
      groupTitle = newGuest.selectedGroup;
      const existingGroup = updatedGroups.find(g => g.title === groupTitle);
      if (existingGroup) {
        existingGroup.size += 1;
        groupId = existingGroup.id;
      }
    } else {
      // Creating new individual group
      groupTitle = `${newGuest.name} (Individual)`;
      groupId = Date.now();
      
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
      };
      updatedGroups.push(individualGroup);
    }

    const guestId = Date.now() + Math.random();
    const guestPublicId = crypto.randomUUID();
    const guest = {
      id: guestId,
      public_id: guestPublicId,
      order:
        (eventData.guests?.filter((g) => g.group === groupTitle).length || 0) +
        1,
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || "",
      gender: newGuest.gender || "",
      ageGroup: newGuest.ageGroup || "",
      tag: newGuest.tag || "",
      group: groupTitle,
      rsvpStatus: "pending",
      plusOne: false,
      subEventRSVPs: newGuest.subEventRSVPs,
      invitedAt: null,
      respondedAt: null,
      isPointOfContact: newGuest.isPointOfContact || false, // Store POC as boolean on guest
    };

    // If this guest is being set as POC, remove POC status from other guests in the group
    if (newGuest.isPointOfContact) {
      const updatedGuestsWithPOCTransfer = (eventData.guests || []).map(existingGuest => {
        if (existingGuest.group === groupTitle && existingGuest.isPointOfContact) {
          return { ...existingGuest, isPointOfContact: false };
        }
        return existingGuest;
      });
      
      // Update the event data with the POC transfer
      updateEventData({ guests: updatedGuestsWithPOCTransfer });
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
      ageGroup: "",
      tag: "",
      selectedGroup: "",
      subEventRSVPs: {},
      isPointOfContact: true, // Default to true for individual guests
    });
    setShowGuestForm(false);
    
    const successMessage = newGuest.selectedGroup 
      ? `Guest added to "${newGuest.selectedGroup}" successfully!`
      : "Individual guest added successfully!";
    
    toast.success(successMessage, {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Handle removing a guest
  const handleRemoveGuest = (guestId) => {
    const guest = eventData.guests?.find((g) => g.id === guestId);
    if (!guest) return;

    let updatedGuests = eventData.guests.filter((g) => g.id !== guestId);
    let updatedGroups = [...(eventData.guestGroups || [])];

    const group = updatedGroups.find((g) => g.title === guest.group);
    if (group) {
      group.size = (group.size || 1) - 1;

      if (group.size <= 0) {
        updatedGroups = updatedGroups.filter((g) => g.id !== group.id);
      } else if (guest.isPointOfContact) {
        // If the removed guest was the POC, assign POC to the first remaining member
        const remainingGroupMembers = updatedGuests.filter(
          (g) => g.group === group.title,
        );
        if (remainingGroupMembers.length > 0) {
          updatedGuests = updatedGuests.map(g => {
            if (g.id === remainingGroupMembers[0].id) {
              return { ...g, isPointOfContact: true };
            }
            return g;
          });
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
    console.log(guest)
    setEditingGuest(guest);
    setAddMode("individual"); // Always edit as individual for simplicity

    // Check if this guest is the point of contact for their group
    const isCurrentPOC = guest.isPointOfContact === true;

    setNewGuest({
      name: guest.name,
      email: guest.email,
      phone: guest.phone || "",
      gender: guest.gender || "",
      ageGroup: guest.ageGroup || "",
      tag: guest.tag || "",
      selectedGroup: guest.group || "",
      subEventRSVPs: guest.subEventRSVPs || {},
      isPointOfContact: isCurrentPOC, // Set based on actual POC status
    });
    setShowGuestForm(true);
  };

  // Handle saving edited guest
  const handleSaveEdit = () => {
    console.log("GUEST: ", newGuest);
    if (!editingGuest){ 
      console.log('not editing')
      return;}
    
    if (!newGuest.name.trim()) {
      toast.error("Guest name is required", { position: "top-center" });
      return;
    }
    console.log('guest name validated')

    // No need for POC validation here as it's handled by confirmation dialog

    const oldGroup = editingGuest.group;
    const newGroupTitle = newGuest.selectedGroup || `${newGuest.name} (Individual)`;
    let updatedGroups = [...(eventData.guestGroups || [])];
    
    // Handle group changes
    if (oldGroup !== newGroupTitle) {
      // Remove from old group
      const oldGroupObj = updatedGroups.find(g => g.title === oldGroup);
      if (oldGroupObj) {
        oldGroupObj.size -= 1;
        // If this was the POC and group still has members, assign POC to someone else
        if (editingGuest.isPointOfContact) {
          const remainingMembers = eventData.guests?.filter(
            g => g.group === oldGroup && g.id !== editingGuest.id
          ) || [];
          if (remainingMembers.length > 0) {
            // Update the first remaining member to be the new POC
            const updatedGuestsForPOCTransfer = eventData.guests.map(guest => {
              if (guest.id === remainingMembers[0].id) {
                return { ...guest, isPointOfContact: true };
              }
              return guest;
            });
            updateEventData({ guests: updatedGuestsForPOCTransfer });
          }
        }
        // Remove group if no members left
        if (oldGroupObj.size <= 0) {
          updatedGroups = updatedGroups.filter(g => g.id !== oldGroupObj.id);
        }
      }

      // Add to new group or create new group
      if (newGuest.selectedGroup) {
        // Adding to existing group
        const existingGroup = updatedGroups.find(g => g.title === newGroupTitle);
        if (existingGroup) {
          existingGroup.size += 1;
        }
      } else {
        // Create new individual group
        const newGroup = {
          id: Date.now(),
          event_id: eventData.id || null,
          title: newGroupTitle,
          size: 1,
          invite_sent_at: null,
          invite_sent_by: null,
          status: "draft",
          details: {
            color: groupColors[updatedGroups.length % groupColors.length],
            description: "Individual guest",
          },
        };
        updatedGroups.push(newGroup);
      }
    }

    console.log('group changes handled')

    // Update the guest
    let updatedGuests = eventData.guests?.map(guest => {
      if (guest.id === editingGuest.id) {
        return {
          ...guest,
          name: newGuest.name,
          email: newGuest.email,
          phone: newGuest.phone || "",
          gender: newGuest.gender || "",
          ageGroup: newGuest.ageGroup || "",
          tag: newGuest.tag || "",
          group: newGroupTitle,
          subEventRSVPs: newGuest.subEventRSVPs,
          isPointOfContact: newGuest.isPointOfContact || false, // Include POC status in update
        };
      }
      return guest;
    }) || [];
    console.log("PART 1", updatedGuests,newGuest)

    // Handle POC status change
    if (newGuest.isPointOfContact) {
      // If this guest is being set as POC, remove POC status from other guests in the group
      updatedGuests = updatedGuests.map(guest => {
        if (guest.group === newGroupTitle && guest.id !== editingGuest.id && guest.isPointOfContact) {
          return { ...guest, isPointOfContact: false };
        }
        return guest;
      });
    }

    console.log("PART 2", updatedGuests,newGuest)

    updateEventData({
      guests: updatedGuests,
      guestGroups: updatedGroups,
    });

    setNewGuest({
      name: "",
      email: "",
      phone: "",
      gender: "",
      ageGroup: "",
      tag: "",
      selectedGroup: "",
      subEventRSVPs: {},
      isPointOfContact: true, // Default to true for individual guests
    });
    setEditingGuest(null);
    setShowGuestForm(false);
    
    toast.success("Guest updated successfully!", {
      position: "top-center",
      autoClose: 2000,
    });
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        console.log('Total lines after filtering:', lines.length);
        console.log('First few lines:', lines.slice(0, 5));
        
        if (lines.length < 2) {
          toast.error("CSV file must have at least a header row and one data row", {
            position: "top-center",
          });
          return;
        }

        // Skip first empty line if exists and get header
        let headerIndex = 0;
        while (headerIndex < lines.length) {
          const line = lines[headerIndex].trim();
          if (!line) {
            headerIndex++;
            continue;
          }
          
          const cells = line.split(',').map(h => h.trim());
          // Check if this line has actual header content (not all empty)
          if (cells.some(cell => cell && cell.toLowerCase().includes('name'))) {
            break;
          }
          
          headerIndex++;
        }
        
        if (headerIndex >= lines.length) {
          toast.error("No valid header found in CSV file", {
            position: "top-center",
          });
          return;
        }

        const headers = lines[headerIndex].split(',').map(h => h.trim());
        const dataLines = lines.slice(headerIndex + 1);
        
        console.log('Header index:', headerIndex);
        console.log('Headers:', headers);
        console.log('Data lines count:', dataLines.length);

        // Find column indices
        const guidIndex = headers.findIndex(h => h.toLowerCase().includes('guid'));
        const orderIndex = headers.findIndex(h => h.toLowerCase().includes('order'));
        const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
        const genderIndex = headers.findIndex(h => h.toLowerCase().includes('gender'));
        const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
        const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('phone'));
        const tagIndex = headers.findIndex(h => h.toLowerCase().includes('tag'));
        const functionsIndex = headers.findIndex(h => h.toLowerCase().includes('functions'));

        // Find sub-event columns (everything after Functions)
        const subEventStartIndex = Math.max(functionsIndex, tagIndex) + 1;
        
        const subEventHeaders = headers.slice(subEventStartIndex).filter(h => h.trim());

        console.log('Column indices:', {
          guidIndex, orderIndex, nameIndex, genderIndex, 
          emailIndex, phoneIndex, tagIndex, functionsIndex
        });
        console.log('Sub-event start index:', subEventStartIndex);
        console.log('Sub-event headers:', subEventHeaders);
        console.log('Available sub-events in event data:', subEvents);

        const processedGuests = [];
        const guestGroups = new Map();
        let groupId = Date.now();

        dataLines.forEach((line, index) => {
          if (!line.trim()) return;
          
          const values = line.split(',').map(v => v.trim());
          
          // Skip if no name
          if (nameIndex === -1 || !values[nameIndex] || !values[nameIndex].trim()) {
            console.log('Skipping line due to missing name:', {nameIndex, values, line});
            return;
          }
          
            console.log('Processing guest:', values[nameIndex]);

          // Determine age group based on gender field
          const genderValue = (genderIndex !== -1) ? values[genderIndex] || '' : '';
          let ageGroup = 'adult'; // Default
          let actualGender = genderValue;
          
          // If gender is 'C', it means child age group
          if (genderValue.toUpperCase() === 'C') {
            ageGroup = 'child';
            actualGender = ''; // Clear gender since C was age indicator
          } else if (genderValue.toUpperCase() === 'M') {
            actualGender = 'Male';
          } else if (genderValue.toUpperCase() === 'F') {
            actualGender = 'Female';
          }

          const guest = {
            id: Date.now() + index + Math.random(),
            public_id: crypto.randomUUID(),
            order: (orderIndex !== -1 && values[orderIndex]) ? values[orderIndex] : (index + 1),
            name: values[nameIndex],
            email: (emailIndex !== -1) ? values[emailIndex] || '' : '',
            phone: (phoneIndex !== -1) ? values[phoneIndex] || '' : '',
            gender: actualGender,
            ageGroup: ageGroup,
            tag: (tagIndex !== -1) ? values[tagIndex] || '' : '',
            group: '', // Will be set below
            rsvpStatus: 'pending',
            plusOne: false,
            subEventRSVPs: {},
            invitedAt: null,
            respondedAt: null,
            isPointOfContact: false, // Default to false, will be set to true for first member of each group
          };

          // Process sub-event RSVPs
          subEventHeaders.forEach((subEventName, subIndex) => {
            const subEventValue = values[subEventStartIndex + subIndex];
            if (subEventValue && (subEventValue.toLowerCase() === 'yes' || subEventValue.toLowerCase() === 'true')) {
              // Find matching sub-event in event data by name similarity
              const matchingSubEvent = subEvents.find(se => {
                const csvName = subEventName.toLowerCase().trim();
                const eventName = se.name.toLowerCase().trim();
                // Check for exact match or partial match
                return eventName.includes(csvName) || csvName.includes(eventName) || eventName === csvName;
              });
              
              if (matchingSubEvent) {
                guest.subEventRSVPs[matchingSubEvent.id] = 'invited';
              } else {
                // If no exact match found, create a sub-event ID based on the CSV header
                const subEventId = subEventName.replace(/\s+/g, '_').toLowerCase();
                guest.subEventRSVPs[subEventId] = 'invited';
              }
            }
          });

          // Group guests by GUID (same GUID = same group)
          const guid = (guidIndex !== -1 && values[guidIndex]) ? values[guidIndex].trim() : '';
          if (guid) {
            if (!guestGroups.has(guid)) {
              guestGroups.set(guid, {
                id: groupId++,
                title: '',
                members: [],
                color: groupColors[guestGroups.size % groupColors.length]
              });
            }
            guestGroups.get(guid).members.push(guest);
          } else {
            // Individual guest without group
            guest.group = `${guest.name} (Individual)`;
            processedGuests.push(guest);
          }
        });

        // Process groups and assign group names
        let groupNumber = 1;
        const allNewGroups = [];
        
        guestGroups.forEach((groupData, guid) => {
          if (groupData.members.length > 0) {
            // Use first member's name for group title if multiple members
            const groupTitle = groupData.members.length > 1 
              ? `Group ${groupNumber++}` 
              : `${groupData.members[0].name} (Individual)`;
            
            groupData.title = groupTitle;
            
            // Assign group to all members and set first member as POC
            groupData.members.forEach((member, memberIndex) => {
              member.group = groupTitle;
              member.isPointOfContact = memberIndex === 0; // First member is POC
            });

            processedGuests.push(...groupData.members);

            // Create group object
            const newGroup = {
              id: groupData.id,
              event_id: eventData.id || null,
              title: groupTitle,
              size: groupData.members.length,
              invite_sent_at: null,
              invite_sent_by: null,
              status: "draft",
              details: {
                color: groupData.color,
                description: groupData.members.length > 1 ? "Family/Group" : "Individual guest",
              },
              // POC will be handled by setting isPointOfContact on the first member
            };

            allNewGroups.push(newGroup);
          }
        });

        // Handle individual guests without groups
        if (processedGuests.some(guest => !guest.group || guest.group.includes('(Individual)'))) {
          const individualGuests = processedGuests.filter(guest => guest.group.includes('(Individual)'));
          
          // Set individual guests as POC of their own group
          individualGuests.forEach(guest => {
            guest.isPointOfContact = true;
          });
          
          const individualGroups = individualGuests.map((guest, index) => ({
            id: Date.now() + 10000 + index,
            event_id: eventData.id || null,
            title: guest.group,
            size: 1,
            invite_sent_at: null,
            invite_sent_by: null,
            status: "draft",
            details: {
              color: groupColors[(allNewGroups.length + index) % groupColors.length],
              description: "Individual guest",
            },
          }));
          allNewGroups.push(...individualGroups);
        }

        console.log('Final processed guests count:', processedGuests.length);
        console.log('Final processed guests:', processedGuests.map(g => g.name));
        console.log('Groups created:', allNewGroups.length);

        // Add all guests and groups at once
        if (processedGuests.length > 0) {
          updateEventData({
            guests: [...(eventData.guests || []), ...processedGuests],
            guestGroups: [...(eventData.guestGroups || []), ...allNewGroups],
          });
        }

        toast.success(`Successfully imported ${processedGuests.length} guests!`, {
          position: "top-center",
          autoClose: 3000,
        });

      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error("Error parsing CSV file. Please check the format and try again.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    };

    reader.readAsText(file);
  };

  // Handle clearing all guests
  const handleClearGuestList = () => {
    if (eventData.guests?.length === 0) {
      toast.info("Guest list is already empty", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (window.confirm(`Are you sure you want to clear all ${eventData.guests.length} guests? This action cannot be undone.`)) {
      updateEventData({
        guests: [],
        guestGroups: [],
      });

      toast.success("Guest list cleared successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
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
                Expected format: GUID, Order, Name, Gender, Email, Phone, Tag, Functions, [Sub-Event Names]
                <br />
                GUID: Use same GUID for guests in the same group/family
                <br />
                Sub-Events: Use "Yes" or "No" to indicate invitation status
                <br />
                Leave GUID empty for individual guests
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
                  console.log(eventData.guests)
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
                    ageGroup: "",
                    tag: "",
                    selectedGroup: "",
                    subEventRSVPs: {},
                    isPointOfContact: true, // Default to true when closing modal
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
                            <option key={group.id} value={group.title}>
                              {group.title} ({group.size} members)
                            </option>
                          ))}
                        </select>
                        <div className={styles.fieldHelp}>
                          Select an existing group to add this guest to, or leave blank to create a new individual group
                        </div>
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
                                {member.gender || "No gender"} •{" "}
                                {member.ageGroup ? 
                                  ageGroups.find(group => group.value === member.ageGroup)?.label || member.ageGroup 
                                  : "No age group"
                                }
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
                    ageGroup: "",
                    tag: "",
                    selectedGroup: "",
                    subEventRSVPs: {},
                    isPointOfContact: true, // Default to true when canceling
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
              All Guests ({filteredGuestsCount}{totalGuests !== filteredGuestsCount ? ` of ${totalGuests}` : ''})
            </h3>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
              onClick={handleClearGuestList}
              title="Clear all guests from the list"
            >
              🗑️ Clear List
            </button>
          </div>

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
                <option value="gender">Filter by Gender</option>
                <option value="ageGroup">Filter by Age Group</option>
                <option value="group">Filter by Group</option>
                <option value="subEvent">Filter by Sub-Event</option>
              </select>

              {filterBy !== "all" && (
                <select
                  className={styles.filterSelect}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option value="">Select {filterBy === "subEvent" ? "sub-event" : filterBy}...</option>
                  {filterBy === "gender" && 
                    getFilterOptions().genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))
                  }
                  {filterBy === "ageGroup" && 
                    getFilterOptions().ageGroups.map(ageGroup => (
                      <option key={ageGroup} value={ageGroup}>
                        {ageGroups.find(ag => ag.value === ageGroup)?.label || ageGroup}
                      </option>
                    ))
                  }
                  {filterBy === "group" && 
                    getFilterOptions().groups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))
                  }
                  {filterBy === "subEvent" && 
                    subEvents.map(subEvent => (
                      <option key={subEvent.id} value={subEvent.id}>{subEvent.name}</option>
                    ))
                  }
                </select>
              )}

              {(searchTerm || filterBy !== "all") && (
                <button
                  className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                  onClick={clearFilters}
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

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
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.guestTable}>
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Group</th>
                    <th>Gender</th>
                    <th>Age Group</th>
                    <th>Tag</th>
                    {subEvents.map((subEvent) => (
                      <th key={subEvent.id} className={styles.subEventColumn}>
                        {subEvent.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => {
                  const isPointOfContact = guest.isPointOfContact === true;

                  return (
                    <tr
                      key={guest.id}
                      className={
                        isPointOfContact ? styles.pointOfContactRow : ""
                      }
                    >
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnGhost} ${styles.btnIcon} ${styles.editIcon}`}
                            onClick={() => handleEditGuest(guest)}
                            title="Edit guest"
                          >
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon} ${styles.deleteIcon}`}
                            onClick={() => handleRemoveGuest(guest.id)}
                            title="Remove guest"
                          >
                          </button>
                        </div>
                      </td>
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
                          {guest.group && (
                            <>
                              <div
                                className={styles.groupColorDot}
                                style={{
                                  backgroundColor: "#7c3aed",
                                }}
                              />
                              <span>{guest.group}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>{guest.gender || "-"}</td>
                      <td>
                        {guest.ageGroup ? 
                          ageGroups.find(group => group.value === guest.ageGroup)?.label || guest.ageGroup 
                          : "-"
                        }
                      </td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
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

      {/* POC Transfer Confirmation Modal */}
      {showPOCConfirmation && pocTransferData && (
        <div className={styles.guestFormOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Transfer Point of Contact
              </h3>
            </div>
            
            <div className={styles.confirmationContent}>
              <div className={styles.confirmationIcon}>
                👥
              </div>
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
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={handlePOCTransferCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handlePOCTransferConfirm}
              >
                Transfer POC Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestListSection;
