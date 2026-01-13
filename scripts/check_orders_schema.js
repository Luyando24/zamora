
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrdersSchema() {
  console.log('Checking orders table schema...');
  
  // We can't directly query schema via client easily without raw SQL or checking a row
  // Let's try to insert a dummy row with all potential fields and see if it fails, 
  // or better, just list the columns if we can (using information_schema if enabled, but RPC is better).
  // Actually, I'll just check a single row to see what keys come back.
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching orders:', error);
  } else {
    if (order.length > 0) {
        console.log('Existing columns in orders:', Object.keys(order[0]));
    } else {
        console.log('Orders table is empty, cannot infer columns from data.');
    }
  }

    const { data: barOrder, error: barError } = await supabase
    .from('bar_orders')
    .select('*')
    .limit(1);

  if (barError) {
    console.error('Error fetching bar_orders:', barError);
  } else {
    if (barOrder.length > 0) {
        console.log('Existing columns in bar_orders:', Object.keys(barOrder[0]));
    } else {
        console.log('Bar Orders table is empty, cannot infer columns from data.');
    }
  }
}

checkOrdersSchema();
