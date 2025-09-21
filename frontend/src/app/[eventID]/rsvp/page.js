"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo} from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loading from "../components/loading";
import RSVPForm from "../components/RSVPForm";

import styles from "../styles/events.module.css";

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const date = new Date(`1970-01-01T${timeString}`);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    return timeString; // Fallback to original string if parsing fails
  }
};

// Helper sorting functions
const sortByPriority = (subEvents) => {
  return [...subEvents].sort((a, b) => {
    const priorityA = a.details?.priority || 999;
    const priorityB = b.details?.priority || 999;
    return priorityA - priorityB;
  });
};

const sortByStartDate = (subEvents) => {
  return [...subEvents].sort((a, b) => {
    const dateTimeA = new Date(`${a.event_date} ${a.start_time || '00:00'}`);
    const dateTimeB = new Date(`${b.event_date} ${b.start_time || '00:00'}`);
    return dateTimeA - dateTimeB;
  });
};

// EventCards component matching the preview design

const EventCards = ({ subEvents }) => {
  // Compute cards only when subEvents change
  const cards = useMemo(() => {
    const sortedEvents = sortByPriority(subEvents);
    const cardImages = sortedEvents
      .map((subEvent) => subEvent.image_url)
      .filter(Boolean);

    return cardImages.length > 0
      ? sortedEvents.filter((subEvent) => subEvent.image_url)
      : sortedEvents.slice(0, 3); // Limit to 3 placeholders
  }, [subEvents]);

  const [cardOrder, setCardOrder] = useState([...cards].reverse());

  useEffect(() => {
    setCardOrder([...cards].reverse());
  }, [cards]);

  const handleCardClick = (clickedCard) => {
    const newOrder = cardOrder.filter((card) => card !== clickedCard);
    newOrder.push(clickedCard);
    setCardOrder(newOrder);
  };

  if (cardOrder.length === 0) return null;

  return (
    <div className={styles.cardsDiv}>
      <div className={styles.imageStack}>
        {cardOrder.map((card, index) => (
          <div
            key={card.title || index}
            className={styles.cardD}
            onClick={() => handleCardClick(card)}
            style={{
              zIndex: index + 1,
              top: `${index * 35}px`,
              right: `${index * 10}px`,
            }}
          >
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.title || `Sub-Event ${index + 1}`}
                width={300}
                height={200}
                className={styles.cardView}
              />
            ) : (
              <div className={styles.cardView}>
                <div className={styles.placeholderCard}>
                  <h3>{card.title || `Sub-Event ${index + 1}`}</h3>
                  <p>
                    {card.event_date && card.start_time
                      ? `${new Date(card.event_date).toLocaleDateString()} at ${formatTime(card.start_time)}`
                      : "Date & Time"}
                  </p>
                  <p>{card.venue_address || "Location"}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Layout Variations
const MinimalLayout = ({ event, party, subEvents, themeStyles, openForm }) => {
  return (
    <div className={styles.minimalLayout}>
      <div className={styles.eventDetails}>
        <h2 style={{ color: themeStyles.color }}>Event Details</h2>
        <p className={styles.eventDescription} style={{ color: themeStyles.color }}>
          {event?.description || "Join us for this special event"}
        </p>
        
        {subEvents && subEvents.length > 0 && (
          <div className={styles.minimalSubEvents}>
            <h3 style={{ color: themeStyles.color }}>Events</h3>
            {sortByPriority(subEvents).map((subEvent) => (
              <div key={subEvent.id || subEvent.title} className={styles.minimalSubEvent}>
                <h4 style={{ color: themeStyles.color }}>{subEvent.title}</h4>
                <p style={{ color: themeStyles.color, opacity: 0.8 }}>
                  {subEvent.event_date && subEvent.start_time
                    ? `${new Date(subEvent.event_date).toLocaleDateString()} at ${formatTime(subEvent.start_time)}`
                    : "Date & Time TBD"}
                </p>
                <p style={{ color: themeStyles.color, opacity: 0.8 }}>
                  {subEvent.venue_address || "Location TBD"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.minimalInviteSection}>
        <h3 style={{ color: themeStyles.color }}>Invited Guests</h3>
        <div className={styles.minimalGuestList}>
          {party && party.map((guest) => (
            <span key={guest.id} className={styles.minimalGuestName} style={{ color: themeStyles.color }}>
              {guest.name}
            </span>
          ))}
        </div>
        
        {subEvents && subEvents.length > 0 && (
          <button
            className={styles.rsvpButton}
            onClick={openForm}
            style={{
              backgroundColor: themeStyles.primaryColor,
              color: "white",
            }}
          >
            RSVP Now
          </button>
        )}
      </div>
    </div>
  );
};

const GalleryLayout = ({ event, party, subEvents, themeStyles, openForm }) => {
  const imagesWithUrl = sortByPriority(subEvents || []).filter(se => se.image_url);
  const [expandedImage, setExpandedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Determine optimal column count for symmetrical layout
  const getColumnCount = (imageCount) => {
    if (imageCount === 0) return 1;
    if (imageCount === 1) return 1;
    if (imageCount === 2) return 2;
    if (imageCount <= 4) return 2;
    if (imageCount <= 6) return 3;
    return 3; // For 7+ images, use 3 columns
  };
  
  const columnCount = getColumnCount(imagesWithUrl.length);

  // Image expansion handlers
  const handleImageExpand = (subEvent, index) => {
    setExpandedImage(subEvent);
    setCurrentImageIndex(index);
  };

  const closeExpandedView = () => {
    setExpandedImage(null);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % imagesWithUrl.length
      : (currentImageIndex - 1 + imagesWithUrl.length) % imagesWithUrl.length;
    
    setCurrentImageIndex(newIndex);
    setExpandedImage(imagesWithUrl[newIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!expandedImage) return;
      
      if (e.key === 'Escape') {
        closeExpandedView();
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [expandedImage, currentImageIndex, imagesWithUrl.length]);
  
  return (
    <div className={styles.galleryLayout}>
      <div 
        className={styles.galleryGrid}
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        }}
      >
        {imagesWithUrl.map((subEvent, index) => (
        <div 
          key={subEvent.id || subEvent.title} 
          className={styles.galleryItem}
          onClick={() => handleImageExpand(subEvent, index)}
        >
          <Image
            src={subEvent.image_url}
            alt={subEvent.title}
            width={300}
            height={200}
            className={styles.galleryImage}
          />
        </div>
      ))}
    </div>
    
    <div className={styles.galleryInfo}>
      <h2 style={{ color: themeStyles.color }}>You're Invited</h2>
      <div className={styles.galleryGuestList}>
        {party && party.map((guest) => (
          <div key={guest.id} className={styles.galleryGuestName} style={{ color: themeStyles.color }}>
            {guest.name}
          </div>
        ))}
      </div>
      
      {subEvents && subEvents.length > 0 && (
        <button
          className={styles.rsvpButton}
          onClick={openForm}
          style={{
            backgroundColor: themeStyles.primaryColor,
            color: "white",
          }}
        >
          RSVP Now
        </button>
      )}
    </div>

    {/* Expanded Image Modal */}
    {expandedImage && (
      <div className={styles.expandedImageModal} onClick={closeExpandedView}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <button 
            className={styles.closeBtn}
            onClick={closeExpandedView}
            style={{ color: "white" }}
          >
            ✕
          </button>

          {imagesWithUrl.length > 1 && (
            <>
              <button 
                className={`${styles.navBtn} ${styles.prevBtn}`}
                onClick={() => navigateImage('prev')}
                style={{ color: "white" }}
              >
                ‹
              </button>
              <button 
                className={`${styles.navBtn} ${styles.nextBtn}`}
                onClick={() => navigateImage('next')}
                style={{ color: "white" }}
              >
                ›
              </button>
            </>
          )}

          <div className={styles.imageDetails}>
            <h3 style={{ color: "white" }}>{expandedImage.title}</h3>
            {expandedImage.event_date && (
              <p style={{ color: "rgba(255,255,255,0.8)" }}>
                {new Date(expandedImage.event_date).toLocaleDateString()}
                {expandedImage.start_time && ` at ${formatTime(expandedImage.start_time)}`}
              </p>
            )}
            {expandedImage.venue_address && (
              <p style={{ color: "rgba(255,255,255,0.8)" }}>
                📍 {expandedImage.venue_address}
              </p>
            )}
          </div>

          <div className={styles.expandedImageContainer}>
            <Image
              src={expandedImage.image_url}
              alt={expandedImage.title}
              width={1200}
              height={800}
              className={styles.expandedImage}
            />
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

const TimelineLayout = ({ event, party, subEvents, themeStyles, openForm }) => {
  return (
    <div className={styles.timelineLayout}>
      <div className={styles.timelineHeader}>
        <h2 style={{ color: themeStyles.color }}>Event Timeline</h2>
      </div>
      
      <div className={styles.timeline}>
        {sortByStartDate(subEvents || []).map((subEvent) => (
          <div key={subEvent.id || subEvent.title} className={styles.timelineItem}>
            <div className={styles.timelineMarker} style={{ backgroundColor: themeStyles.primaryColor }}></div>
            <div className={styles.timelineContent}>
              <h3 style={{ color: themeStyles.color }}>{subEvent.title}</h3>
              <p className={styles.timelineDate} style={{ color: themeStyles.color }}>
                {subEvent.event_date && subEvent.start_time
                  ? `${new Date(subEvent.event_date).toLocaleDateString()} at ${formatTime(subEvent.start_time)}`
                  : "Date & Time TBD"}
              </p>
              <p className={styles.timelineLocation} style={{ color: themeStyles.color, opacity: 0.8 }}>
                {subEvent.venue_address || "Location TBD"}
              </p>
              {subEvent.description && (
                <p className={styles.timelineDescription} style={{ color: themeStyles.color, opacity: 0.9 }}>
                  {subEvent.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.timelineInviteSection}>
        <h3 style={{ color: themeStyles.color }}>Invited Guests</h3>
        <div className={styles.timelineGuestList}>
          {party && party.map((guest) => (
            <span key={guest.id} className={styles.timelineGuestName} style={{ color: themeStyles.color }}>
              {guest.name}
            </span>
          ))}
        </div>
        
        {subEvents && subEvents.length > 0 && (
          <button
            className={styles.rsvpButton}
            onClick={openForm}
            style={{
              backgroundColor: themeStyles.primaryColor,
              color: "white",
            }}
          >
            RSVP Now
          </button>
        )}
      </div>
    </div>
  );
};


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
  const [isMuted, setIsMuted] = useState(false);
  const [layoutVariation, setLayoutVariation] = useState("gallery");

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
          let errorMessage = "Failed to fetch RSVP data";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, use response text or default message
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch (textError) {
              // Use default message if both JSON and text parsing fail
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Set the event, party, and landing config data
        setEvent(data.event);
        setParty(data.party || []);
        setSubEvents(data.subEvents || []);
        setLandingConfig(data.event.landing_page_configs?.[0] || null);

        if (process.env.NODE_ENV === 'development') {
          console.log("RSVP Data loaded:", {
            event: data.event?.title,
            partySize: data.party?.length,
            subEventsCount: data.subEvents?.length,
            hasLandingConfig: !!data.event.landing_page_configs?.[0],
          });
        }
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
    if (process.env.NODE_ENV === 'development') {
      console.log("dev data E",party, subEvents );
    }

      console.log("dev data",party, subEvents );
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const postResponse = async (
    responses,
    guestDetails,
    customQuestionResponses,
  ) => {
    try {
      setFormLoading(true);

      // Format the party data with responses for the new API
      const formattedParty = party.map((guest) => ({
        id: guest.id,
        public_id: guest.public_id,
        guestType: guest.guestType,
        guestLimit: guest.guestLimit,
        responses: responses[guest.id] || {},
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
          customQuestionResponses: customQuestionResponses || {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          "🎉 Thank you! Your RSVP has been submitted successfully.",
        );
        if (process.env.NODE_ENV === 'development') {
          console.log("RSVP submitted successfully:", result);
        }
      } else {
        let errorMessage = "❌ Error submitting response. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use default message
        }
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("RSVP submission error:", error);
      }
      toast.error(
        "❌ Failed to submit RSVP. Please check your connection and try again.",
      );
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
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    }
  };

  // Toggle mute functionality
  const toggleMute = () => {
    setIsMuted(prev => {
      if (audioRef.current) {
        if (!prev) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } else if (pageOpened) {
          audioRef.current.play().catch(error => {
            console.warn('Audio play failed:', error);
          });
        }
      }
      return !prev;
    });
  };

  // Development-only layout toggle functionality
  const availableLayouts = ["default", "minimal", "gallery", "timeline"];
  const toggleLayout = () => {
    if (process.env.NODE_ENV === 'development') {
      const currentIndex = availableLayouts.indexOf(layoutVariation);
      const nextIndex = (currentIndex + 1) % availableLayouts.length;
      setLayoutVariation(availableLayouts[nextIndex]);
    }
  };

  // Helper function to get theme styles from landing config
  const getThemeStyles = () => {
    if (!landingConfig?.greeting_config) {
      return {
        backgroundColor: "#faf5ff",
        color: "#581c87",
        primaryColor: "#7c3aed",
      };
    }

    const config = landingConfig.greeting_config;
    return {
      backgroundColor: config.background_color || "#faf5ff",
      color: config.text_color || "#581c87",
      primaryColor: config.primary_color || "#7c3aed",
      fontFamily: config.font_family || "Inter",
      backgroundImage: config.background_image,
      backgroundOverlay: config.background_overlay || 20,
    };
  };

  // Helper function to determine layout variation from landing config
  const getLayoutVariation = (config) => {
    if (!config?.rsvp_config) {
      return "gallery"; // Hardcoded fallback to current layout
    }
    
    // Check for layout_type in rsvp_config, default to "default"
    return config.rsvp_config.layout_type || "gallery";
  };

  // Update layout variation when landingConfig changes
  useEffect(() => {
    setLayoutVariation(getLayoutVariation(landingConfig));
  }, [landingConfig]);

  const themeStyles = getThemeStyles();

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

  // Helper function to render the appropriate layout
  const renderEventLayout = () => {
    const layoutProps = {
      event,
      party,
      subEvents,
      themeStyles,
      openForm
    };

    switch (layoutVariation) {
      case "minimal":
        return <MinimalLayout {...layoutProps} />;
      case "gallery":
        return <GalleryLayout {...layoutProps} />;
      case "timeline":
        return <TimelineLayout {...layoutProps} />;
      case "default":
      default:
        return (
          <div className={styles.eventContainer}>
            {/* Event Cards Section - matching preview */}
            {subEvents && subEvents.length > 0 && (
              <EventCards subEvents={subEvents} />
            )}

            {/* Guest Invite Section - matching preview design */}
            <div className={styles.inviteSection}>
              <div className={styles.inviteHeader}>
                <h2 style={{ color: themeStyles.color }}>Please Join Us</h2>
              </div>
              <div className={styles.guestList}>
                {party && party.map((guest) => (
                  <div
                    key={guest.id}
                    className={styles.guestName}
                    style={{ color: themeStyles.color }}
                  >
                    {guest.name}
                  </div>
                ))}
              </div>

              {/* Only show RSVP button if there are sub-events to RSVP to */}
              {subEvents && subEvents.length > 0 ? (
                <button
                  className={styles.rsvpButton}
                  onClick={openForm}
                  style={{
                    backgroundColor: themeStyles.primaryColor,
                    color: "white",
                  }}
                >
                  RSVP Now
                </button>
              ) : (
                <div
                  className={styles.noInvitesMessage}
                  style={{ color: themeStyles.color }}
                >
                  <p>No events to RSVP for at this time.</p>
                  <p style={{ fontSize: "14px", opacity: "0.8" }}>
                    Please check back later or contact the event organizer.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  // Return main page
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  return (
    <div
      className={styles.page}
      style={{
        backgroundColor: themeStyles.backgroundColor,
        color: themeStyles.color,
        fontFamily: themeStyles.fontFamily,
        backgroundImage: themeStyles.backgroundImage
          ? `url(${themeStyles.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Background overlay if background image is used */}
      {themeStyles.backgroundImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0, 0, 0, ${themeStyles.backgroundOverlay / 100})`,
            zIndex: 1,
          }}
        />
      )}

      <audio ref={audioRef} src="/invite_track.mp3" />

      {/* Mute button */}
      <button
        onClick={toggleMute}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: isMuted ? "#ef4444" : themeStyles.primaryColor,
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          fontSize: "20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        }}
        title={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* Development-only layout toggle button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={toggleLayout}
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            backgroundColor: themeStyles.primaryColor,
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontWeight: "600",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            textTransform: "capitalize",
          }}
          title={`Current layout: ${layoutVariation}. Click to cycle layouts.`}
          aria-label={`Layout toggle - current: ${layoutVariation}`}
        >
          {layoutVariation}
        </button>
      )}

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
            toast={toast}
          />
        </div>
      )}

      <div className={styles.main} style={{ position: "relative", zIndex: 2 }}>
        <div className={styles.header}>
          <h1 style={{ color: themeStyles.color }}>
            {landingConfig?.title || event?.title || "You're Invited!"}
          </h1>
          {!guid ? (
            <label>Please use the link provided to view details</label>
          ) : !party || party.length === 0 ? (
            <label>No invited guests found for this group</label>
          ) : !pageOpened ? (
            <label>
              {landingConfig?.greeting_config?.subtitle ||
                "Click logo below to continue"}
            </label>
          ) : (
            <label>Please RSVP below</label>
          )}
        </div>

        {/* Show greeting message if configured */}
        {landingConfig?.greeting_config?.message && pageOpened && (
          <div
            className={styles.greetingMessage}
            style={{ color: themeStyles.color }}
          >
            {landingConfig.greeting_config.message}
          </div>
        )}

        {event ? (
          party && party.length > 0 ? (
            pageOpened ? (
              renderEventLayout()
            ) : (
              <div className={styles.logoContainer}>
                <Image
                  src={
                    landingConfig?.logo || event.logo_url || "/default-logo.png"
                  }
                  className={styles.logoP}
                  alt="Click to continue"
                  onClick={openPage}
                  style={{ cursor: "pointer" }}
                  width={400}
                  height={400}
                />
              </div>
            )
          ) : (
            <div className={styles.logoContainer}>
              <Image
                src={
                  landingConfig?.logo || event.logo_url || "/default-logo.png"
                }
                className={styles.logo}
                alt={event.title || "Event Logo"}
                width={400}
                height={400}
              />
            </div>
          )
        ) : (
          <div>No event data available.</div>
        )}
      </div>

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
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
}
