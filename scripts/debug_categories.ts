
import { getSupabaseAdmin } from '../lib/db/supabase-admin';

async function debugCategories() {
  const propertyId = 'a84226c9-0b9b-44e7-901a-770fdecfc7be'; 
  const adminSupabase = getSupabaseAdmin();

  console.log('--- Debugging Property ---');
  const { data: property, error: propError } = await adminSupabase
    .from('properties')
    .select('id, name, created_by')
    .eq('id', propertyId)
    .single();

  if (propError) {
    console.error('Error fetching property:', propError);
    return;
  }
  console.log('Property:', property);

  if (!property.created_by) {
      console.log('WARNING: Property has no created_by user!');
  }

  console.log('\n--- Debugging Categories (Global) ---');
  const { data: globalCats, error: globalError } = await adminSupabase
    .from('menu_categories')
    .select('id, name, created_by')
    .is('created_by', null);
    
  if (globalError) console.error(globalError);
  console.log(`Found ${globalCats?.length} global categories`);
  console.log(globalCats?.map(c => c.name));

  console.log('\n--- Debugging Categories (Property Owner) ---');
  const { data: ownerCats, error: ownerError } = await adminSupabase
    .from('menu_categories')
    .select('id, name, created_by')
    .eq('created_by', property.created_by);

  if (ownerError) console.error(ownerError);
  console.log(`Found ${ownerCats?.length} owner categories`);
  console.log(ownerCats?.map(c => c.name));

  console.log('\n--- Debugging OR Query used in Page ---');
  const { data: combinedCats, error: combinedError } = await adminSupabase
    .from('menu_categories')
    .select('name, created_by')
    .or(`created_by.eq.${property.created_by},created_by.is.null`);

  if (combinedError) console.error(combinedError);
  console.log(`Found ${combinedCats?.length} combined categories`);
  console.log(combinedCats?.map(c => `${c.name} (${c.created_by ? 'Owner' : 'Global'})`));

}

debugCategories();
