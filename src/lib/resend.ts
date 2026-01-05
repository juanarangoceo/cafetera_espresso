import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || 're_missing_key';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is missing. Email sending will fail.');
}

export const resend = new Resend(apiKey);
