const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  'mailto:notifications@mypartsrunner.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userIds, title, body, data } = JSON.parse(event.body || '{}');
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { statusCode: 400, body: 'userIds required' };
    }

    console.log(`📤 SEND-PUSH: Request to send notification to ${userIds.length} user(s)`);
    console.log(`   Title: ${title}`);
    console.log(`   User IDs: ${userIds.join(', ')}`);

    // CRITICAL: If this is a "New Order Available" notification, only send to drivers!
    const isOrderAvailableNotification = title?.includes('New Order') || 
                                        title?.includes('Order Available') ||
                                        data?.type === 'order_available';
    
    if (isOrderAvailableNotification) {
      console.log('🔒 Order notification detected - filtering to drivers only');
      
      // CRITICAL: Verify order is still pending and available before sending
      if (data?.orderId) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, status, driver_id')
          .eq('id', data.orderId)
          .single();
        
        if (orderError) {
          console.error(`❌ Error checking order ${data.orderId}:`, orderError);
          return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'Order not found' }) };
        }
        
        if (!orderData) {
          console.log(`⚠️ Order ${data.orderId} not found, skipping notification`);
          return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'Order not found' }) };
        }
        
        if (orderData.status !== 'pending') {
          console.log(`⚠️ Order ${data.orderId} is no longer pending (status: ${orderData.status}), skipping notification`);
          return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: `Order status is ${orderData.status}, not pending` }) };
        }
        
        if (orderData.driver_id) {
          console.log(`⚠️ Order ${data.orderId} already has driver ${orderData.driver_id} assigned, skipping notification`);
          return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'Order already assigned' }) };
        }
        
        console.log(`✅ Order ${data.orderId} verified: pending, no driver assigned - proceeding with notification`);
      }
      
      // CRITICAL: Get user types FIRST before any other operations
      // This MUST succeed or we abort - we cannot send driver notifications to non-drivers
      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type, email')
        .in('id', userIds);
      
      if (profileError) {
        console.error('❌ CRITICAL: Error checking user types - ABORTING driver notification:', profileError);
        return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'Failed to verify user types - notification blocked for safety' }) };
      }
      
      if (!userProfiles || userProfiles.length === 0) {
        console.log('⚠️ No user profiles found, skipping notification');
        return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'No user profiles found' }) };
      }
      
      // Filter to ONLY driver IDs - CRITICAL: Non-drivers must be excluded
      const driverIds = userProfiles
        .filter(p => {
          const isDriver = p.user_type === 'driver';
          if (!isDriver) {
            console.log(`🚫 BLOCKED: User ${p.id} (${p.email}) is not a driver (type: ${p.user_type}) - notification blocked`);
          }
          return isDriver;
        })
        .map(p => p.id);
      
      console.log(`   Filtered: ${driverIds.length} drivers out of ${userIds.length} users`);
      console.log(`   Driver IDs: ${driverIds.join(', ')}`);
      
      // CRITICAL: If no drivers found, abort immediately
      if (driverIds.length === 0) {
        console.log('⚠️ No drivers in recipient list - ABORTING notification to prevent sending to customers');
        return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'No drivers to notify - notification blocked' }) };
      }
      
      // CRITICAL: Replace userIds array with ONLY driver IDs
      // This ensures we never send to non-drivers even if there's a bug later
      userIds.length = 0;
      userIds.push(...driverIds);
      
      console.log(`✅ Verified ${driverIds.length} drivers only - proceeding with notification`);
    }

    // Fetch subscriptions for these users
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Supabase error fetching subscriptions:', error);
      return { statusCode: 500, body: 'Failed to fetch subscriptions' };
    }

    console.log(`   Found ${subs?.length || 0} subscription(s) for ${userIds.length} user(s)`);
    
    if (!subs || subs.length === 0) {
      console.log(`⚠️ No subscriptions found for users: ${userIds.join(', ')}`);
      console.log(`   This means these users haven't subscribed to push notifications yet`);
      console.log(`   💡 Users need to enable push notifications in their browser and register their subscription`);
      
      // For driver notifications, this is critical - log it prominently
      const isOrderAvailableNotification = title?.includes('New Order') || 
                                          title?.includes('Order Available') ||
                                          data?.type === 'order_available';
      if (isOrderAvailableNotification) {
        console.log(`🚨 CRITICAL: Driver notification could not be sent - drivers need to enable push notifications`);
      }
      
      return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: userIds.length, message: 'No subscriptions found - users need to enable push notifications' }) };
    }

    let sent = 0, failed = 0;
    const payload = JSON.stringify({ title: title || 'MyPartsRunner', body: body || '', data: data || {} });

    // Send to each subscription
    for (const sub of subs) {
      console.log(`   Attempting to send to user ${sub.user_id}...`);
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        // Configure push options for immediate delivery
        const pushOptions = {
          TTL: 0, // Don't queue - deliver immediately or fail
          urgency: 'high', // High priority for immediate delivery
          topic: `order-${data?.orderId || Date.now()}` // Unique topic to prevent queuing
        };
        
        await webpush.sendNotification(subscription, payload, pushOptions);
        console.log(`   ✅ Sent to user ${sub.user_id} (immediate delivery)`);
        sent++;
      } catch (e) {
        console.error(`   ❌ Push failed for user ${sub.user_id}:`, e?.statusCode || e?.message);
        failed++;
        // If gone, delete subscription
        if (e && (e.statusCode === 404 || e.statusCode === 410)) {
          console.log(`   🗑️ Deleting expired subscription for user ${sub.user_id}`);
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    console.log(`📊 Final result: ${sent} sent, ${failed} failed`);
    return { statusCode: 200, body: JSON.stringify({ sent, failed }) };
  } catch (e) {
    console.error('send-push error:', e);
    return { statusCode: 500, body: 'Unexpected error' };
  }
};


