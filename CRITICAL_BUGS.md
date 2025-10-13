# Critical Bugs & Issues Report
**Event-Sync Production Readiness Assessment**
**Generated:** October 12, 2025
**Branch:** feature/dot_net_backend
**Deployment Target:** Vercel (Frontend + Supabase Backend)

---

## Executive Summary

This document outlines critical bugs and issues discovered during a comprehensive codebase evaluation. The application is **NOT production-ready** in its current state. Two critical bugs (#1 and #2) will cause immediate user-facing failures and must be fixed before any production deployment.

**Overall Status:** 🔴 **BLOCKED FOR PRODUCTION**

---

## 🔴 CRITICAL PRIORITY BUGS (Production-Breaking)

### Bug #1: Broken Authentication Redirect in Portal
**Severity:** CRITICAL 🚨
**Status:** BLOCKING PRODUCTION
**Impact:** Portal completely inaccessible to authenticated users

**Details:**
- **Location:** `frontend/src/app/[eventID]/portal/page.js:109`
- **Issue:** Redirects to `/login` route which doesn't exist (actual route is `/signIn`)
- **Code:**
  ```javascript
  if (!session) {
    router.push("/login"); // ❌ WRONG - route doesn't exist
    return;
  }
  ```
- **Expected:** `router.push("/signIn");`
- **Affected Users:** 100% of users trying to access event management portal
- **User Experience:** Users see 404 page instead of sign-in, cannot manage events
- **Reproduction:**
  1. Sign out of application
  2. Navigate to any `/{eventID}/portal` URL
  3. Observe 404 error instead of redirect to sign-in

**Fix:**
```javascript
if (!session) {
  router.push("/signIn"); // ✅ CORRECT
  return;
}
```

**Estimated Fix Time:** 1 minute
**Testing Required:** Manual test portal access flow

---

### Bug #2: Button Click Handler Invoked Immediately
**Severity:** HIGH 🔴
**Status:** BLOCKING PRODUCTION
**Impact:** Function executes on render instead of click, causes unexpected behavior

**Details:**
- **Location:** `frontend/src/app/[eventID]/portal/page.js:262`
- **Issue:** `onClick` handler has parentheses, executing function immediately on render
- **Code:**
  ```javascript
  <button
    onClick={handleCustomizeRSVP()} // ❌ EXECUTES IMMEDIATELY
    className={styles.btnOutline}
  >
    <MdPalette size={18} /> Customize RSVP
  </button>
  ```
- **Expected:** `onClick={handleCustomizeRSVP}` (no parentheses)
- **Affected Users:** All users with event edit permissions
- **User Experience:** Unexpected function execution, potential crashes/errors
- **Side Effects:** Currently function is empty (commented out), but will break when implemented

**Fix:**
```javascript
<button
  onClick={handleCustomizeRSVP} // ✅ CORRECT
  className={styles.btnOutline}
>
```

**Estimated Fix Time:** 1 minute
**Testing Required:** Verify button click behavior

---

## 🟠 HIGH PRIORITY BUGS (Critical Functional Issues)

### Bug #3: React Hook Dependency Warnings
**Severity:** HIGH
**Status:** NEEDS FIX
**Impact:** Stale closures, infinite loops, missing reactive updates

**Details:**
Multiple components have missing dependencies in `useEffect` hooks, causing:
- Stale closure bugs (functions reference old values)
- Missing updates when dependencies change
- Potential infinite render loops

**Affected Files:**

1. **EmailTemplateEditor.jsx:62**
   - Missing: `event.title`, `toast`
   - Risk: Toast notifications may fail, event title updates ignored

2. **GuestForm.js:43**
   - Missing: `loadFormData`
   - Risk: Form data not reloaded when it should be

3. **ManageTeam.jsx:217**
   - Missing: `handleCollaboratorChange`
   - Risk: Collaborator changes not reflected properly

4. **emailPortal.js:170**
   - Missing: `event`
   - Risk: Email portal doesn't update when event changes

5. **dashboard/page.js:317**
   - Missing: `handleCollaborationChange`, `user`
   - Risk: Real-time collaboration updates fail

**Fix Strategy:**
1. Add missing dependencies OR
2. Move function definitions inside useEffect OR
3. Wrap functions in useCallback with proper dependencies

**Estimated Fix Time:** 2-4 hours (requires careful testing)
**Testing Required:** Full regression test of affected components

---

### Bug #4: Dashboard Real-Time Subscription Memory Leak
**Severity:** HIGH
**Status:** NEEDS FIX
**Impact:** Memory leaks, performance degradation over time

**Details:**
- **Location:** `frontend/src/app/dashboard/page.js:293-317`
- **Issue:** Real-time subscription cleanup references function not in dependencies
- **Code:**
  ```javascript
  useEffect(() => {
    const collaborationSubscription = supabase
      .channel('collaboration_updates')
      .on('postgres_changes', { /* ... */ }, (payload) => {
        handleCollaborationChange(payload); // Uses function
      })
      .subscribe();

    return () => {
      collaborationSubscription.unsubscribe();
    };
  }, [userProfile?.id, supabase]); // ❌ Missing handleCollaborationChange
  ```
- **Consequence:** Function captures stale closure, subscription may not clean up properly
- **Affected Users:** All dashboard users, especially long sessions
- **Symptoms:** Increased memory usage, duplicate notifications, stale data

**Fix:**
```javascript
const handleCollaborationChange = useCallback((payload) => {
  // ... implementation
}, [/* proper dependencies */]);

useEffect(() => {
  // ... subscription setup
}, [userProfile?.id, supabase, handleCollaborationChange]);
```

**Estimated Fix Time:** 1 hour
**Testing Required:** Long-running session test, memory profiling

---

### Bug #5: Non-Functional Settings Forms
**Severity:** HIGH
**Status:** INCOMPLETE FEATURE
**Impact:** Users cannot modify account settings

**Details:**
- **Location:** `frontend/src/app/dashboard/page.js:947-1033`
- **Issue:** All settings functionality is stubbed out, buttons do nothing
- **Affected Features:**
  1. **Update Profile (line 979):** Button has no onClick handler
  2. **Update Password (line 1001):** Button has no onClick handler
  3. **Save Preferences (line 1029):** Button has no onClick handler
  4. Profile inputs are read-only
  5. No backend API calls implemented

**Code Example:**
```javascript
<button className={styles.btnPrimary}>Update Profile</button>
// ❌ No onClick handler, no functionality
```

**Affected Users:** All users trying to update settings
**User Experience:** Buttons appear clickable but do nothing (bad UX)

**Fix Required:**
1. Implement profile update API endpoint
2. Implement password change functionality
3. Implement notification preference save
4. Add form validation
5. Add success/error handling

**Estimated Fix Time:** 8-16 hours
**Testing Required:** Full settings CRUD testing

---

### Bug #6: Empty handleCustomizeRSVP Function
**Severity:** MEDIUM-HIGH
**Status:** INCOMPLETE FEATURE
**Impact:** Users cannot customize RSVP pages despite button being visible

**Details:**
- **Location:** `frontend/src/app/[eventID]/portal/page.js:153-155`
- **Code:**
  ```javascript
  const handleCustomizeRSVP = () => {
    //router.push(`/create-event?edit=${event.id}`)
  };
  ```
- **Issue:** Function implementation is commented out, button is visible but non-functional
- **Affected Users:** Event owners with edit permissions
- **User Experience:** Button appears functional but clicking does nothing

**Fix Options:**
1. Uncomment and implement the navigation
2. Hide the button until feature is ready
3. Show "Coming Soon" message

**Estimated Fix Time:** 2-4 hours (if feature exists) OR 1 minute (hide button)
**Testing Required:** Test RSVP customization flow

---

## 🟡 MEDIUM PRIORITY BUGS (Feature Gaps)

### Bug #7: Notification Filtering Not Implemented
**Severity:** MEDIUM
**Location:** `frontend/src/app/dashboard/page.js:1054`
**Impact:** Users cannot filter notifications by type

**Code:**
```javascript
<select
  className={styles.filterSelect}
  onChange={(e) => {/* TODO: Filter notifications */}}
>
  <option value="all">All Notifications</option>
  <option value="invitations">Collaboration Invitations</option>
  <option value="updates">Updates</option>
  <option value="system">System Messages</option>
</select>
```

**Fix Required:** Implement filter logic to update notification display

**Estimated Fix Time:** 2 hours

---

### Bug #8: Missing Incremental Guest Management
**Severity:** MEDIUM
**Location:** `frontend/src/app/api/events/route.js:661`
**Impact:** Poor performance when updating large guest lists

**Code:**
```javascript
// TODO: Implement proper incremental guest management
// Currently replaces entire guest list instead of updating changes
```

**Issue:** Full replacement causes unnecessary database operations and slow updates

**Fix Required:** Implement differential updates (add/update/delete only changed guests)

**Estimated Fix Time:** 8-12 hours
**Performance Gain:** Significant for events with 100+ guests

---

### Bug #9: Handlebars Webpack Warning
**Severity:** MEDIUM
**Location:** Build output for email reminder routes
**Impact:** Potential production build issues, increased bundle size

**Warning:**
```
./node_modules/handlebars/lib/index.js
require.extensions is not supported by webpack. Use a loader instead.
```

**Affected Files:**
- `src/app/api/[eventID]/sendReminder/route.js`
- Other email template routes using Handlebars

**Fix Required:** Configure proper Handlebars loader for webpack/Next.js

**Estimated Fix Time:** 2-4 hours
**References:** https://nextjs.org/docs/app/building-your-application/configuring/webpack

---

## 🟢 LOW PRIORITY BUGS (Performance/UX)

### Bug #10: Image Optimization Not Used
**Severity:** LOW
**Locations:** Multiple components
**Impact:** Slower page loads, higher bandwidth costs

**Affected Files:**
- `EmailTemplateEditor.jsx:316, 840`
- `EmailTemplateCreator.jsx:266`

**Issue:** Using `<img>` tags instead of Next.js `<Image />` component

**Fix:** Replace with `next/image` for automatic optimization

**Estimated Fix Time:** 2 hours
**Performance Gain:** 30-50% faster image loads

---

### Bug #11: Excessive Console Logging
**Severity:** LOW
**Impact:** Performance overhead, security risk (exposes data in browser console)

**Stats:**
- **248 console.error/console.warn statements** across **38 files**
- Production builds should remove or gate these logs

**Security Concern:** May expose sensitive data (user IDs, event details) in browser console

**Fix Required:**
1. Create logger utility with environment checks
2. Remove sensitive data from logs
3. Gate logs behind `process.env.NODE_ENV !== 'production'`

**Estimated Fix Time:** 4-6 hours

---

### Bug #12: Sub-Event Image Upload Not Implemented
**Severity:** LOW
**Location:** `frontend/src/app/api/upload/route.js:183, 215`
**Impact:** Cannot upload images for sub-events

**Code:**
```javascript
subevent_id: null, // TODO: Add subevent_id parameter for sub-event images
```

**Fix Required:** Implement sub-event image upload functionality

**Estimated Fix Time:** 4-6 hours

---

## 🧪 TESTING ISSUES

### Issue #13: Failing Test - Email Template Categories
**Location:** `__tests__/api/events.email-templates.test.js:107`
**Status:** FAILING

**Error:**
```
Expected: "email_template_categories"
Received:
  1: "users"
  2: "events"
  3: "events"
Number of calls: 3
```

**Issue:** Mock expectations don't match actual implementation order

**Impact:** False confidence in email template functionality

**Fix Required:** Update test mocks to match actual API call order

**Estimated Fix Time:** 30 minutes

---

## Fix Priority Roadmap

### Phase 1: IMMEDIATE (Before Any Deployment)
**Timeline:** 1-2 hours
- [ ] Bug #1: Fix `/login` → `/signIn` redirect
- [ ] Bug #2: Fix `handleCustomizeRSVP()` invocation

**Blocker Status:** These MUST be fixed for production

---

### Phase 2: THIS WEEK (Critical Functionality)
**Timeline:** 2-3 days
- [ ] Bug #3: Fix all React Hook dependency warnings (6 components)
- [ ] Bug #4: Fix dashboard real-time subscription memory leak
- [ ] Bug #6: Hide or implement Customize RSVP functionality
- [ ] Issue #13: Fix failing test

**Impact:** Improves stability and reliability

---

### Phase 3: THIS MONTH (Feature Completion)
**Timeline:** 1-2 weeks
- [ ] Bug #5: Implement settings forms functionality
- [ ] Bug #7: Implement notification filtering
- [ ] Bug #8: Implement incremental guest management
- [ ] Bug #9: Fix Handlebars webpack warning

**Impact:** Completes core features

---

### Phase 4: BACKLOG (Polish & Optimization)
**Timeline:** As time permits
- [ ] Bug #10: Implement image optimization
- [ ] Bug #11: Reduce console logging
- [ ] Bug #12: Implement sub-event image uploads

**Impact:** Performance and UX improvements

---

## Risk Assessment

### Production Deployment Risk: 🔴 HIGH

**Blockers:**
1. Portal access completely broken (Bug #1)
2. Potential crashes from immediate function execution (Bug #2)

**High-Risk Issues:**
3. Memory leaks in long-running sessions (Bug #4)
4. Stale data from React Hook issues (Bug #3)
5. Non-functional user settings (Bug #5)

**Recommendation:** **DO NOT DEPLOY** until Phase 1 and Phase 2 are complete.

---

## Testing Recommendations

### Manual Testing Checklist (Before Production)
- [ ] Sign in/out flow
- [ ] Portal access for authenticated users
- [ ] Event creation and management
- [ ] Guest list management
- [ ] Email sending functionality
- [ ] Dashboard collaboration features
- [ ] Real-time updates
- [ ] Settings page (all forms)
- [ ] Long-running session (>1 hour)

### Automated Testing Gaps
- No E2E tests for critical user flows
- Only 1 failing unit test (should be fixed)
- No integration tests for Supabase interactions
- No performance/load testing

**Recommendation:** Add Playwright/Cypress E2E tests for critical paths

---

## Environment Configuration Notes

### Current Setup
- **Frontend:** Next.js 14 on Vercel
- **Backend:** Supabase (PostgreSQL + Auth)
- **Email:** SendGrid
- **.NET Backend:** Not in production, not fully developed

### Production Readiness Checklist
- [ ] Environment variables properly configured
- [ ] Error tracking (Sentry/Datadog) installed
- [ ] Rate limiting configured
- [ ] CORS policies set for production domain
- [ ] Supabase RLS policies reviewed
- [ ] SendGrid sending limits verified
- [ ] Backup strategy defined
- [ ] Monitoring/alerting configured

---

## Contact & Escalation

**For Questions:** Review with development team
**For Urgent Issues:** Escalate bugs #1 and #2 immediately

**Document Version:** 1.0
**Last Updated:** October 12, 2025
