# Bug Fix: WhatsApp Templates Being Erased from Database

## Issue Summary
WhatsApp templates and other event details were being erased from the database when updating events through the POST `/api/events` endpoint.

## Root Cause
**File**: `/frontend/src/app/api/events/route.js`
**Lines**: 836-897 (original code)

The POST endpoint was **overwriting the entire `details` JSONB column** instead of merging with existing data when updating events.

### The Problem
When the `WhatsAppTemplateEditor` component saved templates, it only sent:
- `public_id`
- `title`
- `logo_url`
- `whatsappTemplates`
- `status`

The backend then created a new `details` object with mostly null/default values, **completely replacing** the existing details JSONB column, which contained:
- `location`
- `timezone`
- `event_type`
- `is_private`
- `require_rsvp`
- `allow_plus_ones`
- `rsvp_deadline`
- `whatsapp_templates`

This caused **data loss** for all fields not included in the update request.

## Solution (Following TDD)

### 1. Test-Driven Development Approach

#### Phase 1: Red - Created Failing Tests
- **File**: `__tests__/api/events.details-merge.test.js`
- **File**: `__tests__/api/events.details-merge-integration.test.js`

Tests demonstrated:
- WhatsApp templates being lost when updating other fields
- Other details fields being lost when updating templates
- Explicit null vs undefined handling
- Edge cases with missing details

#### Phase 2: Green - Implemented Fix
**File**: `/frontend/src/app/api/events/route.js`
**Lines**: 848-887

**Key Changes**:
1. **Fetch existing details** when checking for existing events:
   ```javascript
   const { data: existingEvent } = await supabase
     .from("events")
     .select("id, details")  // ✅ Now includes details
     .eq("public_id", eventData.public_id)
     .single();
   ```

2. **Only include explicitly provided fields** in update:
   ```javascript
   let detailsToSave = {};

   if (eventData.location !== undefined) detailsToSave.location = eventData.location;
   if (eventData.timezone !== undefined) detailsToSave.timezone = eventData.timezone;
   // ... only add fields that are provided
   ```

3. **Merge with existing details** for updates:
   ```javascript
   if (existingEvent && !existingEventError && existingEvent.details) {
     detailsToSave = {
       ...(existingEvent.details || {}),  // ✅ Preserve existing
       ...detailsToSave,                   // ✅ Apply updates
     };
   }
   ```

4. **Apply defaults only for new events**:
   ```javascript
   else if (!existingEvent || existingEventError) {
     // For new events, apply defaults
     if (detailsToSave.location === undefined) detailsToSave.location = null;
     // ...
   }
   ```

#### Phase 3: Refactor - Verified Tests Pass
All tests pass successfully:
```
PASS __tests__/api/events.details-merge.test.js (7 tests)
PASS __tests__/api/events.details-merge-integration.test.js (5 tests)
```

## Behavior Before Fix

### Scenario: Update WhatsApp Templates
**Request**:
```json
{
  "public_id": "evt_123",
  "title": "Event Title",
  "whatsappTemplates": [...],
  "status": "draft"
}
```

**Result**: ❌ Lost all details:
- `location`: null (was "123 Main St")
- `timezone`: null (was "America/New_York")
- `event_type`: "event" (was "wedding")
- `require_rsvp`: false (was true)
- All other fields reset to defaults

## Behavior After Fix

### Scenario: Update WhatsApp Templates
**Request**:
```json
{
  "public_id": "evt_123",
  "title": "Event Title",
  "whatsappTemplates": [...],
  "status": "draft"
}
```

**Result**: ✅ Preserves all details:
- `location`: "123 Main St" (preserved)
- `timezone`: "America/New_York" (preserved)
- `event_type`: "wedding" (preserved)
- `require_rsvp`: true (preserved)
- `whatsapp_templates`: [...] (updated)

## Testing

### Test Files Created
1. `__tests__/api/events.details-merge.test.js` - Unit tests for merge logic
2. `__tests__/api/events.details-merge-integration.test.js` - Integration tests

### Test Coverage
- ✅ WhatsApp templates preservation when updating other fields
- ✅ Other details preservation when updating templates
- ✅ Explicit null values vs undefined handling
- ✅ New event creation (no existing details)
- ✅ Edge cases (empty arrays, missing fields)

### Running Tests
```bash
npm test -- __tests__/api/events.details-merge-integration.test.js
```

All 12 tests pass successfully.

## Impact
- **Fixed**: WhatsApp templates no longer get erased when saving
- **Fixed**: Event location, timezone, and other settings preserved on updates
- **Fixed**: All JSONB details fields maintain data integrity
- **No Breaking Changes**: Existing functionality preserved
- **Test Coverage**: Comprehensive tests ensure bug doesn't return

## Files Modified
1. `/frontend/src/app/api/events/route.js` - Fixed POST endpoint merge logic
2. `/frontend/__tests__/api/events.details-merge.test.js` - New test file
3. `/frontend/__tests__/api/events.details-merge-integration.test.js` - New test file

## Recommended Follow-up
Consider switching WhatsAppTemplateEditor to use PATCH endpoint instead of POST, as PATCH already had the correct merge logic implemented (lines 614-629).

## Prevention
To prevent similar issues in the future:
1. Always fetch existing data before updates
2. Use PATCH for partial updates instead of POST
3. Only include explicitly provided fields in update payloads
4. Merge with existing data rather than replacing
5. Write tests that verify data preservation
