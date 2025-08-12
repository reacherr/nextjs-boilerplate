import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { twilioClient } from '@/lib/twilio';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { slug, tableCode, rating, ua } = req.body || {};
    if (!slug || !tableCode || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Bad request' });
    }

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const { data: table } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('table_code', tableCode)
      .single();

    const ip = (
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      ''
    )
      .split(',')[0]
      .trim();
    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;

    await supabaseAdmin.from('feedback').insert({
      restaurant_id: restaurant.id,
      table_id: table?.id ?? null,
      table_code: tableCode,
      rating,
      ua,
      ip_hash: ipHash,
    });

    if (rating <= 3 && restaurant.whatsapp_msisdn) {
      const to = `whatsapp:${restaurant.whatsapp_msisdn}`;
      const vars = JSON.stringify({
        1: tableCode,
        2: String(rating),
        3: restaurant.name,
      });

      if (process.env.TWILIO_TEMPLATE_SID_ACK) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to,
          contentSid: process.env.TWILIO_TEMPLATE_SID_ACK!,
          contentVariables: vars,
        });
      } else if (process.env.TWILIO_TEMPLATE_SID) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to,
          contentSid: process.env.TWILIO_TEMPLATE_SID!,
          contentVariables: vars,
        });
      } else {
        const body = `ALERT: Table ${tableCode} rated ${rating}/5 at ${restaurant.name}. Please check in.`;
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM!,
          to,
          body,
        });
      }
    }

    const review = restaurant.google_review_url || 'https://g.page/r/PLACE_ID/review';
    if (rating >= 4) return res.status(200).json({ redirectTo: review });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
