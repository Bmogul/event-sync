"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { AuthProvider } from "../contexts/AuthContext";
import styles from "./Dashboard.module.css";

const DashboardContent = () => {
  const router = useRouter();
  const { user, userProfile, session, loading, signOut, supabase } = useAuth();
  
  const [activeSection, setActiveSection] = useState("events");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [collaborationsLoading, setCollaborationsLoading] = useState(true);
  const [collaborationsError, setCollaborationsError] = useState(null);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signIn');
    }
  }, [user, loading, router]);

  // Fetch user's events from database
  const fetchEvents = async () => {
    if (!user || !userProfile) return;
    
    try {
      setEventsLoading(true);
      setEventsError(null);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          status:event_state_lookup(state),
          event_managers!inner(user_id)
        `)
        .eq('event_managers.user_id', userProfile.id);
      
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
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError('Failed to load events');
      toast.error('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch collaborations from database
  const fetchCollaborations = async () => {
    if (!user || !userProfile) return;
    
    try {
      setCollaborationsLoading(true);
      setCollaborationsError(null);
      
      const { data, error } = await supabase
        .from('event_managers')
        .select(`
          *,
          event:events(title, public_id),
          role:event_manage_roles(role_name),
          status:event_manage_state_lookup(state),
          owner_user:users!events_created_by_fkey(first_name, last_name)
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
        ownerName: `${collab.owner_user?.first_name || ''} ${collab.owner_user?.last_name || ''}`.trim() || 'Unknown',
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
  };

  // Fetch data when component mounts and user is available
  useEffect(() => {
    if (user && userProfile) {
      fetchEvents();
      fetchCollaborations();
    }
  }, [user, userProfile]);

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
  if (!user || !userProfile) {
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
                <img src={avatarUrl} alt={displayName} onError={(e) => {
                  e.target.src = "/avatar-placeholder.svg";
                }} />
              </div>
              <div className={styles.userDetails}>
                <h1 className={styles.userName}>Welcome back, {displayName}!</h1>
                <p className={styles.userEmail}>{user.email}</p>
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
                <h2 className={styles.sectionTitle}>My Events</h2>
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
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
};

export default Dashboard;