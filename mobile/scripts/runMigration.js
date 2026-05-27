const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://cgcxilefnybidbiirkjn.supabase.co';
const supabaseKey = 'sb_publishable_eEgLhDrPyNBodoruBE7YIw_ucZVB-hz';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync('/app/supabase/schema.sql', 'utf8');
    
    // Since we can't run raw SQL with anon key, we'll create tables via API
    // For now, let's just verify connection works
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Tables do not exist. Schema needs to be created via Supabase Dashboard or Service Role key');
      console.log('Please run the SQL in /app/supabase/schema.sql via Supabase Dashboard → SQL Editor');
    } else if (error) {
      console.log('Error:', error);
    } else {
      console.log('✅ Database connection successful!');
      console.log('Tables exist:', data !== null);
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
