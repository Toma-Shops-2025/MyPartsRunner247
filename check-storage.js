import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('🔍 Checking Supabase Storage setup...\n');
  
  // 1. List all storage buckets
  console.log('1️⃣ Checking storage buckets...');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log(`✅ Found ${buckets?.length || 0} storage buckets:`);
      buckets?.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.id} (public: ${bucket.public})`);
      });
      
      const driverDocsBucket = buckets?.find(b => b.id === 'driver-documents');
      if (driverDocsBucket) {
        console.log('✅ driver-documents bucket exists!');
      } else {
        console.log('❌ driver-documents bucket NOT found');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 2. Check if we can access the driver-documents bucket
  console.log('\n2️⃣ Testing driver-documents bucket access...');
  try {
    const { data: files, error: filesError } = await supabase.storage
      .from('driver-documents')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ Error accessing driver-documents bucket:', filesError.message);
    } else {
      console.log(`✅ Successfully accessed driver-documents bucket`);
      console.log(`📁 Found ${files?.length || 0} files/folders in root`);
      if (files && files.length > 0) {
        console.log('📋 Sample files:');
        files.slice(0, 5).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // 3. Check specific file paths from the error
  console.log('\n3️⃣ Testing specific file paths...');
  const testPaths = [
    '34ac7104-695f-4429-9735-230319536880/driver_license/1761566728744_Toma-ID-Front.jpg',
    '34ac7104-695f-4429-9735-230319536880/driver_license_back/1761566796848_Toma-ID-Back.jpg'
  ];

  for (const path of testPaths) {
    try {
      console.log(`🔍 Testing path: ${path}`);
      const { data: urlData, error: urlError } = await supabase.storage
        .from('driver-documents')
        .createSignedUrl(path, 3600);
      
      if (urlError) {
        console.error(`   ❌ Error: ${urlError.message}`);
      } else {
        console.log(`   ✅ Success! URL generated: ${urlData.signedUrl.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // 4. Check RLS policies
  console.log('\n4️⃣ Checking RLS policies...');
  try {
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError.message);
    } else {
      console.log(`✅ Found ${policies?.length || 0} storage policies:`);
      policies?.forEach((policy, index) => {
        console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n🔍 Storage check complete!');
}

checkStorage().catch(console.error);
