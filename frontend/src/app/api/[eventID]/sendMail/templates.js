export const inviteTemplate = `
<!doctype html>
<html lang="en">
  <head>
    <title>{{eventName}}</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!--<![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap" rel="stylesheet">
  </head>
  <body
    style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    "
  >
    <!-- Main Container -->
    <table
      align="center"
      cellpadding="0"
      cellspacing="0"
      style="
        max-width: 640px;
        width: 100%;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.2);
      "
    >
      <!-- Logo Section -->
      {{#if logoLink}}
      <tr>
        <td style="text-align: center; padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
;">
          <img
            src="{{logoLink}}"
            alt="{{eventName}} Logo"
            style="
              max-width: 200px;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            "
          />
        </td>
      </tr>
      {{/if}}
      
      <!-- Header Section -->
      <tr>
        <td 
          style="
            background: linear-gradient(135deg, {{secondary_color}} 0%, {{secondary_color}}dd 100%);
            padding: 50px 40px;
            text-align: center;
            position: relative;
          "
        >
          <div style="position: relative; z-index: 2;">
            <h1 
              style="
                font-family: '"Dancing Script", cursive';
                font-size: 32px;
                font-weight: 700;
                color: {{text_color}};
                margin: 0 0 16px 0;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              "
            >
              {{eventName}}
            </h1>
          </div>
        </td>
      </tr>
      
      <!-- Main Content -->
      <tr>
        <td 
          style="
            background: {{primary_color}};
            padding: 50px 40px;
          "
        >
          <!-- Message Content -->
          <div style="margin-bottom: 40px;">
            <p 
              style="
                font-size: 20px;
                color: {{text_color}};
                margin: 0 0 24px 0;
                font-weight: 500;
              "
            >
            </p>
            
            <div 
              style="
                background: rgba(0, 0, 0, 0.02);
                padding: 30px;
                border-radius: 12px;
                border-left: 4px solid {{secondary_color}};
                margin: 30px 0;
              "
            >
              <p 
                style="
                  font-size: 18px;
                  color: {{text_color}};
                  margin: 0;
                  line-height: 1.8;
                  font-style: italic;
                "
              >
                {{body}}
              </p>
            </div>

            <p 
              style="
                font-size: 18px;
                color: {{text_color}};
                margin: 24px 0 16px 0;
              "
            >
              {{signoff}}
            </p>
            
            {{#if senderName}}
            <p 
              style="
                font-size: 18px;
                font-weight: 600;
                color: {{text_color}};
                margin: 0;
              "
            >
              {{senderName}}
            </p>
            {{/if}}
          </div>

          <!-- CTA Section -->
          <div style="text-align: center; margin: 50px 0;">
            <p 
              style="
                font-size: 18px;
                color: {{text_color}};
                margin: 0 0 30px 0;
                font-weight: 500;
              "
            >
              Please RSVP to help us plan this special celebration
            </p>
            
   <a
  href="{{rsvpLink}}"
  target="_blank"
  data-sg-no-track="true"
  style="
    display: inline-block;
    background-color: #667eea;
    color: #ffffff;
    text-decoration: none;
    padding: 18px 40px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 1px;
  "
>
  RSVP Now
</a>
            
            <p 
              style="
                font-size: 14px;
                color: #6b7280;
                margin: 24px 0 0 0;
                font-style: italic;
              "
            >
              You can update your response anytime before the event
            </p>
          </div>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td 
          style="
            background: linear-gradient(135deg, {{secondary_color}} 0%, {{secondary_color}}cc 100%);
            padding: 40px;
            text-align: center;
          "
        >
          <div style="margin-bottom: 24px;">
            <p 
              style="
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 8px 0;
                font-weight: 500;
              "
            >
              Questions? We're here to help!
            </p>
            <a 
              href="mailto:info@event-sync.com" 
              style="
                color: {{text_color}};
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
              "
            >
              info@event-sync.com
            </a>
          </div>
          
          <div 
            style="
              padding-top: 24px;
              border-top: 1px solid rgba(107, 114, 128, 0.3);
            "
          >
            <p 
              style="
                font-size: 14px;
                color: #9ca3af;
                margin: 0 0 8px 0;
              "
            >
              Can't click the button? Copy and paste this link:
            </p>
            <p 
              style="
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 16px 0;
                word-break: break-all;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.05);
                padding: 8px 12px;
                border-radius: 6px;
                display: inline-block;
                max-width: 100%;
              "
            >
              {{rsvpLink}}
            </p>
          </div>
          
          <div 
            style="
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid rgba(107, 114, 128, 0.2);
            "
          >
            <p 
              style="
                font-size: 13px;
                color: #9ca3af;
                margin: 0 0 8px 0;
              "
            >
              You received this invitation because you were invited to {{eventName}}
            </p>
            <p 
              style="
                font-size: 13px;
                color: #9ca3af;
                margin: 0;
              "
            >
              Powered by <strong>Event-Sync</strong> © 2024
            </p>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const reminderTemplate = `
<!doctype html>
<html>
  <head>
    <title>Reminder: {{eventName}}</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      color: #333;
      background-color: #f7f7f7;
      margin: 0;
      padding: 20px;
    "
  >
    <table
      align="center"
      bgcolor="#ffffff"
      cellpadding="20"
      cellspacing="0"
      style="
        max-width: 600px;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      "
    >
      {{#if logoLink}}
      <tr>
        <td style="text-align: center">
          <div>
            <img
              src="{{logoLink}}"
              alt="Event Logo"
              style="
                max-width: 200px;
                display: inline-block;
                vertical-align: middle;
              "
            />
          </div>
        </td>
      </tr>
      {{/if}}
      <tr style="background-color:#ffeb3b; color: #333;">
        <td style="text-align: center; padding-top: 20px">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px">
            Event Reminder: {{eventName}}
          </h1>
          {{#if eventDate}}
          <p style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">
            {{eventDate}}
          </p>
          {{/if}}
          <p style="font-size: 16px; margin-bottom: 20px">Don't forget about this upcoming event!</p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 20px">
          <div style="padding: 10px; text-align: left; font-size: 16px; margin-bottom: 20px; color: black;">
            {{#if guestName}}
            <p style="margin-bottom: 15px">Dear {{guestName}},</p>
            {{/if}}
            <p style="margin-bottom: 20px">
              This is a friendly reminder about the upcoming event: <strong>{{eventName}}</strong>
            </p>
            {{#if body}}
            <p style="margin-bottom: 20px">
              {{body}}
            </p>
            {{/if}}
            <p style="margin-bottom: 20px">
              We look forward to seeing you there!
            </p>
            {{#if senderName}}
            <p style="margin-bottom: 10px">
              {{senderName}}
            </p>
            {{/if}}
          </div>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Please click the link below to view details or update your RSVP.
          </p>
          <a
            href="{{rsvpLink}}"
            style="
              display: inline-block;
              background-color: #ff9800;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 24px;
              font-weight: bold;
            "
          >View Event Details</a>
        </td>
      </tr>
      <tr style="background-color:#fff3e0">
        <td
          style="
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #888888;
          "
        >
          <p>For any questions contact: info@event-sync.com</p>
          <p>
            Use the following link if the button does not work: {{rsvpLink}}
          </p>
        </td>
      </tr>
      <tr style="background-color:#fff3e0">
        <td
          style="
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888888;
          "
        >
          <p>
            You are receiving this reminder because you were invited to {{eventName}}.
          </p>
          <p>© 2024 Event-Sync</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
