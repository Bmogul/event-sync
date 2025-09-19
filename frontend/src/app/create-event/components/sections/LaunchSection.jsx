import { useState } from 'react'
import { toast } from 'react-toastify'
import styles from './LaunchSection.module.css'

const LaunchSection = ({ 
  eventData, 
  onPublish, 
  onPrevious, 
  isLoading 
}) => {
  const [previewMode, setPreviewMode] = useState('overview')
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set'
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getEventSummary = () => {
    const summary = {
      duration: eventData.startDate && eventData.endDate ? 
        Math.ceil((new Date(eventData.endDate) - new Date(eventData.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 1,
      totalGuests: eventData.guests.length,
      totalGroups: eventData.guestGroups.length,
      totalSubEvents: eventData.subEvents.length,
      hasRSVPDeadline: !!eventData.rsvpDeadline,
      isPrivate: eventData.isPrivate,
      allowsPlusOnes: eventData.allowPlusOnes
    }
    return summary
  }

  const summary = getEventSummary()

  const handlePreview = () => {
    // TODO: Open event preview in new tab
    toast.info('Event preview will open in a new tab', {
      position: 'top-center',
      autoClose: 2000,
    })
  }

  const handleSendTestInvite = () => {
    // TODO: Send test invitation
    toast.success('Test invitation sent to your email!', {
      position: 'top-center',
      autoClose: 3000,
    })
  }

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>🚀</div>
        <div>
          <h2 className={styles.sectionTitle}>Launch Your Event</h2>
          <p className={styles.sectionDescription}>
            Review your event details and launch it to start sending invitations to your guests.
          </p>
        </div>
      </div>

      {/* Event Summary Cards */}
      <div className={styles.summaryContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📅</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryTitle}>{summary.duration} Day{summary.duration !== 1 ? 's' : ''}</div>
            <div className={styles.summaryText}>Event Duration</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>👥</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryTitle}>{summary.totalGuests}</div>
            <div className={styles.summaryText}>Invited Guests</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>🎯</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryTitle}>{summary.totalSubEvents}</div>
            <div className={styles.summaryText}>Sub-Events</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📋</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryTitle}>{summary.totalGroups}</div>
            <div className={styles.summaryText}>Guest Groups</div>
          </div>
        </div>
      </div>

      {/* Preview Tabs */}
      <div className={styles.previewSection}>
        <div className={styles.previewTabs}>
          <button
            className={`${styles.previewTab} ${previewMode === 'overview' ? styles.active : ''}`}
            onClick={() => setPreviewMode('overview')}
          >
            📋 Overview
          </button>
          <button
            className={`${styles.previewTab} ${previewMode === 'details' ? styles.active : ''}`}
            onClick={() => setPreviewMode('details')}
          >
            📝 Details
          </button>
          <button
            className={`${styles.previewTab} ${previewMode === 'guests' ? styles.active : ''}`}
            onClick={() => setPreviewMode('guests')}
          >
            👥 Guests
          </button>
        </div>

        <div className={styles.previewContent}>
          {previewMode === 'overview' && (
            <div className={styles.overviewContent}>
              <h3 className={styles.eventTitle}>{eventData.title || 'Untitled Event'}</h3>
              <p className={styles.eventDescription}>
                {eventData.description || 'No description provided.'}
              </p>
              
              <div className={styles.eventMeta}>
                <div className={styles.metaItem}>
                  <strong>📍 Location:</strong> {eventData.location || 'Not specified'}
                </div>
                <div className={styles.metaItem}>
                  <strong>📅 Dates:</strong> {formatDate(eventData.startDate)} - {formatDate(eventData.endDate)}
                </div>
                <div className={styles.metaItem}>
                  <strong>🎭 Type:</strong> {eventData.eventType?.charAt(0).toUpperCase() + eventData.eventType?.slice(1) || 'Other'}
                </div>
                {eventData.maxGuests && (
                  <div className={styles.metaItem}>
                    <strong>👥 Capacity:</strong> {eventData.maxGuests} guests
                  </div>
                )}
              </div>

              <div className={styles.settingsList}>
                <div className={`${styles.settingItem} ${eventData.isPrivate ? styles.enabled : styles.disabled}`}>
                  <span className={styles.settingIcon}>{eventData.isPrivate ? '🔒' : '🌐'}</span>
                  <span>{eventData.isPrivate ? 'Private Event' : 'Public Event'}</span>
                </div>
                <div className={`${styles.settingItem} ${eventData.requireRSVP ? styles.enabled : styles.disabled}`}>
                  <span className={styles.settingIcon}>{eventData.requireRSVP ? '✅' : '❌'}</span>
                  <span>{eventData.requireRSVP ? 'RSVP Required' : 'No RSVP Required'}</span>
                </div>
                <div className={`${styles.settingItem} ${eventData.allowPlusOnes ? styles.enabled : styles.disabled}`}>
                  <span className={styles.settingIcon}>{eventData.allowPlusOnes ? '👥' : '👤'}</span>
                  <span>{eventData.allowPlusOnes ? 'Plus Ones Allowed' : 'No Plus Ones'}</span>
                </div>
              </div>
            </div>
          )}

          {previewMode === 'details' && (
            <div className={styles.detailsContent}>
              {eventData.subEvents.length > 0 ? (
                <>
                  <h4 className={styles.subEventsTitle}>Sub-Events ({eventData.subEvents.length})</h4>
                  <div className={styles.subEventsList}>
                    {eventData.subEvents.map((subEvent, index) => (
                      <div key={subEvent.id} className={styles.subEventPreview}>
                        <div className={styles.subEventMeta}>
                          <div className={styles.subEventNumber}>#{index + 1}</div>
                          <div className={styles.subEventInfo}>
                            <h5 className={styles.subEventTitle}>{subEvent.title}</h5>
                            <div className={styles.subEventDetails}>
                              <span>📅 {formatDate(subEvent.date)}</span>
                              {subEvent.startTime && (
                                <span>🕒 {formatTime(subEvent.startTime)} - {formatTime(subEvent.endTime)}</span>
                              )}
                              {subEvent.location && <span>📍 {subEvent.location}</span>}
                            </div>
                            {subEvent.description && (
                              <p className={styles.subEventDescription}>{subEvent.description}</p>
                            )}
                          </div>
                        </div>
                        <div className={styles.subEventStatus}>
                          {subEvent.isRequired ? (
                            <span className={styles.requiredBadge}>Required</span>
                          ) : (
                            <span className={styles.optionalBadge}>Optional</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎯</div>
                  <p>No sub-events configured</p>
                </div>
              )}
            </div>
          )}

          {previewMode === 'guests' && (
            <div className={styles.guestsContent}>
              {eventData.guests.length > 0 ? (
                <>
                  <div className={styles.guestStats}>
                    <span><strong>{eventData.guests.length}</strong> total guests</span>
                    {eventData.guestGroups.length > 0 && (
                      <span><strong>{eventData.guestGroups.length}</strong> groups</span>
                    )}
                  </div>

                  {eventData.guestGroups.length > 0 && (
                    <div className={styles.groupsPreview}>
                      <h4 className={styles.groupsTitle}>Guest Groups</h4>
                      <div className={styles.groupsList}>
                        {eventData.guestGroups.map(group => {
                          const groupGuests = eventData.guests.filter(guest => guest.group === group.name)
                          return (
                            <div key={group.id} className={styles.groupPreview}>
                              <div 
                                className={styles.groupColor} 
                                style={{ backgroundColor: group.color }}
                              />
                              <span className={styles.groupName}>{group.name}</span>
                              <span className={styles.groupCount}>({groupGuests.length})</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.guestsPreview}>
                    <h4 className={styles.guestsTitle}>Guest List</h4>
                    <div className={styles.guestList}>
                      {eventData.guests.slice(0, 10).map(guest => (
                        <div key={guest.id} className={styles.guestPreview}>
                          <div className={styles.guestInfo}>
                            <span className={styles.guestName}>{guest.name}</span>
                            <span className={styles.guestEmail}>{guest.email}</span>
                          </div>
                          {guest.group && (
                            <span 
                              className={styles.guestGroupBadge}
                              style={{ 
                                backgroundColor: eventData.guestGroups.find(g => g.name === guest.group)?.color || '#7c3aed'
                              }}
                            >
                              {guest.group}
                            </span>
                          )}
                        </div>
                      ))}
                      {eventData.guests.length > 10 && (
                        <div className={styles.moreGuests}>
                          +{eventData.guests.length - 10} more guests
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <p>No guests added yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionSection}>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handlePreview}
          >
            👁️ Preview Event Page
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleSendTestInvite}
          >
            📧 Send Test Invite
          </button>
        </div>

        <div className={styles.launchWarning}>
          <div className={styles.warningIcon}>⚠️</div>
          <div className={styles.warningText}>
            <strong>Ready to launch?</strong> Once published, invitations will be sent to all guests and your event will be live.
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
          type="button"
          className={`${styles.btn} ${styles.btnSuccess}`}
          onClick={onPublish}
          disabled={isLoading}
        >
          {isLoading ? 'Publishing...' : '🚀 Publish Event'}
        </button>
      </div>
    </div>
  )
}

export default LaunchSection