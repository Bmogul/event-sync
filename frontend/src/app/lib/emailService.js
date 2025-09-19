import sgMail from "@sendgrid/mail";
import { EmailTemplateService } from './emailTemplateService.js';
import { TemplateEngine } from './templateEngine.js';
import { TemplateVariableResolver } from './templateVariableResolver.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export class EmailService {
  static instance = null;
  static templateEngine = null;

  constructor() {
    this.sender = process.env.EMAIL_SENDER || "sender@event-sync.com";
    if (!EmailService.templateEngine) {
      EmailService.templateEngine = TemplateEngine.getInstance();
    }
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new EmailService();
    }
    return this.instance;
  }

  /**
   * Send invitation emails using template system
   */
  async sendInvitationEmails(eventId, guestList, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: guestList.length
    };

    try {
      // Get event email settings
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      // Use default template if none configured
      let templateId = emailSettings?.invite_template_id;
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate('invitation');
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error('No invitation template found');
      }

      // Process each guest
      for (const guest of guestList) {
        try {
          if (!guest.email) {
            results.failed.push({
              guest: guest,
              error: 'No email address provided'
            });
            continue;
          }

          // Generate email content for this guest
          const emailData = await EmailService.templateEngine.renderEmailTemplate(
            templateId,
            eventId,
            guest.id,
            {
              // Additional context variables
              isReminder: guest.sent === "Yes",
              guestName: guest.name || guest.first_name + ' ' + guest.last_name,
              guestEmail: guest.email
            }
          );

          // Prepare email message
          const msg = {
            to: guest.email,
            from: {
              email: this.sender,
              name: emailSettings?.sender_name || 'Event-Sync'
            },
            replyTo: emailSettings?.sender_email || this.sender,
            subject: emailData.subject,
            html: emailData.html
          };

          // Send email
          await sgMail.send(msg);
          
          results.successful.push({
            guest: guest,
            emailData: emailData
          });

          console.log(`Invitation sent to: ${guest.email}`);

        } catch (error) {
          console.error(`Failed to send to ${guest.email}:`, error);
          results.failed.push({
            guest: guest,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Bulk invitation sending failed:', error);
      throw new Error(`Failed to send invitations: ${error.message}`);
    }
  }

  /**
   * Send reminder emails
   */
  async sendReminderEmails(eventId, guestList, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: guestList.length
    };

    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      let templateId = emailSettings?.reminder_template_id;
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate('reminder');
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error('No reminder template found');
      }

      // Process each guest
      for (const guest of guestList) {
        try {
          if (!guest.email) {
            results.failed.push({
              guest: guest,
              error: 'No email address provided'
            });
            continue;
          }

          const emailData = await EmailService.templateEngine.renderEmailTemplate(
            templateId,
            eventId,
            guest.id,
            {
              guestName: guest.name || guest.first_name + ' ' + guest.last_name,
              guestEmail: guest.email
            }
          );

          const msg = {
            to: guest.email,
            from: {
              email: this.sender,
              name: emailSettings?.sender_name || 'Event-Sync'
            },
            replyTo: emailSettings?.sender_email || this.sender,
            subject: emailData.subject,
            html: emailData.html
          };

          await sgMail.send(msg);
          
          results.successful.push({
            guest: guest,
            emailData: emailData
          });

          console.log(`Reminder sent to: ${guest.email}`);

        } catch (error) {
          console.error(`Failed to send reminder to ${guest.email}:`, error);
          results.failed.push({
            guest: guest,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Bulk reminder sending failed:', error);
      throw new Error(`Failed to send reminders: ${error.message}`);
    }
  }

  /**
   * Send update emails
   */
  async sendUpdateEmails(eventId, guestList, updateMessage, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: guestList.length
    };

    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      let templateId = emailSettings?.update_template_id;
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate('update');
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error('No update template found');
      }

      // Process each guest
      for (const guest of guestList) {
        try {
          if (!guest.email) {
            results.failed.push({
              guest: guest,
              error: 'No email address provided'
            });
            continue;
          }

          const emailData = await EmailService.templateEngine.renderEmailTemplate(
            templateId,
            eventId,
            guest.id,
            {
              updateMessage: updateMessage,
              guestName: guest.name || guest.first_name + ' ' + guest.last_name,
              guestEmail: guest.email
            }
          );

          const msg = {
            to: guest.email,
            from: {
              email: this.sender,
              name: emailSettings?.sender_name || 'Event-Sync'
            },
            replyTo: emailSettings?.sender_email || this.sender,
            subject: emailData.subject,
            html: emailData.html
          };

          await sgMail.send(msg);
          
          results.successful.push({
            guest: guest,
            emailData: emailData
          });

          console.log(`Update sent to: ${guest.email}`);

        } catch (error) {
          console.error(`Failed to send update to ${guest.email}:`, error);
          results.failed.push({
            guest: guest,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Bulk update sending failed:', error);
      throw new Error(`Failed to send updates: ${error.message}`);
    }
  }

  /**
   * Send countdown emails
   */
  async sendCountdownEmails(eventId, guestList, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: guestList.length
    };

    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      let templateId = emailSettings?.countdown_template_id;
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate('countdown');
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error('No countdown template found');
      }

      // Process each guest
      for (const guest of guestList) {
        try {
          if (!guest.email) {
            results.failed.push({
              guest: guest,
              error: 'No email address provided'
            });
            continue;
          }

          const emailData = await EmailService.templateEngine.renderEmailTemplate(
            templateId,
            eventId,
            guest.id,
            {
              guestName: guest.name || guest.first_name + ' ' + guest.last_name,
              guestEmail: guest.email
            }
          );

          const msg = {
            to: guest.email,
            from: {
              email: this.sender,
              name: emailSettings?.sender_name || 'Event-Sync'
            },
            replyTo: emailSettings?.sender_email || this.sender,
            subject: emailData.subject,
            html: emailData.html
          };

          await sgMail.send(msg);
          
          results.successful.push({
            guest: guest,
            emailData: emailData
          });

          console.log(`Countdown sent to: ${guest.email}`);

        } catch (error) {
          console.error(`Failed to send countdown to ${guest.email}:`, error);
          results.failed.push({
            guest: guest,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Bulk countdown sending failed:', error);
      throw new Error(`Failed to send countdown emails: ${error.message}`);
    }
  }

  /**
   * Send single email using template
   */
  async sendSingleEmail(eventId, guestId, templateCategory, additionalData = {}) {
    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      // Get template ID based on category
      const templateIdField = `${templateCategory}_template_id`;
      let templateId = emailSettings?.[templateIdField];
      
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate(templateCategory);
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error(`No ${templateCategory} template found`);
      }

      // Get guest data
      const variables = await TemplateVariableResolver.resolveVariables(eventId, guestId, additionalData);
      
      if (!variables.guestEmail) {
        throw new Error('Guest email not found');
      }

      // Generate email content
      const emailData = await EmailService.templateEngine.renderEmailTemplate(
        templateId,
        eventId,
        guestId,
        additionalData
      );

      // Send email
      const msg = {
        to: variables.guestEmail,
        from: {
          email: this.sender,
          name: emailSettings?.sender_name || 'Event-Sync'
        },
        replyTo: emailSettings?.sender_email || this.sender,
        subject: emailData.subject,
        html: emailData.html
      };

      await sgMail.send(msg);
      
      console.log(`${templateCategory} email sent to: ${variables.guestEmail}`);
      
      return {
        success: true,
        guestEmail: variables.guestEmail,
        emailData: emailData
      };

    } catch (error) {
      console.error(`Failed to send ${templateCategory} email:`, error);
      throw error;
    }
  }

  /**
   * Preview email for testing
   */
  async previewEmail(eventId, guestId, templateCategory, additionalData = {}) {
    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      const templateIdField = `${templateCategory}_template_id`;
      let templateId = emailSettings?.[templateIdField];
      
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate(templateCategory);
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error(`No ${templateCategory} template found`);
      }

      // Generate email content without sending
      const emailData = await EmailService.templateEngine.renderEmailTemplate(
        templateId,
        eventId,
        guestId,
        additionalData
      );

      return emailData;

    } catch (error) {
      console.error(`Failed to preview ${templateCategory} email:`, error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(eventId, testEmailAddress) {
    try {
      const emailSettings = await EmailTemplateService.getEventEmailSettings(eventId);
      
      // Use invitation template for testing
      let templateId = emailSettings?.invite_template_id;
      if (!templateId) {
        const defaultTemplate = await EmailTemplateService.getDefaultTemplate('invitation');
        templateId = defaultTemplate?.id;
      }

      if (!templateId) {
        throw new Error('No template available for testing');
      }

      // Use sample data for test
      const sampleData = TemplateVariableResolver.getSampleVariables();
      
      const testTemplate = await EmailTemplateService.getTemplateById(templateId);
      const renderedSubject = await EmailService.templateEngine.renderTemplate(
        testTemplate.subject_template, 
        sampleData
      );
      const renderedHtml = await EmailService.templateEngine.renderTemplate(
        testTemplate.html_template, 
        sampleData
      );

      const msg = {
        to: testEmailAddress,
        from: {
          email: this.sender,
          name: emailSettings?.sender_name || 'Event-Sync'
        },
        replyTo: emailSettings?.sender_email || this.sender,
        subject: `[TEST] ${renderedSubject}`,
        html: `
          <div style="background: #fef3c7; padding: 1rem; margin-bottom: 1rem; border-radius: 0.5rem; border: 1px solid #fcd34d;">
            <strong style="color: #92400e;">⚠️ This is a test email</strong><br>
            <span style="color: #78350f;">This email was sent to test your event's email configuration. The content below shows how your actual invitations will appear.</span>
          </div>
          ${renderedHtml}
        `
      };

      await sgMail.send(msg);
      
      return {
        success: true,
        testEmail: testEmailAddress,
        subject: renderedSubject
      };

    } catch (error) {
      console.error('Email configuration test failed:', error);
      throw error;
    }
  }

  /**
   * Get email sending statistics
   */
  async getEmailStats(eventId, startDate = null, endDate = null) {
    // This would require additional logging/analytics tables
    // For now return placeholder data
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      bounceRate: 0,
      openRate: 0,
      clickRate: 0,
      period: { startDate, endDate }
    };
  }

  /**
   * Legacy method for backward compatibility
   * Gradually migrate existing code to use the new methods above
   */
  async sendLegacyEmail(eventData, guestList, templateType = 'invitation') {
    console.warn('Using legacy email method. Consider migrating to new template system.');
    
    try {
      // Try to use new system if event has ID
      if (eventData.id) {
        switch (templateType) {
          case 'invitation':
            return await this.sendInvitationEmails(eventData.id, guestList);
          case 'reminder':
            return await this.sendReminderEmails(eventData.id, guestList);
          default:
            return await this.sendInvitationEmails(eventData.id, guestList);
        }
      }
      
      // Fallback to old template system for events without proper setup
      throw new Error('Event not properly configured for new email system');
      
    } catch (error) {
      console.error('Legacy email sending failed:', error);
      throw error;
    }
  }
}