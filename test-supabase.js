const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ssmcagewssgtfknyrjmx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWNhZ2V3c3NndGZrbnlyam14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzYwNzIsImV4cCI6MjA4MDYxMjA3Mn0.Tl5p3whmAff8tMLkemVi8xjuxut27JBdRDyIAz_Ad2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Fetching from public_properties...');
    const { data, error } = await supabase.from('public_properties').select('*');
    if (error) {
        console.error('Error fetching public_properties:', error);
    } else {
        console.log(`Found ${data.length} properties in public_properties.`);
        if (data.length > 0) {
            console.log('First property:', data[0].name);
        }
    }
}

testFetch();
