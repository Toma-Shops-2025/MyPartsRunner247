import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the same configuration as the app
const supabaseUrl = 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up driver documents database...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'create_driver_documents_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute individual statements
      console.log('🔄 Trying alternative approach...');
      await executeIndividualStatements(sqlContent);
    } else {
      console.log('✅ Database setup completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  }
}

async function executeIndividualStatements(sqlContent) {
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Error on statement ${i + 1}:`, err.message);
      }
    }
  }
  
  console.log('✅ Database setup completed!');
}

// Check if we can connect to the database first
async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await setupDatabase();
  } else {
    console.log('❌ Cannot proceed without database connection');
  }
}

main().catch(console.error);
