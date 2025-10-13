# API Migration Map: Next.js → .NET Backend
**Event-Sync API Restructuring Plan**
**Generated:** October 12, 2025
**Current State:** 15 Next.js API routes (serverless functions)
**Target State:** Centralized .NET 8 Web API

---

## Executive Summary

Currently, the application has **15 Next.js API routes** that directly interact with Supabase. These should be migrated to a centralized **.NET backend** to:
- ✅ Centralize business logic
- ✅ Improve security (no Supabase credentials in frontend)
- ✅ Enable better error handling and logging
- ✅ Add rate limiting and request validation
- ✅ Support transactions and complex operations
- ✅ Reduce frontend bundle size

**Current .NET Backend Status:**
- Basic structure exists with `EventsController` and `EventService`
- Only dummy data implementation (no database integration)
- Needs significant expansion

---

## Current API Inventory

### 📊 API Routes Summary

| Category | Endpoints | Total |
|----------|-----------|-------|
| **Event Management** | events, events/[eventID] | 2 |
| **Guest Management** | guestList, guests, guests/[guestId] | 3 |
| **RSVP System** | rsvp | 1 |
| **Email Operations** | sendMail, sendReminder, sendUpdate, remindeCountDown | 4 |
| **Image Upload** | upload, finalize-images, cleanup-temp-images | 3 |
| **Authentication** | login | 1 |
| **Utilities** | updateGroupStatus | 1 |
| **TOTAL** | | **15** |

---

## 🔵 Detailed API Mapping

### 1. Event Management APIs

#### 1.1 `/api/events`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/events/route.js`

**HTTP Methods:**
- `GET` - Fetch event by public_id (query param)
- `POST` - Create new event
- `PATCH` - Update existing event (incremental)
- `DELETE` - Delete event

**Current Flow:**
```
Client → Next.js API Route → Supabase → Response
```

**Database Operations:**
- Query `events`, `subevents`, `guest_groups`, `guests`, `rsvps`, `email_templates`, `landing_page_configs`
- Complex transformations between DB schema and frontend format
- No transaction management (risk of partial updates)

**Authentication:**
- Uses Supabase auth tokens
- Checks `event_managers` table for permissions

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IAuthService _authService;

    // GET api/events?public_id={id}
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<EventDetailDto>> GetEvent([FromQuery] string publicId)

    // POST api/events
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<EventResponseDto>> CreateEvent([FromBody] CreateEventDto dto)

    // PATCH api/events
    [HttpPatch]
    [Authorize]
    public async Task<ActionResult<EventResponseDto>> UpdateEvent([FromBody] UpdateEventDto dto)

    // DELETE api/events?public_id={id}
    [HttpDelete]
    [Authorize]
    public async Task<ActionResult> DeleteEvent([FromQuery] string publicId)
}
```

**Migration Complexity:** 🔴 **HIGH**
- Complex data transformations
- Multiple table operations
- Requires transaction support
- 800+ lines of logic

---

#### 1.2 `/api/events/[eventID]`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/events/[eventID]/route.js`

**HTTP Methods:**
- `GET` - Fetch event details by event ID

**Proposed .NET Structure:**
```csharp
// GET api/events/{eventId}
[HttpGet("{eventId}")]
[AllowAnonymous] // Public RSVP pages need access
public async Task<ActionResult<EventPublicDto>> GetEventById(string eventId)
```

**Migration Complexity:** 🟡 **MEDIUM**
- Simpler than main events route
- Still requires complex joins

---

### 2. Guest Management APIs

#### 2.1 `/api/[eventID]/guestList`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/guestList/route.js`

**HTTP Methods:**
- `GET` - Fetch all guests for event
- `POST` - Update guest list (add/modify/delete guests)

**Current Operations:**
- Fetch guests with groups, RSVPs, status
- Batch insert/update/delete guests
- Update group status
- Complex RSVP tracking

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/events/{eventId}/guests")]
public class GuestListController : ControllerBase
{
    // GET api/events/{eventId}/guests
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<GuestListResponseDto>> GetGuestList(string eventId)

    // POST api/events/{eventId}/guests/batch
    [HttpPost("batch")]
    [Authorize]
    public async Task<ActionResult> BatchUpdateGuests(
        string eventId,
        [FromBody] BatchGuestUpdateDto dto)
}
```

**Migration Complexity:** 🔴 **HIGH**
- Batch operations require transactions
- Complex RSVP state management
- Needs cascade delete logic

---

#### 2.2 `/api/[eventID]/guests`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/guests/route.js`

**HTTP Methods:**
- `POST` - Create new guests
- `GET` - Query guests (with filters)

**Proposed .NET Structure:**
```csharp
// POST api/events/{eventId}/guests
[HttpPost]
[Authorize]
public async Task<ActionResult<GuestDto>> CreateGuest(
    string eventId,
    [FromBody] CreateGuestDto dto)

// GET api/events/{eventId}/guests?group={groupId}&status={status}
[HttpGet]
[Authorize]
public async Task<ActionResult<IEnumerable<GuestDto>>> QueryGuests(
    string eventId,
    [FromQuery] GuestQueryParams queryParams)
```

**Migration Complexity:** 🟡 **MEDIUM**

---

#### 2.3 `/api/[eventID]/guests/[guestId]`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/guests/[guestId]/route.js`

**HTTP Methods:**
- `GET` - Get specific guest
- `PUT` - Update guest
- `DELETE` - Delete guest

**Proposed .NET Structure:**
```csharp
// GET api/events/{eventId}/guests/{guestId}
[HttpGet("{guestId}")]
[Authorize]
public async Task<ActionResult<GuestDetailDto>> GetGuest(
    string eventId,
    string guestId)

// PUT api/events/{eventId}/guests/{guestId}
[HttpPut("{guestId}")]
[Authorize]
public async Task<ActionResult> UpdateGuest(
    string eventId,
    string guestId,
    [FromBody] UpdateGuestDto dto)

// DELETE api/events/{eventId}/guests/{guestId}
[HttpDelete("{guestId}")]
[Authorize]
public async Task<ActionResult> DeleteGuest(
    string eventId,
    string guestId)
```

**Migration Complexity:** 🟢 **LOW**

---

### 3. RSVP System

#### 3.1 `/api/[eventID]/rsvp`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/rsvp/route.js`

**HTTP Methods:**
- `GET` - Fetch guest data for RSVP page (group-based)
- `POST` - Submit RSVP responses

**Special Notes:**
- **PUBLIC ENDPOINT** - No authentication required
- Uses `guestId` (actually group_id) from URL param
- Critical for public RSVP pages

**Current Operations:**
- Fetch event details with landing page config
- Fetch guest group with all guests
- Fetch sub-events for RSVP selection
- Update guest RSVP status
- Send confirmation emails (future feature)

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/events/{eventId}/rsvp")]
public class RsvpController : ControllerBase
{
    // GET api/events/{eventId}/rsvp?guestId={groupId}
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 300)] // Cache for 5 minutes
    public async Task<ActionResult<RsvpPageDataDto>> GetRsvpData(
        string eventId,
        [FromQuery] string guestId)

    // POST api/events/{eventId}/rsvp
    [HttpPost]
    [AllowAnonymous]
    [RateLimit(requests: 10, period: "1m")] // Prevent spam
    public async Task<ActionResult<RsvpResponseDto>> SubmitRsvp(
        string eventId,
        [FromBody] SubmitRsvpDto dto)
}
```

**Migration Complexity:** 🟡 **MEDIUM**
- Public endpoint needs CAPTCHA
- Rate limiting essential
- Email notifications integration

---

### 4. Email Operations

#### 4.1 `/api/[eventID]/sendMail`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/sendMail/route.js`

**HTTP Methods:**
- `POST` - Send emails to guest list

**Current Operations:**
- Authenticates user
- Checks event permissions
- Fetches email template from database
- Compiles Handlebars template
- Sends emails via SendGrid
- Updates group status (invite_sent)

**Dependencies:**
- SendGrid API
- Handlebars templating
- Environment variable: `SENDGRID_API_KEY`

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/events/{eventId}/email")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ITemplateService _templateService;

    // POST api/events/{eventId}/email/send
    [HttpPost("send")]
    [Authorize]
    [RateLimit(requests: 100, period: "1h")] // Prevent abuse
    public async Task<ActionResult<EmailSendResultDto>> SendEmails(
        string eventId,
        [FromBody] SendEmailDto dto)

    // POST api/events/{eventId}/email/send-reminder
    [HttpPost("send-reminder")]
    [Authorize]
    public async Task<ActionResult> SendReminders(
        string eventId,
        [FromBody] SendReminderDto dto)

    // POST api/events/{eventId}/email/send-update
    [HttpPost("send-update")]
    [Authorize]
    public async Task<ActionResult> SendUpdates(
        string eventId,
        [FromBody] SendUpdateDto dto)
}
```

**Migration Complexity:** 🔴 **HIGH**
- Email service integration
- Template engine (use RazorLight instead of Handlebars)
- Queue system needed (Hangfire for background jobs)
- Rate limiting crucial

---

#### 4.2 `/api/[eventID]/sendReminder`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/sendReminder/route.js`

**Proposed .NET Structure:**
Merged into `EmailController.SendReminders()`

**Migration Complexity:** 🟡 **MEDIUM**

---

#### 4.3 `/api/[eventID]/sendUpdate`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/sendUpdate/route.js`

**Proposed .NET Structure:**
Merged into `EmailController.SendUpdates()`

**Migration Complexity:** 🟡 **MEDIUM**

---

#### 4.4 `/api/[eventID]/remindeCountDown`
**Current Implementation:** Next.js API Route (Scheduled/cron job?)
**File:** `frontend/src/app/api/[eventID]/remindeCountDown/route.js`

**Proposed .NET Structure:**
```csharp
// Background job service
public class ReminderBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Use Hangfire for scheduled reminders
    }
}
```

**Migration Complexity:** 🟡 **MEDIUM**
- Requires background job system (Hangfire)

---

### 5. Image Upload APIs

#### 5.1 `/api/upload`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/upload/route.js`

**HTTP Methods:**
- `POST` - Upload images (logo, background, sub-event images)

**Current Operations:**
- Validates image format and size
- Uploads to Supabase Storage
- Creates temporary or permanent records
- Returns public URL

**File Size Limits:**
- Logo: 5MB
- Background: 10MB
- Sub-event: 10MB

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IStorageService _storageService;

    // POST api/upload
    [HttpPost]
    [Authorize]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    public async Task<ActionResult<UploadResponseDto>> UploadImage(
        [FromForm] IFormFile file,
        [FromForm] string imageType,
        [FromForm] string eventId,
        [FromForm] bool isTemporary = false)
}
```

**Migration Complexity:** 🟡 **MEDIUM**
- File upload handling in .NET
- Integration with Supabase Storage or migrate to Azure Blob/AWS S3
- Virus scanning recommended

---

#### 5.2 `/api/finalize-images`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/finalize-images/route.js`

**HTTP Methods:**
- `POST` - Finalize temporary images (make permanent)

**Proposed .NET Structure:**
```csharp
// POST api/upload/finalize
[HttpPost("finalize")]
[Authorize]
public async Task<ActionResult> FinalizeImages([FromBody] FinalizeImagesDto dto)
```

**Migration Complexity:** 🟢 **LOW**

---

#### 5.3 `/api/cleanup-temp-images`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/cleanup-temp-images/route.js`

**HTTP Methods:**
- `POST` - Cleanup abandoned temporary images

**Proposed .NET Structure:**
```csharp
// Background job for cleanup
public class ImageCleanupJob
{
    [AutomaticRetry(Attempts = 3)]
    public async Task CleanupTempImages()
    {
        // Run daily via Hangfire
    }
}
```

**Migration Complexity:** 🟢 **LOW**

---

### 6. Authentication & Authorization

#### 6.1 `/api/[eventID]/login`
**Current Implementation:** Next.js API Route (Legacy?)
**File:** `frontend/src/app/api/[eventID]/login/route.js`

**Note:** This appears to be legacy code. Current auth uses Supabase OAuth (handled by middleware).

**Proposed .NET Structure:**
```csharp
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    // POST api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)

    // POST api/auth/refresh
    [HttpPost("refresh")]
    public async Task<ActionResult<TokenResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)

    // POST api/auth/logout
    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
}
```

**Migration Complexity:** 🔴 **HIGH**
- Needs JWT token generation
- Supabase auth integration or replacement
- Session management

---

### 7. Utilities

#### 7.1 `/api/[eventID]/updateGroupStatus`
**Current Implementation:** Next.js API Route
**File:** `frontend/src/app/api/[eventID]/updateGroupStatus/route.js`

**HTTP Methods:**
- `POST` - Update guest group status (invited, sent, etc.)

**Proposed .NET Structure:**
```csharp
// POST api/events/{eventId}/groups/{groupId}/status
[HttpPost("groups/{groupId}/status")]
[Authorize]
public async Task<ActionResult> UpdateGroupStatus(
    string eventId,
    string groupId,
    [FromBody] UpdateGroupStatusDto dto)
```

**Migration Complexity:** 🟢 **LOW**

---

## 📋 Required .NET Controllers

### Proposed Controller Structure

```
backend/
├── Controllers/
│   ├── EventsController.cs          ✅ EXISTS (needs expansion)
│   ├── GuestListController.cs       ❌ NEW
│   ├── GuestsController.cs          ❌ NEW
│   ├── RsvpController.cs            ❌ NEW
│   ├── EmailController.cs           ❌ NEW
│   ├── UploadController.cs          ❌ NEW
│   ├── AuthController.cs            ❌ NEW
│   └── UsersController.cs           ✅ EXISTS (stub only)
├── Services/
│   ├── EventService.cs              ✅ EXISTS (dummy data only)
│   ├── GuestService.cs              ❌ NEW
│   ├── RsvpService.cs               ❌ NEW
│   ├── EmailService.cs              ❌ NEW
│   ├── TemplateService.cs           ❌ NEW
│   ├── StorageService.cs            ❌ NEW
│   ├── AuthService.cs               ❌ NEW
│   └── PermissionService.cs         ❌ NEW
├── Models/
│   ├── DTOs/                        ❌ NEW (20+ DTOs needed)
│   ├── Event.cs                     ✅ EXISTS (basic)
│   ├── Guest.cs                     ❌ NEW
│   ├── GuestGroup.cs                ❌ NEW
│   ├── SubEvent.cs                  ❌ NEW
│   ├── Rsvp.cs                      ❌ NEW
│   ├── EmailTemplate.cs             ❌ NEW
│   └── User.cs                      ❌ NEW
├── Data/
│   ├── ApplicationDbContext.cs      ❌ NEW
│   └── Repositories/                ❌ NEW
├── Middleware/
│   ├── AuthenticationMiddleware.cs  ❌ NEW
│   ├── RateLimitMiddleware.cs       ❌ NEW
│   └── ErrorHandlingMiddleware.cs   ❌ NEW
└── Background/
    ├── EmailQueueProcessor.cs       ❌ NEW
    └── ImageCleanupJob.cs           ❌ NEW
```

---

## 🔧 Required .NET Packages

### Essential Packages

```xml
<ItemGroup>
  <!-- Database -->
  <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.*" />
  <PackageReference Include="Dapper" Version="2.1.*" />

  <!-- Authentication -->
  <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.*" />
  <PackageReference Include="Supabase" Version="0.17.*" />

  <!-- Email -->
  <PackageReference Include="SendGrid" Version="9.29.*" />

  <!-- Templating -->
  <PackageReference Include="RazorLight" Version="2.3.*" />

  <!-- Background Jobs -->
  <PackageReference Include="Hangfire.AspNetCore" Version="1.8.*" />
  <PackageReference Include="Hangfire.PostgreSql" Version="1.20.*" />

  <!-- Storage -->
  <PackageReference Include="Azure.Storage.Blobs" Version="12.19.*" />
  <!-- OR continue using Supabase Storage -->

  <!-- Validation -->
  <PackageReference Include="FluentValidation.AspNetCore" Version="11.3.*" />

  <!-- Logging -->
  <PackageReference Include="Serilog.AspNetCore" Version="8.0.*" />
  <PackageReference Include="Serilog.Sinks.Console" Version="5.0.*" />

  <!-- API Documentation -->
  <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.*" /> <!-- Already exists -->

  <!-- Caching -->
  <PackageReference Include="StackExchange.Redis" Version="2.7.*" />

  <!-- Rate Limiting -->
  <PackageReference Include="AspNetCoreRateLimit" Version="5.0.*" />

  <!-- Testing -->
  <PackageReference Include="xUnit" Version="2.6.*" />
  <PackageReference Include="Moq" Version="4.20.*" />
</ItemGroup>
```

---

## 🔄 Migration Strategy

### Phase 1: Infrastructure Setup (Week 1-2)
**Priority:** Foundation

1. **Database Integration**
   - [ ] Configure Entity Framework Core with PostgreSQL
   - [ ] Create DbContext for Supabase database
   - [ ] Map all existing tables to C# models
   - [ ] Add Repository pattern

2. **Authentication Setup**
   - [ ] Configure JWT authentication
   - [ ] Integrate with Supabase Auth or migrate to .NET Identity
   - [ ] Implement permission middleware
   - [ ] Add role-based authorization

3. **Core Services**
   - [ ] Expand EventService (remove dummy data)
   - [ ] Create base service classes
   - [ ] Add error handling middleware
   - [ ] Configure logging (Serilog)

**Estimated Time:** 60-80 hours

---

### Phase 2: Core Event APIs (Week 3-4)
**Priority:** Critical Path

4. **Events Controller**
   - [ ] Migrate GET /api/events
   - [ ] Migrate POST /api/events
   - [ ] Migrate PATCH /api/events
   - [ ] Migrate DELETE /api/events
   - [ ] Add transaction support
   - [ ] Unit tests

5. **Guest Management**
   - [ ] Create GuestService
   - [ ] Implement GuestListController
   - [ ] Migrate guest CRUD operations
   - [ ] Add batch operations
   - [ ] Unit tests

**Estimated Time:** 80-100 hours

---

### Phase 3: RSVP & Public APIs (Week 5)
**Priority:** High (User-facing)

6. **RSVP Controller**
   - [ ] Migrate RSVP GET endpoint
   - [ ] Migrate RSVP POST endpoint
   - [ ] Add rate limiting
   - [ ] Add CAPTCHA integration
   - [ ] Response caching

7. **Public Endpoints**
   - [ ] Optimize for performance
   - [ ] CDN integration
   - [ ] Load testing

**Estimated Time:** 40-60 hours

---

### Phase 4: Email System (Week 6-7)
**Priority:** High (Critical Feature)

8. **Email Service**
   - [ ] SendGrid integration
   - [ ] Template service (RazorLight)
   - [ ] Email queue (Hangfire)
   - [ ] Batch sending with rate limits
   - [ ] Retry logic

9. **Email Controllers**
   - [ ] Migrate sendMail endpoint
   - [ ] Migrate sendReminder endpoint
   - [ ] Migrate sendUpdate endpoint
   - [ ] Background reminder job

**Estimated Time:** 60-80 hours

---

### Phase 5: File Upload (Week 8)
**Priority:** Medium

10. **Upload Service**
    - [ ] File validation
    - [ ] Storage integration (Supabase or Azure)
    - [ ] Temp file management
    - [ ] Cleanup background job

11. **Upload Controller**
    - [ ] Migrate upload endpoint
    - [ ] Migrate finalize endpoint
    - [ ] Virus scanning (optional)

**Estimated Time:** 30-40 hours

---

### Phase 6: Polish & Production (Week 9-10)
**Priority:** Production Readiness

12. **Security**
    - [ ] Rate limiting on all endpoints
    - [ ] Input validation (FluentValidation)
    - [ ] SQL injection prevention
    - [ ] XSS prevention

13. **Monitoring**
    - [ ] Application Insights / Sentry
    - [ ] Health checks
    - [ ] Performance monitoring
    - [ ] Error tracking

14. **Testing**
    - [ ] Integration tests
    - [ ] Load tests
    - [ ] Security tests

15. **Deployment**
    - [ ] Docker containerization
    - [ ] CI/CD pipeline
    - [ ] Azure/AWS deployment
    - [ ] Database migrations

**Estimated Time:** 60-80 hours

---

## 📊 Migration Complexity Matrix

| API Endpoint | Complexity | Estimated Hours | Priority |
|--------------|------------|----------------|----------|
| /api/events (all methods) | 🔴 HIGH | 40-50 | P0 |
| /api/[eventID]/guestList | 🔴 HIGH | 30-40 | P0 |
| /api/[eventID]/guests | 🟡 MEDIUM | 20-25 | P1 |
| /api/[eventID]/rsvp | 🟡 MEDIUM | 25-30 | P0 |
| /api/[eventID]/sendMail | 🔴 HIGH | 30-40 | P1 |
| /api/[eventID]/sendReminder | 🟡 MEDIUM | 15-20 | P1 |
| /api/[eventID]/sendUpdate | 🟡 MEDIUM | 15-20 | P2 |
| /api/upload | 🟡 MEDIUM | 20-25 | P2 |
| /api/finalize-images | 🟢 LOW | 5-10 | P3 |
| /api/cleanup-temp-images | 🟢 LOW | 5-10 | P3 |
| /api/[eventID]/login | 🔴 HIGH | 20-30 | P0 |
| Authentication setup | 🔴 HIGH | 40-50 | P0 |
| Infrastructure | 🔴 HIGH | 60-80 | P0 |

**Total Estimated Time:** **400-500 hours** (10-12 weeks full-time)

---

## 🎯 Key Benefits of Migration

### Security
- ✅ API keys hidden in backend (not in client code)
- ✅ Centralized authentication/authorization
- ✅ Rate limiting at API gateway level
- ✅ Input validation before database access
- ✅ SQL injection prevention via EF Core

### Performance
- ✅ Connection pooling for database
- ✅ Caching layer (Redis)
- ✅ Background job processing (emails)
- ✅ Optimized queries with Dapper
- ✅ CDN for static assets

### Maintainability
- ✅ Strongly typed models (no runtime errors)
- ✅ Centralized business logic
- ✅ Easy to test (dependency injection)
- ✅ Better error handling
- ✅ Swagger API documentation

### Scalability
- ✅ Horizontal scaling (multiple instances)
- ✅ Load balancing
- ✅ Database read replicas
- ✅ Queue-based email processing
- ✅ Async operations

---

## 🚧 Migration Risks & Mitigation

### Risk 1: Breaking Changes
**Impact:** Frontend breaks during migration
**Mitigation:**
- Implement API versioning (v1, v2)
- Run .NET backend alongside Next.js routes initially
- Gradual migration endpoint by endpoint
- Feature flags to switch between old/new

### Risk 2: Authentication Changes
**Impact:** Users logged out, can't access app
**Mitigation:**
- Maintain Supabase auth initially
- Dual authentication support during transition
- Session migration script
- Clear communication to users

### Risk 3: Data Consistency
**Impact:** Data loss during migration
**Mitigation:**
- Comprehensive testing in staging
- Database backups before migration
- Transaction support for complex operations
- Rollback plan

### Risk 4: Performance Regression
**Impact:** Slower API responses
**Mitigation:**
- Load testing before production
- Performance monitoring from day 1
- Query optimization
- Caching strategy

---

## 🔀 Hybrid Approach (Recommended)

### Step 1: Run Both Systems (Month 1-2)
```
Client
  ↓
  ├─→ Next.js API Routes (existing)
  │     ↓
  │   Supabase
  │
  └─→ .NET Backend (new, partial)
        ↓
      Supabase
```

### Step 2: Migrate Endpoint by Endpoint (Month 3-4)
```
Client
  ↓
  ├─→ Next.js API Routes (decreasing)
  │     ↓
  │   Supabase
  │
  └─→ .NET Backend (growing)
        ↓
      Supabase
```

### Step 3: Full Migration (Month 5-6)
```
Client
  ↓
.NET Backend (all endpoints)
  ↓
Supabase
```

---

## 📝 Configuration Changes Needed

### Frontend Changes

**Before:**
```javascript
// Direct Supabase calls
const { data } = await supabase.from('events').select('*');
```

**After:**
```javascript
// API calls to .NET backend
const response = await fetch('/api/events?public_id=123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

### Environment Variables

**Frontend `.env`:**
```bash
# Remove (move to backend):
# SENDGRID_API_KEY
# SUPABASE_SERVICE_ROLE_KEY

# Keep:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # NEW
```

**Backend `appsettings.json`:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.xxx.supabase.co;Database=postgres;..."
  },
  "Supabase": {
    "Url": "https://xxx.supabase.co",
    "ServiceRoleKey": "eyJxxx..."
  },
  "SendGrid": {
    "ApiKey": "SG.xxx"
  },
  "Jwt": {
    "Secret": "xxx",
    "Issuer": "EventSync",
    "Audience": "EventSyncAPI"
  }
}
```

---

## 📈 Success Metrics

### Before Migration
- ⏱️ Average API response time: ?
- 📊 API success rate: ?
- 🔒 Security incidents: ?
- 💰 Infrastructure cost: ?

### After Migration (Goals)
- ⏱️ Average API response time: < 200ms (P95)
- 📊 API success rate: > 99.9%
- 🔒 Security incidents: 0
- 💰 Infrastructure cost: Similar or lower
- ✅ Rate limiting: Active on all endpoints
- ✅ Error tracking: 100% coverage
- ✅ API documentation: Complete Swagger docs

---

## 🎬 Next Steps

### Immediate (This Week)
1. Review this migration plan with team
2. Decide on migration timeline
3. Set up .NET development environment
4. Create proof-of-concept with 1-2 endpoints

### Short-Term (Month 1)
5. Complete infrastructure setup
6. Migrate critical event APIs
7. Set up CI/CD pipeline
8. Deploy to staging environment

### Long-Term (Months 2-6)
9. Migrate remaining endpoints
10. Comprehensive testing
11. Production deployment
12. Monitoring and optimization

---

**Document Version:** 1.0
**Last Updated:** October 12, 2025
**Estimated Project Duration:** 5-6 months
**Estimated Cost:** 400-500 hours development
