
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ssmcagewssgtfknyrjmx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWNhZ2V3c3NndGZrbnlyam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzYwNzIsImV4cCI6MjA4MDYxMjA3Mn0.Tl5p3whmAff8tMLkemVi8xjuxut27JBdRDyIAz_Ad2w';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  console.log('Testing fetch from menu_items...');
  try {
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name')
      .limit(5);

    if (itemsError) console.error('Error fetching items:', itemsError);
    else console.log('Items:', items);

    console.log('Testing fetch from menu_categories...');
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(5);
      
    if (catError) console.error('Error fetching categories:', catError);
     else console.log('Categories:', categories);

     console.log('Testing fetch from properties...');
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name, created_by')
        .limit(5);

      if (propError) console.error('Error fetching properties:', propError);
      else console.log('Properties:', properties);

   } catch (err) {
    console.error('Exception:', err);
  }
}

testFetch();
