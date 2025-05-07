"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";

import Loading from "../components/loading";
import EventContainer from "../components/eventcontainer";
import RSVPForm from "../components/RSVPForm";

import styles from "../styles/events.module.css";

export default function EventPage({ eventData }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const audioRef = useRef(null);

  const guid = searchParams.get("guid");

  const [party, setParty] = useState(null);
  const [event, setEvent] = useState(eventData);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [pageOpened, setPageOpened] = useState(false);

  const [showForm, setShowForm] = useState(false);

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
        console.log(data);
        setEvent(data);
        await fetchData(guid, data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        //router.push('/404'); // Redirect to 404 page if event doesn't exist
      }
    };
    const fetchData = async (guid, event) => {
      try {
        const queryParams = new URLSearchParams({
          guid,
          sheetID: event.sheetID,
        });

        const response = await fetch(
          `/api/${params.eventID}/rsvp?${queryParams}`,
        );

        const data = await response.json();

        if (response.status != 200)
          throw new Error(
            JSON.stringify({ message: data, status: response.status }),
          );
        else {
          console.log(data);
          // modifiying event based on functios party is invited to
          const filteredEvent = { ...event };

          // Get all funcX keys
          const funcKeys = Object.keys(event).filter((key) =>
            key.startsWith("func"),
          );

          // Filter out funcX where no party member has the corresponding column set to 1
          for (const funcKey of funcKeys) {
            const funcCol = event[funcKey].funcCol;

            const isAnyoneInvited = data.some(
              (member) => member[funcCol] === "1",
            );

            if (!isAnyoneInvited) {
              delete filteredEvent[funcKey];
            }
          }

          setEvent(filteredEvent);
          setParty(data);
        }
        // Process the data as needed
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [params.eventID, router, guid]);
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  // RSVP Form controls
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const openForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const postResponse = async () => {
    try {
      setFormLoading(true);
      const response = await fetch(`/api/${params.eventID}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ party, event }),
      });

      if (response.ok) {
        await response.json();
        toast("Thank you for your response!");
      } else {
        toast("Error submitted response, please try again");
        throw new Error("Failed to save data");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
      closeForm();
    }
  };
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  // When invite is opeened
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const openPage = () => {
    setPageOpened(true);
    //start music
    if (audioRef.current) {
      audioRef.current.play();
    }
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

  // Return main page
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  return (
    <div className={styles.page}>
      <audio ref={audioRef} src="/invite_track.mp3" />
      {showForm && (
        <div className={styles.formContainer}>
          <RSVPForm
            formLoading={formLoading}
            closeForm={closeForm}
            party={party}
            setParty={setParty}
            postResponse={postResponse}
            event={event}
          />
        </div>
      )}
      <div className={styles.main}>
        <div className={styles.header}>
          <h1>{event.eventTitle}</h1>
          {party ? (
            !pageOpened ? (
              <label>Click logo below</label>
            ) : (
              <label>Please RSVP down below</label>
            )
          ) : (
            <label>Please use the link provided to view details</label>
          )}
          {/*<pre>{JSON.stringify(event, null, 2)}</pre>
          <pre>{JSON.stringify(party, null, 2)}</pre>*/}
        </div>
        {event ? (
          party ? (
            pageOpened ? (
              <div className={styles.eventContainer}>
                {/* Display your event data here */}
                <EventContainer
                  guid={guid}
                  event={event}
                  party={party}
                  openForm={openForm}
                />
              </div>
            ) : (
              <div className={styles.logoContainer}>
                <Image
                  src={event.logo}
                  className={styles.logoP}
                  alt={`Click Me`}
                  onClick={openPage}
                  fill
                />
              </div>
            )
          ) : (
            <div className={styles.logoContainer}>
              <Image
                src={event.logo}
                className={`${styles.logo}`}
                alt={event.eventTitle}
                fill
              />
            </div>
          )
        ) : (
          <div>No data available for this event.</div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
}
