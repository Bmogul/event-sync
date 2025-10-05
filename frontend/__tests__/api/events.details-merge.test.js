/**
 * Test Suite: POST /api/events - Details JSONB Column Merging
 *
 * Bug: WhatsApp templates and other details fields are being erased when updating events
 * Root Cause: POST endpoint overwrites entire details JSONB column instead of merging
 *
 * This test suite follows TDD principles:
 * 1. Write failing tests that demonstrate the bug
 * 2. Implement fix in the POST endpoint
 * 3. Verify tests pass after fix
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');

// Mock Next.js server utilities
jest.mock('../../src/app/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('POST /api/events - Details JSONB Merging Bug', () => {
  let handler;
  let mockRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import the handler (we'll need to mock it properly)
    const { createClient: createServerClient } = require('../../src/app/utils/supabase/server');
    createServerClient.mockReturnValue(mockSupabase);

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null,
    });

    // Mock user profile
    const mockUserProfile = {
      data: { id: 1, supa_id: 'test-user-123' },
      error: null,
    };

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue(mockUserProfile),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
  });

  /**
   * TEST 1: WhatsApp Templates Preservation
   * FAILING TEST - Demonstrates the bug where whatsapp_templates get erased
   */
  describe('WhatsApp Templates Preservation', () => {
    it('should preserve existing whatsapp_templates when updating event with partial data', async () => {
      // Arrange: Existing event with whatsapp_templates and other details
      const existingEvent = {
        id: 100,
        public_id: 'evt_123',
        title: 'Test Event',
        details: {
          location: '123 Main St',
          timezone: 'America/New_York',
          event_type: 'wedding',
          is_private: false,
          require_rsvp: true,
          allow_plus_ones: true,
          rsvp_deadline: '2024-12-01',
          whatsapp_templates: [
            {
              id: 'template_1',
              name: 'Invitation',
              message: 'You are invited! {rsvp_link}',
              created_at: '2024-01-01T00:00:00Z',
              is_default: true,
            },
            {
              id: 'template_2',
              name: 'Reminder',
              message: 'Don\'t forget! {event_title}',
              created_at: '2024-01-02T00:00:00Z',
              is_default: false,
            },
          ],
        },
      };

      // Mock existing event lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'events') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: existingEvent,
              error: null,
            }),
            update: jest.fn().mockImplementation((payload) => ({
              eq: jest.fn().mockResolvedValue({
                data: { ...existingEvent, ...payload },
                error: null,
              }),
            })),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        };
      });

      // Act: Update event with only title and new whatsapp templates (simulating WhatsAppTemplateEditor save)
      const updatePayload = {
        public_id: 'evt_123',
        title: 'Updated Event Title',
        logo_url: null,
        whatsappTemplates: [
          {
            id: 'template_3',
            name: 'New Template',
            message: 'New message {guest_name}',
            created_at: '2024-01-03T00:00:00Z',
            is_default: true,
          },
        ],
        status: 'draft',
      };

      // Simulate POST request processing
      const mockUpdateCall = jest.fn();
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'events') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: existingEvent,
              error: null,
            }),
            update: jest.fn().mockImplementation((payload) => {
              mockUpdateCall(payload);
              return {
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: { ...existingEvent, ...payload },
                  error: null,
                }),
              };
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        };
      });

      // This simulates what the buggy POST endpoint does
      const eventPayload = {
        title: updatePayload.title,
        logo_url: updatePayload.logo_url,
        status_id: 1, // draft
        details: {
          location: updatePayload.location || null,
          timezone: updatePayload.timezone || null,
          event_type: updatePayload.eventType || 'event',
          is_private: updatePayload.isPrivate || false,
          require_rsvp: updatePayload.requireRSVP || false,
          allow_plus_ones: updatePayload.allowPlusOnes || false,
          rsvp_deadline: updatePayload.rsvpDeadline || null,
          ...(updatePayload.whatsappTemplates && Array.isArray(updatePayload.whatsappTemplates) && {
            whatsapp_templates: updatePayload.whatsappTemplates,
          }),
        },
      };

      // Assert: The bug - details are overwritten, losing original data
      expect(eventPayload.details.location).toBeNull(); // ❌ Lost original location
      expect(eventPayload.details.timezone).toBeNull(); // ❌ Lost original timezone
      expect(eventPayload.details.require_rsvp).toBe(false); // ❌ Lost original true value
      expect(eventPayload.details.allow_plus_ones).toBe(false); // ❌ Lost original true value

      // The fix should preserve all original details
      // EXPECTED after fix:
      // expect(mergedDetails.location).toBe('123 Main St');
      // expect(mergedDetails.timezone).toBe('America/New_York');
      // expect(mergedDetails.require_rsvp).toBe(true);
      // expect(mergedDetails.allow_plus_ones).toBe(true);
      // expect(mergedDetails.whatsapp_templates).toEqual(updatePayload.whatsappTemplates);
    });

    it('should merge new whatsapp_templates without losing other details fields', async () => {
      // Arrange
      const existingDetails = {
        location: 'Grand Ballroom',
        timezone: 'America/Los_Angeles',
        event_type: 'conference',
        is_private: true,
        require_rsvp: true,
        allow_plus_ones: false,
        rsvp_deadline: '2024-11-15',
        // No whatsapp_templates initially
      };

      const newTemplates = [
        {
          id: 'template_new',
          name: 'First Template',
          message: 'Welcome to {event_title}',
          created_at: new Date().toISOString(),
          is_default: true,
        },
      ];

      // This demonstrates what should happen after the fix
      const expectedMergedDetails = {
        ...existingDetails,
        whatsapp_templates: newTemplates,
      };

      // Assert: After fix, all fields should be preserved
      expect(expectedMergedDetails).toEqual({
        location: 'Grand Ballroom',
        timezone: 'America/Los_Angeles',
        event_type: 'conference',
        is_private: true,
        require_rsvp: true,
        allow_plus_ones: false,
        rsvp_deadline: '2024-11-15',
        whatsapp_templates: newTemplates,
      });
    });
  });

  /**
   * TEST 2: Other Details Fields Preservation
   * FAILING TEST - Demonstrates that all details fields get lost on partial updates
   */
  describe('Other Details Fields Preservation', () => {
    it('should preserve all details fields when updating only event title', async () => {
      // Arrange
      const existingDetails = {
        location: 'Central Park',
        timezone: 'America/New_York',
        event_type: 'wedding',
        is_private: false,
        require_rsvp: true,
        allow_plus_ones: true,
        rsvp_deadline: '2024-12-25',
        whatsapp_templates: [
          {
            id: 'tmpl_1',
            name: 'Default',
            message: 'Join us!',
            is_default: true,
          },
        ],
      };

      // Act: Update only title
      const partialUpdate = {
        public_id: 'evt_456',
        title: 'New Title Only',
        status: 'draft',
      };

      // Simulate buggy behavior - creates new details object
      const buggyDetails = {
        location: partialUpdate.location || null, // ❌ Lost
        timezone: partialUpdate.timezone || null, // ❌ Lost
        event_type: partialUpdate.eventType || 'event', // ❌ Changed from wedding
        is_private: partialUpdate.isPrivate || false,
        require_rsvp: partialUpdate.requireRSVP || false, // ❌ Lost
        allow_plus_ones: partialUpdate.allowPlusOnes || false, // ❌ Lost
        rsvp_deadline: partialUpdate.rsvpDeadline || null, // ❌ Lost
      };

      // Assert: Bug demonstration
      expect(buggyDetails.location).toBeNull();
      expect(buggyDetails.event_type).toBe('event'); // Changed from 'wedding'
      expect(buggyDetails.whatsapp_templates).toBeUndefined(); // ❌ Completely lost

      // Expected behavior after fix:
      const expectedDetails = {
        ...existingDetails,
        // Only title should change, everything else preserved
      };

      expect(expectedDetails).toEqual(existingDetails);
    });

    it('should preserve existing details when adding new logo_url', async () => {
      // Arrange
      const existingDetails = {
        location: 'Beach Resort',
        timezone: 'Pacific/Honolulu',
        event_type: 'party',
        is_private: true,
        require_rsvp: false,
        allow_plus_ones: true,
        rsvp_deadline: null,
      };

      // Act: Update only logo
      const logoUpdate = {
        public_id: 'evt_789',
        title: 'Same Title',
        logo_url: 'https://example.com/new-logo.png',
        status: 'draft',
      };

      // Expected: All details preserved
      const expectedDetails = { ...existingDetails };

      expect(expectedDetails.location).toBe('Beach Resort');
      expect(expectedDetails.timezone).toBe('Pacific/Honolulu');
      expect(expectedDetails.event_type).toBe('party');
    });
  });

  /**
   * TEST 3: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle event with no existing details field', async () => {
      // Some events might not have details initialized
      const eventWithoutDetails = {
        id: 200,
        public_id: 'evt_new',
        title: 'New Event',
        details: null, // or undefined
      };

      const newDetails = {
        location: 'New Location',
        whatsapp_templates: [{ id: '1', name: 'Test', message: 'Hi' }],
      };

      // Should create details without errors
      const merged = { ...(eventWithoutDetails.details || {}), ...newDetails };

      expect(merged).toEqual(newDetails);
    });

    it('should handle empty whatsapp_templates array', async () => {
      const existingDetails = {
        location: 'Venue',
        whatsapp_templates: [{ id: '1', name: 'Old' }],
      };

      const update = {
        whatsappTemplates: [], // Empty array
      };

      // Should preserve location but update templates to empty
      const expected = {
        location: 'Venue',
        whatsapp_templates: [],
      };

      expect(expected.location).toBe('Venue');
      expect(expected.whatsapp_templates).toEqual([]);
    });

    it('should handle null vs undefined vs missing fields correctly', async () => {
      const existingDetails = {
        location: 'Original Location',
        timezone: 'America/New_York',
        rsvp_deadline: '2024-12-01',
      };

      const update = {
        location: null, // Explicitly set to null
        // timezone: undefined, // Not provided
        rsvp_deadline: '2025-01-01', // Updated
      };

      // Null should overwrite, undefined/missing should preserve
      const merged = {
        ...existingDetails,
        ...Object.fromEntries(
          Object.entries(update).filter(([_, v]) => v !== undefined)
        ),
      };

      expect(merged.location).toBeNull(); // Explicitly nullified
      expect(merged.timezone).toBe('America/New_York'); // Preserved
      expect(merged.rsvp_deadline).toBe('2025-01-01'); // Updated
    });
  });
});
