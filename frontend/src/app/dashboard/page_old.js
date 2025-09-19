"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  
  const [collaborations, setCollaborations] = useState([
    {
      id: "col_001",
      eventTitle: "Anniversary Celebration",
      ownerName: "Sarah Johnson",
      role: "Co-organizer",
      status: "active",
      invitedDate: "2024-05-01"
    },
    {
      id: "col_002",
      eventTitle: "Conference 2024",
      ownerName: "Michael Chen", 
      role: "Vendor",
      status: "pending",
      invitedDate: "2024-04-15"
    }
  ]);

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

  const handleAcceptCollaboration = (collaborationId) => {
    setCollaborations(prev => 
      prev.map(col => 
        col.id === collaborationId 
          ? { ...col, status: "active" }
          : col
      )
    );
    toast.success("Collaboration accepted!");
  };

  const handleDeclineCollaboration = (collaborationId) => {
    setCollaborations(prev => 
      prev.filter(col => col.id !== collaborationId)
    );
    toast.success("Collaboration declined");
  };

  const handleSignOut = () => {
    // Clear any authentication tokens/session data here if needed
    // For now, just redirect to homepage
    toast.success("Successfully signed out");
    router.push("/");
  };

  useEffect(()=>{
    console.log(user)
  },[user])

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
                  src={user.avatar || "/avatar-placeholder.svg"} 
                  alt={user.name} 
                  width={60}
                  height={60}
                />
              </div>
              <div className={styles.userDetails}>
                <h1 className={styles.userName}>Welcome back, {user.name}!</h1>
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
                        value={user.name}
                        onChange={(e) => setUser(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Email Address</label>
                      <input 
                        type="email" 
                        className={styles.formInput}
                        value={user.email}
                        onChange={(e) => setUser(prev => ({...prev, email: e.target.value}))}
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

export default Dashboard;
