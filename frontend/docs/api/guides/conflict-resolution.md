# Conflict Resolution Guide

This guide covers how Event Sync handles conflicts that arise when multiple users edit the same event simultaneously, and how to implement robust conflict resolution in your application.

## Overview

Conflict resolution in Event Sync prevents data loss when:
- Multiple users edit the same event simultaneously
- Network issues cause delayed saves
- Browser tabs with the same event get out of sync
- External systems modify event data

The system uses **conflict tokens** and **timestamp comparison** to detect conflicts and provide resolution options.

## Conflict Detection Mechanism

### Conflict Tokens

Each event maintains a conflict token - a hash of the event's current state:

```javascript
// Generated when event is loaded or saved
const conflictToken = btoa(JSON.stringify(eventData)).slice(0, 16);
```

When saving changes, the client sends its conflict token. The server compares this with the current server-side token:

```javascript
// Client saves with token from when data was loaded
const savePayload = {
  ...changes,
  conflictToken: "abc123def456"  // From when event was loaded
};

// Server has newer token "xyz789uvw012" 
// → Conflict detected!
```

### Conflict Scenarios

1. **Concurrent Edits**: Two users modify the event simultaneously
2. **Stale Data**: User loads event, server data changes, user tries to save
3. **Network Issues**: Save fails, retry with outdated conflict token
4. **Browser Tab Sync**: Multiple tabs editing same event

## Implementation

### Basic Conflict Detection

```javascript
import { useChangeTracking } from './hooks/useChangeTracking';

async function saveWithConflictDetection(eventData, changeTracking) {
  const changes = changeTracking.getChanges();
  
  if (!changes) return;
  
  try {
    const response = await fetch('/api/events', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...changes.changes,
        public_id: eventData.public_id,
        conflictToken: changes.metadata.conflictToken
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      if (error.conflictDetected) {
        return handleConflict(error, eventData, changes);
      }
      throw new Error(error.message);
    }
    
    const result = await response.json();
    changeTracking.markAsSaved();
    return result;
    
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
}
```

### Conflict Response Structure

When a conflict is detected, the server returns:

```javascript
{
  success: false,
  conflictDetected: true,
  serverVersion: "xyz789uvw012",      // Current server conflict token
  clientVersion: "abc123def456",      // Client's outdated token
  lastModified: "2024-01-15T14:30:00Z", // When server version was last updated
  conflictingFields: [                // Fields that have conflicts
    "title",
    "subEvents.1.location",
    "guests.uuid-123.name"
  ],
  message: "Event was modified by another user",
  resolution: {
    autoMerge: false,                 // Whether conflicts can be auto-merged
    suggestions: [                    // Suggested resolutions
      {
        field: "title",
        serverValue: "Updated Wedding",
        clientValue: "Sarah's Wedding",
        recommendation: "manual_merge"
      }
    ]
  }
}
```

## Conflict Resolution Strategies

### 1. Manual Resolution (Recommended)

Present conflicts to the user for manual resolution:

```javascript
async function handleConflict(conflictError, currentData, pendingChanges) {
  const resolution = await showConflictDialog({
    conflicts: conflictError.resolution.suggestions,
    serverModified: conflictError.lastModified,
    conflictingFields: conflictError.conflictingFields
  });
  
  switch (resolution.action) {
    case 'keep_client':
      // Force save client changes
      return forceSaveChanges(currentData, pendingChanges);
      
    case 'keep_server':
      // Discard client changes and reload server data
      return reloadServerData(currentData.public_id);
      
    case 'merge_manual':
      // User manually merged - save resolved data
      return saveResolvedData(resolution.mergedData);
      
    case 'cancel':
      // User chose to cancel - no action
      return null;
  }
}
```

### 2. Automatic Merge

For non-conflicting changes, attempt automatic merge:

```javascript
function attemptAutoMerge(clientChanges, serverData, conflictInfo) {
  const merged = { ...serverData };
  const conflicts = [];
  
  // Only merge non-conflicting fields
  Object.entries(clientChanges).forEach(([section, changes]) => {
    if (!conflictInfo.conflictingFields.some(field => field.startsWith(section))) {
      // No conflicts in this section - safe to merge
      merged[section] = applyChangesToSection(merged[section], changes);
    } else {
      // Has conflicts - require manual resolution
      conflicts.push({ section, changes });
    }
  });
  
  return {
    canAutoMerge: conflicts.length === 0,
    mergedData: merged,
    remainingConflicts: conflicts
  };
}
```

### 3. Last-Writer-Wins

Simple but data-loss prone strategy:

```javascript
async function forceOverwrite(eventData, changes) {
  // Force save without conflict checking
  const response = await fetch('/api/events', {
    method: 'POST', // Use POST to force overwrite
    body: JSON.stringify({
      ...eventData,
      forceOverwrite: true
    })
  });
  
  console.warn('Forced overwrite - potential data loss!');
  return response.json();
}
```

## User Experience Patterns

### Conflict Dialog Component

```javascript
function ConflictResolutionDialog({ conflicts, onResolve, onCancel }) {
  const [resolution, setResolution] = useState({});
  
  return (
    <div className="conflict-dialog">
      <h2>Conflict Detected</h2>
      <p>The event was modified by another user. Please resolve conflicts:</p>
      
      {conflicts.map((conflict, index) => (
        <div key={index} className="conflict-item">
          <h3>{conflict.field}</h3>
          
          <div className="conflict-options">
            <label>
              <input
                type="radio"
                name={`conflict-${index}`}
                value="server"
                onChange={(e) => setResolution({
                  ...resolution,
                  [conflict.field]: e.target.value
                })}
              />
              Keep server version: "{conflict.serverValue}"
            </label>
            
            <label>
              <input
                type="radio"
                name={`conflict-${index}`}
                value="client"
                onChange={(e) => setResolution({
                  ...resolution,
                  [conflict.field]: e.target.value
                })}
              />
              Keep your version: "{conflict.clientValue}"
            </label>
            
            <label>
              <input
                type="radio"
                name={`conflict-${index}`}
                value="custom"
                onChange={(e) => setResolution({
                  ...resolution,
                  [conflict.field]: e.target.value
                })}
              />
              Custom:
              <input
                type="text"
                placeholder="Enter custom value"
                onChange={(e) => setResolution({
                  ...resolution,
                  [`${conflict.field}_custom`]: e.target.value
                })}
              />
            </label>
          </div>
        </div>
      ))}
      
      <div className="dialog-actions">
        <button onClick={() => onResolve(resolution)}>
          Resolve Conflicts
        </button>
        <button onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

### Real-time Conflict Prevention

Prevent conflicts by showing real-time editing status:

```javascript
function EventEditor({ eventData }) {
  const [activeEditors, setActiveEditors] = useState([]);
  const [lastServerUpdate, setLastServerUpdate] = useState(null);
  
  // Poll for server changes
  useEffect(() => {
    const interval = setInterval(async () => {
      const serverInfo = await checkServerVersion(eventData.public_id);
      
      if (serverInfo.conflictToken !== changeTracking.conflictToken) {
        setLastServerUpdate(serverInfo.lastModified);
        // Optionally show warning or auto-reload
      }
      
      setActiveEditors(serverInfo.activeEditors);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [eventData.public_id]);
  
  return (
    <div className="event-editor">
      {activeEditors.length > 1 && (
        <div className="collaboration-warning">
          ⚠️ {activeEditors.length - 1} other user(s) are editing this event
        </div>
      )}
      
      {lastServerUpdate && (
        <div className="server-update-warning">
          ℹ️ Event was updated on server at {formatTime(lastServerUpdate)}
          <button onClick={reloadFromServer}>Refresh</button>
        </div>
      )}
      
      <EventForm data={eventData} />
    </div>
  );
}
```

## Advanced Conflict Resolution

### Field-Level Granularity

Instead of resolving entire objects, resolve individual fields:

```javascript
function resolveFieldConflicts(conflicts, userChoices) {
  const resolved = {};
  
  conflicts.forEach((conflict, index) => {
    const choice = userChoices[conflict.field];
    
    switch (choice) {
      case 'server':
        resolved[conflict.field] = conflict.serverValue;
        break;
      case 'client':
        resolved[conflict.field] = conflict.clientValue;
        break;
      case 'custom':
        resolved[conflict.field] = userChoices[`${conflict.field}_custom`];
        break;
      default:
        // Default to server value if no choice made
        resolved[conflict.field] = conflict.serverValue;
    }
  });
  
  return resolved;
}
```

### Three-Way Merge

For complex objects, implement three-way merge:

```javascript
function threeWayMerge(original, client, server) {
  const merged = { ...original };
  
  // Apply server changes first
  Object.keys(server).forEach(key => {
    if (server[key] !== original[key]) {
      merged[key] = server[key];
    }
  });
  
  // Apply client changes that don't conflict
  Object.keys(client).forEach(key => {
    if (client[key] !== original[key]) {
      if (server[key] === original[key]) {
        // Server didn't change this field - safe to apply client change
        merged[key] = client[key];
      } else {
        // Conflict - both client and server changed this field
        throw new ConflictError(`Conflict in field: ${key}`);
      }
    }
  });
  
  return merged;
}
```

### Operational Transforms

For real-time collaboration, consider operational transforms:

```javascript
function transformOperation(operation, otherOperations) {
  // Transform client operation against concurrent server operations
  let transformed = operation;
  
  otherOperations.forEach(otherOp => {
    transformed = transformAgainst(transformed, otherOp);
  });
  
  return transformed;
}

function transformAgainst(op1, op2) {
  // Implement operation transformation logic
  // This is complex and depends on operation types
  
  if (op1.type === 'insert' && op2.type === 'insert') {
    // Both operations insert at same position
    if (op1.position <= op2.position) {
      op2.position += op1.length;
    }
  }
  
  // ... handle other operation type combinations
  
  return op2;
}
```

## Testing Conflict Resolution

### Simulating Conflicts

```javascript
// Test utility to simulate conflicts
async function simulateConflict(eventData, conflictingChanges) {
  // Save conflicting changes directly to server
  await updateEventDirectly(eventData.public_id, conflictingChanges);
  
  // Now try to save client changes - should trigger conflict
  const clientChanges = {
    title: "Client Title",
    description: "Client Description"
  };
  
  try {
    await saveIncrementalChanges(clientChanges);
    throw new Error('Expected conflict but none occurred');
  } catch (error) {
    if (!error.conflictDetected) {
      throw error;
    }
    
    console.log('✓ Conflict successfully detected');
    return error;
  }
}
```

### Unit Tests

```javascript
describe('Conflict Resolution', () => {
  test('detects conflicts correctly', async () => {
    const conflict = await simulateConflict(testEvent, {
      title: 'Server Title'
    });
    
    expect(conflict.conflictDetected).toBe(true);
    expect(conflict.conflictingFields).toContain('title');
  });
  
  test('resolves conflicts manually', async () => {
    const conflict = await simulateConflict(testEvent, {
      title: 'Server Title'
    });
    
    const resolution = {
      title: 'Merged Title'
    };
    
    const result = await resolveConflictManually(conflict, resolution);
    expect(result.success).toBe(true);
  });
  
  test('auto-merges non-conflicting changes', async () => {
    const result = await attemptAutoMerge(
      { description: 'Client Description' },  // Client changes
      { title: 'Server Title' },             // Server changes
      { conflictingFields: ['title'] }        // Only title conflicts
    );
    
    expect(result.canAutoMerge).toBe(false); // Description is safe
    expect(result.mergedData.description).toBe('Client Description');
    expect(result.mergedData.title).toBe('Server Title');
  });
});
```

## Best Practices

### 1. Proactive Conflict Prevention
- Check for server updates before saving
- Show warnings when other users are editing
- Implement auto-save with short intervals
- Use optimistic UI updates

### 2. User-Friendly Resolution
- Clearly explain what conflicts mean
- Show timestamps of conflicting changes
- Provide preview of resolution results
- Allow users to cancel and try again

### 3. Data Safety
- Always preserve user's work in local storage
- Provide "export changes" option before resolving
- Log all conflict resolutions for debugging
- Never auto-resolve destructive conflicts

### 4. Performance Considerations
- Only check for conflicts on save, not every keystroke
- Cache conflict tokens to avoid unnecessary checks
- Use efficient diff algorithms for large objects
- Limit real-time polling frequency

## References

- [Change Tracking Guide](./change-tracking.md)
- [Events API Documentation](../endpoints/events.md)
- [Request/Response Schemas](../schemas/request-response-schemas.md)
- [Error Handling Patterns](../examples/code-examples.md#error-handling-patterns)