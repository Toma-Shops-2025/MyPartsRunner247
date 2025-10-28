// Netlify Function for Document Expiration Cron Job
// This function can be triggered by a cron service or webhook

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests (for security)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Verify the request is authorized (optional - add your own auth logic)
  const authHeader = event.headers.authorization;
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Function to get drivers with expiring documents
    async function getDriversWithExpiringDocuments(daysAhead = 30) {
      const { data, error } = await supabase.rpc('get_drivers_with_expiring_documents', {
        days_ahead: daysAhead
      });

      if (error) {
        console.error('Error fetching drivers with expiring documents:', error);
        return [];
      }

      return data || [];
    }

    // Function to send driver reminder
    async function sendDriverReminder(driverId, documentType, daysUntilExpiry) {
      // Get driver details
      const { data: driver, error: driverError } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', driverId)
        .single();

      if (driverError || !driver) {
        console.error('Error fetching driver details:', driverError);
        return false;
      }

      // Create notification record
      const { error: notificationError } = await supabase
        .from('driver_notifications')
        .insert({
          user_id: driverId,
          type: 'document_expiration',
          title: `Document Expiration Notice - ${documentType}`,
          message: `Your ${documentType} expires in ${daysUntilExpiry} days. Please upload updated documentation to continue driving.`,
          severity: daysUntilExpiry <= 7 ? 'error' : daysUntilExpiry <= 14 ? 'warning' : 'info',
          action_required: true,
          metadata: {
            document_type: documentType,
            days_until_expiry: daysUntilExpiry,
            expiration_reminder: true
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        return false;
      }

      // TODO: Send email/SMS notification here
      console.log(`Reminder sent to ${driver.full_name} (${driver.email}) for ${documentType} expiring in ${daysUntilExpiry} days`);

      return true;
    }

    // Function to check if it's time for quarterly reminder
    function shouldSendQuarterlyReminder() {
      const now = new Date();
      const dayOfMonth = now.getDate();
      const month = now.getMonth(); // 0-based
      
      // Send quarterly reminders on the 1st day of January, April, July, October
      return dayOfMonth === 1 && [0, 3, 6, 9].includes(month);
    }

    // Function to send bulk quarterly reminder
    async function sendBulkQuarterlyReminder() {
      // Create bulk reminder record
      const { data: reminderRecord, error: reminderError } = await supabase
        .from('bulk_reminder_tracking')
        .insert({
          reminder_type: 'quarterly',
          reminder_date: new Date().toISOString().split('T')[0],
          total_drivers: 0, // Will be updated
          status: 'pending'
        })
        .select()
        .single();

      if (reminderError || !reminderRecord) {
        throw new Error('Failed to create bulk reminder record');
      }

      // Get all active drivers
      const { data: drivers, error: driversError } = await supabase.rpc('get_all_active_drivers');
      
      if (driversError) {
        throw new Error('Failed to fetch drivers');
      }

      const totalDrivers = drivers.length;
      const driversWithExpiringDocs = drivers.filter(d => d.has_expiring_docs).length;

      // Update reminder record with counts
      await supabase
        .from('bulk_reminder_tracking')
        .update({
          total_drivers: totalDrivers,
          drivers_with_expiring_docs: driversWithExpiringDocs
        })
        .eq('id', reminderRecord.id);

      let driversNotified = 0;

      // Send reminders to all drivers
      for (const driver of drivers) {
        try {
          // Create general document reminder notification
          const { error: notificationError } = await supabase
            .from('driver_notifications')
            .insert({
              user_id: driver.user_id,
              type: 'bulk_document_reminder',
              title: 'Quarterly Document Review',
              message: driver.has_expiring_docs 
                ? `Please review your driver documents. You have ${driver.expiring_doc_types.join(', ')} expiring soon.`
                : 'Please ensure all your driver documents are up to date and valid.',
              severity: driver.has_expiring_docs ? 'warning' : 'info',
              action_required: true,
              metadata: {
                bulk_reminder: true,
                reminder_type: 'quarterly',
                has_expiring_docs: driver.has_expiring_docs,
                expiring_doc_types: driver.expiring_doc_types
              }
            });

          if (!notificationError) {
            driversNotified++;
          }

          // TODO: Send email/SMS notification here
          console.log(`Bulk reminder sent to ${driver.full_name} (${driver.email})`);

        } catch (error) {
          console.error(`Error sending reminder to driver ${driver.user_id}:`, error);
        }
      }

      // Update reminder record as completed
      await supabase
        .from('bulk_reminder_tracking')
        .update({
          drivers_notified: driversNotified,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', reminderRecord.id);

      return {
        total_drivers: totalDrivers,
        drivers_notified: driversNotified,
        drivers_with_expiring_docs: driversWithExpiringDocs,
        reminder_id: reminderRecord.id
      };
    }

    // Main function to check and send reminders
    async function checkAndSendReminders() {
      console.log('Starting document expiration check...');
      
      // Check for documents expiring in 30 days
      const drivers30Days = await getDriversWithExpiringDocuments(30);
      for (const driver of drivers30Days) {
        if (driver.days_until_expiry === 30) {
          await sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 14 days
      const drivers14Days = await getDriversWithExpiringDocuments(14);
      for (const driver of drivers14Days) {
        if (driver.days_until_expiry === 14) {
          await sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 7 days
      const drivers7Days = await getDriversWithExpiringDocuments(7);
      for (const driver of drivers7Days) {
        if (driver.days_until_expiry === 7) {
          await sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 1 day
      const drivers1Day = await getDriversWithExpiringDocuments(1);
      for (const driver of drivers1Day) {
        if (driver.days_until_expiry === 1) {
          await sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      console.log('Document expiration check completed successfully');
    }

    // Execute the cron job
    await checkAndSendReminders();
    
    // Check if it's time for quarterly bulk reminder
    if (shouldSendQuarterlyReminder()) {
      console.log('Sending quarterly bulk reminder...');
      const result = await sendBulkQuarterlyReminder();
      console.log(`Bulk reminder completed: ${result.drivers_notified}/${result.total_drivers} drivers notified`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Document expiration cron job completed successfully',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in document expiration cron job:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
