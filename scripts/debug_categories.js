const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching properties...');
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .limit(5);

  for (const property of properties) {
    console.log(`\n--- Property: ${property.name} ---`);
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('name, category')
      .eq('menu_item_properties.property_id', property.id)
      .select('*, menu_item_properties!inner(property_id)');

    if (menuItems && menuItems.length > 0) {
        // Group by category
        const categories = {};
        menuItems.forEach(item => {
            if (!categories[item.category]) categories[item.category] = [];
            categories[item.category].push(item.name);
        });

        console.log('Categories found:', Object.keys(categories));
        Object.keys(categories).forEach(cat => {
            console.log(`  ${cat}: ${categories[cat].length} items`);
            // Print first few items
            console.log(`    Examples: ${categories[cat].slice(0, 3).join(', ')}`);
        });
    } else {
        console.log('No menu items found.');
    }
  }
}

main();
