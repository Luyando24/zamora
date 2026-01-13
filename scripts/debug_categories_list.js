const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching menu_categories...');
  const { data: categories, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${categories.length} categories.`);
  categories.forEach(cat => {
    console.log(`- "${cat.name}" (ID: ${cat.id}, Property: ${cat.property_id || 'Global'})`);
  });
}

main();
