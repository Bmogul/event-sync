import React, { useState, useEffect } from "react";
import styles from "../styles/form.module.css";
import Image from "next/image";
import Loading from "./loading";

const GuestRSVPBlock = ({ guest, subEvent, responses, onResponseChange, themeStyles }) => {
  const guestId = guest.id;
  const subEventId = subEvent.id;
  const currentResponse = responses[guestId]?.[subEventId] || 'pending';

  const handleResponse = (status) => {
    onResponseChange(guestId, subEventId, status);
  };

  return (
    <div className={styles.resBlock}>
      <div>
        <label>{guest.name} - {subEvent.title}</label>
        {subEvent.event_date && (
          <div className={styles.subEventDetails}>
            Date: {new Date(subEvent.event_date).toLocaleDateString()}
            {subEvent.start_time && ` at ${subEvent.start_time}`}
          </div>
        )}
      </div>
      <div className={styles.responseButtons}>
        <button
          className={`${styles.responseBtn} ${currentResponse === 'attending' ? styles.selectedBtn : ''}`}
          onClick={() => handleResponse('attending')}
          style={{
            backgroundColor: currentResponse === 'attending' ? themeStyles.primaryColor : 'transparent',
            borderColor: themeStyles.primaryColor,
            color: currentResponse === 'attending' ? 'white' : themeStyles.primaryColor
          }}
        >
          Yes
        </button>
        <button
          className={`${styles.responseBtn} ${currentResponse === 'not_attending' ? styles.selectedBtn : ''}`}
          onClick={() => handleResponse('not_attending')}
          style={{
            backgroundColor: currentResponse === 'not_attending' ? '#dc2626' : 'transparent',
            borderColor: '#dc2626',
            color: currentResponse === 'not_attending' ? 'white' : '#dc2626'
          }}
        >
          No
        </button>
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
  themeStyles
}) => {
  // State for RSVP responses: { guestId: { subEventId: 'attending'|'not_attending' } }
  const [responses, setResponses] = useState({});
  const [guestDetails, setGuestDetails] = useState({});
  const [customQuestionResponses, setCustomQuestionResponses] = useState({});
  const [currentSubEventIndex, setCurrentSubEventIndex] = useState(0);

  // Initialize responses from existing RSVP data
  useEffect(() => {
    const initialResponses = {};
    const initialGuestDetails = {};
    
    party.forEach(guest => {
      initialResponses[guest.id] = {};
      initialGuestDetails[guest.public_id] = {
        email: guest.email || '',
        phone: guest.phone || ''
      };

      // Set existing responses
      if (guest.invites) {
        Object.entries(guest.invites).forEach(([subEventTitle, statusId]) => {
          const subEvent = subEvents.find(se => se.title === subEventTitle);
          if (subEvent) {
            let status = 'pending';
            switch (statusId) {
              case 3: status = 'attending'; break;
              case 4: status = 'not_attending'; break;
              case 5: status = 'maybe'; break;
              default: status = 'pending';
            }
            initialResponses[guest.id][subEvent.id] = status;
          }
        });
      }
    });
    
    setResponses(initialResponses);
    setGuestDetails(initialGuestDetails);
  }, [party, subEvents]);

  const onResponseChange = (guestId, subEventId, status) => {
    setResponses(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [subEventId]: status
      }
    }));
  };

  const onCustomQuestionChange = (questionId, value) => {
    setCustomQuestionResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const onGuestDetailChange = (guestPublicId, field, value) => {
    setGuestDetails(prev => ({
      ...prev,
      [guestPublicId]: {
        ...prev[guestPublicId],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    // Validate that all required responses are given
    const incompleteGuests = party.filter(guest => {
      return subEvents.some(subEvent => {
        return !responses[guest.id]?.[subEvent.id] || responses[guest.id][subEvent.id] === 'pending';
      });
    });

    if (incompleteGuests.length > 0) {
      alert('Please provide responses for all guests and events before submitting.');
      return;
    }

    // Validate required custom questions
    if (landingConfig?.rsvp_config) {
      const config = landingConfig.rsvp_config;
      
      if (config.dietary_restrictions_required && !customQuestionResponses.dietary_restrictions?.trim()) {
        alert('Please answer the dietary restrictions question.');
        return;
      }
      
      if (config.song_requests_required && !customQuestionResponses.song_requests?.trim()) {
        alert('Please answer the song requests question.');
        return;
      }
      
      if (config.special_accommodations_required && !customQuestionResponses.special_accommodations?.trim()) {
        alert('Please answer the special accommodations question.');
        return;
      }

      // Validate custom questions
      if (config.custom_questions) {
        for (let i = 0; i < config.custom_questions.length; i++) {
          const question = config.custom_questions[i];
          if (question.required && !customQuestionResponses[`custom_${i}`]?.trim()) {
            alert(`Please answer the required question: ${question.question}`);
            return;
          }
        }
      }
    }

    postResponse(responses, guestDetails, customQuestionResponses);
  };

  if (!subEvents || subEvents.length === 0) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.form}>
          <div className={styles.header}>
            <h2>No Events Available</h2>
            <button onClick={closeForm} className={styles.closeBtn}>×</button>
          </div>
          <p>There are no events to RSVP for at this time.</p>
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
    if (!subEvent.event_date) return;

    const eventDate = new Date(subEvent.event_date);
    if (subEvent.start_time) {
      const [hours, minutes] = subEvent.start_time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }

    const formatDate = (date) =>
      date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const startDate = formatDate(eventDate);
    const endDate = formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)); // 2 hours duration
    
    const encodedTitle = encodeURIComponent(subEvent.title);
    const encodedLocation = subEvent.venue_address ? encodeURIComponent(subEvent.venue_address) : '';

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
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: themeStyles.color
              }}
            >
              ×
            </button>
          </div>
          
          <div className={styles.formHeader} style={{ borderBottomColor: themeStyles.primaryColor }}>
            <h3 style={{ color: themeStyles.color }}>
              RSVP for {event?.title || 'Event'}
            </h3>
            
            {currentSubEvent && (
              <div className={styles.headerInfo}>
                <h4 style={{ color: themeStyles.primaryColor }}>
                  {currentSubEvent.title}
                </h4>
                {currentSubEvent.event_date && (
                  <div className={styles.eventDetails}>
                    <button
                      onClick={() => openGoogleCalendar(currentSubEvent)}
                      className={styles.calendarBtn}
                      style={{ 
                        backgroundColor: themeStyles.primaryColor,
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📅 Add to Calendar
                    </button>
                    <span>
                      {new Date(currentSubEvent.event_date).toLocaleDateString()}
                      {currentSubEvent.start_time && ` at ${currentSubEvent.start_time}`}
                    </span>
                  </div>
                )}
                {currentSubEvent.venue_address && (
                  <div className={styles.locationInfo}>
                    <button
                      onClick={() => openMap(currentSubEvent.venue_address)}
                      className={styles.mapBtn}
                      style={{ 
                        backgroundColor: 'transparent',
                        color: themeStyles.primaryColor,
                        border: `1px solid ${themeStyles.primaryColor}`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
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
                      backgroundColor: themeStyles.primaryColor
                    }}
                  />
                </div>
              </div>
            )}

            {/* Guest contact info section */}
            <div className={styles.contactSection}>
              <h4 style={{ color: themeStyles.color }}>Contact Information</h4>
              {party.filter(guest => guest.point_of_contact).map(guest => (
                <div key={guest.id} className={styles.contactForm}>
                  <p style={{ color: themeStyles.color }}>
                    Please confirm your contact details:
                  </p>
                  <div className={styles.contactFields}>
                    <div className={styles.contactField}>
                      <label>Email:</label>
                      <input
                        type="email"
                        value={guestDetails[guest.public_id]?.email || ''}
                        onChange={(e) => onGuestDetailChange(guest.public_id, 'email', e.target.value)}
                        style={{ borderColor: themeStyles.primaryColor }}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div className={styles.contactField}>
                      <label>Phone:</label>
                      <input
                        type="tel"
                        value={guestDetails[guest.public_id]?.phone || ''}
                        onChange={(e) => onGuestDetailChange(guest.public_id, 'phone', e.target.value)}
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
              {party.map((guest) => (
                <GuestRSVPBlock
                  key={guest.id}
                  guest={guest}
                  subEvent={currentSubEvent}
                  responses={responses}
                  onResponseChange={onResponseChange}
                  themeStyles={themeStyles}
                />
              ))}
            </div>

            {/* Custom questions from RSVP config */}
            {landingConfig?.rsvp_config && (
              <div className={styles.customQuestions}>
                <h4 style={{ color: themeStyles.color }}>Additional Questions</h4>
                
                {/* Dietary restrictions */}
                {landingConfig.rsvp_config.dietary_restrictions_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Do you have any dietary restrictions?
                      {landingConfig.rsvp_config.dietary_restrictions_required && 
                        <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    <textarea
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="Please describe any dietary restrictions or allergies..."
                      rows="3"
                      value={customQuestionResponses.dietary_restrictions || ''}
                      onChange={(e) => onCustomQuestionChange('dietary_restrictions', e.target.value)}
                    />
                  </div>
                )}

                {/* Song requests */}
                {landingConfig.rsvp_config.song_requests_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Song requests
                      {landingConfig.rsvp_config.song_requests_required && 
                        <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="What songs would you like to hear?"
                      value={customQuestionResponses.song_requests || ''}
                      onChange={(e) => onCustomQuestionChange('song_requests', e.target.value)}
                    />
                  </div>
                )}

                {/* Special accommodations */}
                {landingConfig.rsvp_config.special_accommodations_enabled && (
                  <div className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      Special accommodations needed
                      {landingConfig.rsvp_config.special_accommodations_required && 
                        <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    <textarea
                      style={{ borderColor: themeStyles.primaryColor }}
                      placeholder="Please describe any special accommodations needed..."
                      rows="3"
                      value={customQuestionResponses.special_accommodations || ''}
                      onChange={(e) => onCustomQuestionChange('special_accommodations', e.target.value)}
                    />
                  </div>
                )}

                {/* Custom questions */}
                {landingConfig.rsvp_config.custom_questions && 
                 landingConfig.rsvp_config.custom_questions.length > 0 && 
                 landingConfig.rsvp_config.custom_questions.map((question, index) => (
                  <div key={index} className={styles.customQuestion}>
                    <label style={{ color: themeStyles.color }}>
                      {question.question}
                      {question.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    {question.type === 'text' && (
                      <input
                        type="text"
                        style={{ borderColor: themeStyles.primaryColor }}
                        placeholder={question.placeholder}
                        value={customQuestionResponses[`custom_${index}`] || ''}
                        onChange={(e) => onCustomQuestionChange(`custom_${index}`, e.target.value)}
                      />
                    )}
                    {question.type === 'textarea' && (
                      <textarea
                        style={{ borderColor: themeStyles.primaryColor }}
                        placeholder={question.placeholder}
                        rows="3"
                        value={customQuestionResponses[`custom_${index}`] || ''}
                        onChange={(e) => onCustomQuestionChange(`custom_${index}`, e.target.value)}
                      />
                    )}
                    {question.type === 'select' && (
                      <select 
                        style={{ borderColor: themeStyles.primaryColor }}
                        value={customQuestionResponses[`custom_${index}`] || ''}
                        onChange={(e) => onCustomQuestionChange(`custom_${index}`, e.target.value)}
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
                ))}
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
                    backgroundColor: 'transparent',
                    color: themeStyles.primaryColor,
                    border: `1px solid ${themeStyles.primaryColor}`
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
                    color: 'white',
                    border: 'none'
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
                    color: 'white',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold'
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
