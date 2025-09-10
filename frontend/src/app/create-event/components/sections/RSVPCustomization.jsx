import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import styles from './RSVPCustomization.module.css'

const RSVPCustomization = ({ 
  eventData, 
  updateEventData, 
  onNext, 
  onPrevious, 
  isLoading 
}) => {
  const [errors, setErrors] = useState({})
  const [previewDevice, setPreviewDevice] = useState('mobile')

  const handleInputChange = (field, value) => {
    updateEventData({ 
      rsvpSettings: { 
        ...eventData.rsvpSettings, 
        [field]: value 
      } 
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleQuestionToggle = (questionType, isChecked) => {
    const currentQuestions = eventData.rsvpSettings?.customQuestions || []
    if (isChecked) {
      updateEventData({ 
        rsvpSettings: { 
          ...eventData.rsvpSettings, 
          customQuestions: [...currentQuestions, questionType] 
        } 
      })
    } else {
      updateEventData({ 
        rsvpSettings: { 
          ...eventData.rsvpSettings, 
          customQuestions: currentQuestions.filter(q => q !== questionType) 
        } 
      })
    }
  }

  const applyTheme = (themeName) => {
    const themes = {
      elegant: {
        fontFamily: 'Playfair Display',
        backgroundColor: '#faf5ff',
        textColor: '#581c87',
        primaryColor: '#7c3aed'
      },
      modern: {
        fontFamily: 'Inter',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        primaryColor: '#7c3aed'
      },
      rustic: {
        fontFamily: 'Cormorant Garamond',
        backgroundColor: '#f0fdf4',
        textColor: '#065f46',
        primaryColor: '#7c3aed'
      },
      glamorous: {
        fontFamily: 'Great Vibes',
        backgroundColor: '#111827',
        textColor: '#fbbf24',
        primaryColor: '#7c3aed'
      },
      beach: {
        fontFamily: 'Dancing Script',
        backgroundColor: '#eff6ff',
        textColor: '#1e40af',
        primaryColor: '#7c3aed'
      }
    }

    const selectedTheme = themes[themeName]
    if (selectedTheme) {
      updateEventData({ 
        rsvpSettings: { 
          ...eventData.rsvpSettings, 
          theme: themeName,
          ...selectedTheme
        } 
      })
      toast.success(`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme applied!`, {
        position: 'top-center',
        autoClose: 2000,
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const rsvpSettings = eventData.rsvpSettings || {}
    
    if (!rsvpSettings.pageTitle?.trim()) {
      newErrors.pageTitle = 'RSVP page title is required'
    }
    if (!rsvpSettings.subtitle?.trim()) {
      newErrors.subtitle = 'RSVP subtitle is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      toast.success('RSVP page configured successfully!', {
        position: 'top-center',
        autoClose: 2000,
      })
      onNext()
    } else {
      toast.error('Please fix the errors below', {
        position: 'top-center',
        autoClose: 3000,
      })
    }
  }

  // Initialize RSVP settings if not present
  useEffect(() => {
    if (!eventData.rsvpSettings) {
      updateEventData({ 
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
        }
      })
    }
  }, [])

  const rsvpSettings = eventData.rsvpSettings || {}

  return (
    <form className={styles.formSection+" "+styles.customization} onSubmit={handleSubmit}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>💌</div>
        <div>
          <h2 className={styles.sectionTitle}>RSVP Page Customization</h2>
          <p className={styles.sectionDescription}>
            Design your RSVP page to match your event's style and gather the information you need from guests.
          </p>
        </div>
      </div>

      <div className={styles.editorLayout}>
        {/* Left Panel - Controls */}
        <div className={styles.controlsPanel}>
          {/* Basic Settings */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>📝 Content</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Page Title *</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.pageTitle ? styles.error : ''}`}
                value={rsvpSettings.pageTitle || ''}
                onChange={(e) => handleInputChange('pageTitle', e.target.value)}
                placeholder="You're Invited!"
              />
              {errors.pageTitle && <div className={styles.errorText}>{errors.pageTitle}</div>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subtitle *</label>
              <input
                type="text"
                className={`${styles.formInput} ${errors.subtitle ? styles.error : ''}`}
                value={rsvpSettings.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Join us for our special celebration"
              />
              {errors.subtitle && <div className={styles.errorText}>{errors.subtitle}</div>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Welcome Message</label>
              <textarea
                className={styles.formTextarea}
                value={rsvpSettings.welcomeMessage || ''}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                placeholder="We're so excited to celebrate with you! Please let us know if you can make it."
                rows="3"
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>🎨 Theme</h3>
            
            <div className={styles.themeGrid}>
              {['elegant', 'modern', 'rustic', 'glamorous', 'beach'].map(theme => (
                <button
                  key={theme}
                  type="button"
                  className={`${styles.themeButton} ${rsvpSettings.theme === theme ? styles.active : ''}`}
                  onClick={() => applyTheme(theme)}
                >
                  {theme === 'elegant' && '✨ Elegant'}
                  {theme === 'modern' && '🎯 Modern'}
                  {theme === 'rustic' && '🌿 Rustic'}
                  {theme === 'glamorous' && '💎 Glamorous'}
                  {theme === 'beach' && '🏖️ Beach'}
                </button>
              ))}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Font Style</label>
              <select
                className={styles.formSelect}
                value={rsvpSettings.fontFamily || 'Playfair Display'}
                onChange={(e) => handleInputChange('fontFamily', e.target.value)}
              >
                <option value="Playfair Display">Playfair Display (Elegant)</option>
                <option value="Dancing Script">Dancing Script (Handwritten)</option>
                <option value="Great Vibes">Great Vibes (Stylish)</option>
                <option value="Cormorant Garamond">Cormorant Garamond (Classic)</option>
                <option value="Inter">Inter (Modern)</option>
              </select>
            </div>
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
                  checked={rsvpSettings.customQuestions?.includes('dietary')}
                  onChange={(e) => handleQuestionToggle('dietary', e.target.checked)}
                />
                <label>Dietary Restrictions</label>
              </div>
              <div className={styles.questionItem}>
                <input 
                  type="checkbox" 
                  checked={rsvpSettings.customQuestions?.includes('contact')}
                  onChange={(e) => handleQuestionToggle('contact', e.target.checked)}
                />
                <label>Contact Information</label>
              </div>
              <div className={styles.questionItem}>
                <input 
                  type="checkbox" 
                  checked={rsvpSettings.customQuestions?.includes('song')}
                  onChange={(e) => handleQuestionToggle('song', e.target.checked)}
                />
                <label>Song Requests</label>
              </div>
              <div className={styles.questionItem}>
                <input 
                  type="checkbox" 
                  checked={rsvpSettings.customQuestions?.includes('message')}
                  onChange={(e) => handleQuestionToggle('message', e.target.checked)}
                />
                <label>Personal Message</label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <h3>Preview</h3>
            <div className={styles.deviceToggle}>
              <button
                type="button"
                className={`${styles.deviceBtn} ${previewDevice === 'mobile' ? styles.active : ''}`}
                onClick={() => setPreviewDevice('mobile')}
              >
                📱
              </button>
              <button
                type="button"
                className={`${styles.deviceBtn} ${previewDevice === 'tablet' ? styles.active : ''}`}
                onClick={() => setPreviewDevice('tablet')}
              >
                📱
              </button>
              <button
                type="button"
                className={`${styles.deviceBtn} ${previewDevice === 'desktop' ? styles.active : ''}`}
                onClick={() => setPreviewDevice('desktop')}
              >
                💻
              </button>
            </div>
          </div>

          <div className={`${styles.previewFrame} ${styles[previewDevice]}`}>
            <div 
              className={styles.rsvpPreview}
              style={{
                backgroundColor: rsvpSettings.backgroundColor,
                fontFamily: rsvpSettings.fontFamily,
                color: rsvpSettings.textColor
              }}
            >
              <div className={styles.rsvpHeader}>
                <h1 className={styles.rsvpTitle}>{rsvpSettings.pageTitle || "You're Invited!"}</h1>
                <p className={styles.rsvpSubtitle}>{rsvpSettings.subtitle || "Join us for our special celebration"}</p>
              </div>
              
              {/* Event Cards Section */}
              {eventData.subEvents && eventData.subEvents.length > 0 && (
                <div className={styles.cardsSection}>
                  <div className={styles.cardStack}>
                    {eventData.subEvents.slice(0, 3).map((subEvent, index) => (
                      <div 
                        key={index} 
                        className={styles.eventCard}
                        style={{ 
                          zIndex: eventData.subEvents.length - index,
                          transform: `translate(${index * 10}px, ${index * 20}px)`
                        }}
                      >
                        <div className={styles.cardContent}>
                          <h3>{subEvent.title || `Sub-Event ${index + 1}`}</h3>
                          <p>{subEvent.date && subEvent.startTime ? 
                            `${new Date(subEvent.date).toLocaleDateString()} at ${subEvent.startTime}` : 
                            'Date & Time'}
                          </p>
                          <p>{subEvent.location || 'Location'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Guest List Section */}
              <div className={styles.inviteSection}>
                <div className={styles.inviteHeader}>
                  <h2>Please Join Us</h2>
                </div>
                <div className={styles.guestList}>
                  <div className={styles.guestName}>Sarah Johnson</div>
                  <div className={styles.guestName}>Michael Johnson</div>
                  <div className={styles.guestName}>Emma Johnson</div>
                </div>
                <button 
                  type="button" 
                  className={styles.rsvpButton}
                  style={{ backgroundColor: rsvpSettings.primaryColor }}
                  onClick={() => {/* This would open the RSVP modal */}}
                >
                  RSVP Now
                </button>
              </div>

              {/* RSVP Modal Preview - Shows what happens when RSVP is clicked */}
              <div className={styles.modalPreview}>
                <div className={styles.modalContent}>
                  <div className={styles.modalHeader}>
                    <h3>{eventData.subEvents?.[0]?.title || 'Sub-Event 1'}</h3>
                    <div className={styles.modalInfo}>
                      <span>📅 {eventData.subEvents?.[0]?.date ? 
                        new Date(eventData.subEvents[0].date).toLocaleDateString() : 
                        'Event Date'}</span>
                      <span>📍 {eventData.subEvents?.[0]?.location || 'Event Location'}</span>
                    </div>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.guestResponse}>
                      <span>Sarah Johnson</span>
                      <div className={styles.responseButtons}>
                        <button className={`${styles.responseBtn} ${styles.yesBtn}`}>Yes</button>
                        <button className={styles.responseBtn}>No</button>
                      </div>
                    </div>
                    <div className={styles.guestResponse}>
                      <span>Michael Johnson</span>
                      <div className={styles.responseButtons}>
                        <button className={styles.responseBtn}>Yes</button>
                        <button className={styles.responseBtn}>No</button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button className={styles.nextBtn}>Next Sub-Event →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          {isLoading ? 'Saving...' : 'Continue to Launch →'}
        </button>
      </div>
    </form>
  )
}

export default RSVPCustomization
