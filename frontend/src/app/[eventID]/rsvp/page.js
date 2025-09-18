"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";

import Loading from "../components/loading";
import RSVPForm from "../components/RSVPForm";

import styles from "../styles/events.module.css";

export default function RSVPPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const audioRef = useRef(null);

  const guid = searchParams.get("guid") || searchParams.get("guestId");

  const [party, setParty] = useState(null);
  const [event, setEvent] = useState(null);
  const [landingConfig, setLandingConfig] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [pageOpened, setPageOpened] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Get event data based on eventID and guest ID
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  useEffect(() => {
    const fetchRSVPData = async () => {
      if (!guid) {
        setLoading(false);
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          guestId: guid,
        });

        const response = await fetch(
          `/api/${params.eventID}/rsvp?${queryParams}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch RSVP data");
        }

        const data = await response.json();
        
        // Set the event, party, and landing config data
        setEvent(data.event);
        setParty(data.party || []);
        setSubEvents(data.subEvents || []);
        setLandingConfig(data.event.landing_page_configs?.[0] || null);

        console.log("RSVP Data loaded:", {
          event: data.event?.title,
          partySize: data.party?.length,
          subEventsCount: data.subEvents?.length,
          hasLandingConfig: !!data.event.landing_page_configs?.[0]
        });

      } catch (error) {
        console.error("Error fetching RSVP data:", error);
        toast.error(error.message || "Failed to load RSVP data");
        // Don't redirect, let them see the error state
      } finally {
        setLoading(false);
      }
    };

    fetchRSVPData();
  }, [params.eventID, guid]);
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  // RSVP Form controls
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const openForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const postResponse = async (responses, guestDetails, customQuestionResponses) => {
    try {
      setFormLoading(true);
      
      // Format the party data with responses for the new API
      const formattedParty = party.map(guest => ({
        id: guest.id,
        public_id: guest.public_id,
        responses: responses[guest.id] || {}
      }));

      const response = await fetch(`/api/${params.eventID}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          party: formattedParty,
          responses: responses,
          guestDetails: guestDetails || {},
          customQuestionResponses: customQuestionResponses || {}
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Thank you for your response!");
        console.log("RSVP submitted successfully:", result);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error submitting response, please try again");
        throw new Error(errorData.error || "Failed to save data");
      }
    } catch (error) {
      console.error("RSVP submission error:", error);
      toast.error("Failed to submit RSVP. Please try again.");
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

  // Helper function to get theme styles from landing config
  const getThemeStyles = () => {
    if (!landingConfig?.greeting_config) {
      return {
        backgroundColor: '#faf5ff',
        color: '#581c87',
        primaryColor: '#7c3aed'
      };
    }

    const config = landingConfig.greeting_config;
    return {
      backgroundColor: config.background_color || '#faf5ff',
      color: config.text_color || '#581c87',
      primaryColor: config.primary_color || '#7c3aed',
      fontFamily: config.font_family || 'Inter',
      backgroundImage: config.background_image,
      backgroundOverlay: config.background_overlay || 20
    };
  };

  const themeStyles = getThemeStyles();

  // Return main page
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  return (
    <div 
      className={styles.page}
      style={{
        backgroundColor: themeStyles.backgroundColor,
        color: themeStyles.color,
        fontFamily: themeStyles.fontFamily,
        backgroundImage: themeStyles.backgroundImage ? `url(${themeStyles.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      {/* Background overlay if background image is used */}
      {themeStyles.backgroundImage && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0, 0, 0, ${themeStyles.backgroundOverlay / 100})`,
            zIndex: 1
          }}
        />
      )}
      
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
            subEvents={subEvents}
            landingConfig={landingConfig}
            themeStyles={themeStyles}
          />
        </div>
      )}
      
      <div className={styles.main} style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.header}>
          <h1 style={{ color: themeStyles.color }}>
            {landingConfig?.title || event?.title || 'You\'re Invited!'}
          </h1>
          {!guid ? (
            <label>Please use the link provided to view details</label>
          ) : !party || party.length === 0 ? (
            <label>Group not found for this event</label>
          ) : !pageOpened ? (
            <label>
              {landingConfig?.greeting_config?.subtitle || 'Click logo below to continue'}
            </label>
          ) : (
            <div>
              {/* Display guest names */}
              {party && party.length > 0 && (
                <div className={styles.guestNames} style={{ color: themeStyles.color, marginBottom: '16px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '500' }}>
                    {party.length === 1 ? (
                      `Hello ${party[0].name}!`
                    ) : party.length === 2 ? (
                      `Hello ${party[0].name} and ${party[1].name}!`
                    ) : (
                      `Hello ${party.slice(0, -1).map(guest => guest.name).join(', ')}, and ${party[party.length - 1].name}!`
                    )}
                  </p>
                  {party[0].group && (
                    <p style={{ fontSize: '14px', opacity: '0.8' }}>
                      Group: {party[0].group}
                    </p>
                  )}
                </div>
              )}
              <label>Please RSVP below</label>
            </div>
          )}
        </div>

        {/* Show greeting message if configured */}
        {landingConfig?.greeting_config?.message && pageOpened && (
          <div className={styles.greetingMessage} style={{ color: themeStyles.color }}>
            {landingConfig.greeting_config.message}
          </div>
        )}

        {event ? (
          party && party.length > 0 ? (
            pageOpened ? (
              <div className={styles.eventContainer}>
                {/* Display event information and RSVP button */}
                <div className={styles.eventInfo}>
                  {event.description && (
                    <p className={styles.eventDescription}>{event.description}</p>
                  )}
                  
                  {/* Show sub-events */}
                  {subEvents && subEvents.length > 0 && (
                    <div className={styles.subEvents}>
                      <h3>Event Details:</h3>
                      {subEvents.map(subEvent => (
                        <div key={subEvent.id} className={styles.subEvent}>
                          <h4>{subEvent.title}</h4>
                          {subEvent.event_date && (
                            <p>Date: {new Date(subEvent.event_date).toLocaleDateString()}</p>
                          )}
                          {subEvent.start_time && (
                            <p>Time: {subEvent.start_time}</p>
                          )}
                          {subEvent.venue_address && (
                            <p>Location: {subEvent.venue_address}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    className={styles.rsvpButton} 
                    onClick={openForm}
                    style={{ 
                      backgroundColor: themeStyles.primaryColor,
                      color: 'white'
                    }}
                  >
                    RSVP Now
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.logoContainer}>
                <Image
                  src={landingConfig?.logo || event.logo_url || '/default-logo.png'}
                  className={styles.logoP}
                  alt="Click to continue"
                  onClick={openPage}
                  fill
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )
          ) : (
            <div className={styles.logoContainer}>
              <Image
                src={landingConfig?.logo || event.logo_url || '/default-logo.png'}
                className={styles.logo}
                alt={event.title || 'Event Logo'}
                fill
              />
            </div>
          )
        ) : (
          <div>No event data available.</div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
}
