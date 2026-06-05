const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing select on profiles using ANON key (representing client/middleware)...');
  
  // We don't even need to be logged in to trigger RLS check, 
  // but let's test a simple query
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', '303c4cac-3115-486f-b25d-d4ce850bc515'); // Ahmed Baba's ID from earlier
    
  if (error) {
    console.error('ANON select failed:');
    console.error(error);
  } else {
    console.log('ANON select succeeded! Data:', data);
  }
}

test();
