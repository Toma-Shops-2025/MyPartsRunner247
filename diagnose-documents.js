import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDocuments() {
  console.log('🔍 Diagnosing driver documents database...\n');
  
  // 1. Check if driver_documents table exists and has data
  console.log('1️⃣ Checking driver_documents table...');
  try {
    const { data: docs, error: docsError } = await supabase
      .from('driver_documents')
      .select('*')
      .limit(10);
    
    if (docsError) {
      console.error('❌ Error:', docsError.message);
    } else {
      console.log(`✅ Found ${docs?.length || 0} documents in driver_documents table`);
      if (docs && docs.length > 0) {
        console.log('📋 Sample documents:');
        docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. Type: ${doc.document_type}, Status: ${doc.status}, User: ${doc.user_id?.slice(0, 8)}...`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 2. Check pending_document_reviews view
  console.log('\n2️⃣ Checking pending_document_reviews view...');
  try {
    const { data: pending, error: pendingError } = await supabase
      .from('pending_document_reviews')
      .select('*');
    
    if (pendingError) {
      console.error('❌ Error:', pendingError.message);
    } else {
      console.log(`✅ Found ${pending?.length || 0} documents in pending_document_reviews view`);
      if (pending && pending.length > 0) {
        console.log('📋 Pending documents:');
        pending.forEach((doc, index) => {
          console.log(`   ${index + 1}. Driver: ${doc.full_name}, Type: ${doc.document_type}, Status: ${doc.status}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 3. Check profiles table for drivers
  console.log('\n3️⃣ Checking profiles table for drivers...');
  try {
    const { data: drivers, error: driversError } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type')
      .eq('user_type', 'driver')
      .limit(5);
    
    if (driversError) {
      console.error('❌ Error:', driversError.message);
    } else {
      console.log(`✅ Found ${drivers?.length || 0} drivers in profiles table`);
      if (drivers && drivers.length > 0) {
        console.log('📋 Sample drivers:');
        drivers.forEach((driver, index) => {
          console.log(`   ${index + 1}. ${driver.full_name} (${driver.email}) - ID: ${driver.id?.slice(0, 8)}...`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 4. Check for documents with pending_review status specifically
  console.log('\n4️⃣ Checking for documents with pending_review status...');
  try {
    const { data: pendingDocs, error: pendingDocsError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('status', 'pending_review')
      .eq('is_current', true);
    
    if (pendingDocsError) {
      console.error('❌ Error:', pendingDocsError.message);
    } else {
      console.log(`✅ Found ${pendingDocs?.length || 0} documents with pending_review status`);
      if (pendingDocs && pendingDocs.length > 0) {
        console.log('📋 Pending review documents:');
        pendingDocs.forEach((doc, index) => {
          console.log(`   ${index + 1}. Type: ${doc.document_type}, User: ${doc.user_id?.slice(0, 8)}..., Uploaded: ${doc.uploaded_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 5. Check for documents with uploaded status
  console.log('\n5️⃣ Checking for documents with uploaded status...');
  try {
    const { data: uploadedDocs, error: uploadedDocsError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('status', 'uploaded')
      .eq('is_current', true);
    
    if (uploadedDocsError) {
      console.error('❌ Error:', uploadedDocsError.message);
    } else {
      console.log(`✅ Found ${uploadedDocs?.length || 0} documents with uploaded status`);
      if (uploadedDocs && uploadedDocs.length > 0) {
        console.log('📋 Uploaded documents:');
        uploadedDocs.forEach((doc, index) => {
          console.log(`   ${index + 1}. Type: ${doc.document_type}, User: ${doc.user_id?.slice(0, 8)}..., Uploaded: ${doc.uploaded_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🔍 Diagnosis complete!');
}

diagnoseDocuments().catch(console.error);
