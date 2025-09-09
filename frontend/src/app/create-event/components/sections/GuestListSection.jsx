import { useState } from 'react'
import { toast } from 'react-toastify'
import styles from './GuestListSection.module.css'

const GuestListSection = ({ 
  eventData, 
  updateEventData, 
  onNext, 
  onPrevious, 
  isLoading 
}) => {
  const [newGuest, setNewGuest] = useState({ name: '', email: '', group: '' })
  const [newGroup, setNewGroup] = useState({ name: '', color: '#7c3aed' })
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [errors, setErrors] = useState({})

  const groupColors = [
    '#7c3aed', '#059669', '#dc2626', '#d97706', 
    '#0891b2', '#9333ea', '#16a34a', '#ea580c'
  ]

  const handleAddGuest = () => {
    if (!newGuest.name.trim()) {
      toast.error('Guest name is required', { position: 'top-center' })
      return
    }

    if (!newGuest.email.trim()) {
      toast.error('Guest email is required', { position: 'top-center' })
      return
    }

    // Check if email already exists
    if (eventData.guests.some(guest => guest.email === newGuest.email)) {
      toast.error('This email is already in the guest list', { position: 'top-center' })
      return
    }

    const guest = {
      id: Date.now(),
      name: newGuest.name,
      email: newGuest.email,
      group: newGuest.group,
      rsvpStatus: 'pending',
      plusOne: false,
      subEventRSVPs: {},
      invitedAt: null,
      respondedAt: null,
    }

    updateEventData({ 
      guests: [...eventData.guests, guest] 
    })
    
    setNewGuest({ name: '', email: '', group: '' })
    toast.success('Guest added successfully!', { position: 'top-center', autoClose: 2000 })
  }

  const handleRemoveGuest = (guestId) => {
    const updatedGuests = eventData.guests.filter(guest => guest.id !== guestId)
    updateEventData({ guests: updatedGuests })
    toast.success('Guest removed', { position: 'top-center', autoClose: 2000 })
  }

  const handleAddGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required', { position: 'top-center' })
      return
    }

    if (eventData.guestGroups.some(group => group.name === newGroup.name)) {
      toast.error('A group with this name already exists', { position: 'top-center' })
      return
    }

    const group = {
      id: Date.now(),
      name: newGroup.name,
      color: newGroup.color,
      guestCount: 0,
    }

    updateEventData({ 
      guestGroups: [...eventData.guestGroups, group] 
    })
    
    setNewGroup({ name: '', color: '#7c3aed' })
    setShowAddGroup(false)
    toast.success('Group created successfully!', { position: 'top-center', autoClose: 2000 })
  }

  const handleRemoveGroup = (groupId) => {
    // Remove the group
    const updatedGroups = eventData.guestGroups.filter(group => group.id !== groupId)
    
    // Update guests to remove the group assignment
    const updatedGuests = eventData.guests.map(guest => {
      const removedGroup = eventData.guestGroups.find(group => group.id === groupId)
      if (guest.group === removedGroup?.name) {
        return { ...guest, group: '' }
      }
      return guest
    })

    updateEventData({ 
      guestGroups: updatedGroups,
      guests: updatedGuests
    })
    
    toast.success('Group removed', { position: 'top-center', autoClose: 2000 })
  }

  const handleBulkImport = (csvData) => {
    // TODO: Implement CSV import functionality
    console.log('Bulk import:', csvData)
    toast.info('Bulk import feature coming soon!', { position: 'top-center' })
  }

  const getGroupStats = () => {
    const stats = {}
    eventData.guestGroups.forEach(group => {
      stats[group.name] = eventData.guests.filter(guest => guest.group === group.name).length
    })
    stats['unassigned'] = eventData.guests.filter(guest => !guest.group).length
    return stats
  }

  const handleSubmit = () => {
    if (eventData.guests.length === 0) {
      toast.error('Please add at least one guest to continue', {
        position: 'top-center',
        autoClose: 3000,
      })
      return
    }

    toast.success('Guest list configured successfully!', {
      position: 'top-center',
      autoClose: 2000,
    })
    onNext()
  }

  const groupStats = getGroupStats()

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>👥</div>
        <div>
          <h2 className={styles.sectionTitle}>Guest List</h2>
          <p className={styles.sectionDescription}>
            Add your guests and organize them into groups. You can import from a spreadsheet or add them manually.
          </p>
        </div>
      </div>

      {/* Guest Statistics */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{eventData.guests.length}</div>
          <div className={styles.statLabel}>Total Guests</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{eventData.guestGroups.length}</div>
          <div className={styles.statLabel}>Groups</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{groupStats.unassigned || 0}</div>
          <div className={styles.statLabel}>Unassigned</div>
        </div>
      </div>

      {/* Guest Groups Management */}
      <div className={styles.groupsSection}>
        <div className={styles.subsectionHeader}>
          <h3 className={styles.subsectionTitle}>Guest Groups</h3>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => setShowAddGroup(!showAddGroup)}
          >
            + Add Group
          </button>
        </div>

        {showAddGroup && (
          <div className={styles.addGroupForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Group Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., Family, Friends, Colleagues"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Color</label>
                <div className={styles.colorPicker}>
                  {groupColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorOption} ${newGroup.color === color ? styles.selected : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewGroup({ ...newGroup, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setShowAddGroup(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleAddGroup}
              >
                Create Group
              </button>
            </div>
          </div>
        )}

        {eventData.guestGroups.length > 0 && (
          <div className={styles.groupsList}>
            {eventData.guestGroups.map(group => (
              <div key={group.id} className={styles.groupCard}>
                <div className={styles.groupInfo}>
                  <div 
                    className={styles.groupColor} 
                    style={{ backgroundColor: group.color }}
                  />
                  <span className={styles.groupName}>{group.name}</span>
                  <span className={styles.groupCount}>
                    ({groupStats[group.name] || 0} guest{(groupStats[group.name] || 0) !== 1 ? 's' : ''})
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveGroup(group.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Guest Form */}
      <div className={styles.addGuestSection}>
        <h3 className={styles.subsectionTitle}>Add Guests</h3>
        
        <div className={styles.addGuestForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name *</label>
              <input
                type="text"
                className={styles.formInput}
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email *</label>
              <input
                type="email"
                className={styles.formInput}
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Group (Optional)</label>
              <select
                className={styles.formSelect}
                value={newGuest.group}
                onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })}
              >
                <option value="">No Group</option>
                {eventData.guestGroups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleAddGuest}
          >
            Add Guest
          </button>
        </div>

        <div className={styles.bulkImportSection}>
          <p className={styles.bulkImportText}>
            Have a large guest list? <button className={styles.linkBtn}>Import from CSV</button>
          </p>
        </div>
      </div>

      {/* Guest List */}
      {eventData.guests.length > 0 && (
        <div className={styles.guestListSection}>
          <h3 className={styles.subsectionTitle}>
            Guests ({eventData.guests.length})
          </h3>
          
          <div className={styles.guestList}>
            {eventData.guests.map(guest => (
              <div key={guest.id} className={styles.guestCard}>
                <div className={styles.guestInfo}>
                  <div className={styles.guestName}>{guest.name}</div>
                  <div className={styles.guestEmail}>{guest.email}</div>
                  {guest.group && (
                    <div className={styles.guestGroup}>
                      <span 
                        className={styles.groupBadge}
                        style={{ 
                          backgroundColor: eventData.guestGroups.find(g => g.name === guest.group)?.color || '#7c3aed'
                        }}
                      >
                        {guest.group}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.guestActions}>
                  <span className={styles.rsvpStatus}>
                    {guest.rsvpStatus}
                  </span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveGuest(guest.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Continue to Launch →'}
        </button>
      </div>
    </div>
  )
}

export default GuestListSection