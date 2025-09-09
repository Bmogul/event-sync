'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styles from './page.module.css'
import Header from './components/Header'
import ProgressSteps from './components/ProgressSteps'
import EventDetailsForm from './components/sections/EventDetailsForm'
import GuestListSection from './components/sections/GuestListSection'
import LaunchSection from './components/sections/LaunchSection'

const CreateEvent = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  // Event form data
  const [eventData, setEventData] = useState({
    // Main event details
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxGuests: '',
    eventType: 'wedding',
    isPrivate: false,
    
    // Sub-events
    subEvents: [],
    
    // Guest list
    guests: [],
    guestGroups: [],
    
    // Settings
    requireRSVP: true,
    allowPlusOnes: false,
    rsvpDeadline: '',
  })


  const updateEventData = (updates) => {
    setEventData(prev => ({
      ...prev,
      ...updates
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleStepClick = (step) => {
    setCurrentStep(step)
  }

  const saveDraft = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement save draft functionality
      console.log('Saving draft...', eventData)
      toast.success('Draft saved successfully!', {
        position: 'top-center',
        autoClose: 2000,
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const publishEvent = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement publish event functionality
      console.log('Publishing event...', eventData)
      toast.success('Event published successfully!', {
        position: 'top-center',
        autoClose: 3000,
      })
      // Redirect to event page or dashboard
      router.push('/')
    } catch (error) {
      console.error('Error publishing event:', error)
      toast.error('Failed to publish event. Please try again.', {
        position: 'top-center',
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <>
      <div className={styles.createEventPage}>
        <Header onSaveDraft={saveDraft} isLoading={isLoading} />
        
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Create Your Event</h1>
              <p className={styles.pageSubtitle}>
                Set up your multi-day event with individual sub-events. Perfect for weddings, conferences, and celebrations.
              </p>
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
  )
}

export default CreateEvent