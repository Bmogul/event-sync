export const inviteTemplate = `
<!doctype html>
<html>
  <head>
    <title>{{eventName}}</title>
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
</div><div>
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
            {{eventName}}
          </h1>
          <p style="font-size: 16px; margin-bottom: 20px">We invite you to share this special day with us.</p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 20px">
<div style="padding:10px; text-align:left;font-size: 16px; margin-bottom: 20px; color: black;">
          <p style="font-size: 16px; margin-bottom: 20px">
            Afzalus salaam
          </p>
          <p style="text-align: left">
Aqa Moula TUS ni raza ane dua Mubarak si hamari piyari dikri Sakina ni shaadi ni masaraat naseeb thai che. Aap ne izan araz karye che, zaroor padharjo
</p>
</br>
<p>
Huzefa and Fatema Mogul
</p>
</div>
Please click the link below to view details and
            RSVP at your earliest convenience.
          </p>
          <p style="font-size: 14px; font-style: italic; margin-bottom: 30px">
            If you ever need to check your response or see any details, the
            website will be available.
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
            "
            >RSVP Now</a
          >
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
            Use the following link if the button does not work: {{rsvpLink}}
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
            You are receiving this email because you were invited to {{eventName}}.
          </p>
          <p>
            If you wish to unsubscribe, please
            <a href="#" style="color: #888888">click here</a>.
          </p>
          <p>© 2024 Event-Sync</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const reminderTemplate = ``;
