import { NextResponse } from 'next/server';
import mongoClientPromise from '@/lib/mongodb';



export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Please complete all fields.' }, { status: 400 });
    }

    const { name, email, message } = body as Record<string, unknown>;
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Please complete all fields.' }, { status: 400 });
    }
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();
    if (!cleanName || cleanName.length > 100 || !/^\S+@\S+\.\S+$/.test(cleanEmail) || cleanEmail.length > 254 || !cleanMessage || cleanMessage.length > 4000) {
      return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });
    }

    const client = await mongoClientPromise;
    await client.db(process.env.MONGODB_DB || 'portfolio').collection('contacts').insertOne({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      createdAt: new Date(),
    });

    let emailSent = false;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    if (apiKey && from) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [cleanEmail],
            subject: 'Thanks for getting in touch',
            text: `Hi ${cleanName},\n\nThanks for reaching out. Your message has been received, and I’ll get back to you soon.\n\n— OGX`,
          }),
        });
        emailSent = emailResponse.ok;
      } catch {
        emailSent = false;
      }
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch {
    return NextResponse.json({ error: 'We could not save your message right now. Please try again.' }, { status: 500 });
  }
}
