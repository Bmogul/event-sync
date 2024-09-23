'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation';

import styles from '../../styles/events.module.css'
import Loading from '../../components/loading'


const page = ({ eventData }) => {

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState(false);
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

  // Send Mail
  const SendMail = async () => {
    console.log(`/api/events/${params.eventID}/portal`)
    const res = await fetch(`/api/events/${params.eventID}/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'recipient@example.com',
        subject: 'Hello from Next.js',
        text: 'This is a test email sent from a Next.js application!',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      }),
    });

    const result = await res.json();
    console.log("Result of send", result);
  }

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
      <div className={styles.main}>
        <h1>Event Portal</h1>
        <h3>Event Title: {event.eventTitle}</h3>
        <button onClick={SendMail}>Test Send</button>
      </div>
    </div>
  )
}

export default page;
