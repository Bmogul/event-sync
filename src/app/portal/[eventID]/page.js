'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";

import styles from '../styles/portal.module.css'
import stylesL from '../styles/login.module.css'
import Loading from '../../components/loading'

import Login from '../components/login'
import EmailPortal from '../components/emailPortal'

const page = ({ eventData }) => {

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState(false);

  const [guestList, setGuestList] = useState()
  //
  // Get event data based on eventID
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log(params)
        const response = await fetch(`/api/events/${params.eventID}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const data = await response.json();
        console.log(data)
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        //router.push('/404'); // Redirect to 404 page if event doesn't exist
      } finally {
        setLoading(false)
      }
    };

    fetchEventData();
  }, [params.eventID, router]);
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
          <Image className={styles.responsiveLogo} src={"/logo.svg"} alt="Event-Sync" fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        </div>
        <p>Event Portal</p>
      </div>
      <div className={styles.main}>
        {!login ? (
          <Login event={event} setLogin={setLogin} params={params} toast={toast} setLoading={setLoading} setGuestList={setGuestList} />
        ) : (
          <EmailPortal toast={toast} event={event} params={params} guestList={guestList} />
        )}
      </div>
      <ToastContainer />
    </div>
  )
}

export default page;
