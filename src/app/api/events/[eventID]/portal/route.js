import sgMail from '@sendgrid/mail';
import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../../../lib/google-sheets";
import bcrypt from 'bcrypt'

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sender = 'event-sync@bmogul.net'

export async function POST(req) {

  const body = await req.json()
  if (body.password) {
    // Check Password with sheet
    const sheetID = process.env.GOOGLE_SHEET_ID
    const sheets = await getGoogleSheets();
    try {
      const webdata = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "WebsiteData"
      })
      const password = webdata.data.values[0][1]
      if (password === body.password) {
        let allUsers = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetID,
          range: "Main"
        })
        allUsers = allUsers.data.values
        const keys = allUsers.shift()
        const selectedKeys = [keys[0], keys[1], keys[4], keys[5], keys[10], keys[11]]
        const selectedIndexes = [0, 1, 4, 5, 10, 11]

        allUsers = allUsers.map((user) => {
          return selectedKeys.reduce((obj, key, index) => {
            obj[key] = user[selectedIndexes[index]]
            return obj
          }, {})
        })
        return NextResponse.json({ validated: true, guestList: allUsers }, { status: 200 })
      } else {
        return NextResponse.json({ validated: false }, { status: 200 })
      }
    } catch (error) {
      return NextResponse.json({ message: error }, { status: 200 })
    }
  } else {
    if (body.to) {
      const { to, subject, text, html } = body
      try {
        const msg = {
          to: to, // Change to your recipient
          from: sender,// Change to your verified sender
          subject: subject,
          text: text,
          html: html,
        };

        await sgMail.send(msg);
        console.log('Email sent');
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
      } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: "Failed" }, { status: 400 })

}

async function GET(req) {
  const body = await req.json()

  if (body.password) {
    return NextResponse.json({ message: body.password }, { status: 200 })
  }
  if (body.getUsers) {
    // get all users
    try {
      const allUsers = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "Main"
      })
      return NextResponse.json({ messgae: allUsers }, { status: 200 })
    } catch (error) {
      return NextResponse.json({ messgae: errors }, { status: 400 })
    }
  }

  return NextResponse.json({ error: "Failed" }, { status: 400 })
}

export async function handler(req, res) {
  if (req.method === 'POST')
    return await POST(req)
  if (req.method === 'GET')
    return await GET(req)
  return NextResponse.json({ error: "Failed" }, { status: 400 })
}
