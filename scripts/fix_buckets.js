const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixBuckets() {
  console.log('Checking storage buckets...');
  
  const bucketsToEnsure = ['property-images', 'menu-images', 'room-images'];
  
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  const existingNames = existingBuckets.map(b => b.name);
  console.log('Existing buckets:', existingNames);
  
  for (const bucketName of bucketsToEnsure) {
    if (existingNames.includes(bucketName)) {
      console.log(`Bucket '${bucketName}' already exists.`);
      
      // Update to public just in case
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      });
      
      if (updateError) {
        console.error(`Error updating bucket '${bucketName}':`, updateError);
      } else {
        console.log(`Bucket '${bucketName}' verified public.`);
      }
      
    } else {
      console.log(`Creating bucket '${bucketName}'...`);
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error(`Error creating bucket '${bucketName}':`, createError);
      } else {
        console.log(`Bucket '${bucketName}' created successfully.`);
      }
    }
  }
  
  console.log('Bucket check complete.');
}

fixBuckets();
