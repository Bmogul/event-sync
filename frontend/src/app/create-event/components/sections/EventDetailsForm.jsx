import { useState } from 'react'
import { toast } from 'react-toastify'
import styles from './EventDetailsForm.module.css'

const EventDetailsForm = ({ 
  eventData, 
  updateEventData, 
  onNext, 
  onPrevious, 
  isLoading, 
  showSubEvents = false 
}) => {
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    updateEventData({ [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubEventChange = (index, field, value) => {
    const updatedSubEvents = [...eventData.subEvents]
    updatedSubEvents[index] = { ...updatedSubEvents[index], [field]: value }
    updateEventData({ subEvents: updatedSubEvents })
  }

  const addSubEvent = () => {
    const newSubEvent = {
      id: Date.now(),
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
    updateEventData({ 
      subEvents: [...eventData.subEvents, newSubEvent] 
    })
  }

  const removeSubEvent = (index) => {
    // Prevent removing the last sub-event (minimum 1 required)
    if (eventData.subEvents.length <= 1) {
      toast.error('At least one sub-event is required', {
        position: 'top-center',
        autoClose: 2000,
      })
      return
    }
    
    const updatedSubEvents = eventData.subEvents.filter((_, i) => i !== index)
    updateEventData({ subEvents: updatedSubEvents })
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!eventData.title.trim()) newErrors.title = 'Event title is required'
    
    if (eventData.endDate && eventData.startDate && new Date(eventData.endDate) < new Date(eventData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    // Validate sub-events - only title is required, other fields are nullable
    if (showSubEvents && eventData.subEvents.length > 0) {
      eventData.subEvents.forEach((subEvent, index) => {
        if (!subEvent.title.trim()) {
          newErrors[`subEvent_${index}_title`] = 'Sub-event title is required'
        }
        // Remove date requirement - it's now nullable
        // Remove other field requirements - they're all nullable
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      if (showSubEvents) {
        toast.success('Sub-events configured successfully!', {
          position: 'top-center',
          autoClose: 2000,
        })
      } else {
        toast.success('Event details saved!', {
          position: 'top-center',
          autoClose: 2000,
        })
      }
      onNext()
    } else {
      toast.error('Please fix the errors below', {
        position: 'top-center',
        autoClose: 3000,
      })
    }
  }

  if (showSubEvents) {
    return (
      <form className={styles.formSection} onSubmit={handleSubmit}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>🎯</div>
          <div>
            <h2 className={styles.sectionTitle}>Sub-Events</h2>
            <p className={styles.sectionDescription}>
              Break down your event into specific activities or days. Each sub-event can have its own details and guest requirements.
            </p>
          </div>
        </div>

        <div className={styles.subEventsContainer}>
          {eventData.subEvents.map((subEvent, index) => (
            <div key={subEvent.id} className={styles.subEventCard}>
              <div className={styles.subEventHeader}>
                <div className={styles.subEventNumber}>
                  Sub-Event {index + 1}
                </div>
                {eventData.subEvents.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeSubEventBtn}
                    onClick={() => removeSubEvent(index)}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Title *</label>
                  <input
                    type="text"
                    className={`${styles.formInput} ${errors[`subEvent_${index}_title`] ? styles.error : ''}`}
                    value={subEvent.title}
                    onChange={(e) => handleSubEventChange(index, 'title', e.target.value)}
                    placeholder="e.g., Welcome Reception, Main Ceremony"
                  />
                  {errors[`subEvent_${index}_title`] && (
                    <div className={styles.errorText}>{errors[`subEvent_${index}_title`]}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    className={`${styles.formInput} ${errors[`subEvent_${index}_date`] ? styles.error : ''}`}
                    value={subEvent.date}
                    onChange={(e) => handleSubEventChange(index, 'date', e.target.value)}
                    min={eventData.startDate}
                    max={eventData.endDate}
                  />
                  {errors[`subEvent_${index}_date`] && (
                    <div className={styles.errorText}>{errors[`subEvent_${index}_date`]}</div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={subEvent.startTime}
                    onChange={(e) => handleSubEventChange(index, 'startTime', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={subEvent.endTime}
                    onChange={(e) => handleSubEventChange(index, 'endTime', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Timezone</label>
                  <select
                    className={styles.formInput}
                    value={subEvent.timezone}
                    onChange={(e) => handleSubEventChange(index, 'timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Paris">CET (Paris)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                    <option value="Asia/Shanghai">CST (Shanghai)</option>
                    <option value="Asia/Kolkata">IST (India)</option>
                    <option value="Australia/Sydney">AEST (Sydney)</option>
                  </select>
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formTextarea}
                    value={subEvent.description}
                    onChange={(e) => handleSubEventChange(index, 'description', e.target.value)}
                    placeholder="Brief description of this sub-event"
                    rows="3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={subEvent.location}
                    onChange={(e) => handleSubEventChange(index, 'location', e.target.value)}
                    placeholder="Specific location for this sub-event"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Max Guests</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={subEvent.maxGuests}
                    onChange={(e) => handleSubEventChange(index, 'maxGuests', e.target.value)}
                    placeholder="Optional capacity limit"
                    min="1"
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id={`required_${index}`}
                  className={styles.checkboxInput}
                  checked={subEvent.isRequired}
                  onChange={(e) => handleSubEventChange(index, 'isRequired', e.target.checked)}
                />
                <label htmlFor={`required_${index}`} className={styles.checkboxLabel}>
                  This sub-event is required for all guests
                </label>
              </div>
            </div>
          ))}

          {errors.subEvents && (
            <div className={styles.errorText}>{errors.subEvents}</div>
          )}

          <button
            type="button"
            className={styles.addSubEventBtn}
            onClick={addSubEvent}
          >
            + Add Another Sub-Event
          </button>
        </div>

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
            {isLoading ? 'Saving...' : 'Continue to Sub-Events →'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form className={styles.formSection} onSubmit={handleSubmit}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>🎉</div>
        <div>
          <h2 className={styles.sectionTitle}>Main Event Details</h2>
          <p className={styles.sectionDescription}>
            Let's start with the basics. Tell us about your event so we can create the perfect experience for you and your guests.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Event Title *</label>
          <input
            type="text"
            className={`${styles.formInput} ${errors.title ? styles.error : ''}`}
            value={eventData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Jumana & Burhanuddin Wedding Weekend"
          />
          {errors.title && <div className={styles.errorText}>{errors.title}</div>}
        </div>

        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Description</label>
          <textarea
            className={`${styles.formTextarea} ${errors.description ? styles.error : ''}`}
            value={eventData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Share what makes your event special..."
            rows="4"
          />
          {errors.description && <div className={styles.errorText}>{errors.description}</div>}
        </div>

        <div className={styles.formGroupFull}>
          <label className={styles.formLabel}>Event Logo URL</label>
          <input
            type="url"
            className={`${styles.formInput} ${errors.logo_url ? styles.error : ''}`}
            value={eventData.logo_url || ''}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="https://example.com/your-logo.png"
          />
          <div className={styles.formHelp}>
            Optional: Add a logo URL that will appear in your email invitations and RSVP page
          </div>
          {errors.logo_url && <div className={styles.errorText}>{errors.logo_url}</div>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Event Type</label>
          <select
            className={styles.formSelect}
            value={eventData.eventType}
            onChange={(e) => handleInputChange('eventType', e.target.value)}
          >
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday Party</option>
            <option value="conference">Conference</option>
            <option value="corporate">Corporate Event</option>
            <option value="celebration">Celebration</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Max Guests</label>
          <input
            type="number"
            className={styles.formInput}
            value={eventData.maxGuests}
            onChange={(e) => handleInputChange('maxGuests', e.target.value)}
            placeholder="Optional capacity limit"
            min="1"
          />
          <div className={styles.formHelp}>Leave blank for unlimited</div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Start Date</label>
          <input
            type="date"
            className={`${styles.formInput} ${errors.startDate ? styles.error : ''}`}
            value={eventData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.startDate && <div className={styles.errorText}>{errors.startDate}</div>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>End Date</label>
          <input
            type="date"
            className={`${styles.formInput} ${errors.endDate ? styles.error : ''}`}
            value={eventData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            min={eventData.startDate || new Date().toISOString().split('T')[0]}
          />
          {errors.endDate && <div className={styles.errorText}>{errors.endDate}</div>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>RSVP Deadline</label>
          <input
            type="date"
            className={styles.formInput}
            value={eventData.rsvpDeadline}
            onChange={(e) => handleInputChange('rsvpDeadline', e.target.value)}
            max={eventData.startDate}
          />
          <div className={styles.formHelp}>When should guests respond by?</div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3 className={styles.settingsTitle}>Event Settings</h3>
        
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="isPrivate"
            className={styles.checkboxInput}
            checked={eventData.isPrivate}
            onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
          />
          <label htmlFor="isPrivate" className={styles.checkboxLabel}>
            Private Event (invitation only)
          </label>
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="requireRSVP"
            className={styles.checkboxInput}
            checked={eventData.requireRSVP}
            onChange={(e) => handleInputChange('requireRSVP', e.target.checked)}
          />
          <label htmlFor="requireRSVP" className={styles.checkboxLabel}>
            Require RSVP from guests
          </label>
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="allowPlusOnes"
            className={styles.checkboxInput}
            checked={eventData.allowPlusOnes}
            onChange={(e) => handleInputChange('allowPlusOnes', e.target.checked)}
          />
          <label htmlFor="allowPlusOnes" className={styles.checkboxLabel}>
            Allow guests to bring plus ones
          </label>
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Continue to Guest List →'}
        </button>
      </div>
    </form>
  )
}

export default EventDetailsForm
