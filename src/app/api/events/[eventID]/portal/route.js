import sgMail from '@sendgrid/mail';
import { NextResponse } from "next/server";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sender = 'event-sync@bmogul.net'

export async function POST(req) {
  const {to, subject, text, html} = await req.json()
  console.log(body)
  try {
    const msg = {
      to: to, // Change to your recipient
      from: sender,// Change to your verified sender
      subject: subject,
      text: text,
      html: html,
    };

    //await sgMail.send(msg);
    console.log('Email sent');
    return NextResponse.json({ message: 'Email sent successfully'}, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({message: 'HELLO'}, {status: 200})
}
