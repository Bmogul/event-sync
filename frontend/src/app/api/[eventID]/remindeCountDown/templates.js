export const reminderTemplate = `
<!doctype html>
<html>
  <head>
    <title>{{eventName}} - {{daysUntil}} Days To Go!</title>
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
      <tr>
        <td style="text-align: center">
          <div style="font-size: 0">
            <img
              src="https://i.imgur.com/ripeIdt.png"
              alt="Wedding Invitation"
              style="
                max-width: 200px;
                display: inline-block;
                vertical-align: middle;
              "
            />
          </div>
          <div>
            <img
              src={{logoLink}}
              alt="Wedding Invitation"
              style="
                max-width: 200px;
                display: inline-block;
                vertical-align: middle;
              "
            />
          </div>
        </td>
      </tr>
      <tr style="background-color:#e1c0b7">
        <td style="text-align: center; padding-top: 20px">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px">
            {{daysUntil}} Days Until {{eventName}}!
          </h1>
          <div style="
            background-color: #181818;
            color: #ffffff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px auto;
            max-width: 300px;
          ">
            <p style="font-size: 18px; margin: 0;">
              Event Date: {{eventDate}}
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 20px">
          <div style="padding:10px; text-align:left; font-size: 16px; margin-bottom: 20px; color: black;">
            <p style="font-size: 16px; margin-bottom: 20px">
              Afzalus salaam {{name}},
            </p>
            <p style="text-align: left">
              This is a reminder that our event is approaching in {{daysUntil}} days.
            </p>
            <p style="text-align: left">
Aqa Moula TUS ni raza ane dua Mubarak si hamari piyari dikri Sakina ni shaadi ni masaraat naseeb thai che. Aap ne izan araz karye che, zaroor padharjo

            </p>
            </br>
            <p>

Huzefa and Fatema Mogul
            </p>
          </div>
          
          <div style="
            background-color: #f8f4f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="font-size: 16px; margin: 10px 0;">
              Quick Links:
            </p>
            <a
              href="https://{{{rsvpLink}}}"
              style="
                display: inline-block;
                background-color: #181818;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 24px;
                font-weight: bold;
                margin: 10px;
              "
            >View Event Details</a>
          </div>

          <p style="font-size: 14px; font-style: italic; margin-bottom: 30px">
            You can access the event website at any time to review details or update your response.
          </p>
        </td>
      </tr>
      <tr style="background-color:#e1c0b7">
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
            Event link: {{rsvpLink}}
          </p>
        </td>
      </tr>
      <tr style="background-color:#e1c0b7">
        <td
          style="
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888888;
          "
        >
          <p>
            You are receiving this reminder because you RSVP'd to {{eventName}}.
          </p>
          <p>© 2024 Event-Sync</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
