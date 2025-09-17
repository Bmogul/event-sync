"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./page.module.css";
import Header from "./components/Header";
import ProgressSteps from "./components/ProgressSteps";
import EventDetailsForm from "./components/sections/EventDetailsForm";
import GuestListSection from "./components/sections/GuestListSection";
import RSVPCustomization from "./components/sections/RSVPCustomization";
import LaunchSection from "./components/sections/LaunchSection";

const CreateEvent = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedImages, setHasUnsavedImages] = useState(false);
  const heroContent = [
    {
      tile: "Create Your Event",
      subtitle:
        "Set up your multi-day event with individual sub-events. Perfect for weddings, conferences, and celebrations.",
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
    { title: "Customize RSVP Page", subtitle: "Design your RSVP page to match your event's style and gather the information you need." },
    {
      title: "Ready to Launch",
      subtitle:
        "Review your event details and choose how you'd like to launch your Event.",
    },
  ];

  // Event form data
  const [eventData, setEventData] = useState({
    // Main event details
    title: "",
    description: "",
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
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        maxGuests: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isRequired: true,
      }
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
      welcomeMessage: "We're so excited to celebrate with you! Please let us know if you can make it.",
      theme: 'elegant',
      fontFamily: 'Playfair Display',
      backgroundColor: '#faf5ff',
      textColor: '#581c87',
      primaryColor: '#7c3aed',
      customQuestions: ['dietary', 'message'],
      backgroundImage: null,
      backgroundOverlay: 20
    },
  });

  const updateEventData = (updates) => {
    setEventData((prev) => ({
      ...prev,
      ...updates,
    }));
    
    // Check if any temporary images were added
    const newData = { ...eventData, ...updates };
    const hasTemporaryImages = 
      (newData.rsvpSettings?.logo && newData.rsvpSettings.logo.includes('/temp/')) ||
      (newData.rsvpSettings?.backgroundImage && newData.rsvpSettings.backgroundImage.includes('/temp/')) ||
      (newData.subEvents && newData.subEvents.some(se => se.image && se.image.includes('/temp/')));
    
    setHasUnsavedImages(hasTemporaryImages);
  };

  // Cleanup temporary images when leaving page without saving
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (hasUnsavedImages) {
        // Try to cleanup temp images on page unload
        try {
          const { cleanupTempImages, extractTempImageUrls } = await import('../utils/imageUpload');
          const tempUrls = extractTempImageUrls(eventData);
          if (tempUrls.length > 0) {
            // Use sendBeacon for reliable cleanup during page unload
            navigator.sendBeacon('/api/cleanup-temp-images', JSON.stringify({
              imageUrls: tempUrls
            }));
          }
        } catch (error) {
          console.warn("Failed to cleanup temp images on unload:", error);
        }
        
        // Show confirmation dialog
        event.preventDefault();
        event.returnValue = 'You have unsaved images. Are you sure you want to leave?';
        return 'You have unsaved images. Are you sure you want to leave?';
      }
    };

    const handleRouteChange = async () => {
      if (hasUnsavedImages) {
        try {
          const { cleanupTempImages, extractTempImageUrls } = await import('../utils/imageUpload');
          const tempUrls = extractTempImageUrls(eventData);
          if (tempUrls.length > 0) {
            await cleanupTempImages(tempUrls);
          }
        } catch (error) {
          console.warn("Failed to cleanup temp images on route change:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup on component unmount
      if (hasUnsavedImages) {
        handleRouteChange();
      }
    };
  }, [hasUnsavedImages, eventData]);

  const nextStep = () => {
    if (currentStep < 5) {
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

  const saveDraft = async () => {
    setIsLoading(true);
    try {
      // First create/update the event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          status: 'draft'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      const savedEvent = await response.json();
      const eventId = savedEvent.id || savedEvent.eventId;

      // Update local event data with the saved ID
      setEventData(prev => ({ ...prev, id: eventId }));

      // Finalize any temporary images
      try {
        const { finalizeImages, extractImageDataForFinalization } = await import('../utils/imageUpload');
        const imageData = extractImageDataForFinalization(eventData);
        
        if (imageData.length > 0) {
          console.log("Finalizing images for draft...", imageData);
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
        console.warn("Image finalization failed:", imageError);
        toast.success("Draft saved (images may need re-upload)", {
          position: "top-center",
          autoClose: 2000,
        });
      }

    } catch (error) {
      console.error("Error saving draft:", error);
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
      // First create/update the event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          status: 'published'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish event');
      }

      const savedEvent = await response.json();
      const eventId = savedEvent.id || savedEvent.eventId;

      // Finalize any temporary images
      try {
        const { finalizeImages, extractImageDataForFinalization } = await import('../utils/imageUpload');
        const imageData = extractImageDataForFinalization(eventData);
        
        if (imageData.length > 0) {
          console.log("Finalizing images for published event...", imageData);
          await finalizeImages(eventId, imageData);
        }
      } catch (imageError) {
        console.warn("Image finalization failed:", imageError);
        // Don't fail the publish if images fail
      }

      toast.success("Event published successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
      
      // Redirect to event page or dashboard
      router.push(`/${eventId}`);
    } catch (error) {
      console.error("Error publishing event:", error);
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
              <h1 className={styles.pageTitle}>{heroContent[currentStep-1].title}</h1>
              <p className={styles.pageSubtitle}>{heroContent[currentStep-1].subtitle}</p>
            </div>

            {/* Progress Steps */}
            <ProgressSteps
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />

            {/* Form Content */}
            <div className={styles.formContainer}>
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
                <LaunchSection
                  eventData={eventData}
                  onPublish={publishEvent}
                  onPrevious={previousStep}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </main>
      </div>

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

export default CreateEvent;
