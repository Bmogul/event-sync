"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";

import Loading from "../../components/loading";
import Login from "../components/login";
import Email from "../components/emailPortal";

import styles from "../styles/portal.module.css";

const page = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState();
  const [guestList, setGuestList] = useState();

  const [authToken, setAuthToken] = useState();
  const [loading, setLoading] = useState(true);

  const [menu, setMenu] = useState("loading");
  const menuOptions = { login: Login, email: Email, loading: Loading };

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
      <div className={styles.main}></div>
      <ToastContainer />
    </div>
  );
};

export default page;
