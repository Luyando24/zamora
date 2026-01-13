const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCategories() {
  console.log('Starting category migration...');

  // 1. Fetch all global categories (property_id IS NULL)
  const { data: globalCategories, error: fetchError } = await supabase
    .from('menu_categories')
    .select('*')
    .is('property_id', null);

  if (fetchError) {
    console.error('Error fetching global categories:', fetchError);
    return;
  }
  console.log(`Found ${globalCategories.length} global categories.`);

  // 2. Fetch all properties
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, name');

  if (propError) {
    console.error('Error fetching properties:', propError);
    return;
  }
  console.log(`Found ${properties.length} properties.`);

  // 3. For each property, ensure it has a copy of the global categories
  for (const prop of properties) {
    console.log(`Processing property: ${prop.name} (${prop.id})`);
    
    // Fetch existing categories for this property
    const { data: existingCats } = await supabase
      .from('menu_categories')
      .select('name')
      .eq('property_id', prop.id);
      
    const existingNames = new Set(existingCats?.map(c => c.name) || []);

    const newCategoriesToInsert = [];
    
    for (const globalCat of globalCategories) {
      if (!existingNames.has(globalCat.name)) {
        // Add to list for insertion
        newCategoriesToInsert.push({
          name: globalCat.name,
          property_id: prop.id,
          created_by: globalCat.created_by // Preserve creator if possible, or use system/admin
        });
        existingNames.add(globalCat.name); // Prevent duplicates within this loop if globals have duplicates
      }
    }

    if (newCategoriesToInsert.length > 0) {
      console.log(`  Adding ${newCategoriesToInsert.length} categories...`);
      const { error: insertError } = await supabase
        .from('menu_categories')
        .insert(newCategoriesToInsert);
        
      if (insertError) {
        console.error(`  Error inserting categories for ${prop.name}:`, insertError);
      }
    } else {
      console.log('  No new categories to add.');
    }
  }

  // 4. Delete global categories
  if (globalCategories.length > 0) {
    console.log('Deleting global categories...');
    const { error: deleteError } = await supabase
      .from('menu_categories')
      .delete()
      .is('property_id', null);

    if (deleteError) {
      console.error('Error deleting global categories:', deleteError);
    } else {
      console.log('Successfully deleted global categories.');
    }
  }

  console.log('Migration complete.');
}

migrateCategories();
