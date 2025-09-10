import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styles from "./RSVPCustomization.module.css";

// EventCards component matching the [eventID]/rsvp/page.js layout
const EventCards = ({ subEvents }) => {
  // Get images from sub-events that have them, or create default placeholder cards
  const cardImages = subEvents
    .map((subEvent) => subEvent.image)
    .filter(Boolean);

  // If no images, create placeholder cards with event info
  const cards =
    cardImages.length > 0
      ? subEvents.filter((subEvent) => subEvent.image)
      : subEvents.slice(0, 3); // Limit to 3 cards like original

  const [cardOrder, setCardOrder] = useState([...cards].reverse());

  useEffect(() => {
    setCardOrder([...cards].reverse());
  }, [subEvents]);

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
            {card.image ? (
              <img
                src={card.image}
                alt={card.title || `Sub-Event ${index + 1}`}
                className={styles.cardView}
              />
            ) : (
              <div className={styles.cardView}>
                <div className={styles.placeholderCard}>
                  <h3>{card.title || `Sub-Event ${index + 1}`}</h3>
                  <p>
                    {card.date && card.startTime
                      ? `${new Date(card.date).toLocaleDateString()} at ${card.startTime}`
                      : "Date & Time"}
                  </p>
                  <p>{card.location || "Location"}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// Fullscreen Preview component - shows exactly what guests will see
const FullscreenPreview = ({
  eventData,
  rsvpSettings,
  previewView,
  setPreviewView,
  currentSubEventIndex,
  showRSVPForm,
  showGreeting,
  nextSubEvent,
  previousSubEvent,
  closeFullscreen,
}) => {
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  
  const openRSVPModal = () => {
    setShowRSVPModal(true);
  };
  
  const closeRSVPModal = () => {
    setShowRSVPModal(false);
  };
  
  // Handle escape key to close fullscreen or RSVP modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showRSVPModal) {
          setShowRSVPModal(false);
        } else {
          closeFullscreen();
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [closeFullscreen, showRSVPModal]);

  return (
    <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
      <div
        className={styles.fullscreenContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fullscreen Header Controls */}
        <div className={styles.fullscreenHeader}>
          <div className={styles.fullscreenTitle}>
            <h2>Guest Preview - {eventData.title || "Your Event"}</h2>
            <p>This is exactly how your guests will see the RSVP page</p>
          </div>
          <div className={styles.fullscreenControls}>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewBtn} ${previewView === "landing" ? styles.active : ""}`}
                onClick={() => setPreviewView("landing")}
              >
                Landing Page
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${previewView === "greeting" ? styles.active : ""}`}
                onClick={() => setPreviewView("greeting")}
              >
                Greeting Page
              </button>
            </div>
            <button
              type="button"
              className={styles.closeFullscreenBtn}
              onClick={closeFullscreen}
              title="Close Preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Fullscreen Content - Matching actual RSVP page layout */}
        <div className={styles.fullscreenContent}>
          <div
            className={styles.guestRSVPPage}
            style={{
              backgroundColor: rsvpSettings.backgroundColor,
              fontFamily: rsvpSettings.fontFamily,
              color: rsvpSettings.textColor,
            }}
          >
            {/* Page Header */}
            <div className={styles.guestHeader}>
              <h1 className={styles.guestEventTitle}>
                {rsvpSettings.pageTitle || "You're Invited!"}
              </h1>
              <p className={styles.guestEventSubtitle}>
                {previewView === "landing"
                  ? rsvpSettings.logo
                    ? "Click logo below"
                    : "Click below to continue"
                  : previewView === "greeting"
                    ? rsvpSettings.subtitle || "Join us for our special celebration"
                    : "Please RSVP down below"}
              </p>
            </div>

            {/* Main Content Container - Matching [eventID]/rsvp layout */}
            <div className={styles.guestEventContainer}>
              {previewView === "landing" ? (
                /* Landing Page View - Fullscreen */
                <div className={styles.fullscreenLandingContainer}>
                  {rsvpSettings.logo ? (
                    <img
                      src={rsvpSettings.logo}
                      alt="Event Logo"
                      className={styles.fullscreenLogoImage}
                      onClick={() => setPreviewView("greeting")}
                    />
                  ) : (
                    <div
                      className={styles.fullscreenNoLogoContainer}
                      onClick={() => setPreviewView("greeting")}
                    >
                      <div className={styles.fullscreenNoLogoIcon}>✨</div>
                      <p>Click to Enter</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Event Cards */}
                  {eventData.subEvents && eventData.subEvents.length > 0 && (
                    <EventCards subEvents={eventData.subEvents} />
                  )}

                  {/* Guest Invite Section - Matching editing preview exactly */}
                  <div className={styles.fullscreenInviteSection}>
                    <div className={styles.fullscreenInviteHeader}>
                      <h2>Please Join Us</h2>
                    </div>
                    <div className={styles.fullscreenGuestList}>
                      <div className={styles.fullscreenGuestName}>
                        Jumana Motiwala
                      </div>
                      <div className={styles.fullscreenGuestName}>
                        Burhanuddin Mogul
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.fullscreenRsvpButton}
                      style={{ backgroundColor: rsvpSettings.primaryColor }}
                      onClick={openRSVPModal}
                    >
                      RSVP Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* RSVP Modal */}
      {showRSVPModal && (
        <div className={styles.modalOverlay} onClick={closeRSVPModal}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button 
                type="button"
                className={styles.closeBtn} 
                onClick={closeRSVPModal}
              >
                ✕
              </button>
              <h3>{eventData.subEvents?.[currentSubEventIndex]?.title || `Sub-Event ${currentSubEventIndex + 1}`}</h3>
              <div className={styles.modalInfo}>
                <span>📅 {eventData.subEvents?.[currentSubEventIndex]?.date ? 
                  new Date(eventData.subEvents[currentSubEventIndex].date).toLocaleDateString() : 
                  'Event Date'}</span>
                <span>📍 {eventData.subEvents?.[currentSubEventIndex]?.location || 'Event Location'}</span>
              </div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.guestResponse}>
                <span>Sarah Johnson</span>
                <div className={styles.responseButtons}>
                  <button 
                    type="button"
                    className={`${styles.responseBtn} ${styles.yesBtn}`}
                  >
                    Yes
                  </button>
                  <button 
                    type="button"
                    className={styles.responseBtn}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className={styles.guestResponse}>
                <span>Michael Johnson</span>
                <div className={styles.responseButtons}>
                  <button 
                    type="button"
                    className={styles.responseBtn}
                  >
                    Yes
                  </button>
                  <button 
                    type="button"
                    className={styles.responseBtn}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className={styles.guestResponse}>
                <span>Emma Johnson</span>
                <div className={styles.responseButtons}>
                  <button 
                    type="button"
                    className={styles.responseBtn}
                  >
                    Yes
                  </button>
                  <button 
                    type="button"
                    className={styles.responseBtn}
                  >
                    No
                  </button>
                </div>
              </div>
              
              {rsvpSettings.customQuestions?.includes('dietary') && (
                <div className={styles.customQuestion}>
                  <label>Dietary Restrictions</label>
                  <textarea placeholder="Let us know about any dietary restrictions..."></textarea>
                </div>
              )}
              
              {rsvpSettings.customQuestions?.includes('message') && (
                <div className={styles.customQuestion}>
                  <label>Personal Message</label>
                  <textarea placeholder="Share a message with us..."></textarea>
                </div>
              )}
              
              {rsvpSettings.customQuestions?.includes('contact') && (
                <div className={styles.customQuestion}>
                  <label>Contact Information</label>
                  <input type="email" placeholder="Email address..." />
                </div>
              )}
              
              {rsvpSettings.customQuestions?.includes('song') && (
                <div className={styles.customQuestion}>
                  <label>Song Requests</label>
                  <input type="text" placeholder="What songs would you like to hear?" />
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              {currentSubEventIndex > 0 && (
                <button 
                  type="button"
                  className={styles.prevBtn} 
                  onClick={previousSubEvent}
                >
                  ← Previous
                </button>
              )}
              <button 
                type="button"
                className={styles.nextBtn} 
                onClick={nextSubEvent}
                style={{ backgroundColor: rsvpSettings.primaryColor }}
              >
                {currentSubEventIndex < (eventData.subEvents?.length || 1) - 1 ? 'Next Sub-Event →' : 'Submit RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RSVPCustomization = ({
  eventData,
  updateEventData,
  onNext,
  onPrevious,
  isLoading,
}) => {
  const [errors, setErrors] = useState({});
  const [previewDevice, setPreviewDevice] = useState("mobile");
  const [previewView, setPreviewView] = useState("landing"); // 'landing', 'greeting', or 'rsvp'
  const [currentSubEventIndex, setCurrentSubEventIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleInputChange = (field, value) => {
    updateEventData({
      rsvpSettings: {
        ...eventData.rsvpSettings,
        [field]: value,
      },
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleQuestionToggle = (questionType, isChecked) => {
    const currentQuestions = eventData.rsvpSettings?.customQuestions || [];
    if (isChecked) {
      updateEventData({
        rsvpSettings: {
          ...eventData.rsvpSettings,
          customQuestions: [...currentQuestions, questionType],
        },
      });
    } else {
      updateEventData({
        rsvpSettings: {
          ...eventData.rsvpSettings,
          customQuestions: currentQuestions.filter((q) => q !== questionType),
        },
      });
    }
  };

  const handleSubEventImageUpload = async (subEventIndex, event) => {
    const file = event.target.files[0];
    if (file) {
      // Create a file URL for preview (in production, you'd upload to a server)
      const imageUrl = URL.createObjectURL(file);

      const updatedSubEvents = [...eventData.subEvents];
      updatedSubEvents[subEventIndex] = {
        ...updatedSubEvents[subEventIndex],
        image: imageUrl,
        imageFile: file, // Store the file for actual upload later
      };

      updateEventData({ subEvents: updatedSubEvents });

      toast.success(
        `Image uploaded for ${updatedSubEvents[subEventIndex].title || `Sub-Event ${subEventIndex + 1}`}!`,
        {
          position: "top-center",
          autoClose: 2000,
        },
      );
    }
  };

  const handleRemoveSubEventImage = (subEventIndex) => {
    const updatedSubEvents = [...eventData.subEvents];

    // Clean up the object URL to prevent memory leaks
    if (updatedSubEvents[subEventIndex].image) {
      URL.revokeObjectURL(updatedSubEvents[subEventIndex].image);
    }

    updatedSubEvents[subEventIndex] = {
      ...updatedSubEvents[subEventIndex],
      image: null,
      imageFile: null,
    };

    updateEventData({ subEvents: updatedSubEvents });

    toast.success("Image removed!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);

      updateEventData({
        rsvpSettings: {
          ...eventData.rsvpSettings,
          logo: imageUrl,
          logoFile: file,
        },
      });

      toast.success("Logo uploaded successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const handleRemoveLogo = () => {
    // Clean up the object URL
    if (eventData.rsvpSettings?.logo) {
      URL.revokeObjectURL(eventData.rsvpSettings.logo);
    }

    updateEventData({
      rsvpSettings: {
        ...eventData.rsvpSettings,
        logo: null,
        logoFile: null,
      },
    });

    toast.success("Logo removed!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const applyTheme = (themeName) => {
    const themes = {
      elegant: {
        fontFamily: "Playfair Display",
        backgroundColor: "#faf5ff",
        textColor: "#581c87",
        primaryColor: "#7c3aed",
      },
      modern: {
        fontFamily: "Inter",
        backgroundColor: "#f8fafc",
        textColor: "#1e293b",
        primaryColor: "#7c3aed",
      },
      rustic: {
        fontFamily: "Cormorant Garamond",
        backgroundColor: "#f0fdf4",
        textColor: "#065f46",
        primaryColor: "#7c3aed",
      },
      glamorous: {
        fontFamily: "Great Vibes",
        backgroundColor: "#111827",
        textColor: "#fbbf24",
        primaryColor: "#7c3aed",
      },
      beach: {
        fontFamily: "Dancing Script",
        backgroundColor: "#eff6ff",
        textColor: "#1e40af",
        primaryColor: "#7c3aed",
      },
    };

    const selectedTheme = themes[themeName];
    if (selectedTheme) {
      updateEventData({
        rsvpSettings: {
          ...eventData.rsvpSettings,
          theme: themeName,
          ...selectedTheme,
        },
      });
      toast.success(
        `${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme applied!`,
        {
          position: "top-center",
          autoClose: 2000,
        },
      );
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const rsvpSettings = eventData.rsvpSettings || {};

    if (!rsvpSettings.pageTitle?.trim()) {
      newErrors.pageTitle = "RSVP page title is required";
    }
    if (!rsvpSettings.subtitle?.trim()) {
      newErrors.subtitle = "RSVP subtitle is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      toast.success("RSVP page configured successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
      onNext();
    } else {
      toast.error("Please fix the errors below", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const showLanding = () => {
    setPreviewView("landing");
  };

  const showRSVPForm = () => {
    setCurrentSubEventIndex(0);
    setPreviewView("rsvp");
  };

  const showGreeting = () => {
    setPreviewView("greeting");
  };

  const proceedToGreeting = () => {
    setPreviewView("greeting");
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = "unset"; // Restore scrolling
  };

  const nextSubEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSubEventIndex < (eventData.subEvents?.length || 1) - 1) {
      setCurrentSubEventIndex(currentSubEventIndex + 1);
    } else {
      showGreeting();
      toast.success("RSVP submitted successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const previousSubEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSubEventIndex > 0) {
      setCurrentSubEventIndex(currentSubEventIndex - 1);
    }
  };

  // Initialize RSVP settings if not present
  useEffect(() => {
    if (!eventData.rsvpSettings) {
      updateEventData({
        rsvpSettings: {
          pageTitle: "You're Invited!",
          subtitle: "Join us for our special celebration",
          welcomeMessage:
            "We're so excited to celebrate with you! Please let us know if you can make it.",
          theme: "elegant",
          fontFamily: "Playfair Display",
          backgroundColor: "#faf5ff",
          textColor: "#581c87",
          primaryColor: "#7c3aed",
          customQuestions: ["dietary", "message"],
          backgroundImage: null,
          backgroundOverlay: 20,
        },
      });
    }
  }, []);

  const rsvpSettings = eventData.rsvpSettings || {};

  return (
    <form
      className={styles.formSection + " " + styles.customization}
      onSubmit={handleSubmit}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>💌</div>
        <div>
          <h2 className={styles.sectionTitle}>RSVP Page Customization</h2>
          <p className={styles.sectionDescription}>
            Design your RSVP page to match your event's style and gather the
            information you need from guests.
          </p>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Left Panel - Controls */}
        <div className={styles.controlsPanel}>
          {/* Landing Page Settings */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>🏠 Landing Page</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Event Logo</label>
              {rsvpSettings.logo ? (
                <div className={styles.imagePreview}>
                  <img
                    src={rsvpSettings.logo}
                    alt="Event Logo"
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={handleRemoveLogo}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.imageUploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className={styles.imageInput}
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={styles.imageInputLabel}
                  >
                    <div className={styles.uploadIcon}>🏷️</div>
                    <span>Upload Logo</span>
                  </label>
                </div>
              )}
              <div className={styles.formHelp}>
                Optional: Upload a logo that guests will click to enter the RSVP
                page
              </div>
            </div>
          </div>

          {/* Basic Settings */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>📝 Content</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Page Title *</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.pageTitle ? styles.error : ""}`}
                value={rsvpSettings.pageTitle || ""}
                onChange={(e) => handleInputChange("pageTitle", e.target.value)}
                placeholder="You're Invited!"
              />
              {errors.pageTitle && (
                <div className={styles.errorText}>{errors.pageTitle}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subtitle *</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.subtitle ? styles.error : ""}`}
                value={rsvpSettings.subtitle || ""}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="Join us for our special celebration"
              />
              {errors.subtitle && (
                <div className={styles.errorText}>{errors.subtitle}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Welcome Message</label>
              <textarea
                className={styles.formTextarea}
                value={rsvpSettings.welcomeMessage || ""}
                onChange={(e) =>
                  handleInputChange("welcomeMessage", e.target.value)
                }
                placeholder="We're so excited to celebrate with you! Please let us know if you can make it."
                rows="3"
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>🎨 Theme</h3>

            <div className={styles.themeGrid}>
              {["elegant", "modern", "rustic", "glamorous", "beach"].map(
                (theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={`${styles.themeButton} ${rsvpSettings.theme === theme ? styles.active : ""}`}
                    onClick={() => applyTheme(theme)}
                  >
                    {theme === "elegant" && "✨ Elegant"}
                    {theme === "modern" && "🎯 Modern"}
                    {theme === "rustic" && "🌿 Rustic"}
                    {theme === "glamorous" && "💎 Glamorous"}
                    {theme === "beach" && "🏖️ Beach"}
                  </button>
                ),
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Font Style</label>
              <select
                className={styles.formSelect}
                value={rsvpSettings.fontFamily || "Playfair Display"}
                onChange={(e) =>
                  handleInputChange("fontFamily", e.target.value)
                }
              >
                <option value="Playfair Display">
                  Playfair Display (Elegant)
                </option>
                <option value="Dancing Script">
                  Dancing Script (Handwritten)
                </option>
                <option value="Great Vibes">Great Vibes (Stylish)</option>
                <option value="Cormorant Garamond">
                  Cormorant Garamond (Classic)
                </option>
                <option value="Inter">Inter (Modern)</option>
              </select>
            </div>
          </div>

          {/* Sub-Event Images */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>🖼️ Event Images</h3>

            {eventData.subEvents && eventData.subEvents.length > 0 ? (
              <div className={styles.imageUploadSection}>
                {eventData.subEvents.map((subEvent, index) => (
                  <div key={index} className={styles.imageUploadItem}>
                    <label className={styles.formLabel}>
                      {subEvent.title || `Sub-Event ${index + 1}`}
                    </label>

                    {subEvent.image ? (
                      <div className={styles.imagePreview}>
                        <img
                          src={subEvent.image}
                          alt={subEvent.title || `Sub-Event ${index + 1}`}
                          className={styles.previewImage}
                        />
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          onClick={() => handleRemoveSubEventImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={styles.imageUploadArea}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSubEventImageUpload(index, e)}
                          className={styles.imageInput}
                          id={`subevent-image-${index}`}
                        />
                        <label
                          htmlFor={`subevent-image-${index}`}
                          className={styles.imageInputLabel}
                        >
                          <div className={styles.uploadIcon}>📷</div>
                          <span>Upload Image</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noSubEventsMessage}>
                Add sub-events in step 2 to upload images
              </p>
            )}
          </div>

          {/* RSVP Questions */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>❓ RSVP Questions</h3>

            <div className={styles.questionsGrid}>
              <div className={styles.questionItem}>
                <input type="checkbox" checked disabled />
                <label>Attendance Confirmation</label>
              </div>
              <div className={styles.questionItem}>
                <input type="checkbox" checked disabled />
                <label>Number of Guests</label>
              </div>
              <div className={styles.questionItem}>
                <input
                  type="checkbox"
                  checked={rsvpSettings.customQuestions?.includes("dietary")}
                  onChange={(e) =>
                    handleQuestionToggle("dietary", e.target.checked)
                  }
                />
                <label>Dietary Restrictions</label>
              </div>
              <div className={styles.questionItem}>
                <input
                  type="checkbox"
                  checked={rsvpSettings.customQuestions?.includes("contact")}
                  onChange={(e) =>
                    handleQuestionToggle("contact", e.target.checked)
                  }
                />
                <label>Contact Information</label>
              </div>
              <div className={styles.questionItem}>
                <input
                  type="checkbox"
                  checked={rsvpSettings.customQuestions?.includes("song")}
                  onChange={(e) =>
                    handleQuestionToggle("song", e.target.checked)
                  }
                />
                <label>Song Requests</label>
              </div>
              <div className={styles.questionItem}>
                <input
                  type="checkbox"
                  checked={rsvpSettings.customQuestions?.includes("message")}
                  onChange={(e) =>
                    handleQuestionToggle("message", e.target.checked)
                  }
                />
                <label>Personal Message</label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewBtn} ${previewView === "landing" ? styles.active : ""}`}
                onClick={() => setPreviewView("landing")}
              >
                Landing
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${previewView === "greeting" ? styles.active : ""}`}
                onClick={() => setPreviewView("greeting")}
              >
                Greeting
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${previewView === "rsvp" ? styles.active : ""}`}
                onClick={() => setPreviewView("rsvp")}
              >
                RSVP Form
              </button>
            </div>
            <div className={styles.previewControls}>
              <button
                type="button"
                className={styles.fullscreenBtn}
                onClick={openFullscreen}
                title="Fullscreen Preview"
              >
                🔍 Preview
              </button>
              <div className={styles.deviceToggle}>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "mobile" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  📱
                </button>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "tablet" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("tablet")}
                >
                  📱
                </button>
                <button
                  type="button"
                  className={`${styles.deviceBtn} ${previewDevice === "desktop" ? styles.active : ""}`}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  💻
                </button>
              </div>
            </div>
          </div>

          <div className={`${styles.previewFrame} ${styles[previewDevice]}`}>
            <div
              className={styles.rsvpPreview}
              style={{
                backgroundColor: rsvpSettings.backgroundColor,
                fontFamily: rsvpSettings.fontFamily,
                color: rsvpSettings.textColor,
              }}
            >
              <div className={styles.rsvpHeader}>
                <h1 className={styles.rsvpTitle}>
                  {rsvpSettings.pageTitle || "You're Invited!"}
                </h1>
                <p className={styles.rsvpSubtitle}>
                  {rsvpSettings.subtitle ||
                    "Join us for our special celebration"}
                </p>
              </div>

              {/* Conditional Content Based on Preview View */}
              {previewView === "landing" ? (
                /* Landing Page View */
                <div className={styles.landingPageContainer}>
                  <div className={styles.landingContent}>
                    <div className={styles.landingHeader}>
                      <h1 className={styles.landingTitle}>
                        {eventData.title || "Your Event"}
                      </h1>
                      <p className={styles.landingSubtitle}>
                        {rsvpSettings.logo
                          ? "Click logo below"
                          : "Click below to continue"}
                      </p>
                    </div>

                    <div className={styles.logoContainer}>
                      {rsvpSettings.logo ? (
                        <img
                          src={rsvpSettings.logo}
                          alt="Event Logo"
                          className={styles.logoImage}
                          onClick={proceedToGreeting}
                        />
                      ) : (
                        <div
                          className={styles.noLogoContainer}
                          onClick={proceedToGreeting}
                        >
                          <div className={styles.noLogoIcon}>✨</div>
                          <p>Click to Enter</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : previewView === "greeting" ? (
                <>
                  {/* Event Images/Cards Section - Matching [eventID]/rsvp/page.js */}
                  {eventData.subEvents && eventData.subEvents.length > 0 && (
                    <EventCards subEvents={eventData.subEvents} />
                  )}

                  {/* Guest List Section */}
                  <div className={styles.inviteSection}>
                    <div className={styles.inviteHeader}>
                      <h2>Please Join Us</h2>
                    </div>
                    <div className={styles.guestList}>
                      <div className={styles.guestName}>Jumana Motiwala</div>
                      <div className={styles.guestName}>Burhanuddin Mogul</div>
                    </div>
                    <button
                      type="button"
                      className={styles.rsvpButton}
                      style={{ backgroundColor: rsvpSettings.primaryColor }}
                      onClick={showRSVPForm}
                    >
                      RSVP Now
                    </button>
                  </div>
                </>
              ) : (
                /* RSVP Form View */
                <div className={styles.rsvpFormContainer}>
                  <div className={styles.rsvpFormHeader}>
                    <h2>
                      {eventData.subEvents?.[currentSubEventIndex]?.title ||
                        `Sub-Event ${currentSubEventIndex + 1}`}
                    </h2>
                    <div className={styles.eventInfo}>
                      <span>
                        📅{" "}
                        {eventData.subEvents?.[currentSubEventIndex]?.date
                          ? new Date(
                            eventData.subEvents[currentSubEventIndex].date,
                          ).toLocaleDateString()
                          : "Event Date"}
                      </span>
                      <span>
                        📍{" "}
                        {eventData.subEvents?.[currentSubEventIndex]
                          ?.location || "Event Location"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.guestResponses}>
                    <div className={styles.guestResponse}>
                      <span className={styles.guestResponseName}>
                            Jumana Motiwala
                        </span>
                      <div className={styles.responseButtons}>
                        <button
                          type="button"
                          className={`${styles.responseBtn} ${styles.yesBtn}`}
                        >
                          Yes
                        </button>
                        <button type="button" className={styles.responseBtn}>
                          No
                        </button>
                      </div>
                    </div>
                    <div className={styles.guestResponse}>
                      <span className={styles.guestResponseName}>
                        Burhanuddin Mogul
                      </span>
                      <div className={styles.responseButtons}>
                        <button type="button" className={styles.responseBtn}>
                          Yes
                        </button>
                        <button type="button" className={styles.responseBtn}>
                          No
                        </button>
                      </div>
                    </div>
                   </div>

                  {/* Custom Questions */}
                  <div className={styles.customQuestions}>
                    {rsvpSettings.customQuestions?.includes("dietary") && (
                      <div className={styles.customQuestion}>
                        <label>Dietary Restrictions</label>
                        <textarea placeholder="Let us know about any dietary restrictions..."></textarea>
                      </div>
                    )}

                    {rsvpSettings.customQuestions?.includes("message") && (
                      <div className={styles.customQuestion}>
                        <label>Personal Message</label>
                        <textarea placeholder="Share a message with us..."></textarea>
                      </div>
                    )}

                    {rsvpSettings.customQuestions?.includes("contact") && (
                      <div className={styles.customQuestion}>
                        <label>Contact Information</label>
                        <input type="email" placeholder="Email address..." />
                      </div>
                    )}

                    {rsvpSettings.customQuestions?.includes("song") && (
                      <div className={styles.customQuestion}>
                        <label>Song Requests</label>
                        <input
                          type="text"
                          placeholder="What songs would you like to hear?"
                        />
                      </div>
                    )}
                  </div>

                  {/* Form Navigation */}
                  <div className={styles.rsvpFormFooter}>
                    {currentSubEventIndex > 0 && (
                      <button
                        type="button"
                        className={styles.prevBtn}
                        onClick={previousSubEvent}
                      >
                        ← Previous
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.nextBtn}
                      onClick={nextSubEvent}
                      style={{ backgroundColor: rsvpSettings.primaryColor }}
                    >
                      {currentSubEventIndex <
                        (eventData.subEvents?.length || 1) - 1
                        ? "Next Sub-Event →"
                        : "Submit RSVP"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <FullscreenPreview
          eventData={eventData}
          rsvpSettings={rsvpSettings}
          previewView={previewView}
          setPreviewView={setPreviewView}
          currentSubEventIndex={currentSubEventIndex}
          showRSVPForm={showRSVPForm}
          showGreeting={showGreeting}
          nextSubEvent={nextSubEvent}
          previousSubEvent={previousSubEvent}
          closeFullscreen={closeFullscreen}
        />
      )}

      <div className={styles.formActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onPrevious}
        >
          ← Previous
        </button>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Continue to Launch →"}
        </button>
      </div>
    </form>
  );
};

export default RSVPCustomization;
