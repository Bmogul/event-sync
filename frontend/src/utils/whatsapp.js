/**
 * WhatsApp "Click to Chat" Link Generation Service
 *
 * Robust WhatsApp link generation following best practices:
 * - Proper URL encoding to prevent link breakage
 * - HTTPS-only links for better domain reputation
 * - Clean message formatting for maximum compatibility
 * - Support for both wa.me and api.whatsapp.com formats
 * - Comprehensive validation and debugging tools
 *
 * References:
 * - https://faq.whatsapp.com/591407391054482
 * - https://wa.me/ format documentation
 */

const WHATSAPP_MESSAGE_LIMIT = 4096; // WhatsApp character limit

/**
 * Normalize phone number to international format (digits only)
 *
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number (digits only)
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all non-digit characters
  const normalized = phone.replace(/\D/g, '');

  return normalized;
}

/**
 * Format WhatsApp message for optimal compatibility
 *
 * Best practices:
 * - Place links on their own line
 * - Add whitespace before URLs
 * - Keep emojis away from URLs
 * - Use double line breaks for clarity
 *
 * @param {string} message - Message text
 * @param {string} link - Optional URL to append
 * @returns {string} Formatted message
 */
export function formatWhatsAppMessage(message, link = null) {
  if (!message) return '';

  // Strip any potentially dangerous HTML/script tags
  let cleanMessage = message
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');

  // If there's a link, ensure it's on its own line with proper spacing
  if (link) {
    // Remove trailing whitespace from message
    cleanMessage = cleanMessage.trimEnd();

    // Add double line break before link for better formatting
    cleanMessage = `${cleanMessage}\n\n${link}`;
  }

  return cleanMessage;
}

/**
 * Generate WhatsApp "Click to Chat" link
 *
 * Creates properly encoded WhatsApp links that work reliably across:
 * - iOS and Android
 * - WhatsApp Web
 * - Different network conditions
 * - Various domain reputations
 *
 * @param {string} phone - Phone number (will be normalized)
 * @param {string} message - Message text
 * @param {Object} options - Configuration options
 * @param {boolean} options.useApi - Use api.whatsapp.com instead of wa.me
 * @param {boolean} options.formatMessage - Auto-format message (default: true)
 * @returns {string} WhatsApp click-to-chat URL
 *
 * @example
 * const link = generateWhatsAppLink(
 *   '+1 555-123-4567',
 *   'Hi John! RSVP here: https://event.com/rsvp?id=123'
 * );
 * // Returns: https://wa.me/15551234567?text=Hi%20John!%20RSVP%20here%3A%0A...
 */
export function generateWhatsAppLink(phone, message, options = {}) {
  const {
    useApi = false,
    formatMessage: shouldFormat = false,
  } = options;

  // Normalize phone number (remove all non-digits)
  const normalizedPhone = normalizePhoneNumber(phone);

  // Prepare message
  let finalMessage = message || '';

  // Optional: format message for better compatibility
  if (shouldFormat && finalMessage) {
    // Extract any URLs from the message
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = finalMessage.match(urlRegex);

    if (urls && urls.length > 0) {
      // Format with the last URL as a separate line
      const lastUrl = urls[urls.length - 1];
      const messageWithoutLastUrl = finalMessage.replace(lastUrl, '').trim();
      finalMessage = formatWhatsAppMessage(messageWithoutLastUrl, lastUrl);
    }
  }

  // Warn about message length
  if (finalMessage.length > WHATSAPP_MESSAGE_LIMIT) {
    console.warn(
      `WhatsApp message exceeds ${WHATSAPP_MESSAGE_LIMIT} character limit. ` +
      `Current length: ${finalMessage.length}. Message may be truncated.`
    );
  }

  // Properly encode the message
  // encodeURIComponent handles all special characters including:
  // &, ?, =, #, /, :, and Unicode characters
  const encodedMessage = encodeURIComponent(finalMessage);

  // Generate link based on format preference
  if (useApi) {
    // api.whatsapp.com format
    if (normalizedPhone) {
      return `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMessage}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedMessage}`;
  } else {
    // wa.me format (default, more modern)
    if (normalizedPhone) {
      return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
    }
    return `https://wa.me/?text=${encodedMessage}`;
  }
}

/**
 * Validate WhatsApp link for common issues
 *
 * Checks for:
 * - Proper HTTPS usage
 * - Correct encoding
 * - Valid phone number format
 * - Message length
 *
 * @param {string} link - WhatsApp link to validate
 * @returns {Object} Validation result with errors and warnings
 */
export function validateWhatsAppLink(link) {
  const errors = [];
  const warnings = [];

  // Check HTTPS
  if (!link.startsWith('https://')) {
    errors.push('Link must use HTTPS for better domain reputation and security');
  }

  // Check for valid WhatsApp domain
  if (!link.includes('wa.me') && !link.includes('api.whatsapp.com')) {
    errors.push('Link must use wa.me or api.whatsapp.com domain');
  }

  // Extract text parameter
  const textMatch = link.match(/[?&]text=([^&]*)/);
  if (textMatch) {
    const encodedText = textMatch[1];

    // Check if text contains unencoded special characters
    if (encodedText.includes('&') && !encodedText.match(/%26/)) {
      errors.push('Text parameter contains unencoded special characters (&)');
    }
    if (encodedText.includes('?') && !encodedText.match(/%3F/)) {
      errors.push('Text parameter contains unencoded special characters (?)');
    }

    // Decode and check message length
    try {
      const decodedText = decodeURIComponent(encodedText);
      if (decodedText.length > WHATSAPP_MESSAGE_LIMIT) {
        warnings.push(
          `Message length (${decodedText.length}) exceeds WhatsApp limit (${WHATSAPP_MESSAGE_LIMIT})`
        );
      }
    } catch (e) {
      errors.push('Text parameter is not properly URL encoded');
    }
  }

  // Extract phone number
  const phoneMatch = link.match(/wa\.me\/([^?&\s]+)|phone=([^?&\s]+)/);
  if (phoneMatch) {
    const phone = phoneMatch[1] || phoneMatch[2];
    if (!/^\d+$/.test(phone)) {
      warnings.push('Phone number contains non-digit characters');
    }
  } else {
    warnings.push('No phone number specified (link will open WhatsApp but not pre-select contact)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Debug WhatsApp link
 *
 * Provides detailed information about a WhatsApp link for troubleshooting:
 * - Decoded message
 * - Phone number
 * - Message length
 * - Embedded URLs
 * - Validation results
 *
 * @param {string} link - WhatsApp link to debug
 * @returns {Object} Debug information
 */
export function debugWhatsAppLink(link) {
  const validation = validateWhatsAppLink(link);

  // Extract components
  const textMatch = link.match(/[?&]text=([^&]*)/);
  const phoneMatch = link.match(/wa\.me\/(\d+)|phone=(\d+)/);

  let decodedMessage = '';
  let embeddedUrls = [];

  if (textMatch) {
    try {
      decodedMessage = decodeURIComponent(textMatch[1]);

      // Extract embedded URLs from message
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      embeddedUrls = decodedMessage.match(urlRegex) || [];
    } catch (e) {
      decodedMessage = '[ERROR: Could not decode message]';
    }
  }

  const phoneNumber = phoneMatch ? (phoneMatch[1] || phoneMatch[2]) : null;

  // Determine format
  const format = link.includes('api.whatsapp.com') ? 'api.whatsapp.com' : 'wa.me';

  return {
    url: link,
    format,
    phoneNumber,
    decodedMessage,
    messageLength: decodedMessage.length,
    embeddedUrls,
    validation,
    testInstructions: [
      '1. Copy the URL above',
      '2. Paste it into a browser\'s address bar',
      '3. Check if WhatsApp Web opens with the message pre-filled',
      '4. Verify all embedded links are clickable (blue text)',
      '5. Test on both sender and recipient devices',
    ].join('\n'),
  };
}

/**
 * Create WhatsApp link for event invitation
 *
 * Convenience function for creating event invitation links
 * with proper formatting and encoding.
 *
 * @param {Object} params - Invitation parameters
 * @param {string} params.phone - Guest phone number
 * @param {string} params.guestName - Guest name
 * @param {string} params.eventTitle - Event title
 * @param {string} params.rsvpUrl - RSVP URL
 * @param {string} params.customMessage - Optional custom message template
 * @returns {string} WhatsApp link
 *
 * @example
 * const link = createEventInvitationLink({
 *   phone: '+1 555-123-4567',
 *   guestName: 'John Doe',
 *   eventTitle: 'Summer Wedding 2024',
 *   rsvpUrl: 'https://event-sync.app/rsvp?id=xyz'
 * });
 */
export function createEventInvitationLink(params) {
  const {
    phone,
    guestName = 'Guest',
    eventTitle = 'our event',
    rsvpUrl,
    customMessage = null,
  } = params;

  // Use custom message or default template
  let message;
  if (customMessage) {
    message = customMessage;
  } else {
    // Default template following best practices:
    // - Emoji at the start (away from URL)
    // - URL on its own line at the end
    // - Double line breaks for clarity
    message = `Hi ${guestName}! 🎉\n\nYou're invited to ${eventTitle}.\n\nPlease RSVP here:\n${rsvpUrl}`;
  }

  return generateWhatsAppLink(phone, message);
}

/**
 * Batch generate WhatsApp links for multiple guests
 *
 * @param {Array} guests - Array of guest objects
 * @param {Function} messageTemplate - Function that takes guest and returns message
 * @returns {Array} Array of objects with guest info and WhatsApp link
 */
export function batchGenerateWhatsAppLinks(guests, messageTemplate) {
  return guests.map((guest) => {
    const message = messageTemplate(guest);
    const link = generateWhatsAppLink(guest.phone, message);

    return {
      guest,
      link,
      validation: validateWhatsAppLink(link),
    };
  });
}
