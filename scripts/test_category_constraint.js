const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const categoryName = 'TEST_UNIQUENESS_' + Date.now();
  
  console.log(`Testing with category: ${categoryName}`);

  // Create Item 1
  const { data: item1, error: error1 } = await supabase
    .from('menu_items')
    .insert({
      name: 'Item 1',
      category: categoryName,
      price: 100,
      description: 'Test Item 1'
    })
    .select()
    .single();

  if (error1) {
    console.error('Error creating Item 1:', error1);
    return;
  }
  console.log('Item 1 created:', item1.id);

  // Create Item 2 with SAME category
  const { data: item2, error: error2 } = await supabase
    .from('menu_items')
    .insert({
      name: 'Item 2',
      category: categoryName,
      price: 200,
      description: 'Test Item 2'
    })
    .select()
    .single();

  if (error2) {
    console.error('Error creating Item 2 (EXPECTED if constraint exists):', error2);
  } else {
    console.log('Item 2 created successfully (No constraint on category):', item2.id);
  }

  // Cleanup
  if (item1) await supabase.from('menu_items').delete().eq('id', item1.id);
  if (item2) await supabase.from('menu_items').delete().eq('id', item2.id);
}

main();
