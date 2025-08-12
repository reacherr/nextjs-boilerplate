import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
imp{ort { creat}eClient } from '@supabase/supabase-js';

const OUT = path.resolve('./qrs');
const BASE = 'https://nextjs-boilerplate-delta-mauve-59.vercel.app';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  const { data: restaurants, error: rErr } = await admin
    .from('restaurants')
    .select('id,slug,name')
    .eq('is_active', true);
  if (rErr) throw rErr;

  for (const r of restaurants ?? []) {
    const { data: tables, error: tErr } = await admin
      .from('tables')
      .select('table_code')
      .eq('restaurant_id', r.id)
      .order('table_code');
    if (tErr) throw tErr;

    for (const t of tables ?? []) {
      const url = `${BASE}/r/${r.slug}/t/${t.table_code}`;
      const file = path.join(OUT, `${r.slug}-${t.table_code}.png`);
      await QRCode.toFile(file, url, {
        margin: 1,
        width: 800,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      console.log('Generated', file, '→', url);
    }
  }
  console.log('All QR codes generated in ./qrs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
