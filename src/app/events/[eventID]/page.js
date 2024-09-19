"use client"
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image'
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";

import Loading from "../components/loading"
import EventContainer from "../components/eventcontainer"
import RSVPForm from "../components/RSVPForm"

import styles from "../styles/events.module.css"

export default function EventPage({ eventData }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const guid = searchParams.get("guid");

  const [party, setParty] = useState(null)
  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

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
      }
    };

    fetchEventData();
  }, [params.eventID, router]);
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */


  // Get party data based on GUID
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  useEffect(() => {
    const fetchData = async (guid) => {
      try {
        const response = await fetch(`/api/sheets?guid=${guid}`);
        const data = await response.json();

        if (response.status != 200)
          throw new Error(JSON.stringify({ message: data, status: response.status }))
        else {
          setParty(data)
          console.log(data)
        }
        // Process the data as needed
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false)
      }
    };
    fetchData(guid);
  }, [guid]);
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */


  // RSVP Form controls
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const openForm = () => {
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
  }

  const postResponse = async () => {

    try {
      setFormLoading(true)
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ party }),
      });

      if (response.ok) {
        await response.json();
        toast("Thank you for your response!")
      } else {
        toast("Error submitted response, please try again")
        throw new Error("Failed to save data");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false)
      closeForm()
    }
  }
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


  // Return main page
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  return (
    <div className={styles.page}>
      {showForm && (
        <div className={styles.formContainer}>
          <RSVPForm formLoading={formLoading} closeForm={closeForm} party={party} setParty={setParty} postResponse={postResponse} event={event} />
        </div>
      )}
      <div className={styles.main}>

        <div className={styles.header}>
          <h1>{event.eventTitle}</h1>
          {!party ? (
            <label>Please use the link provided to view details</label>
          ) : (
            <label>Please RSVP down below</label>
          )}
          {/*<pre>{JSON.stringify(event, null, 2)}</pre>
          <pre>{JSON.stringify(party, null, 2)}</pre>*/}
        </div>
        {event ? (
          party ? (
            <div className={styles.eventContainer}>
              {/* Display your event data here */}
              <EventContainer guid={guid} event={event} party={party} openForm={openForm} />
            </div>
          ) : (
            <div className={styles.logoContainer}>
              <Image
                src={event.logo}
                className={styles.logo}
                alt={event.eventTitle}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )) : (
          <div>No data available for this event.</div>
        )}
      </div>
      <ToastContainer/>
    </div>
  );
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
}
