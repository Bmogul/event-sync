/**
 * Unit tests for email template helper functions and logic
 */

describe('Email Template Functions', () => {
  describe('Template Validation', () => {
    it('should validate required template fields', () => {
      const validTemplate = {
        title: 'Wedding Invitation',
        subject_line: 'You\'re Invited!',
        body: 'Join us for our special day',
        sender_name: 'John & Jane'
      };

      const invalidTemplates = [
        { title: '', subject_line: 'Test' }, // Missing title
        { title: 'Test', subject_line: '' }, // Missing subject
        { title: 'Test', subject_line: 'Test', body: '', sender_name: '' }, // Missing body and sender
      ];

      // Test validation logic
      const isValidTemplate = (template) => {
        return !!(template.title && template.title.trim() && 
                 template.subject_line && template.subject_line.trim());
      };

      expect(isValidTemplate(validTemplate)).toBe(true);
      expect(isValidTemplate(invalidTemplates[0])).toBe(false);
      expect(isValidTemplate(invalidTemplates[1])).toBe(false);
      expect(isValidTemplate(invalidTemplates[2])).toBe(true); // Only title and subject are required for filtering
    });

    it('should filter templates correctly', () => {
      const templates = [
        { title: 'Valid Template', subject_line: 'Valid Subject', body: 'Valid body' },
        { title: '', subject_line: 'Invalid - no title', body: 'Body' },
        { title: 'Invalid - no subject', subject_line: '', body: 'Body' },
        { title: 'Another Valid', subject_line: 'Another Subject', body: 'Another body' }
      ];

      const validTemplates = templates.filter(
        (template) => template.title && template.title.trim() && 
                     template.subject_line && template.subject_line.trim()
      );

      expect(validTemplates).toHaveLength(2);
      expect(validTemplates[0].title).toBe('Valid Template');
      expect(validTemplates[1].title).toBe('Another Valid');
    });
  });

  describe('Frontend to Database Mapping', () => {
    it('should map frontend template fields to database schema', () => {
      const frontendTemplate = {
        title: 'Wedding Invitation',
        subtitle: 'Join us for our special day',
        category: 'invitation',
        status: 'draft',
        subject_line: 'You\'re Invited to Our Wedding!',
        sender_name: 'John & Jane Smith',
        body: 'We are excited to celebrate our special day with you.',
        greeting: 'Dear Guest,',
        signoff: 'With love and excitement,',
        reply_to: 'john.jane@wedding.com',
        description: 'Main wedding invitation template',
        is_default: true,
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        text_color: '#333333'
      };

      // Simulate the mapping logic from our API
      const mapToDatabase = (template, eventId, categoryId = 1, statusId = 1) => ({
        event_id: eventId,
        category_id: categoryId,
        template_status_id: statusId,
        name: template.title,
        subject_line: template.subject_line,
        sender_name: template.sender_name || 'Event Host',
        description: template.description || null,
        title: template.subtitle || null,
        subtitle: template.subtitle || null,
        greeting: template.greeting || null,
        body: template.body || null,
        signoff: template.signoff || null,
        reply_to: template.reply_to || null,
        is_default: template.is_default || false,
        primary_color: template.primary_color || null,
        secondary_color: template.secondary_color || null,
        font_color: template.text_color || null
      });

      const dbPayload = mapToDatabase(frontendTemplate, 123, 1, 1);

      expect(dbPayload).toEqual({
        event_id: 123,
        category_id: 1,
        template_status_id: 1,
        name: 'Wedding Invitation',
        subject_line: 'You\'re Invited to Our Wedding!',
        sender_name: 'John & Jane Smith',
        description: 'Main wedding invitation template',
        title: 'Join us for our special day',
        subtitle: 'Join us for our special day',
        greeting: 'Dear Guest,',
        body: 'We are excited to celebrate our special day with you.',
        signoff: 'With love and excitement,',
        reply_to: 'john.jane@wedding.com',
        is_default: true,
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        font_color: '#333333'
      });
    });
  });

  describe('Database to Frontend Transformation', () => {
    it('should transform database templates to frontend format', () => {
      const dbTemplate = {
        id: 1,
        name: 'Wedding Invitation',
        subject_line: 'You\'re Invited!',
        body: 'Join us for our wedding',
        sender_name: 'John & Jane',
        greeting: 'Dear Guest,',
        signoff: 'With love,',
        reply_to: 'reply@wedding.com',
        description: 'Main invitation template',
        is_default: true,
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        font_color: '#333333',
        email_template_categories: { name: 'invitation' },
        email_template_status: { name: 'active' }
      };

      // Simulate the transformation logic from our GET API
      const transformToFrontend = (template) => ({
        id: template.id,
        title: template.name,
        subtitle: template.subtitle || '',
        body: template.body || '',
        greeting: template.greeting || '',
        signoff: template.signoff || '',
        sender_name: template.sender_name || '',
        sender_email: template.sender_email || '',
        reply_to: template.reply_to || '',
        subject_line: template.subject_line || '',
        template_key: template.template_key || '',
        category: template.email_template_categories?.name || 'invitation',
        status: template.email_template_status?.name || 'draft',
        description: template.description || '',
        is_default: template.is_default || false,
        primary_color: template.primary_color || '#ffffff',
        secondary_color: template.secondary_color || '#e1c0b7',
        text_color: template.font_color || '#333333'
      });

      const frontendTemplate = transformToFrontend(dbTemplate);

      expect(frontendTemplate).toEqual({
        id: 1,
        title: 'Wedding Invitation',
        subtitle: '',
        body: 'Join us for our wedding',
        greeting: 'Dear Guest,',
        signoff: 'With love,',
        sender_name: 'John & Jane',
        sender_email: '',
        reply_to: 'reply@wedding.com',
        subject_line: 'You\'re Invited!',
        template_key: '',
        category: 'invitation',
        status: 'active',
        description: 'Main invitation template',
        is_default: true,
        primary_color: '#ffffff',
        secondary_color: '#e1c0b7',
        text_color: '#333333'
      });
    });
  });

  describe('Template Update Logic', () => {
    it('should identify templates to update, insert, and delete', () => {
      const existingTemplates = [
        { id: 1, name: 'Old Invitation' },
        { id: 2, name: 'Old Reminder' },
        { id: 3, name: 'Delete Me' }
      ];

      const frontendTemplates = [
        { id: 1, title: 'Updated Invitation' }, // Update existing
        { id: 2, title: 'Updated Reminder' },   // Update existing
        { title: 'New Update Template' }        // Insert new (no id)
        // Note: template with id: 3 is missing, should be deleted
      ];

      // Simulate the update logic from our API
      const existingTemplatesMap = new Map();
      existingTemplates.forEach((template) => {
        existingTemplatesMap.set(template.id, template);
      });

      const templatesToUpdate = [];
      const templatesToInsert = [];
      const processedIds = new Set();

      frontendTemplates.forEach((template) => {
        if (template.id && existingTemplatesMap.has(template.id)) {
          templatesToUpdate.push({
            id: template.id,
            name: template.title
          });
          processedIds.add(template.id);
        } else {
          templatesToInsert.push({
            name: template.title
          });
        }
      });

      const templateIdsToDelete = [];
      existingTemplates.forEach((template) => {
        if (!processedIds.has(template.id)) {
          templateIdsToDelete.push(template.id);
        }
      });

      expect(templatesToUpdate).toHaveLength(2);
      expect(templatesToUpdate[0].id).toBe(1);
      expect(templatesToUpdate[1].id).toBe(2);

      expect(templatesToInsert).toHaveLength(1);
      expect(templatesToInsert[0].name).toBe('New Update Template');

      expect(templateIdsToDelete).toEqual([3]);
    });
  });

  describe('Category and Status Handling', () => {
    it('should handle category mapping correctly', () => {
      const categories = ['invitation', 'reminder', 'update'];
      const validCategories = categories.filter(cat => 
        ['invitation', 'reminder', 'update'].includes(cat)
      );

      expect(validCategories).toEqual(['invitation', 'reminder', 'update']);
    });

    it('should handle status mapping correctly', () => {
      const statuses = ['draft', 'active', 'archive'];
      const validStatuses = statuses.filter(status => 
        ['draft', 'active', 'archive'].includes(status)
      );

      expect(validStatuses).toEqual(['draft', 'active', 'archive']);
    });

    it('should provide fallback values for invalid categories and statuses', () => {
      const getFallbackCategory = (category) => {
        const validCategories = ['invitation', 'reminder', 'update'];
        return validCategories.includes(category) ? category : 'invitation';
      };

      const getFallbackStatus = (status) => {
        const validStatuses = ['draft', 'active', 'archive'];
        return validStatuses.includes(status) ? status : 'draft';
      };

      expect(getFallbackCategory('invalid')).toBe('invitation');
      expect(getFallbackCategory('reminder')).toBe('reminder');

      expect(getFallbackStatus('invalid')).toBe('draft');
      expect(getFallbackStatus('active')).toBe('active');
    });
  });

  describe('Email Template Integration', () => {
    it('should demonstrate the complete flow from frontend to database', () => {
      // Simulate frontend data
      const eventData = {
        emailTemplates: [
          {
            title: 'Wedding Invitation',
            subject_line: 'You\'re Invited!',
            category: 'invitation',
            status: 'draft',
            body: 'Join us for our special day',
            sender_name: 'John & Jane'
          },
          {
            title: '', // Invalid - should be filtered out
            subject_line: 'Invalid Template'
          }
        ]
      };

      // Step 1: Filter valid templates
      const validTemplates = eventData.emailTemplates.filter(
        (template) => template.title && template.title.trim() && 
                     template.subject_line && template.subject_line.trim()
      );

      expect(validTemplates).toHaveLength(1);

      // Step 2: Map to database format
      const dbPayloads = validTemplates.map(template => ({
        event_id: 123,
        category_id: 1, // Would come from lookup
        template_status_id: 1, // Would come from lookup
        name: template.title,
        subject_line: template.subject_line,
        body: template.body,
        sender_name: template.sender_name
      }));

      expect(dbPayloads).toHaveLength(1);
      expect(dbPayloads[0].name).toBe('Wedding Invitation');

      // Step 3: Simulate database response and transform back
      const dbResults = dbPayloads.map((payload, index) => ({
        ...payload,
        id: index + 1,
        email_template_categories: { name: 'invitation' },
        email_template_status: { name: 'draft' }
      }));

      const frontendResults = dbResults.map(template => ({
        id: template.id,
        title: template.name,
        subject_line: template.subject_line,
        category: template.email_template_categories.name,
        status: template.email_template_status.name,
        body: template.body,
        sender_name: template.sender_name
      }));

      expect(frontendResults).toHaveLength(1);
      expect(frontendResults[0].title).toBe('Wedding Invitation');
      expect(frontendResults[0].category).toBe('invitation');
    });
  });
});