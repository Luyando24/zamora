const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking for triggers on menu_items...');
  
  // We can't query information_schema easily with JS client unless we have a function for it 
  // or raw sql access. 
  // But we can check if there are any RLS policies that might block updates based on category?
  
  // Or maybe we can just try to reproduce the "cannot assign to more than 1 item" behavior
  // by creating a category, assigning it to Item 1, then Item 2, and checking the result.
  
  const categoryName = 'TEST_REPRO_' + Date.now();
  console.log(`Using category: ${categoryName}`);

  // 1. Create Item 1
  const { data: item1, error: e1 } = await supabase.from('menu_items').insert({
    name: 'Item 1', category: categoryName, price: 100
  }).select().single();
  
  if (e1) { console.error('Item 1 failed:', e1); return; }
  console.log('Item 1 created with category:', item1.category);

  // 2. Create Item 2
  const { data: item2, error: e2 } = await supabase.from('menu_items').insert({
    name: 'Item 2', category: categoryName, price: 200
  }).select().single();

  if (e2) { console.error('Item 2 failed:', e2); }
  else { console.log('Item 2 created with category:', item2.category); }

  // Cleanup
  await supabase.from('menu_items').delete().eq('category', categoryName);
}

main();
