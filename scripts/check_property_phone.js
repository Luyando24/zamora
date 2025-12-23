const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProperties() {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, name, admin_notification_phone');

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  console.log('Properties and their notification phones:');
  properties.forEach(p => {
    console.log(`- ${p.name} (${p.id}): ${p.admin_notification_phone || 'NOT SET'}`);
  });
}

checkProperties();
