# Change Tracking Guide

This guide explains Event Sync's change tracking system, which enables efficient incremental updates by monitoring data changes and generating minimal API payloads.

## Overview

Change tracking is a client-side optimization that:
- Monitors all changes to event data in real-time
- Generates incremental update payloads containing only modified fields
- Reduces API payload sizes by 60-90% for large events
- Provides automatic fallback to full updates when needed
- Prevents data overwrites through conflict detection

## Architecture

### Core Components

1. **useChangeTracking Hook** (`/src/app/create-event/hooks/useChangeTracking.js`)
   - Main change tracking implementation
   - Deep comparison of data structures
   - Incremental payload generation
   - Conflict token management

2. **Integration Layer** (`/src/app/create-event/page.js`)
   - Hooks into existing updateEventData flow
   - Automatic method selection (PATCH vs POST)
   - Fallback handling and user feedback

3. **API Endpoints** (`/src/app/api/events/route.js`)
   - PATCH endpoint for incremental updates
   - Enhanced POST endpoint with compatibility flags
   - Smart merge operations

### Data Flow

```
User Edit → updateEventData() → Change Tracking → Save Trigger → Method Selection → API Call → Response Handling
                   ↓                    ↓              ↓              ↓             ↓
            Update Component    Track Changes    Choose PATCH    Send Changes   Mark Saved
               State          Store Original       or POST       Only         Reset Tracking
```

## Implementation

### Basic Setup

```javascript
import { useChangeTracking } from './hooks/useChangeTracking';

function EventEditor({ initialData }) {
  const [eventData, setEventData] = useState(initialData);
  const changeTracking = useChangeTracking();
  
  // Initialize tracking when data loads
  useEffect(() => {
    if (initialData) {
      changeTracking.initializeTracking(initialData);
    }
  }, [initialData]);
  
  // Update both state and tracking
  const updateEventData = (updates) => {
    setEventData(prev => ({ ...prev, ...updates }));
    changeTracking.updateData(updates);
  };
  
  return (
    <EventForm 
      eventData={eventData} 
      onUpdate={updateEventData}
      hasChanges={changeTracking.hasUnsavedChanges()}
    />
  );
}
```

### Advanced Usage

#### Custom Change Detection
```javascript
// Check specific types of changes
const changes = changeTracking.getChanges();

if (changes?.changes.mainEvent) {
  console.log('Main event changed:', Object.keys(changes.changes.mainEvent));
}

if (changes?.changes.subEvents) {
  const { added, modified, removed } = changes.changes.subEvents;
  console.log(`Sub-events: +${added.length} ~${Object.keys(modified).length} -${removed.length}`);
}
```

#### Performance Monitoring
```javascript
const { reduction, fullSize, incrementalSize, hasChanges } = 
  changeTracking.getPayloadSizeComparison();

if (hasChanges) {
  console.log(`Incremental update will be ${reduction}% smaller`);
  console.log(`${fullSize} → ${incrementalSize} characters`);
}
```

#### Manual Save Operations
```javascript
async function saveChanges() {
  const changes = changeTracking.getChanges();
  
  if (!changes) {
    console.log('No changes to save');
    return;
  }
  
  try {
    await saveIncrementalChanges(changes);
    changeTracking.markAsSaved();
  } catch (error) {
    console.error('Save failed:', error);
    // Handle error or fallback
  }
}
```

## Change Structure

### Change Detection Rules

The system tracks changes at multiple levels:

1. **Main Event Fields**: Title, description, dates, settings
2. **Sub-Events**: Additions, modifications, deletions by ID
3. **Guest Groups**: Similar to sub-events
4. **Guests**: Tracked by public_id for consistency
5. **RSVP Settings**: Field-level changes only
6. **Email Templates**: Template-level changes by ID

### Change Categories

#### Additions
Items without existing IDs or with temporary IDs (negative numbers):
```javascript
{
  added: [
    { title: "New Sub-Event", date: "2024-07-15" }
  ]
}
```

#### Modifications
Items with existing IDs that have changed fields:
```javascript
{
  modified: {
    "1": { title: "Updated Title", location: "New Venue" },
    "3": { startTime: "14:00" }
  }
}
```

#### Removals
IDs that existed in original data but not in current data:
```javascript
{
  removed: [2, 5, 7]
}
```

## Best Practices

### When to Use Change Tracking

✅ **Recommended for:**
- Event editing workflows
- Large events with many guests
- Frequent auto-save operations
- Multi-step form wizards
- Collaborative editing scenarios

❌ **Avoid for:**
- New event creation (first save)
- Simple single-field updates
- One-time data imports
- Read-only displays

### Performance Optimization

#### Memory Management
```javascript
// Clean up change tracking when component unmounts
useEffect(() => {
  return () => {
    changeTracking.markAsSaved(); // Reset tracking
  };
}, []);
```

#### Batch Updates
```javascript
// Batch multiple updates instead of individual calls
const batchUpdates = {
  title: "New Title",
  description: "New Description",
  location: "New Location"
};

updateEventData(batchUpdates); // Single tracking update
```

#### Selective Tracking
```javascript
// Only track specific sections if needed
const changes = changeTracking.getChanges();
const mainEventChanges = changes?.changes.mainEvent;

if (mainEventChanges && Object.keys(mainEventChanges).length > 0) {
  // Only save main event changes
  await savePartialChanges({ mainEvent: mainEventChanges });
}
```

### Data Integrity

#### Deep Merge Handling
```javascript
// Ensure nested objects merge correctly
const updateEventData = (updates) => {
  setEventData(prev => {
    const newData = { ...prev };
    
    // Handle nested objects specially
    if (updates.rsvpSettings) {
      newData.rsvpSettings = {
        ...prev.rsvpSettings,
        ...updates.rsvpSettings
      };
    }
    
    // Apply other updates
    Object.keys(updates).forEach(key => {
      if (key !== 'rsvpSettings') {
        newData[key] = updates[key];
      }
    });
    
    return newData;
  });
  
  changeTracking.updateData(updates);
};
```

#### ID Consistency
```javascript
// Ensure consistent ID handling for arrays
const generateSafeId = () => {
  // Use negative numbers for temporary items
  return -(Date.now() + Math.floor(Math.random() * 1000));
};

const addSubEvent = () => {
  const newSubEvent = {
    id: generateSafeId(), // Temporary ID
    title: "",
    date: ""
  };
  
  updateEventData({
    subEvents: [...eventData.subEvents, newSubEvent]
  });
};
```

## Troubleshooting

### Common Issues

#### Changes Not Detected
```javascript
// Problem: Shallow comparison fails
const badUpdate = eventData.rsvpSettings;
badUpdate.theme = "modern";
updateEventData({ rsvpSettings: badUpdate });

// Solution: Create new object
const goodUpdate = {
  ...eventData.rsvpSettings,
  theme: "modern"
};
updateEventData({ rsvpSettings: goodUpdate });
```

#### Memory Leaks
```javascript
// Problem: Change tracking not cleaned up
// Solution: Reset on unmount
useEffect(() => {
  return () => changeTracking.markAsSaved();
}, []);
```

#### Payload Size Issues
```javascript
// Monitor payload sizes in development
const debugInfo = changeTracking.getDebugInfo();
console.log('Change tracking status:', debugInfo);

if (debugInfo.payloadComparison.reduction < 50) {
  console.warn('Low payload reduction - consider full update');
}
```

### Debug Tools

#### Change Inspection
```javascript
// Get detailed change information
const changes = changeTracking.getChanges();
console.log('Raw changes:', JSON.stringify(changes, null, 2));

// Check what's being tracked
const debugInfo = changeTracking.getDebugInfo();
console.table(debugInfo);
```

#### Performance Monitoring
```javascript
// Track save operations
const startTime = performance.now();
await saveIncrementalChanges(changes);
const endTime = performance.now();
console.log(`Save completed in ${endTime - startTime}ms`);
```

## Migration Guide

### From Full Updates
```javascript
// Before: Full update every time
const saveEvent = async () => {
  await fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

// After: Incremental updates with fallback
const saveEvent = async () => {
  const changes = changeTracking.getChanges();
  
  if (changes && isEditMode) {
    try {
      await fetch('/api/events', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      changeTracking.markAsSaved();
    } catch (error) {
      // Fallback to full update
      await fetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
    }
  } else {
    await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }
};
```

### Gradual Adoption
1. **Phase 1**: Add change tracking to existing components
2. **Phase 2**: Implement incremental save functions
3. **Phase 3**: Add fallback mechanisms
4. **Phase 4**: Enable by default with opt-out option
5. **Phase 5**: Remove opt-out once stable

## References

- [useChangeTracking Hook API](../hooks/useChangeTracking.js)
- [PATCH API Endpoint Documentation](../endpoints/events.md#patch-apievents)
- [Request/Response Schemas](../schemas/request-response-schemas.md)
- [Code Examples](../examples/code-examples.md#change-tracking-and-incremental-updates)