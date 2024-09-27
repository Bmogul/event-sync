"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";

import styles from "../styles/portal.module.css";
import stylesL from "../styles/login.module.css";
import Loading from "../../components/loading";

import Login from "../components/login";
import EmailPortal from "../components/emailPortal";

const page = ({ eventData }) => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState(false);

  const [password, setPassword] = useState("");

  const [guestList, setGuestList] = useState();
  //
  // Get event data based on eventID
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log(params);
        const response = await fetch(`/api/events/${params.eventID}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        console.log(data);
        setEvent(data);
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

  // Handle Login
  const handleLogin = async (e) => {
    // logic to verify password
    setLoading(true);
    reloadGuests()
    setLoading(false);
    //setLogin(true)
  };

  const reloadGuests = async () => {
    const res = await fetch(`/api/events/${params.eventID}/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    });
    const result = await res.json();
    if (res.status == 200) {
      if (result.validated) {
        setLogin(true);
        setGuestList(result.guestList);
        toast("Welcome");
      } else {
        toast("Invalid Password");
      }
    } else {
      toast("Please try again");
    }
  };

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
        {!login ? (
          <Login
            event={event}
            setLogin={setLogin}
            params={params}
            toast={toast}
            setLoading={setLoading}
            setGuestList={setGuestList}
            password={password}
            setPassword={setPassword}
            handleLogin={handleLogin}
          />
        ) : (
          <EmailPortal
            toast={toast}
            event={event}
            params={params}
            guestList={guestList}
            password={password}
            reloadGuests={reloadGuests}
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default page;
