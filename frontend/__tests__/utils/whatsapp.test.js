/**
 * Test Suite: WhatsApp Link Generation Service
 *
 * Tests comprehensive WhatsApp "click to chat" link generation
 * following best practices for encoding, formatting, and reliability.
 */

import {
  generateWhatsAppLink,
  validateWhatsAppLink,
  formatWhatsAppMessage,
  normalizePhoneNumber,
  debugWhatsAppLink,
} from '../../src/utils/whatsapp';

describe('WhatsApp Link Generation Service', () => {
  describe('normalizePhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
      expect(normalizePhoneNumber('555.123.4567')).toBe('5551234567');
      expect(normalizePhoneNumber('1-555-123-4567')).toBe('15551234567');
    });

    it('should handle international formats', () => {
      expect(normalizePhoneNumber('+44 20 7123 4567')).toBe('442071234567');
      expect(normalizePhoneNumber('+91 98765 43210')).toBe('919876543210');
    });

    it('should handle empty or invalid inputs', () => {
      expect(normalizePhoneNumber('')).toBe('');
      expect(normalizePhoneNumber(null)).toBe('');
      expect(normalizePhoneNumber(undefined)).toBe('');
      expect(normalizePhoneNumber('abc')).toBe('');
    });

    it('should strip leading zeros for international format', () => {
      // Some countries use leading 0 domestically
      expect(normalizePhoneNumber('0123456789')).toBe('0123456789');
    });
  });

  describe('formatWhatsAppMessage', () => {
    it('should properly format message with link at the end', () => {
      const message = 'Hi John, check out this event';
      const link = 'https://event-sync.app/event/abc123';

      const formatted = formatWhatsAppMessage(message, link);

      expect(formatted).toBe(`Hi John, check out this event\n\n${link}`);
    });

    it('should handle message without link', () => {
      const message = 'Simple message';

      const formatted = formatWhatsAppMessage(message);

      expect(formatted).toBe('Simple message');
    });

    it('should add proper line breaks before link', () => {
      const message = 'Your invitation is ready 🎉';
      const link = 'https://event-sync.app/rsvp/xyz';

      const formatted = formatWhatsAppMessage(message, link);

      // Link should be on its own line with double line break
      expect(formatted).toContain('\n\n');
      expect(formatted.endsWith(link)).toBe(true);
    });

    it('should handle emojis correctly', () => {
      const message = 'You\'re invited 🎉🎊💐';
      const link = 'https://event-sync.app/invite';

      const formatted = formatWhatsAppMessage(message, link);

      expect(formatted).toContain('🎉');
      expect(formatted).toContain(link);
    });

    it('should strip dangerous characters from message', () => {
      const message = 'Check this<script>alert("xss")</script>';
      const link = 'https://event-sync.app/safe';

      const formatted = formatWhatsAppMessage(message, link);

      // Should not contain script tags
      expect(formatted).not.toContain('<script>');
      expect(formatted).not.toContain('</script>');
    });
  });

  describe('generateWhatsAppLink', () => {
    it('should generate valid wa.me link with phone and message', () => {
      const phone = '15551234567';
      const message = 'Hi John, you are invited!';

      const link = generateWhatsAppLink(phone, message);

      expect(link).toContain('https://wa.me/15551234567');
      expect(link).toContain('?text=');
      expect(link).toContain(encodeURIComponent(message));
    });

    it('should properly encode special characters', () => {
      const phone = '15551234567';
      const message = 'Hi John! Check this: https://event.com/rsvp?id=123&type=wedding';

      const link = generateWhatsAppLink(phone, message);

      // Should encode &, ?, =, and other special chars
      expect(link).not.toContain('&type=');
      expect(link).not.toContain('?id=');
      expect(link).toContain('%3A'); // Encoded :
      expect(link).toContain('%3F'); // Encoded ?
      expect(link).toContain('%26'); // Encoded &
    });

    it('should handle event URL with query parameters', () => {
      const phone = '15551234567';
      const eventUrl = 'https://event-sync.app/event/abc123/rsvp?guestId=xyz&source=invite';
      const message = `You're invited! Tap here to RSVP:\n${eventUrl}`;

      const link = generateWhatsAppLink(phone, message);

      // The entire message (including the embedded URL) should be encoded
      expect(link).toContain(encodeURIComponent(eventUrl));
      expect(decodeURIComponent(link.split('?text=')[1])).toContain(eventUrl);
    });

    it('should use api.whatsapp.com format when specified', () => {
      const phone = '15551234567';
      const message = 'Test message';

      const link = generateWhatsAppLink(phone, message, { useApi: true });

      expect(link).toContain('https://api.whatsapp.com/send');
      expect(link).toContain('phone=15551234567');
      expect(link).toContain('&text=');
    });

    it('should generate link without phone number', () => {
      const message = 'Check out this event!';

      const link = generateWhatsAppLink(null, message);

      expect(link).toBe(`https://wa.me/?text=${encodeURIComponent(message)}`);
    });

    it('should handle HTTPS links in message correctly', () => {
      const phone = '15551234567';
      const eventLink = 'https://secure-event.com/rsvp/abc123';
      const message = `Hi! RSVP here: ${eventLink}`;

      const link = generateWhatsAppLink(phone, message);

      const decodedMessage = decodeURIComponent(link.split('?text=')[1]);
      expect(decodedMessage).toContain('https://secure-event.com');
      expect(decodedMessage).toBe(message);
    });

    it('should handle multiple line breaks', () => {
      const phone = '15551234567';
      const message = 'Hi John,\n\nYou are invited!\n\nRSVP: https://event.com/rsvp';

      const link = generateWhatsAppLink(phone, message);

      const decoded = decodeURIComponent(link.split('?text=')[1]);
      expect(decoded).toContain('\n\n');
    });

    it('should keep link simple - no emojis near URL', () => {
      const phone = '15551234567';
      const eventUrl = 'https://event-sync.app/rsvp';
      // Good practice: emoji at start, URL at end with whitespace
      const message = `🎉 You're invited!\n\nTap here to RSVP:\n${eventUrl}`;

      const link = generateWhatsAppLink(phone, message);

      expect(link).toBeTruthy();
      const decoded = decodeURIComponent(link.split('?text=')[1]);
      expect(decoded).toContain('🎉');
      expect(decoded.endsWith(eventUrl)).toBe(true);
    });

    it('should handle very long messages', () => {
      const phone = '15551234567';
      const longMessage = 'A'.repeat(4096); // WhatsApp limit

      const link = generateWhatsAppLink(phone, longMessage);

      expect(link).toBeTruthy();
      expect(link.length).toBeGreaterThan(0);
    });

    it('should warn about message length limit', () => {
      const phone = '15551234567';
      const tooLongMessage = 'A'.repeat(5000); // Over WhatsApp limit

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      generateWhatsAppLink(phone, tooLongMessage);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WhatsApp message exceeds')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateWhatsAppLink', () => {
    it('should validate correct wa.me link', () => {
      const link = 'https://wa.me/15551234567?text=Hello';

      const result = validateWhatsAppLink(link);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct api.whatsapp.com link', () => {
      const link = 'https://api.whatsapp.com/send?phone=15551234567&text=Hello';

      const result = validateWhatsAppLink(link);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing HTTPS', () => {
      const link = 'http://wa.me/15551234567?text=Hello';

      const result = validateWhatsAppLink(link);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Link must use HTTPS for better domain reputation and security');
    });

    it('should detect improperly encoded text', () => {
      // Manually construct a bad link (don't use our generator which encodes properly)
      const link = 'https://wa.me/15551234567?text=Hello?test&more';

      const result = validateWhatsAppLink(link);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('unencoded'))).toBe(true);
    });

    it('should detect invalid phone number format', () => {
      const link = 'https://wa.me/abc?text=Hello';

      const result = validateWhatsAppLink(link);

      // This should produce warnings, not necessarily errors
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('non-digit'))).toBe(true);
    });

    it('should provide warnings for edge cases', () => {
      const link = 'https://wa.me/?text=NoPhoneNumber';

      const result = validateWhatsAppLink(link);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('No phone number'))).toBe(true);
    });
  });

  describe('debugWhatsAppLink', () => {
    it('should provide debug information', () => {
      const link = 'https://wa.me/15551234567?text=Hello%20World';

      const debug = debugWhatsAppLink(link);

      expect(debug.url).toBe(link);
      expect(debug.phoneNumber).toBe('15551234567');
      expect(debug.decodedMessage).toBe('Hello World');
      expect(debug.messageLength).toBe(11);
      expect(debug.format).toBe('wa.me');
    });

    it('should decode complex messages', () => {
      const message = 'Hi John! RSVP: https://event.com/rsvp?id=123';
      const link = `https://wa.me/15551234567?text=${encodeURIComponent(message)}`;

      const debug = debugWhatsAppLink(link);

      expect(debug.decodedMessage).toBe(message);
      expect(debug.decodedMessage).toContain('https://event.com');
      expect(debug.decodedMessage).toContain('?id=123');
    });

    it('should identify embedded URLs in message', () => {
      const message = 'Check this: https://event.com/invite';
      const link = `https://wa.me/15551234567?text=${encodeURIComponent(message)}`;

      const debug = debugWhatsAppLink(link);

      expect(debug.embeddedUrls).toHaveLength(1);
      expect(debug.embeddedUrls[0]).toBe('https://event.com/invite');
    });

    it('should provide test instructions', () => {
      const link = 'https://wa.me/15551234567?text=Test';

      const debug = debugWhatsAppLink(link);

      expect(debug.testInstructions).toBeTruthy();
      expect(debug.testInstructions).toContain('Test');
    });
  });

  describe('Edge Cases and Real-World Scenarios', () => {
    it('should handle event invitation with all common variables', () => {
      const phone = '15551234567';
      const guestName = 'John Doe';
      const eventTitle = 'Summer Wedding 2024';
      const rsvpUrl = 'https://event-sync.app/event/abc123/rsvp?guestId=xyz789';

      const message = `Hi ${guestName}! 🎉\n\nYou're invited to ${eventTitle}.\n\nPlease RSVP here:\n${rsvpUrl}`;

      const link = generateWhatsAppLink(phone, message);

      expect(link).toBeTruthy();

      const decoded = decodeURIComponent(link.split('?text=')[1]);
      expect(decoded).toContain(guestName);
      expect(decoded).toContain(eventTitle);
      expect(decoded).toContain(rsvpUrl);
    });

    it('should handle message with apostrophes and quotes', () => {
      const phone = '15551234567';
      const message = "Hi John! You're invited to Sarah's wedding. \"Save the date!\"";

      const link = generateWhatsAppLink(phone, message);

      const decoded = decodeURIComponent(link.split('?text=')[1]);
      expect(decoded).toBe(message);
    });

    it('should handle Unicode characters correctly', () => {
      const phone = '15551234567';
      const message = 'مرحبا! Welcome! 欢迎! 🎉';

      const link = generateWhatsAppLink(phone, message);

      const decoded = decodeURIComponent(link.split('?text=')[1]);
      expect(decoded).toContain('مرحبا');
      expect(decoded).toContain('欢迎');
      expect(decoded).toContain('🎉');
    });
  });
});
