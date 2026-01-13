const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Inspecting menu_items table...');
  // We can't directly inspect schema with js client easily without SQL, 
  // but we can try to insert dummy data to test constraints if needed, 
  // or just look at existing data.
  
  // Let's check if there are duplicate categories in menu_items
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, category');

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  const categoryCounts = {};
  items.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  console.log('Category usage counts:', categoryCounts);

  // Check unique constraints? 
  // I'll try to insert two items with the same category (and delete them) to see if it fails.
  const testCategory = 'TEST_CATEGORY_UNIQUENESS';
  
  console.log(`\nTesting insertion of two items with category: ${testCategory}`);
  
  const item1 = {
    name: 'Test Item 1',
    category: testCategory,
    price: 100,
    created_by: '00000000-0000-0000-0000-000000000000' // This might fail if created_by FK constraint exists
  };

  // We need a valid user ID potentially. 
  // Let's skip insertion test for now and just rely on observation of existing data 
  // and maybe check if 'menu_categories' has a unique constraint that is being misused.

  console.log('\nInspecting menu_categories table...');
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('*');
    
  if (catError) console.error(catError);
  else console.log('Categories:', categories);

}

main();
