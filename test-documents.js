import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocuments() {
  console.log('🔍 Checking driver_documents table...');
  
  try {
    const { data: docs, error: docsError } = await supabase
      .from('driver_documents')
      .select('*')
      .limit(10);
    
    if (docsError) {
      console.error('❌ Error fetching driver_documents:', docsError);
      return;
    }
    
    console.log('📄 Driver documents found:', docs?.length || 0);
    if (docs && docs.length > 0) {
      console.log('📋 Sample documents:');
      docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}, Type: ${doc.document_type}, Status: ${doc.status}, User: ${doc.user_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🔍 Checking pending_document_reviews view...');
  
  try {
    const { data: pending, error: pendingError } = await supabase
      .from('pending_document_reviews')
      .select('*');
    
    if (pendingError) {
      console.error('❌ Error fetching pending_document_reviews:', pendingError);
      return;
    }
    
    console.log('⏳ Pending documents found:', pending?.length || 0);
    if (pending && pending.length > 0) {
      console.log('📋 Pending documents:');
      pending.forEach((doc, index) => {
        console.log(`  ${index + 1}. Driver: ${doc.full_name} (${doc.email}), Type: ${doc.document_type}, Status: ${doc.status}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🔍 Checking profiles table for drivers...');
  
  try {
    const { data: drivers, error: driversError } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type')
      .eq('user_type', 'driver')
      .limit(5);
    
    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return;
    }
    
    console.log('👥 Drivers found:', drivers?.length || 0);
    if (drivers && drivers.length > 0) {
      console.log('📋 Sample drivers:');
      drivers.forEach((driver, index) => {
        console.log(`  ${index + 1}. ${driver.full_name} (${driver.email}) - ID: ${driver.id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDocuments().catch(console.error);
