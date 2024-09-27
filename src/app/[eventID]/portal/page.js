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

const page = () => {
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

  // While still loading
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  if (loading)
    return (
      <div className={styles.page}>
        <Loading />
      </div>
    );
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <Image
            className={styles.responsiveLogo}
            src={"/logo.svg"}
            alt="Event-Sync"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <p>Event Portal</p>
      </div>
      <div className={styles.main}>
        {menu === "login" ? (
          <Login
            event={event}
            password={password}
            setPassword={setPassword}
            handleLogin={handleLogin}
          />
        ) : menu === "email" ? (
          <Email
            toast={toast}
            event={event}
            params={params}
            guestList={guestList}
            password={password}
            getGuestList={getGuestList}
            updateGuestList={updateGuestList}
          />
        ) : (
          <></>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default page;
