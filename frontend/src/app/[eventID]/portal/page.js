"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Image from "next/image";

import { useAuth } from "../../contexts/AuthContext";
import useEventPermissions from "../../hooks/useEventPermissions";

import Loading from "../components/loading";
import Email from "../components/emailPortal";
import EmailTemplateEditor from "../components/EmailTemplateEditor";

import styles from "../styles/portal.module.css";

const Page = () => {
  const router = useRouter();
  const params = useParams();

  const [event, setEvent] = useState();
  const [guestList, setGuestList] = useState();
  const [password, setPassword] = useState(Cookies.get("auth"));
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("email"); // "email" or "template-editor"

  const { session, supabase, user, userProfile, loading: authLoading } = useAuth(); // get supabase client and session from context

  // Get user permissions for this event
  const {
    userRole,
    loading: permissionsLoading,
    hasPermission,
    canSendEmails,
    canEditTemplates,
    canViewAnalytics,
    canDeleteEvent,
    canEditEvent,
    isOwner,
    isAdmin,
    error: permissionsError
  } = useEventPermissions(event?.eventID);


  // GuestList functions
  const getGuestList = useCallback(async (event) => {
    try {
      if (!session?.access_token)
        throw new Error("User not authenticated");

      const res = await fetch(`/api/${params.eventID}/guestList`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await res.json();
      console.log("GUESTLIST:", params.eventID, result);

      if (res.status === 200 && result.validated) {
        setGuestList(result.allUsers);
      } else throw new Error("Failed to get guestlist");
    } catch (error) {
      console.error(error);
      toast("Failed to get guests. Try again");
    }
  }, [session?.access_token, params.eventID]);
  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${params.eventID}`);
        if (!response.ok) throw new Error("Event not found");
        const data = await response.json();
        console.log(data);
        setEvent(data);

        // Fetch guest list after event data is loaded, but only if authenticated
        if (data && session?.access_token) {
          getGuestList(data);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if auth is not loading and we have checked session
    if (!authLoading) {
      if (!session) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }
      fetchEventData();
    }
  }, [params.eventID, session, authLoading, router, getGuestList]);



  const updateGuestList = async (usersToUpdate) => {
    let guests = guestList;
    for (const userUpdate of usersToUpdate) {
      guests = guests.map((guest) =>
        guest.UID === userUpdate.UID ? userUpdate : guest,
      );
    }

    try {
      if (!session?.access_token)
        throw new Error("User not authenticated");

      const res = await fetch(`/api/${params.eventID}/guestList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ event, guestList: guests }),
      });

      const result = await res.json();
      if (res.status === 200 && result.validated) setGuestList(guests);
    } catch (error) {
      console.error(error);
      toast("Failed to update guest list");
    }
  };

  const handleCustomizeRSVP = ()=>{
   //router.push(`/create-event?edit=${event.id}`) 
  }



  // Show loading while authentication and permissions are being checked
  if (authLoading || loading || permissionsLoading) {
    return <Loading />;
  }

  // Show loading if not authenticated (will redirect)
  if (!session) {
    return <Loading />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <div className={styles.logoSection}>
              <a href="/" className={styles.logo}>
                Event-Sync
              </a>
              <span className={styles.breadcrumb}>/ Event Portal</span>
              {userRole && (
                <span className={styles.userRoleBadge}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
            </div>
            <div className={styles.navActions}>
              {canViewAnalytics && (
                <button className={styles.btnSecondary}>Export Data</button>
              )}
              {canEditEvent && (
                <button className={styles.btnOutline}>Event Settings</button>
              )}
              <button
                className={styles.btnPrimary}
                onClick={() => window.open(`/${params.eventID}/rsvp`, "_blank")}
              >
                View Public Page
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Event Header */}
          <div className={styles.eventHeader}>
            {event?.logo && (
              <div className={styles.eventLogo}>
                <Image
                  src={event.logo}
                  alt={`${event?.eventTitle || "Event"} Logo`}
                  width={120}
                  height={120}
                  style={{
                    objectFit: "contain",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  }}
                />
              </div>
            )}
            <div className={styles.eventInfo}>
              <h1 className={styles.eventTitle}>
                {event?.eventTitle || "Event Management"}
              </h1>
              <p className={styles.eventSubtitle}>
                Event Management Portal • Guest Communication & Analytics
              </p>
              <div className={styles.eventActions}>
                {canSendEmails && (
                  <button 
                    className={currentView === "email" ? styles.btnPrimary : styles.btnOutline}
                    onClick={() => setCurrentView("email")}
                  >
                    ✉️ Send Mail
                  </button>
                )}
                
                {canViewAnalytics && (
                  <button className={styles.btnOutline}>📊 View Analytics</button>
                )}
                
                <button className={styles.btnOutline}>📱 Share Event</button>
                
                {canEditEvent && (
                  <button onClick={handleCustomizeRSVP()} className={styles.btnOutline}>🎨 Customize RSVP</button>
                )}
                
                {canEditTemplates && (
                  <button 
                    className={currentView === "template-editor" ? styles.btnPrimary : styles.btnOutline}
                    onClick={() => setCurrentView("template-editor")}
                  >
                    🎨 Edit Templates
                  </button>
                )}
                
                {(isOwner || isAdmin) && (
                  <button className={styles.btnOutline}>👥 Manage Team</button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{guestList?.length || 0}</div>
              <div className={styles.statLabel}>Total Guests</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {guestList?.filter((guest) => guest.Sent === "Yes").length || 0}
              </div>
              <div className={styles.statLabel}>Invites Sent</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {guestList?.filter(
                  (guest) =>
                    guest.MainResponse === "1" || guest.MainResponse === 1,
                ).length || 0}
              </div>
              <div className={styles.statLabel}>Responses</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {guestList?.filter(
                  (guest) =>
                    guest.Sent === "Yes" &&
                    (!guest.MainResponse || guest.MainResponse === ""),
                ).length || 0}
              </div>
              <div className={styles.statLabel}>Pending</div>
            </div>
          </div>

          {/* Conditional Component Rendering */}
          {currentView === "email" ? (
            <Email
              toast={toast}
              event={event}
              params={params}
              guestList={guestList}
              session={session}
              getGuestList={getGuestList}
              updateGuestList={updateGuestList}
              setCurrentView={setCurrentView}
              permissions={{
                canSendEmails,
                canEditTemplates,
                canViewAnalytics,
                hasPermission,
                userRole
              }}
            />
          ) : currentView === "template-editor" ? (
            <EmailTemplateEditor
              toast={toast}
              event={event}
              params={params}
              session={session}
              setCurrentView={setCurrentView}
              permissions={{
                canEditTemplates,
                hasPermission,
                userRole
              }}
            />
          ) : null}
        </div>
      </main>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        draggable
        theme="colored"
      />
    </div>
  );
};

export default Page;
