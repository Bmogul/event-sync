"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import Cookies from "js-cookie";

import Loading from "../components/loading";
import Login from "../components/login";
import Email from "../components/emailPortal";

import styles from "../styles/portal.module.css";

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState();
  const [guestList, setGuestList] = useState();

  const [password, setPassword] = useState(Cookies.get("auth"));
  const [loading, setLoading] = useState(true);

  const [menu, setMenu] = useState("loading");

  // Get event data based on eventID
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await fetch(`/api/events/${params.eventID}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        setEvent(data);

        // check to see for password, and if not set login
        if (!password) setMenu("login");
        else await handleLogin(data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        //router.push('/404'); // Redirect to 404 page if event doesn't exist
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [params.eventID, router]);
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  // Login and Out
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const handleLogin = async (event2) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${params.eventID}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, event: event2 }),
      });

      const result = await res.json();
      if (res.status === 200 && result.validated) {
        Cookies.set("auth", password, { expires: 1 });
        // get guestlist
        await getGuestList(event2);
        // change menu
        setMenu("email");
        setLoading(false);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      setLoading(false);

      console.log(error);
      toast("Failed to authenticate, try again");
    }
  };
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  // GuestList functions
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const getGuestList = async (event) => {
    try {
      const queryParams = new URLSearchParams({
        sheetID: event.sheetID,
        password,
      });
      const res = await fetch(
        `/api/${params.eventID}/guestList?${queryParams}`,
      );
      const result = await res.json();

      if (res.status === 200 && result.validated) {
        setGuestList(result.allUsers);
      } else throw new Error("Failed to get guestlist");
    } catch (error) {
      toast("Failed to get guests. Try again");
    }
  };

  const updateGuestList = async (usersToUpdate) => {
    let guests = guestList;
    for (const user of usersToUpdate) {
      guests = guests.map((guest) => (guest.UID === user.UID ? user : guest));
    }
    try {
      const res = await fetch(`/api/${params.eventID}/guestList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, event, guestList: guests }),
      });
      const result = await res.json();
      if (res.status === 200 && result.validated) {
        setGuestList(guests);
      } else throw new Error("Failed to validate");
    } catch (error) {}
  };
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */


  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            <div className={styles.logoSection}>
              <a href="/" className={styles.logo}>Event-Sync</a>
              <span className={styles.breadcrumb}>/ Event Portal</span>
            </div>
            <div className={styles.navActions}>
              <button className={styles.btnSecondary}>Export Data</button>
              <button className={styles.btnOutline}>Event Settings</button>
              <button 
                className={styles.btnPrimary}
                onClick={() => window.open(`/${params.eventID}/rsvp`, '_blank')}
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
          {menu === "login" ? (
            <Login
              event={event}
              password={password}
              setPassword={setPassword}
              handleLogin={handleLogin}
            />
          ) : menu === "email" ? (
            <>
              {/* Event Header */}
              <div className={styles.eventHeader}>
                <h1 className={styles.eventTitle}>{event?.eventTitle || "Event Management"}</h1>
                <p className={styles.eventSubtitle}>
                  Event Management Portal • Guest Communication & Analytics
                </p>
                <div className={styles.eventActions}>
                  <button className={styles.btnPrimary} onClick={() => {}}>
                    ✉️ Send Mail
                  </button>
                  <button className={styles.btnOutline}>📊 View Analytics</button>
                  <button className={styles.btnOutline}>📱 Share Event</button>
                  <button className={styles.btnOutline}>🎨 Customize RSVP</button>
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
                    {guestList?.filter(guest => guest.Sent === "Yes").length || 0}
                  </div>
                  <div className={styles.statLabel}>Invites Sent</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {guestList?.filter(guest => guest.MainResponse === "1" || guest.MainResponse === 1).length || 0}
                  </div>
                  <div className={styles.statLabel}>Responses</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {guestList?.filter(guest => guest.Sent === "Yes" && (!guest.MainResponse || guest.MainResponse === "")).length || 0}
                  </div>
                  <div className={styles.statLabel}>Pending</div>
                </div>
              </div>

              {/* Email Portal Component */}
              <Email
                toast={toast}
                event={event}
                params={params}
                guestList={guestList}
                password={password}
                getGuestList={getGuestList}
                updateGuestList={updateGuestList}
              />
            </>
          ) : (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
            </div>
          )}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default Page;
