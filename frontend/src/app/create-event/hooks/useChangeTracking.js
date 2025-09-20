import { useState, useCallback, useRef } from 'react';

/**
 * Deep equality comparison function (replaces lodash isEqual)
 */
const isEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  
  return true;
};

/**
 * Deep clone function (replaces lodash cloneDeep)
 */
const cloneDeep = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => cloneDeep(item));
  
  const cloned = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = cloneDeep(obj[key]);
    }
  }
  return cloned;
};

/**
 * Hook for tracking changes to event data and generating incremental updates
 * 
 * Features:
 * - Deep comparison of data changes
 * - Tracks additions, modifications, and deletions
 * - Generates minimal update payloads
 * - Handles conflict detection
 * - Reset tracking after successful saves
 * 
 * @param {Object} initialData - The initial/original event data
 * @returns {Object} Change tracking utilities
 */
export const useChangeTracking = (initialData = null) => {
  const [originalData, setOriginalData] = useState(initialData ? cloneDeep(initialData) : null);
  const [currentData, setCurrentData] = useState(initialData ? cloneDeep(initialData) : null);
  const [lastSaved, setLastSaved] = useState(null);
  const conflictToken = useRef(null);

  /**
   * Initialize or reset change tracking with new data
   */
  const initializeTracking = useCallback((data) => {
    const clonedData = cloneDeep(data);
    setOriginalData(clonedData);
    setCurrentData(clonedData);
    setLastSaved(new Date().toISOString());
    conflictToken.current = generateConflictToken(clonedData);
  }, []);

  /**
   * Update current data and track changes
   */
  const updateData = useCallback((updates) => {
    setCurrentData(prev => {
      const newData = { ...prev };
      
      // Handle nested updates (like rsvpSettings)
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          newData[key] = {
            ...prev[key],
            ...updates[key]
          };
        } else {
          newData[key] = updates[key];
        }
      });
      
      return newData;
    });
  }, []);

  /**
   * Generate a simple conflict token based on data hash
   */
  const generateConflictToken = (data) => {
    return btoa(JSON.stringify(data)).slice(0, 16);
  };

  /**
   * Deep compare arrays and track changes
   */
  const compareArrays = (original, current, idField = 'id') => {
    const changes = {
      added: [],
      modified: {},
      removed: []
    };

    if (!original || !current) {
      return changes;
    }

    // Create maps for efficient lookup
    const originalMap = new Map();
    const currentMap = new Map();

    original.forEach(item => {
      if (item[idField]) {
        originalMap.set(item[idField], item);
      }
    });

    current.forEach(item => {
      if (item[idField]) {
        currentMap.set(item[idField], item);
      }
    });

    // Find added and modified items
    current.forEach(item => {
      if (!item[idField] || item[idField] < 0) {
        // New item (no ID or negative ID for temporary items)
        changes.added.push(item);
      } else if (originalMap.has(item[idField])) {
        // Existing item - check for modifications
        const originalItem = originalMap.get(item[idField]);
        if (!isEqual(originalItem, item)) {
          changes.modified[item[idField]] = item;
        }
      } else {
        // Item with ID but not in original - treat as added
        changes.added.push(item);
      }
    });

    // Find removed items
    original.forEach(item => {
      if (item[idField] && !currentMap.has(item[idField])) {
        changes.removed.push(item[idField]);
      }
    });

    return changes;
  };

  /**
   * Generate incremental changes payload
   */
  const getChanges = useCallback(() => {
    if (!originalData || !currentData) {
      return null;
    }

    const changes = {};
    let hasChanges = false;

    // Compare main event fields
    const mainEventFields = [
      'title', 'description', 'location', 'startDate', 'endDate', 
      'logo_url', 'maxGuests', 'eventType', 'isPrivate', 'requireRSVP', 
      'allowPlusOnes', 'rsvpDeadline', 'timezone'
    ];

    const mainEventChanges = {};
    mainEventFields.forEach(field => {
      if (!isEqual(originalData[field], currentData[field])) {
        mainEventChanges[field] = currentData[field];
        hasChanges = true;
      }
    });

    if (Object.keys(mainEventChanges).length > 0) {
      changes.mainEvent = mainEventChanges;
    }

    // Compare sub-events
    const subEventChanges = compareArrays(originalData.subEvents, currentData.subEvents, 'id');
    if (subEventChanges.added.length > 0 || 
        Object.keys(subEventChanges.modified).length > 0 || 
        subEventChanges.removed.length > 0) {
      changes.subEvents = subEventChanges;
      hasChanges = true;
    }

    // Compare guest groups
    const guestGroupChanges = compareArrays(originalData.guestGroups, currentData.guestGroups, 'id');
    if (guestGroupChanges.added.length > 0 || 
        Object.keys(guestGroupChanges.modified).length > 0 || 
        guestGroupChanges.removed.length > 0) {
      changes.guestGroups = guestGroupChanges;
      hasChanges = true;
    }

    // Compare guests (use public_id as primary identifier)
    const guestChanges = compareArrays(originalData.guests, currentData.guests, 'public_id');
    if (guestChanges.added.length > 0 || 
        Object.keys(guestChanges.modified).length > 0 || 
        guestChanges.removed.length > 0) {
      changes.guests = guestChanges;
      hasChanges = true;
    }

    // Compare RSVP settings
    if (!isEqual(originalData.rsvpSettings, currentData.rsvpSettings)) {
      const rsvpChanges = {};
      if (originalData.rsvpSettings && currentData.rsvpSettings) {
        Object.keys(currentData.rsvpSettings).forEach(key => {
          if (!isEqual(originalData.rsvpSettings[key], currentData.rsvpSettings[key])) {
            rsvpChanges[key] = currentData.rsvpSettings[key];
          }
        });
      } else {
        // Handle case where rsvpSettings is entirely new or removed
        Object.assign(rsvpChanges, currentData.rsvpSettings);
      }
      
      if (Object.keys(rsvpChanges).length > 0) {
        changes.rsvpSettings = rsvpChanges;
        hasChanges = true;
      }
    }

    // Compare email templates
    const templateChanges = compareArrays(originalData.emailTemplates, currentData.emailTemplates, 'id');
    if (templateChanges.added.length > 0 || 
        Object.keys(templateChanges.modified).length > 0 || 
        templateChanges.removed.length > 0) {
      changes.emailTemplates = templateChanges;
      hasChanges = true;
    }

    return hasChanges ? {
      changes,
      metadata: {
        lastSaved,
        conflictToken: conflictToken.current,
        timestamp: new Date().toISOString()
      }
    } : null;
  }, [originalData, currentData, lastSaved]);

  /**
   * Get the full current data (for fallback to full updates)
   */
  const getFullData = useCallback(() => {
    return currentData;
  }, [currentData]);

  /**
   * Check if there are any unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return !isEqual(originalData, currentData);
  }, [originalData, currentData]);

  /**
   * Reset tracking after successful save
   */
  const markAsSaved = useCallback(() => {
    if (currentData) {
      const clonedData = cloneDeep(currentData);
      setOriginalData(clonedData);
      setLastSaved(new Date().toISOString());
      conflictToken.current = generateConflictToken(clonedData);
    }
  }, [currentData]);

  /**
   * Calculate estimated payload size reduction
   */
  const getPayloadSizeComparison = useCallback(() => {
    const fullPayload = JSON.stringify(currentData || {});
    const changes = getChanges();
    const incrementalPayload = JSON.stringify(changes || {});
    
    return {
      fullSize: fullPayload.length,
      incrementalSize: incrementalPayload.length,
      reduction: changes ? Math.round((1 - incrementalPayload.length / fullPayload.length) * 100) : 0,
      hasChanges: !!changes
    };
  }, [currentData, getChanges]);

  /**
   * Get debug information for troubleshooting
   */
  const getDebugInfo = useCallback(() => {
    return {
      hasOriginalData: !!originalData,
      hasCurrentData: !!currentData,
      hasUnsavedChanges: hasUnsavedChanges(),
      lastSaved,
      conflictToken: conflictToken.current,
      payloadComparison: getPayloadSizeComparison()
    };
  }, [originalData, currentData, hasUnsavedChanges, lastSaved, getPayloadSizeComparison]);

  return {
    // Data management
    originalData,
    currentData,
    initializeTracking,
    updateData,
    
    // Change detection
    getChanges,
    getFullData,
    hasUnsavedChanges,
    markAsSaved,
    
    // Utilities
    getPayloadSizeComparison,
    getDebugInfo,
    
    // Metadata
    lastSaved,
    conflictToken: conflictToken.current
  };
};

export default useChangeTracking;