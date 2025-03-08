require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('Testing Supabase connection...');
  
  // Check if environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL or SUPABASE_KEY environment variables are not set.');
    console.log('Please make sure you have created a .env file with your Supabase credentials.');
    process.exit(1);
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('keywords').select('count', { count: 'exact' });
    
    if (error) {
      if (error.code === '42P01') { // relation does not exist
        console.error('Error: Tables not found in the database.');
        console.log('Please run the setup.sql script in your Supabase project.');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Database is properly configured and ready to use.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();
