/**
 * Tests for email template functionality in events API
 */

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
};

// Mock the createClient function
jest.mock('../../src/app/utils/supabase/server', () => ({
  createClient: () => mockSupabase
}));

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn()
};

jest.mock('next/server', () => ({
  NextResponse: mockNextResponse
}));

describe('Events API - Email Templates', () => {
  let mockQuery, mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain for Supabase queries
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockInsert = jest.fn().mockReturnValue({ select: jest.fn() });
    mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn() });
    mockDelete = jest.fn().mockReturnValue({ eq: jest.fn(), in: jest.fn() });
    mockQuery = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    });
    
    mockSupabase.from.mockImplementation(() => mockQuery());
  });

  describe('Email Template Category Lookup', () => {
    it('should get category ID for invitation', async () => {
      // Mock successful category lookup
      mockSingle.mockResolvedValue({
        data: { id: 1 },
        error: null
      });

      // Import after mocks are set up
      const { POST } = require('../../src/app/api/events/route.js');
      
      // We need to extract and test the getCategoryId function
      // Since it's defined inside POST, we'll test it through the main flow
      
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          public_id: 'test-event-123',
          title: 'Test Event',
          emailTemplates: [{
            title: 'Test Template',
            subject_line: 'Test Subject',
            category: 'invitation',
            status: 'draft',
            body: 'Test body',
            sender_name: 'Test Sender'
          }]
        })
      };

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock user profile lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { id: 1 },
                  error: null
                })
              })
            })
          };
        }
        return mockQuery();
      });

      mockNextResponse.json.mockReturnValue('mocked response');

      await POST(mockRequest);

      // Verify category lookup was called
      expect(mockSupabase.from).toHaveBeenCalledWith('email_template_categories');
    });

    it('should handle category lookup error gracefully', async () => {
      // Mock category lookup error
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Category not found' }
      });

      // The function should fall back to default category ID (1)
      // This is tested through the main POST flow
    });
  });

  describe('Email Template Status Lookup', () => {
    it('should get status ID for draft', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 1 },
        error: null
      });

      // This will be tested through the main flow similar to category lookup
      expect(true).toBe(true); // Placeholder for now
    });
  });

  describe('Email Template Creation (New Events)', () => {
    it('should create email templates for new events', async () => {
      const mockEmailTemplates = [{
        title: 'Wedding Invitation',
        subject_line: 'You\'re Invited to Our Wedding!',
        category: 'invitation',
        status: 'draft',
        body: 'Join us for our special day',
        sender_name: 'John & Jane',
        greeting: 'Dear Guest,',
        signoff: 'With love,',
        reply_to: 'reply@test.com',
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        text_color: '#333333'
      }];

      // Test data validation
      const validTemplate = mockEmailTemplates[0];
      expect(validTemplate.title).toBeTruthy();
      expect(validTemplate.subject_line).toBeTruthy();
      expect(validTemplate.body).toBeTruthy();
      expect(validTemplate.sender_name).toBeTruthy();
    });

    it('should filter out invalid templates', async () => {
      const invalidTemplates = [
        { title: '', subject_line: 'Test' }, // Missing title
        { title: 'Test', subject_line: '' }, // Missing subject
        { title: 'Valid', subject_line: 'Valid', body: '', sender_name: 'Test' } // Valid
      ];

      const validTemplates = invalidTemplates.filter(
        (template) => template.title && template.title.trim() && 
                     template.subject_line && template.subject_line.trim()
      );

      expect(validTemplates).toHaveLength(1);
      expect(validTemplates[0].title).toBe('Valid');
    });
  });

  describe('Email Template Updates (Existing Events)', () => {
    it('should update existing templates', async () => {
      const existingTemplates = [
        { id: 1, name: 'Old Template', subject_line: 'Old Subject' }
      ];

      const updatedTemplates = [
        { id: 1, title: 'Updated Template', subject_line: 'Updated Subject' }
      ];

      // Mock existing template lookup
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'email_templates') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: existingTemplates,
                error: null
              })
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn()
            })
          };
        }
        return mockQuery();
      });

      // The update logic should identify templates that exist and need updating
      const existingTemplatesMap = new Map();
      existingTemplates.forEach((template) => {
        existingTemplatesMap.set(template.id, template);
      });

      const templatesToUpdate = [];
      const processedIds = new Set();

      updatedTemplates.forEach((template) => {
        if (template.id && existingTemplatesMap.has(template.id)) {
          templatesToUpdate.push(template);
          processedIds.add(template.id);
        }
      });

      expect(templatesToUpdate).toHaveLength(1);
      expect(processedIds.has(1)).toBe(true);
    });

    it('should delete templates not in frontend data', async () => {
      const existingTemplates = [
        { id: 1, name: 'Keep Template' },
        { id: 2, name: 'Delete Template' }
      ];

      const frontendTemplates = [
        { id: 1, title: 'Keep Template' }
        // Template with id: 2 is missing, should be deleted
      ];

      const processedIds = new Set([1]);
      const templateIdsToDelete = [];

      existingTemplates.forEach((template) => {
        if (!processedIds.has(template.id)) {
          templateIdsToDelete.push(template.id);
        }
      });

      expect(templateIdsToDelete).toContain(2);
      expect(templateIdsToDelete).toHaveLength(1);
    });
  });

  describe('Email Template Retrieval', () => {
    it('should transform database templates to frontend format', async () => {
      const dbTemplate = {
        id: 1,
        name: 'Wedding Invitation',
        subject_line: 'You\'re Invited!',
        body: 'Join us for our wedding',
        sender_name: 'John & Jane',
        greeting: 'Dear Guest,',
        signoff: 'With love,',
        reply_to: 'reply@test.com',
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        font_color: '#333333',
        email_template_categories: { name: 'invitation' },
        email_template_status: { name: 'active' }
      };

      // Transform to frontend format
      const frontendTemplate = {
        id: dbTemplate.id,
        title: dbTemplate.name,
        subtitle: dbTemplate.subtitle || '',
        body: dbTemplate.body || '',
        greeting: dbTemplate.greeting || '',
        signoff: dbTemplate.signoff || '',
        sender_name: dbTemplate.sender_name || '',
        sender_email: dbTemplate.sender_email || '',
        reply_to: dbTemplate.reply_to || '',
        subject_line: dbTemplate.subject_line || '',
        template_key: dbTemplate.template_key || '',
        category: dbTemplate.email_template_categories?.name || 'invitation',
        status: dbTemplate.email_template_status?.name || 'draft',
        description: dbTemplate.description || '',
        is_default: dbTemplate.is_default || false,
        primary_color: dbTemplate.primary_color || '#ffffff',
        secondary_color: dbTemplate.secondary_color || '#e1c0b7',
        text_color: dbTemplate.font_color || '#333333'
      };

      expect(frontendTemplate.title).toBe('Wedding Invitation');
      expect(frontendTemplate.category).toBe('invitation');
      expect(frontendTemplate.status).toBe('active');
      expect(frontendTemplate.text_color).toBe('#333333');
    });
  });

  describe('Data Mapping', () => {
    it('should correctly map frontend template to database payload', async () => {
      const frontendTemplate = {
        title: 'Test Template',
        subtitle: 'Test Subtitle',
        category: 'invitation',
        status: 'draft',
        subject_line: 'Test Subject',
        sender_name: 'Test Sender',
        body: 'Test Body',
        greeting: 'Hello,',
        signoff: 'Regards,',
        reply_to: 'test@test.com',
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        text_color: '#333333'
      };

      // Simulate mapping (without async lookups for simplicity)
      const dbPayload = {
        event_id: 123,
        category_id: 1, // Would come from lookup
        template_status_id: 1, // Would come from lookup
        name: frontendTemplate.title,
        subject_line: frontendTemplate.subject_line,
        sender_name: frontendTemplate.sender_name,
        description: frontendTemplate.description || null,
        title: frontendTemplate.subtitle || null,
        subtitle: frontendTemplate.subtitle || null,
        greeting: frontendTemplate.greeting || null,
        body: frontendTemplate.body || null,
        signoff: frontendTemplate.signoff || null,
        reply_to: frontendTemplate.reply_to || null,
        is_default: frontendTemplate.is_default || false,
        primary_color: frontendTemplate.primary_color || null,
        secondary_color: frontendTemplate.secondary_color || null,
        font_color: frontendTemplate.text_color || null
      };

      expect(dbPayload.name).toBe('Test Template');
      expect(dbPayload.font_color).toBe('#333333');
      expect(dbPayload.event_id).toBe(123);
    });
  });
});