"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./page.module.css";
import Header from "./components/Header";
import ProgressSteps from "./components/ProgressSteps";
import EventDetailsForm from "./components/sections/EventDetailsForm";
import GuestListSection from "./components/sections/GuestListSection";
import RSVPCustomization from "./components/sections/RSVPCustomization";
import EmailTemplateCreator from "./components/sections/EmailTemplateCreator";
import LaunchSection from "./components/sections/LaunchSection";
import { useChangeTracking } from "./hooks/useChangeTracking";

const CreateEventContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [hasUnsavedImages, setHasUnsavedImages] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Edit mode disabled
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateGuests, setDuplicateGuests] = useState([]);
  const [duplicateCallback, setDuplicateCallback] = useState(null);
  const heroContent = [
    {
      title: "Create Your Event",
      subtitle: "Set up your multi-day event with individual sub-events. Perfect for weddings, conferences, and celebrations.",
    },
    {
      title: "Add Sub-Events",
      subtitle: "These are the blocks that make up your event.",
    },
    {
      title: "Guest List Management",
      subtitle:
        "Organize your guests into groups and select which sub-events each person is invited to attend.",
    },
    {
      title: "Customize RSVP Page",
      subtitle:
        "Design your RSVP page to match your event's style and gather the information you need.",
    },
    {
      title: "Email Templates",
      subtitle:
        "Create and customize email templates for invitations, reminders, and updates.",
    },
    {
      title: "Ready to Launch",
      subtitle: "Review your event details and choose how you'd like to launch your Event.",
    },
  ];

  // Default event data
  const getDefaultEventData = () => ({
    // Main event details
    public_id: crypto.randomUUID(),
    title: "",
    description: "",
    logo_url: "",
    location: "",
    startDate: "",
    endDate: "",
    maxGuests: "",
    eventType: "wedding",
    isPrivate: false,

    // Sub-events - always start with one default sub-event
    subEvents: [
      {
        id: 1,
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        maxGuests: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isRequired: true,
      },
    ],

    // Guest list
    guests: [],
    guestGroups: [],

    // Settings
    requireRSVP: true,
    allowPlusOnes: false,
    rsvpDeadline: "",

    // RSVP Page Settings
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

  // Initialize change tracking
  const changeTracking = useChangeTracking();
  const [useIncrementalUpdates, setUseIncrementalUpdates] = useState(true);
  
  // Event form data
  const [eventData, setEventData] = useState(getDefaultEventData());

  const updateEventData = (updates) => {
    setEventData((prev) => {
      const newData = { ...prev, ...updates };

      // Ensure RSVP settings merge deeply instead of overwriting
      if (updates.rsvpSettings) {
        newData.rsvpSettings = {
          ...prev.rsvpSettings,
          ...updates.rsvpSettings,
        };
      }

      return newData;
    });
    
    // Update change tracking
    if (changeTracking.currentData) {
      changeTracking.updateData(updates);
    }
  };

  // Event editing via create-event route is disabled
  useEffect(() => {
    const publicId = searchParams.get("edit");

    if (publicId) {
      // Redirect to dashboard or show error message instead of loading edit mode
      toast.error(
        "Event editing is currently disabled. Please use the dashboard to manage existing events.",
        {
          position: "top-center",
          autoClose: 5000,
        },
      );

      // Optionally redirect to dashboard
      // router.push('/dashboard');
      
      if (process.env.NODE_ENV === 'development') {
        console.warn("Event editing via create-event route is disabled. Public ID:", publicId);
      }
    }
  }, [searchParams]);

  // Cleanup temporary images when leaving page without saving
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (hasUnsavedImages) {
        // Try to cleanup temp images on page unload
        try {
          const { cleanupTempImages, extractTempImageUrls } = await import(
            "../utils/imageUpload"
          );
          const tempUrls = extractTempImageUrls(eventData);
          if (tempUrls.length > 0) {
            // Use sendBeacon for reliable cleanup during page unload
            navigator.sendBeacon(
              "/api/cleanup-temp-images",
              JSON.stringify({
                imageUrls: tempUrls,
              }),
            );
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("Failed to cleanup temp images on unload:", error);
          }
        }

        // Show confirmation dialog
        event.preventDefault();
        event.returnValue =
          "You have unsaved images. Are you sure you want to leave?";
        return "You have unsaved images. Are you sure you want to leave?";
      }
    };

    const handleRouteChange = async () => {
      if (hasUnsavedImages) {
        try {
          const { cleanupTempImages, extractTempImageUrls } = await import(
            "../utils/imageUpload"
          );
          const tempUrls = extractTempImageUrls(eventData);
          if (tempUrls.length > 0) {
            await cleanupTempImages(tempUrls);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("Failed to cleanup temp images on route change:", error);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup on component unmount
      if (hasUnsavedImages) {
        handleRouteChange();
      }
    };
  }, [hasUnsavedImages, eventData]);

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (step) => {
    setCurrentStep(step);
  };

  // Handle duplicate guest detection
  const handleDuplicateDetection = (duplicates, callback) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(duplicates);
    }
    setDuplicateGuests(duplicates);
    setDuplicateCallback(() => callback);
    setShowDuplicateModal(true);
  };

  // Save draft with duplicates allowed
  const saveDraftWithDuplicates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventData,
          status: "draft",
          allowDuplicates: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save event");
      }

      const savedEvent = await response.json();
      const eventId = savedEvent.id || savedEvent.eventId;

      // Update local event data with the complete saved data including IDs
      setEventData((prev) => {
        const updated = { ...prev, id: eventId };
        
        // Update guests with database IDs if provided
        if (savedEvent.guests && Array.isArray(savedEvent.guests)) {
          updated.guests = savedEvent.guests;
          console.log(`✓ Updated ${savedEvent.guests.length} guests with database IDs`);
        }
        
        // Update guest groups with database IDs if provided  
        if (savedEvent.guestGroups && Array.isArray(savedEvent.guestGroups)) {
          updated.guestGroups = savedEvent.guestGroups;
          console.log(`✓ Updated ${savedEvent.guestGroups.length} guest groups with database IDs`);
        }
        
        return updated;
      });

      // Finalize any temporary images
      try {
        const { finalizeImages, extractImageDataForFinalization } =
          await import("../utils/imageUpload");
        const imageData = extractImageDataForFinalization(eventData);

        if (imageData.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Finalizing images for draft...", imageData);
          }
          await finalizeImages(eventId, imageData);
          toast.success("Draft saved with images!", {
            position: "top-center",
            autoClose: 2000,
          });
        } else {
          toast.success("Draft saved successfully!", {
            position: "top-center",
            autoClose: 2000,
          });
        }
      } catch (imageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Image finalization failed:", imageError);
        }
        toast.success("Draft saved (images may need re-upload)", {
          position: "top-center",
          autoClose: 2000,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving draft:", error);
      }
      toast.error("Failed to save draft. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
      setShowDuplicateModal(false);
    }
  };

  // Publish event with duplicates allowed
  const publishEventWithDuplicates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventData,
          status: "published",
          allowDuplicates: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish event");
      }

      const savedEvent = await response.json();
      const eventId = savedEvent.id || savedEvent.eventId;

      toast.success("Event published successfully!", {
        position: "top-center",
        autoClose: 3000,
      });

      // Redirect to event page or dashboard
      router.push(`/${eventId}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error publishing event:", error);
      }
      toast.error("Failed to publish event. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
      setShowDuplicateModal(false);
    }
  };

  const saveDraft = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log(eventData);
    }
    setIsLoading(true);
    try {
      // Determine whether to use incremental or full update
      const changes = useIncrementalUpdates ? changeTracking.getChanges() : null;
      const shouldUseIncremental = false; // Incremental updates disabled with edit mode
      
      if (shouldUseIncremental) {
        const payloadComparison = changeTracking.getPayloadSizeComparison();
        if (process.env.NODE_ENV === 'development') {
          console.log("=== INCREMENTAL SAVE DRAFT ===");
          console.log(`Payload reduction: ${payloadComparison.reduction}% (${payloadComparison.fullSize} → ${payloadComparison.incrementalSize} chars)`);
          console.log("Changes:", changes.changes);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("=== FULL SAVE DRAFT ===");
          console.log("Guest count:", eventData.guests?.length || 0);
        }
      }

      // Prepare request payload
      const requestPayload = shouldUseIncremental 
        ? {
            ...changes.changes,
            public_id: eventData.public_id,
            status: "draft",
            isPartialUpdate: true,
            conflictToken: changes.metadata.conflictToken
          }
        : {
            ...eventData,
            status: "draft",
            isPartialUpdate: false
          };

      // Send request using appropriate method
      const response = await fetch("/api/events", {
        method: shouldUseIncremental ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        // If incremental update fails, fallback to full update
        if (shouldUseIncremental) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("Incremental update failed, falling back to full update");
          }
          toast.warning("Using full update as fallback", {
            position: "top-center",
            autoClose: 2000,
          });
          
          const fallbackResponse = await fetch("/api/events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...eventData,
              status: "draft",
              isPartialUpdate: false
            }),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error("Failed to save event");
          }
          
          const fallbackResult = await fallbackResponse.json();
          if (!fallbackResult.success && fallbackResult.duplicatesFound) {
            setIsLoading(false);
            handleDuplicateDetection(fallbackResult.duplicates, () => saveDraftWithDuplicates());
            return;
          }
        } else {
          throw new Error("Failed to save event");
        }
      }

      const savedEvent = await response.json();

      // Handle duplicate detection
      if (!savedEvent.success && savedEvent.duplicatesFound) {
        setIsLoading(false);
        handleDuplicateDetection(savedEvent.duplicates, () =>
          saveDraftWithDuplicates(),
        );
        return;
      }

      const eventId = savedEvent.id || savedEvent.eventId;

      // Update local event data with the saved ID
      setEventData((prev) => ({ ...prev, id: eventId }));
      
      // Mark changes as saved
      if (shouldUseIncremental) {
        changeTracking.markAsSaved();
        toast.success(`Draft saved! (${changeTracking.getPayloadSizeComparison().reduction}% smaller payload)`, {
          position: "top-center",
          autoClose: 2000,
        });
      } else {
        toast.success("Draft saved!", {
          position: "top-center",
          autoClose: 2000,
        });
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving draft:", error);
      }
      toast.error("Failed to save draft. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const publishEvent = async () => {
    setIsLoading(true);
    try {
      // Determine whether to use incremental or full update
      const changes = useIncrementalUpdates ? changeTracking.getChanges() : null;
      const shouldUseIncremental = false; // Incremental updates disabled with edit mode
      
      if (shouldUseIncremental) {
        const payloadComparison = changeTracking.getPayloadSizeComparison();
        if (process.env.NODE_ENV === 'development') {
          console.log("=== INCREMENTAL PUBLISH EVENT ===");
          console.log(`Payload reduction: ${payloadComparison.reduction}% (${payloadComparison.fullSize} → ${payloadComparison.incrementalSize} chars)`);
          console.log("Changes:", changes.changes);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("=== FULL PUBLISH EVENT ===");
          console.log("Guest count:", eventData.guests?.length || 0);
        }
      }

      // Prepare request payload
      const requestPayload = shouldUseIncremental 
        ? {
            ...changes.changes,
            public_id: eventData.public_id,
            status: "published",
            isPartialUpdate: true,
            conflictToken: changes.metadata.conflictToken
          }
        : {
            ...eventData,
            status: "published",
            isPartialUpdate: false
          };

      // Send request using appropriate method
      const response = await fetch("/api/events", {
        method: shouldUseIncremental ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        // If incremental update fails, fallback to full update
        if (shouldUseIncremental) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("Incremental publish failed, falling back to full update");
          }
          toast.warning("Using full update as fallback", {
            position: "top-center",
            autoClose: 2000,
          });
          
          const fallbackResponse = await fetch("/api/events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...eventData,
              status: "published",
              isPartialUpdate: false
            }),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error("Failed to publish event");
          }
          
          const fallbackResult = await fallbackResponse.json();
          if (!fallbackResult.success && fallbackResult.duplicatesFound) {
            setIsLoading(false);
            handleDuplicateDetection(fallbackResult.duplicates, () => publishEventWithDuplicates());
            return;
          }

          // Update local event data for fallback response
          const fallbackEventId = fallbackResult.id || fallbackResult.eventId;
          setEventData((prev) => {
            const updated = { ...prev, id: fallbackEventId };
            
            // Update guests with database IDs if provided
            if (fallbackResult.guests && Array.isArray(fallbackResult.guests)) {
              updated.guests = fallbackResult.guests;
              console.log(`✓ Updated ${fallbackResult.guests.length} guests with database IDs (fallback)`);
            }
            
            // Update guest groups with database IDs if provided  
            if (fallbackResult.guestGroups && Array.isArray(fallbackResult.guestGroups)) {
              updated.guestGroups = fallbackResult.guestGroups;
              console.log(`✓ Updated ${fallbackResult.guestGroups.length} guest groups with database IDs (fallback)`);
            }
            
            return updated;
          });
        } else {
          throw new Error("Failed to publish event");
        }
      }

      const savedEvent = await response.json();

      // Handle duplicate detection
      if (!savedEvent.success && savedEvent.duplicatesFound) {
        setIsLoading(false);
        handleDuplicateDetection(savedEvent.duplicates, () =>
          publishEventWithDuplicates(),
        );
        return;
      }

      const eventId = savedEvent.id || savedEvent.eventId;

      // Update local event data with the complete saved data including IDs
      setEventData((prev) => {
        const updated = { ...prev, id: eventId };
        
        // Update guests with database IDs if provided
        if (savedEvent.guests && Array.isArray(savedEvent.guests)) {
          updated.guests = savedEvent.guests;
          console.log(`✓ Updated ${savedEvent.guests.length} guests with database IDs`);
        }
        
        // Update guest groups with database IDs if provided  
        if (savedEvent.guestGroups && Array.isArray(savedEvent.guestGroups)) {
          updated.guestGroups = savedEvent.guestGroups;
          console.log(`✓ Updated ${savedEvent.guestGroups.length} guest groups with database IDs`);
        }
        
        return updated;
      });

      // Finalize any temporary images
      try {
        const { finalizeImages, extractImageDataForFinalization } =
          await import("../utils/imageUpload");
        const imageData = extractImageDataForFinalization(eventData);

        if (imageData.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Finalizing images for published event...", imageData);
          }
          await finalizeImages(eventId, imageData);
        }
      } catch (imageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Image finalization failed:", imageError);
        }
        // Don't fail the publish if images fail
      }

      // Mark changes as saved
      if (shouldUseIncremental) {
        changeTracking.markAsSaved();
      }

      toast.success("Event published successfully!", {
        position: "top-center",
        autoClose: 3000,
      });

      // Redirect to event page or dashboard
      router.push(`/${eventId}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error publishing event:", error);
      }
      toast.error("Failed to publish event. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.createEventPage}>
        <Header onSaveDraft={saveDraft} isLoading={isLoading} />

        <main className={styles.main}>
          <div className={styles.container}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                {heroContent[currentStep - 1].title}
              </h1>
              <p className={styles.pageSubtitle}>
                {heroContent[currentStep - 1].subtitle}
              </p>
            </div>

            {/* Progress Steps */}
            <ProgressSteps
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />

            {/* Form Content */}
            <div className={styles.formContainer}>
              {isLoadingEvent ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading event details...</p>
                </div>
              ) : (
                <>
                  {currentStep === 1 && (
                    <EventDetailsForm
                      eventData={eventData}
                      updateEventData={updateEventData}
                      onNext={nextStep}
                      isLoading={isLoading}
                    />
                  )}

                  {currentStep === 2 && (
                    <EventDetailsForm
                      eventData={eventData}
                      updateEventData={updateEventData}
                      onNext={nextStep}
                      onPrevious={previousStep}
                      isLoading={isLoading}
                      showSubEvents={true}
                    />
                  )}

                  {currentStep === 3 && (
                    <GuestListSection
                      eventData={eventData}
                      updateEventData={updateEventData}
                      onNext={nextStep}
                      onPrevious={previousStep}
                      isLoading={isLoading}
                    />
                  )}

                  {currentStep === 4 && (
                    <RSVPCustomization
                      eventData={eventData}
                      updateEventData={updateEventData}
                      onNext={nextStep}
                      onPrevious={previousStep}
                      isLoading={isLoading}
                    />
                  )}

                  {currentStep === 5 && (
                    <EmailTemplateCreator
                      eventData={eventData}
                      updateEventData={updateEventData}
                      onNext={nextStep}
                      onPrevious={previousStep}
                      isLoading={isLoading}
                    />
                  )}

                  {currentStep === 6 && (
                    <LaunchSection
                      eventData={eventData}
                      onPublish={publishEvent}
                      onPrevious={previousStep}
                      isLoading={isLoading}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && (
        <div className={styles.guestFormOverlay}>
          <div className={styles.guestFormModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Duplicate Guests Detected</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowDuplicateModal(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <p className={styles.duplicateMessage}>
                We found {duplicateGuests.length} potential duplicate guest
                {duplicateGuests.length > 1 ? "s" : ""}:
              </p>

              <div className={styles.duplicateList}>
                {duplicateGuests.map((duplicate, index) => (
                  <div key={index} className={styles.duplicateItem}>
                    <div className={styles.duplicateInfo}>
                      <strong>{duplicate.guestName}</strong> in group{" "}
                      <em>{duplicate.groupTitle}</em>
                      {duplicate.type === "existing_guest" && (
                        <span className={styles.duplicateType}>
                          (Already exists in database)
                        </span>
                      )}
                      {duplicate.type === "within_new_list" && (
                        <span className={styles.duplicateType}>
                          (Appears multiple times in your guest list)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className={styles.confirmationText}>
                Would you like to proceed anyway? This will create separate
                entries for guests with the same name.
              </p>

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowDuplicateModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={duplicateCallback}
                  type="button"
                >
                  Proceed with Duplicates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </>
  );
};

const CreateEvent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateEventContent />
    </Suspense>
  );
};

export default CreateEvent;
