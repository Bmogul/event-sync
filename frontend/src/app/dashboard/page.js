"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Dashboard.module.css";

const DashboardContent = () => {
  const router = useRouter();
  const { user, userProfile, session, loading, profileLoading, profileError, signOut, supabase, retryProfileFetch } = useAuth();
  
  const [activeSection, setActiveSection] = useState("events");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [collaborationsLoading, setCollaborationsLoading] = useState(true);
  const [collaborationsError, setCollaborationsError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single', eventId } or { type: 'mass', eventIds }

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signIn');
    }
  }, [user, loading, router]);

  // Fetch user's events from database
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      setEventsLoading(true);
      setEventsError(null);

      // If userProfile doesn't have a database ID, we can't fetch events
      if (!userProfile?.id) {
        console.log('UserProfile has no database ID, cannot fetch events');
        setEvents([]);
        return;
      }
      
      // First get event IDs where user is a manager
      const { data: managerData, error: managerError } = await supabase
        .from('event_managers')
        .select('event_id')
        .eq('user_id', userProfile.id);
      
      if (managerError) {
        throw managerError;
      }
      
      if (!managerData || managerData.length === 0) {
        setEvents([]);
        return;
      }
      
      // Get unique event IDs
      const eventIds = [...new Set(managerData.map(m => m.event_id))];
      
      // Then fetch events using the event IDs
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          status:event_state_lookup(state)
        `)
        .in('id', eventIds);
      
      if (error) {
        throw error;
      }
      
      // Transform data to match component structure
      const transformedEvents = data?.map(event => ({
        id: event.public_id,
        title: event.title,
        date: event.start_date,
        status: event.status?.state || 'draft',
        guestsCount: event.capacity || 0,
        responsesCount: event.total_yes || 0,
        type: event.details?.type || 'event',
        location: event.details?.location || 'Location TBD',
        description: event.description,
        endDate: event.end_date,
        logoUrl: event.logo_url,
        heroUrl: event.hero_url
      })) || [];
      
      // Remove any potential duplicates based on event ID (extra safety measure)
      const uniqueEvents = transformedEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );
      
      setEvents(uniqueEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError('Failed to load events');
      toast.error('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, [user, userProfile?.id, supabase]);

  // Fetch collaborations from database
  const fetchCollaborations = useCallback(async () => {
    if (!user) return;
    
    try {
      setCollaborationsLoading(true);
      setCollaborationsError(null);

      // If userProfile doesn't have a database ID, we can't fetch collaborations
      if (!userProfile?.id) {
        console.log('UserProfile has no database ID, cannot fetch collaborations');
        setCollaborations([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('event_managers')
        .select(`
          *,
          event:events(title, public_id, created_by, users!events_created_by_fkey(first_name, last_name)),
          role:event_manage_roles(role_name),
          status:event_manage_state_lookup(state)
        `)
        .eq('user_id', userProfile.id)
        .neq('role_id', 1); // Exclude owner role
      
      if (error) {
        throw error;
      }
      
      // Transform data to match component structure
      const transformedCollaborations = data?.map(collab => ({
        id: `${collab.user_id}_${collab.event_id}`,
        eventTitle: collab.event?.title || 'Unknown Event',
        eventId: collab.event?.public_id,
        ownerName: `${collab.event?.users?.first_name || ''} ${collab.event?.users?.last_name || ''}`.trim() || 'Unknown',
        role: collab.role?.role_name || 'collaborator',
        status: collab.status?.state || 'pending',
        invitedDate: collab.invited_at,
        acceptedDate: collab.accepted_at
      })) || [];
      
      setCollaborations(transformedCollaborations);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      setCollaborationsError('Failed to load collaborations');
      toast.error('Failed to load collaborations');
    } finally {
      setCollaborationsLoading(false);
    }
  }, [user, userProfile?.id, supabase]);

  // Fetch data when component mounts and user is available
  useEffect(() => {
    if (user) {
      // Fetch events and collaborations immediately if we have a user
      // Even if userProfile is still loading, these functions handle that gracefully
      fetchEvents();
      fetchCollaborations();
    }
  }, [user, userProfile?.id, fetchEvents, fetchCollaborations]); // Re-fetch when profile ID becomes available

  // Fetch notifications (collaboration invites, etc.)
  const fetchNotifications = useCallback(async () => {
    if (!user || !userProfile?.id) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    try {
      setNotificationsLoading(true);
      
      // Get pending collaboration invitations
      const { data, error } = await supabase
        .from('event_managers')
        .select(`
          *,
          event:events(title, public_id),
          role:event_manage_roles(role_name),
          status:event_manage_state_lookup(state),
          inviter:events!event_managers_event_id_fkey(users!events_created_by_fkey(first_name, last_name))
        `)
        .eq('user_id', userProfile.id)
        .eq('status_id', 1) // Pending status
        .order('invited_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data to notification format
      const transformedNotifications = data?.map(invitation => ({
        id: `invite_${invitation.event_id}_${invitation.user_id}`,
        type: 'collaboration_invite',
        title: `Collaboration Invitation: ${invitation.event?.title}`,
        message: `You've been invited to collaborate on "${invitation.event?.title}" as a ${invitation.role?.role_name}`,
        status: 'pending',
        read: false,
        created_at: invitation.invited_at,
        event_id: invitation.event_id,
        event_public_id: invitation.event?.public_id,
        role: invitation.role?.role_name,
        inviter_name: `${invitation.inviter?.users?.first_name || ''} ${invitation.inviter?.users?.last_name || ''}`.trim() || 'Someone'
      })) || [];

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  }, [user, userProfile?.id, supabase]);

  // Add fetchNotifications to the useEffect
  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchCollaborations();
      fetchNotifications();
    }
  }, [user, userProfile?.id, fetchEvents, fetchCollaborations, fetchNotifications]);

  // Set up real-time subscriptions for collaboration updates
  useEffect(() => {
    if (!user || !userProfile?.id) return;

    console.log('Setting up real-time subscription for user:', userProfile.id);

    // Subscribe to event_managers table changes for this user
    const collaborationSubscription = supabase
      .channel('collaboration_updates')
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'event_managers',
        filter: `user_id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('Real-time collaboration update:', payload);
        handleCollaborationChange(payload);
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up collaboration subscription');
      collaborationSubscription.unsubscribe();
    };
  }, [userProfile?.id, supabase]);

  // Handle real-time collaboration changes
  const handleCollaborationChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Handling collaboration change:', { eventType, newRecord, oldRecord });
    
    switch (eventType) {
      case 'INSERT':
        // New collaboration invitation received
        if (newRecord.status_id === 1) { // Pending status
          toast.info('New collaboration invitation received!');
          fetchNotifications(); // Refresh notifications to show new invite
        }
        break;
        
      case 'UPDATE':
        // Collaboration status changed (accepted/declined)
        const oldStatus = oldRecord?.status_id;
        const newStatus = newRecord?.status_id;
        
        if (oldStatus !== newStatus) {
          // Refresh both notifications and collaborations
          fetchNotifications();
          fetchCollaborations();
          
          if (newStatus === 2) { // Accepted
            toast.success('Collaboration invitation accepted!');
          } else if (newStatus === 3) { // Declined
            toast.info('Collaboration invitation declined');
          }
        }
        break;
        
      case 'DELETE':
        // Collaboration removed
        toast.info('Collaboration access removed');
        fetchNotifications();
        fetchCollaborations();
        break;
        
      default:
        console.log('Unknown event type:', eventType);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "var(--color-green-500)";
      case "draft": return "var(--color-yellow-500)";
      case "completed": return "var(--color-blue-500)";
      case "pending": return "var(--color-orange-500)";
      default: return "var(--color-gray-500)";
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case "wedding": return "💒";
      case "birthday": return "🎂";
      case "corporate": return "🏢";
      default: return "🎉";
    }
  };

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  const handleViewEvent = (eventId) => {
    router.push(`/${eventId}/portal`);
  };

  const handleEditEvent = (eventId) => {
    router.push(`/create-event?edit=${eventId}`);
  };

  const handleAcceptCollaboration = async (collaborationId) => {
    try {
      const [userId, eventId] = collaborationId.split('_');
      
      const { error } = await supabase
        .from('event_managers')
        .update({ 
          status_id: 2, // accepted status
          accepted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) throw error;

      setCollaborations(prev => 
        prev.map(col => 
          col.id === collaborationId 
            ? { ...col, status: "accepted", acceptedDate: new Date().toISOString() }
            : col
        )
      );
      toast.success("Collaboration accepted!");
    } catch (error) {
      console.error('Error accepting collaboration:', error);
      toast.error('Failed to accept collaboration');
    }
  };

  const handleDeclineCollaboration = async (collaborationId) => {
    try {
      const [userId, eventId] = collaborationId.split('_');
      
      const { error } = await supabase
        .from('event_managers')
        .update({ status_id: 3 }) // declined status
        .eq('user_id', userId)
        .eq('event_id', eventId);

      if (error) throw error;

      setCollaborations(prev => 
        prev.filter(col => col.id !== collaborationId)
      );
      toast.success("Collaboration declined");
    } catch (error) {
      console.error('Error declining collaboration:', error);
      toast.error('Failed to decline collaboration');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out");
      router.push("/");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // Handle event selection for mass delete
  const handleEventSelection = (eventId, checked) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, eventId]);
    } else {
      setSelectedEvents(prev => prev.filter(id => id !== eventId));
    }
  };

  // Handle select all events
  const handleSelectAllEvents = (checked) => {
    if (checked) {
      setSelectedEvents(events.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  // Handle single event delete
  const handleDeleteEvent = (eventId) => {
    setDeleteTarget({ type: 'single', eventId });
    setShowDeleteConfirmation(true);
  };

  // Handle mass delete
  const handleMassDelete = () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select events to delete");
      return;
    }
    setDeleteTarget({ type: 'mass', eventIds: selectedEvents });
    setShowDeleteConfirmation(true);
  };

  // Confirm delete operation
  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'single') {
        // Delete single event
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('public_id', deleteTarget.eventId);

        if (error) throw error;

        setEvents(prev => prev.filter(event => event.id !== deleteTarget.eventId));
        toast.success("Event deleted successfully");
      } else {
        // Delete multiple events
        const { error } = await supabase
          .from('events')
          .delete()
          .in('public_id', deleteTarget.eventIds);

        if (error) throw error;

        setEvents(prev => prev.filter(event => !deleteTarget.eventIds.includes(event.id)));
        setSelectedEvents([]);
        toast.success(`${deleteTarget.eventIds.length} events deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting event(s):', error);
      toast.error('Failed to delete event(s)');
    } finally {
      setShowDeleteConfirmation(false);
      setDeleteTarget(null);
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteTarget(null);
  };

  // Handle collaboration invitation response
  const handleInvitationResponse = async (notification, action) => {
    try {
      const statusId = action === 'accept' ? 2 : 3; // 2 = accepted, 3 = declined
      
      const { error } = await supabase
        .from('event_managers')
        .update({ 
          status_id: statusId,
          accepted_at: action === 'accept' ? new Date().toISOString() : null
        })
        .eq('user_id', userProfile.id)
        .eq('event_id', notification.event_id);

      if (error) throw error;

      toast.success(`Invitation ${action}ed successfully`);
      
      // Refresh notifications and collaborations
      fetchNotifications();
      fetchCollaborations();
      
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      toast.error(`Failed to ${action} invitation`);
    }
  };

  // Mark notification as read
  const markAsRead = async (notification) => {
    // For now, just update local state since we don't have a separate notifications table
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Show loading state while authenticating
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const displayName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User' : 'User';
  const avatarUrl = userProfile?.settings?.avatar_url || '/avatar-placeholder.svg';

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <div className={styles.logoSection}>
              <a href="/" className={styles.logo}>Event-Sync</a>
              <span className={styles.breadcrumb}>/ Dashboard</span>
            </div>
            <div className={styles.navActions}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setActiveSection("settings")}
              >
                ⚙️ Settings
              </button>
              <button 
                className={styles.btnPrimary}
                onClick={handleCreateEvent}
              >
                ➕ Create Event
              </button>
              <button 
                className={styles.btnOutline}
                onClick={handleSignOut}
              >
                🚪 Sign Out
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* User Header */}
          <div className={styles.userHeader}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <Image 
                  src={avatarUrl || "/avatar-placeholder.svg"} 
                  alt={displayName} 
                  width={40}
                  height={40}
                />
              </div>
              <div className={styles.userDetails}>
                <h1 className={styles.userName}>Welcome back, {displayName}!</h1>
                <p className={styles.userEmail}>{user.email}</p>
                {profileError && (
                  <div className={styles.profileError}>
                    <p>Profile could not be loaded. <button onClick={retryProfileFetch} className={styles.retryBtn}>Retry</button></p>
                  </div>
                )}
                {profileLoading && (
                  <div className={styles.profileLoading}>
                    <p>Loading profile...</p>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.userActions}>
              <button 
                className={styles.btnOutline}
                onClick={() => setActiveSection("settings")}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={styles.tabNavigation}>
            <button 
              className={`${styles.tabButton} ${activeSection === "events" ? styles.active : ""}`}
              onClick={() => setActiveSection("events")}
            >
              🎉 My Events ({events.length})
            </button>
            <button 
              className={`${styles.tabButton} ${activeSection === "collaborations" ? styles.active : ""}`}
              onClick={() => setActiveSection("collaborations")}
            >
              🤝 Collaborations ({collaborations.length})
            </button>
            <button 
              className={`${styles.tabButton} ${activeSection === "inbox" ? styles.active : ""}`}
              onClick={() => setActiveSection("inbox")}
            >
              🔔 Inbox {unreadCount > 0 && <span className={styles.notificationBadge}>({unreadCount})</span>}
            </button>
            <button 
              className={`${styles.tabButton} ${activeSection === "settings" ? styles.active : ""}`}
              onClick={() => setActiveSection("settings")}
            >
              ⚙️ Account Settings
            </button>
          </div>

          {/* Content Sections */}
          {activeSection === "events" && (
            <div className={styles.eventsSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleArea}>
                  <h2 className={styles.sectionTitle}>My Events</h2>
                  {events.length > 0 && (
                    <div className={styles.selectionControls}>
                      <label className={styles.selectAllLabel}>
                        <input
                          type="checkbox"
                          checked={selectedEvents.length === events.length && events.length > 0}
                          onChange={(e) => handleSelectAllEvents(e.target.checked)}
                        />
                        Select All ({selectedEvents.length})
                      </label>
                      {selectedEvents.length > 0 && (
                        <button
                          className={styles.btnDanger}
                          onClick={handleMassDelete}
                        >
                          🗑️ Delete Selected ({selectedEvents.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  className={styles.btnPrimary}
                  onClick={handleCreateEvent}
                >
                  ➕ Create New Event
                </button>
              </div>

              {/* Events Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{events.length}</div>
                  <div className={styles.statLabel}>Total Events</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {events.filter(e => e.status === "active").length}
                  </div>
                  <div className={styles.statLabel}>Active Events</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {events.reduce((sum, e) => sum + e.guestsCount, 0)}
                  </div>
                  <div className={styles.statLabel}>Total Guests</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {events.reduce((sum, e) => sum + e.responsesCount, 0)}
                  </div>
                  <div className={styles.statLabel}>Total Responses</div>
                </div>
              </div>

              {/* Events Grid */}
              {eventsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading events...</p>
                </div>
              ) : eventsError ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{eventsError}</p>
                  <button className={styles.btnSecondary} onClick={fetchEvents}>
                    Try Again
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎉</div>
                  <h3>No events yet</h3>
                  <p>Create your first event to get started!</p>
                  <button className={styles.btnPrimary} onClick={handleCreateEvent}>
                    Create Event
                  </button>
                </div>
              ) : (
                <div className={styles.eventsGrid}>
                  {events.map(event => (
                    <div key={event.id} className={styles.eventCard}>
                      <div className={styles.eventCardHeader}>
                        <div className={styles.eventCardControls}>
                          <input
                            type="checkbox"
                            className={styles.eventCheckbox}
                            checked={selectedEvents.includes(event.id)}
                            onChange={(e) => handleEventSelection(event.id, e.target.checked)}
                          />
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete event"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className={styles.eventIcon}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div className={styles.eventStatus}>
                          <span 
                            className={styles.statusIndicator}
                            style={{ backgroundColor: getStatusColor(event.status) }}
                          ></span>
                          <span className={styles.statusText}>{event.status}</span>
                        </div>
                      </div>
                      
                      <div className={styles.eventContent}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <p className={styles.eventDate}>
                          📅 {new Date(event.date).toLocaleDateString()}
                        </p>
                        <p className={styles.eventLocation}>📍 {event.location}</p>
                        
                        <div className={styles.eventStats}>
                          <div className={styles.eventStat}>
                            <span>{event.guestsCount}</span>
                            <small>Guests</small>
                          </div>
                          <div className={styles.eventStat}>
                            <span>{event.responsesCount}</span>
                            <small>Responses</small>
                          </div>
                        </div>
                      </div>

                      <div className={styles.eventActions}>
                        <button 
                          className={styles.btnSecondary}
                          onClick={() => handleEditEvent(event.id)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className={styles.btnPrimary}
                          onClick={() => handleViewEvent(event.id)}
                        >
                          👁️ Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "collaborations" && (
            <div className={styles.collaborationsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Collaborations</h2>
                <p className={styles.sectionDescription}>
                  Events where you've been invited as a collaborator
                </p>
              </div>

              {collaborationsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading collaborations...</p>
                </div>
              ) : collaborationsError ? (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{collaborationsError}</p>
                  <button className={styles.btnSecondary} onClick={fetchCollaborations}>
                    Try Again
                  </button>
                </div>
              ) : collaborations.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🤝</div>
                  <h3>No collaborations</h3>
                  <p>You haven't been invited to collaborate on any events yet.</p>
                </div>
              ) : (
                <div className={styles.collaborationsList}>
                  {collaborations.map(collaboration => (
                    <div key={collaboration.id} className={styles.collaborationCard}>
                      <div className={styles.collaborationInfo}>
                        <h3 className={styles.collaborationTitle}>
                          {collaboration.eventTitle}
                        </h3>
                        <p className={styles.collaborationDetails}>
                          Invited by <strong>{collaboration.ownerName}</strong> as {collaboration.role}
                        </p>
                        <p className={styles.collaborationDate}>
                          Invited on {new Date(collaboration.invitedDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className={styles.collaborationStatus}>
                        <span 
                          className={styles.statusIndicator}
                          style={{ backgroundColor: getStatusColor(collaboration.status) }}
                        ></span>
                        <span className={styles.statusText}>{collaboration.status}</span>
                      </div>

                      {collaboration.status === "pending" && (
                        <div className={styles.collaborationActions}>
                          <button 
                            className={styles.btnSecondary}
                            onClick={() => handleDeclineCollaboration(collaboration.id)}
                          >
                            Decline
                          </button>
                          <button 
                            className={styles.btnPrimary}
                            onClick={() => handleAcceptCollaboration(collaboration.id)}
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "settings" && (
            <div className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Account Settings</h2>
              </div>

              <div className={styles.settingsGrid}>
                <div className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div className={styles.settingsIcon}>👤</div>
                    <h3 className={styles.settingsTitle}>Profile Information</h3>
                  </div>
                  <div className={styles.settingsContent}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Full Name</label>
                      <input 
                        type="text" 
                        className={styles.formInput}
                        value={displayName}
                        readOnly
                        placeholder="Update in profile settings"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email Address</label>
                      <input 
                        type="email" 
                        className={styles.formInput}
                        value={user.email}
                        readOnly
                      />
                    </div>
                    <button className={styles.btnPrimary}>Update Profile</button>
                  </div>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div className={styles.settingsIcon}>🔒</div>
                    <h3 className={styles.settingsTitle}>Security</h3>
                  </div>
                  <div className={styles.settingsContent}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Current Password</label>
                      <input type="password" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <input type="password" className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm Password</label>
                      <input type="password" className={styles.formInput} />
                    </div>
                    <button className={styles.btnPrimary}>Update Password</button>
                  </div>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div className={styles.settingsIcon}>🔔</div>
                    <h3 className={styles.settingsTitle}>Notifications</h3>
                  </div>
                  <div className={styles.settingsContent}>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" className={styles.checkbox} defaultChecked />
                        Email notifications for RSVP responses
                      </label>
                    </div>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" className={styles.checkbox} defaultChecked />
                        Weekly event summary emails
                      </label>
                    </div>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" className={styles.checkbox} />
                        SMS notifications for urgent updates
                      </label>
                    </div>
                    <button className={styles.btnPrimary}>Save Preferences</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "inbox" && (
            <div className={styles.inboxSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Inbox</h2>
                <p className={styles.sectionDescription}>
                  Manage your collaboration invitations and notifications
                </p>
                <div className={styles.inboxActions}>
                  {unreadCount > 0 && (
                    <button 
                      className={styles.btnSecondary}
                      onClick={markAllAsRead}
                    >
                      Mark All Read
                    </button>
                  )}
                  <select 
                    className={styles.filterSelect}
                    onChange={(e) => {/* TODO: Filter notifications */}}
                  >
                    <option value="all">All Notifications</option>
                    <option value="invitations">Collaboration Invitations</option>
                    <option value="updates">Updates</option>
                    <option value="system">System Messages</option>
                  </select>
                </div>
              </div>

              {notificationsLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔔</div>
                  <h3>No notifications</h3>
                  <p>You're all caught up! New collaboration invitations and updates will appear here.</p>
                </div>
              ) : (
                <div className={styles.notificationsList}>
                  {notifications.map(notification => (
                    <div key={notification.id} className={`${styles.notificationCard} ${!notification.read ? styles.unread : ''}`}>
                      <div className={styles.notificationIcon}>
                        {notification.type === 'collaboration_invite' && '🤝'}
                        {notification.type === 'system' && 'ℹ️'}
                        {notification.type === 'update' && '📢'}
                      </div>
                      <div className={styles.notificationContent}>
                        <h4 className={styles.notificationTitle}>{notification.title}</h4>
                        <p className={styles.notificationMessage}>{notification.message}</p>
                        <span className={styles.notificationTimestamp}>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.notificationActions}>
                        {notification.type === 'collaboration_invite' && notification.status === 'pending' && (
                          <>
                            <button 
                              className={styles.btnPrimarySmall}
                              onClick={() => handleInvitationResponse(notification, 'accept')}
                            >
                              Accept
                            </button>
                            <button 
                              className={styles.btnSecondarySmall}
                              onClick={() => handleInvitationResponse(notification, 'decline')}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {!notification.read && (
                          <button 
                            className={styles.btnGhost}
                            onClick={() => markAsRead(notification)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {deleteTarget.type === 'single' ? 'Delete Event' : 'Delete Events'}
              </h3>
            </div>
            
            <div className={styles.confirmationContent}>
              <div className={styles.confirmationIcon}>
                ⚠️
              </div>
              <div className={styles.confirmationMessage}>
                <p>
                  {deleteTarget.type === 'single' 
                    ? 'Are you sure you want to delete this event? This action cannot be undone.'
                    : `Are you sure you want to delete ${deleteTarget.eventIds.length} events? This action cannot be undone.`
                  }
                </p>
                <p className={styles.confirmationSubtext}>
                  All associated data including guests, RSVPs, and sub-events will be permanently removed.
                </p>
              </div>
            </div>

            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={confirmDelete}
              >
                {deleteTarget.type === 'single' ? 'Delete Event' : `Delete ${deleteTarget.eventIds.length} Events`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardContent;