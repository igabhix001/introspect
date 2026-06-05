const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Testing select on admin profile using ANON key...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('id', '502b5fae-bf6b-4293-bf3a-a756aa46debf')
    .single();
    
  if (error) {
    console.error('ANON select failed:');
    console.error(error);
  } else {
    console.log('ANON select succeeded! Data:', data);
  }
}

test();
