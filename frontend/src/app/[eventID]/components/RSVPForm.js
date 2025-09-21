import React, { useState, useEffect } from "react";
import styles from "../styles/form.module.css";
import Image from "next/image";
import Loading from "./loading";

const GuestRSVPBlock = ({
  guest,
  subEvent,
  responses,
  onResponseChange,
  themeStyles,
}) => {
  const guestId = guest.id;
  const subEventId = subEvent.id;
  const currentResponse = responses[guestId]?.[subEventId] ?? "pending";

  const handleResponse = (value) => {
    onResponseChange(guestId, subEventId, value);
  };

  return (
    <div className={styles.resBlock}>
      <div>
        <label>
          {guest.name} - {subEvent.title}
        </label>
        {subEvent.event_date && (
          <div className={styles.subEventDetails}>
            Date: {new Date(subEvent.event_date).toLocaleDateString(undefined, {timeZone:'UTC'})}
            {subEvent.start_time &&
              ` at ${new Date(
                `1970-01-01T${subEvent.start_time}`,
              ).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`}
          </div>
        )}
      </div>

      <div className={styles.responseButtons}>
        {/* Render RSVP input depending on guest type */}
        {guest.guestType === "single" && (
          <>
            <button
              className={`${styles.responseBtn} ${currentResponse === "attending" ? styles.selectedBtn : ""}`}
              onClick={() => handleResponse("attending")}
              style={{
                backgroundColor:
                  currentResponse === "attending"
                    ? themeStyles.primaryColor
                    : "transparent",
                borderColor: themeStyles.primaryColor,
                color:
                  currentResponse === "attending"
                    ? "white"
                    : themeStyles.primaryColor,
              }}
            >
              Yes
            </button>
            <button
              className={`${styles.responseBtn} ${currentResponse === "not_attending" ? styles.selectedBtn : ""}`}
              onClick={() => handleResponse("not_attending")}
              style={{
                backgroundColor:
                  currentResponse === "not_attending"
                    ? "#dc2626"
                    : "transparent",
                borderColor: "#dc2626",
                color:
                  currentResponse === "not_attending" ? "white" : "#dc2626",
              }}
            >
              No
            </button>
          </>
        )}

        {guest.guestType === "multiple" && (
          <select
            value={currentResponse === "pending" ? "" : currentResponse}
            onChange={(e) => handleResponse(Number(e.target.value))}
            style={{ borderColor: themeStyles.primaryColor }}
          >
            <option value="">Select number attending</option>
            {Array.from(
              { length: (guest.guestLimit ?? 1) + 1 },
              (_, i) => i,
            ).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        )}

        {guest.guestType === "variable" && (
          <input
            type="number"
            min="0"
            value={currentResponse === "pending" ? "" : currentResponse}
            onChange={(e) => handleResponse(Number(e.target.value))}
            style={{ borderColor: themeStyles.primaryColor }}
            placeholder="Enter number attending"
          />
        )}
      </div>
    </div>
  );
};

const RsvpForm = ({
  formLoading,
  closeForm,
  party,
  setParty,
  postResponse,
  event,
  subEvents,
  landingConfig,
  themeStyles,
  toast,
}) => {
  // State for RSVP responses: { guestId: { subEventId: 'attending'|'not_attending' } }
  const [responses, setResponses] = useState({});
  const [guestDetails, setGuestDetails] = useState({});
  const [customQuestionResponses, setCustomQuestionResponses] = useState({});
  const [currentSubEventIndex, setCurrentSubEventIndex] = useState(0);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize responses from existing RSVP data
  useEffect(() => {
    const initialResponses = {};
    const initialGuestDetails = {};

    party.forEach((guest) => {
      initialResponses[guest.id] = {};
      initialGuestDetails[guest.public_id] = {
        email: guest.email || "",
        phone: guest.phone || "",
      };

      // Set existing responses based on guest type and RSVP data
      if (guest.rsvps && guest.rsvps.length > 0) {
        guest.rsvps.forEach((rsvp) => {
          const subEvent = subEvents.find((se) => se.id === rsvp.subevent_id);
          if (subEvent) {
            const guestType = (guest.guestType || "single").toLowerCase();

            // Convert database response back to frontend format based on guest type
            let frontendResponse;
            switch (guestType) {
              case "single":
                // For single type: status_id determines the response
                if (rsvp.status_id === 3) {
                  frontendResponse = "attending";
                } else if (rsvp.status_id === 4) {
                  frontendResponse = "not_attending";
                } else if (rsvp.status_id === 5) {
                  frontendResponse = "maybe";
                } else {
                  frontendResponse = "pending";
                }
                break;

              case "multiple":
              case "variable":
                // For multiple/variable types: use the numeric response value
                if (rsvp.response !== null && rsvp.response !== undefined) {
                  frontendResponse = rsvp.response;
                } else {
                  // Fallback: if no response value, determine from status
                  frontendResponse = rsvp.status_id === 3 ? 1 : 0;
                }
                break;

              default:
                // Default to pending
                frontendResponse = "pending";
            }

            if (process.env.NODE_ENV === 'development') {
              console.log(
                `Loading existing response for ${guest.name} (${guestType}) - ${subEvent.title}: DB status=${rsvp.status_id}, DB response=${rsvp.response} → Frontend: ${frontendResponse}`,
              );
            }
            initialResponses[guest.id][subEvent.id] = frontendResponse;
          }
        });
      } else if (guest.invites) {
        // Fallback: use old invites structure if rsvps not available
        Object.entries(guest.invites).forEach(([subEventTitle, statusId]) => {
          const subEvent = subEvents.find((se) => se.title === subEventTitle);
          if (subEvent) {
            let status = "pending";
            switch (statusId) {
              case 3:
                status = "attending";
                break;
              case 4:
                status = "not_attending";
                break;
              case 5:
                status = "maybe";
                break;
              default:
                status = "pending";
            }
            initialResponses[guest.id][subEvent.id] = status;
          }
        });
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("RSVP Form Initialization Summary:", {
        totalGuests: party.length,
        guestsWithResponses: Object.keys(initialResponses).filter(
          (guestId) => Object.keys(initialResponses[guestId]).length > 0,
        ).length,
        initialResponses,
      });
    }

    setResponses(initialResponses);
    setGuestDetails(initialGuestDetails);
  }, [party, subEvents]);

  const onResponseChange = (guestId, subEventId, status) => {
    setResponses((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [subEventId]: status,
      },
    }));
  };

  // Mobile detection and header collapse logic
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleHeader = () => {
    if (isMobile) {
      setIsHeaderCollapsed(!isHeaderCollapsed);
    }
  };

  const onCustomQuestionChange = (questionId, value) => {
    setCustomQuestionResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const onGuestDetailChange = (guestPublicId, field, value) => {
    setGuestDetails((prev) => ({
      ...prev,
      [guestPublicId]: {
        ...prev[guestPublicId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    // Validate that all required responses are given - only for guests invited to each sub-event
    const incompleteGuests = party.filter((guest) => {
      return subEvents.some((subEvent) => {
        // Only validate if the guest is invited to this sub-event
        const isInvited = guest.rsvps?.some(
          (rsvp) => rsvp.subevent_id === subEvent.id,
        );
        if (!isInvited) return false;

        return (
          !responses[guest.id]?.[subEvent.id] ||
          responses[guest.id][subEvent.id] === "pending"
        );
      });
    });

    if (incompleteGuests.length > 0) {
      toast.error(
        "Please provide responses for all invited guests and events before submitting.",
      );
      return;
    }

    // Validate required custom questions
    if (landingConfig?.rsvp_config) {
      const config = landingConfig.rsvp_config;

      if (
        config.dietary_restrictions_required &&
        !customQuestionResponses.dietary_restrictions?.trim()
      ) {
        toast.error("Please answer the dietary restrictions question.");
        return;
      }

      if (
        config.song_requests_required &&
        !customQuestionResponses.song_requests?.trim()
      ) {
        toast.error("Please answer the song requests question.");
        return;
      }

      if (
        config.special_accommodations_required &&
        !customQuestionResponses.special_accommodations?.trim()
      ) {
        toast.error("Please answer the special accommodations question.");
        return;
      }

      // Validate custom questions
      if (config.custom_questions) {
        for (let i = 0; i < config.custom_questions.length; i++) {
          const question = config.custom_questions[i];
          if (
            question.required &&
            !customQuestionResponses[`custom_${i}`]?.trim()
          ) {
            toast.error(
              `Please answer the required question: ${question.question}`,
            );
            return;
          }
        }
      }
    }

    toast.info("Submitting your RSVP responses...");
    postResponse(responses, guestDetails, customQuestionResponses);
  };

  if (!subEvents || subEvents.length === 0) {
    return (
      <div className={styles.modal}>
        <div className={styles.closeBtnDiv}>
          <button onClick={closeForm} className={styles.closeBtn}>
            ×
          </button>
        </div>
        <div className={styles.formHeader}>
          <h3>No Events Available</h3>
          <div className={styles.headerInfo}>
            <p>There are no events to RSVP for at this time.</p>
            <p style={{ fontSize: "14px", opacity: "0.8" }}>
              You may not be invited to any sub-events, or all invitations may
              have been completed.
            </p>
          </div>
        </div>
        <div className={styles.formSubmit}>
          <button onClick={closeForm} className={styles.responseBtn}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentSubEvent = subEvents[currentSubEventIndex];

  const handleNext = () => {
    if (currentSubEventIndex < subEvents.length - 1) {
      setCurrentSubEventIndex(currentSubEventIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSubEventIndex > 0) {
      setCurrentSubEventIndex(currentSubEventIndex - 1);
    }
  };

  const openMap = (address) => {
    if (address) {
      const encodedLocation = encodeURIComponent(address);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
        "_blank",
      );
    }
  };

  const openGoogleCalendar = (subEvent) => {
    console.log(subEvent)
    if (!subEvent.event_date) return;

    const eventDate = new Date(subEvent.event_date);
    if (subEvent.start_time) {
      const [hours, minutes] = subEvent.start_time.split(":");
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }

    const formatDate = (date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const startDate = formatDate(eventDate);
    const endDate = formatDate(
      new Date(eventDate.getTime() + 2 * 60 * 60 * 1000),
    ); // 2 hours duration

    const encodedTitle = encodeURIComponent(subEvent.title);
    const encodedLocation = subEvent.venue_address
      ? encodeURIComponent(subEvent.venue_address)
      : "";

    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${startDate}/${endDate}&details=Event%20created%20from%20RSVP&location=${encodedLocation}&sf=true&output=xml`;
    window.open(calendarUrl, "_blank");
  };

  return (
    <dialog open className={styles.modal}>
      {formLoading ? (
        <Loading />
      ) : (
        <>
          <div className={styles.closeBtnDiv}>
            <button
              onClick={closeForm}
              className={styles.closeBtn}
              style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: themeStyles.color,
              }}
            >
              ×
            </button>
          </div>

          <div
            className={`${styles.formHeader} ${isMobile && isHeaderCollapsed ? styles.headerCollapsed : ""}`}
            style={{ borderBottomColor: themeStyles.primaryColor }}
            onClick={toggleHeader}
          >
            <div className={styles.headerTitle}>
              <h3 style={{ color: themeStyles.color }}>
                RSVP for {event?.title || "Event"}
              </h3>
              {isMobile && (
                <div
                  className={styles.toggleIcon}
                  style={{ color: themeStyles.primaryColor }}
                >
                  {isHeaderCollapsed
                    ? "▼ Tap to expand details"
                    : "▲ Tap to collapse details"}
                </div>
              )}
            </div>

            <div
              className={`${styles.headerDetails} ${isMobile && isHeaderCollapsed ? styles.detailsCollapsed : ""}`}
            >
              {currentSubEvent && (
                <div className={styles.headerInfo}>
                  <h4 style={{ color: themeStyles.primaryColor }}>
                    {currentSubEvent.title}
                  </h4>
                  {currentSubEvent.event_date && (
                    <div className={styles.eventDetails}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleCalendar(currentSubEvent);
                        }}
                        className={styles.calendarBtn}
                        style={{
                          backgroundColor: themeStyles.primaryColor,
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        📅 Add to Calendar
                      </button>
                      <span>
                        {new Date(
                          currentSubEvent.event_date,
                        ).toLocaleDateString(undefined, {timeZone:'UTC'})}
                        {currentSubEvent.start_time &&
                          ` at ${new Date(
                            `1970-01-01T${currentSubEvent.start_time}`,
                          ).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`}
                      </span>
                    </div>
                  )}
                  {currentSubEvent.venue_address && (
                    <div className={styles.locationInfo}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMap(currentSubEvent.venue_address);
                        }}
                        className={styles.mapBtn}
                        style={{
                          backgroundColor: "transparent",
                          color: themeStyles.primaryColor,
                          border: `1px solid ${themeStyles.primaryColor}`,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        📍 View Location
                      </button>
                      <span>{currentSubEvent.venue_address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formBody}>
            {/* Progress indicator */}
            {subEvents.length > 1 && (
              <div className={styles.progressIndicator}>
                <span style={{ color: themeStyles.color }}>
                  Event {currentSubEventIndex + 1} of {subEvents.length}
                </span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${((currentSubEventIndex + 1) / subEvents.length) * 100}%`,
                      backgroundColor: themeStyles.primaryColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Guest contact info section */}
            <div className={styles.contactSection}>
              <h4 style={{ color: themeStyles.color }}>Contact Information</h4>
              {party
                .filter((guest) => guest.point_of_contact)
                .map((guest) => (
                  <div key={guest.id} className={styles.contactForm}>
                    <p style={{ color: themeStyles.color }}>
                      Please confirm your contact details:
                    </p>
                    <div className={styles.contactFields}>
                      <div className={styles.contactField}>
                        <label>Email:</label>
                        <input
                          type="email"
                          value={guestDetails[guest.public_id]?.email || ""}
                          onChange={(e) =>
                            onGuestDetailChange(
                              guest.public_id,
                              "email",
                              e.target.value,
                            )
                          }
                          style={{ borderColor: themeStyles.primaryColor }}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div className={styles.contactField}>
                        <label>Phone:</label>
                        <input
                          type="tel"
                          value={guestDetails[guest.public_id]?.phone || ""}
                          onChange={(e) =>
                            onGuestDetailChange(
                              guest.public_id,
                              "phone",
                              e.target.value,
                            )
                          }
                          style={{ borderColor: themeStyles.primaryColor }}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* RSVP responses */}
            <div className={styles.rsvpSection}>
              <h4 style={{ color: themeStyles.color }}>
                Please respond for each guest:
              </h4>
              {(() => {
                const invitedGuests = party.filter((guest) => {
                  // Only show guests who are invited to this specific sub-event
                  return guest.rsvps?.some(
                    (rsvp) => rsvp.subevent_id === currentSubEvent.id,
                  );
                });

                if (invitedGuests.length === 0) {
                  return (
                    <div
                      className={styles.noGuestsMessage}
                      style={{ color: themeStyles.color }}
                    >
                      <p>No guests are invited to this event.</p>
                    </div>
                  );
                }

                return invitedGuests.map((guest) => (
                  <GuestRSVPBlock
                    key={guest.id}
                    guest={guest}
                    subEvent={currentSubEvent}
                    responses={responses}
                    onResponseChange={onResponseChange}
                    themeStyles={themeStyles}
                  />
                ));
              })()}
            </div>

            {/* Custom questions from RSVP config */}
            {landingConfig?.rsvp_config && (
              <div className={styles.customQuestions}>
                <h4 style={{ color: themeStyles.color }}>
                  Additional Questions
                </h4>

                {/* Dietary restrictions */}
                {landingConfig.rsvp_config.dietary_restrictions_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Do you have any dietary restrictions?
                      {landingConfig.rsvp_config
                        .dietary_restrictions_required && (
                        <span style={{ color: "#dc2626" }}>*</span>
                      )}
                    </label>
                    <textarea
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="Please describe any dietary restrictions or allergies..."
                      rows="3"
                      value={customQuestionResponses.dietary_restrictions || ""}
                      onChange={(e) =>
                        onCustomQuestionChange(
                          "dietary_restrictions",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                )}

                {/* Song requests */}
                {landingConfig.rsvp_config.song_requests_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Song requests
                      {landingConfig.rsvp_config.song_requests_required && (
                        <span style={{ color: "#dc2626" }}>*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="What songs would you like to hear?"
                      value={customQuestionResponses.song_requests || ""}
                      onChange={(e) =>
                        onCustomQuestionChange("song_requests", e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Special accommodations */}
                {landingConfig.rsvp_config.special_accommodations_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Special accommodations needed
                      {landingConfig.rsvp_config
                        .special_accommodations_required && (
                        <span style={{ color: "#dc2626" }}>*</span>
                      )}
                    </label>
                    <textarea
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="Please describe any special accommodations needed..."
                      rows="3"
                      value={
                        customQuestionResponses.special_accommodations || ""
                      }
                      onChange={(e) =>
                        onCustomQuestionChange(
                          "special_accommodations",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                )}

                {/* Custom questions */}
                {landingConfig.rsvp_config.custom_questions &&
                  landingConfig.rsvp_config.custom_questions.length > 0 &&
                  landingConfig.rsvp_config.custom_questions.map(
                    (question, index) => (
                      <div key={index} className={styles.customQuestion}>
                        <label style={{ color: themeStyles.color }}>
                          {question.question}
                          {question.required && (
                            <span style={{ color: "#dc2626" }}>*</span>
                          )}
                        </label>
                        {question.type === "text" && (
                          <input
                            type="text"
                            style={{ borderColor: themeStyles.primaryColor }}
                            placeholder={question.placeholder}
                            value={
                              customQuestionResponses[`custom_${index}`] || ""
                            }
                            onChange={(e) =>
                              onCustomQuestionChange(
                                `custom_${index}`,
                                e.target.value,
                              )
                            }
                          />
                        )}
                        {question.type === "textarea" && (
                          <textarea
                            style={{ borderColor: themeStyles.primaryColor }}
                            placeholder={question.placeholder}
                            rows="3"
                            value={
                              customQuestionResponses[`custom_${index}`] || ""
                            }
                            onChange={(e) =>
                              onCustomQuestionChange(
                                `custom_${index}`,
                                e.target.value,
                              )
                            }
                          />
                        )}
                        {question.type === "select" && (
                          <select
                            style={{ borderColor: themeStyles.primaryColor }}
                            value={
                              customQuestionResponses[`custom_${index}`] || ""
                            }
                            onChange={(e) =>
                              onCustomQuestionChange(
                                `custom_${index}`,
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Please select...</option>
                            {question.options?.map((option, optIndex) => (
                              <option key={optIndex} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ),
                  )}
              </div>
            )}
          </div>

          <div className={styles.formSubmit}>
            {/* Navigation buttons */}
            <div className={styles.navButtons}>
              {currentSubEventIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className={styles.responseBtn}
                  style={{
                    backgroundColor: "transparent",
                    color: themeStyles.primaryColor,
                    border: `1px solid ${themeStyles.primaryColor}`,
                  }}
                >
                  ← Previous Event
                </button>
              )}

              {currentSubEventIndex < subEvents.length - 1 ? (
                <button
                  onClick={handleNext}
                  className={styles.responseBtn}
                  style={{
                    backgroundColor: themeStyles.primaryColor,
                    color: "white",
                    border: "none",
                  }}
                >
                  Next Event →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className={styles.responseBtn}
                  style={{
                    backgroundColor: themeStyles.primaryColor,
                    color: "white",
                    border: "none",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Submit RSVP
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
};

export default RsvpForm;
