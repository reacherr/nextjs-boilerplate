import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

// Placeholder restaurants
const restaurants = [
  {
    slug: 'green-spoon',
    name: 'The Green Spoon',
    whatsapp_msisdn: '+919876543210',
    google_review_url: 'https://g.page/r/PLACE_ID/review',
  },
  {
    slug: 'royal-tandoor',
    name: 'Royal Tandoor',
    whatsapp_msisdn: '+919123456789',
    google_review_url: 'https://g.page/r/PLACE_ID/review',
  },
  {
    slug: 'noqi-bistro',
    name: 'Noqi Bistro',
    whatsapp_msisdn: '+919000112233',
    google_review_url: 'https://g.page/r/PLACE_ID/review',
  },
];

const tableCodes = Array.from({ length: 12 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);

async function upsertRestaurants() {
  for (const r of restaurants) {
    const { data, error } = await admin
      .from('restaurants')
      .upsert({ ...r, is_active: true }, { onConflict: 'slug' })
      .select('id, slug')
      .single();
    if (error) throw error;

    for (const code of tableCodes) {
      const { error: tErr } = await admin
        .from('tables')
        .upsert({ restaurant_id: data.id, table_code: code }, { onConflict: 'restaurant_id, table_code' });
      if (tErr) throw tErr;
    }
    console.log(`Seeded ${r.slug}`);
  }
}

upsertRestaurants()
  .then(() => {
    console.log('Seed complete');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
