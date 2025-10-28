import { supabase } from '@/lib/supabase';

export interface DocumentExpiration {
  id: string;
  user_id: string;
  document_type: string;
  document_id: string;
  expiration_date: string;
  days_until_expiry: number;
  status: 'active' | 'expired' | 'renewed' | 'suspended';
  reminder_sent_30_days: boolean;
  reminder_sent_14_days: boolean;
  reminder_sent_7_days: boolean;
  reminder_sent_1_day: boolean;
  last_reminder_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverWithExpiringDocs {
  user_id: string;
  full_name: string;
  email: string;
  document_type: string;
  expiration_date: string;
  days_until_expiry: number;
  phone: string;
}

export interface BulkReminderResult {
  total_drivers: number;
  drivers_notified: number;
  drivers_with_expiring_docs: number;
  reminder_id: string;
}

class DocumentExpirationService {
  /**
   * Get drivers with documents expiring within specified days
   */
  static async getDriversWithExpiringDocuments(daysAhead: number = 30): Promise<DriverWithExpiringDocs[]> {
    try {
      const { data, error } = await supabase.rpc('get_drivers_with_expiring_documents', {
        days_ahead: daysAhead
      });

      if (error) {
        console.error('Error fetching drivers with expiring documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDriversWithExpiringDocuments:', error);
      return [];
    }
  }

  /**
   * Get all active drivers for bulk reminders
   */
  static async getAllActiveDrivers(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_active_drivers');

      if (error) {
        console.error('Error fetching all active drivers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllActiveDrivers:', error);
      return [];
    }
  }

  /**
   * Update document expiration date
   */
  static async updateDocumentExpiration(
    documentId: string,
    expirationDate: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({ 
          expiration_date: expirationDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document expiration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateDocumentExpiration:', error);
      return false;
    }
  }

  /**
   * Mark reminder as sent for a specific document
   */
  static async markReminderSent(
    trackingId: string,
    reminderType: '30_days' | '14_days' | '7_days' | '1_day'
  ): Promise<boolean> {
    try {
      const updateData: any = {
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      updateData[`reminder_sent_${reminderType}`] = true;

      const { error } = await supabase
        .from('document_expiration_tracking')
        .update(updateData)
        .eq('id', trackingId);

      if (error) {
        console.error('Error marking reminder as sent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markReminderSent:', error);
      return false;
    }
  }

  /**
   * Get document expiration status for a specific driver
   */
  static async getDriverDocumentStatus(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('driver_document_status')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching driver document status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDriverDocumentStatus:', error);
      return [];
    }
  }

  /**
   * Send individual reminder to driver
   */
  static async sendDriverReminder(
    driverId: string,
    documentType: string,
    daysUntilExpiry: number
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Error in sendDriverReminder:', error);
      return false;
    }
  }

  /**
   * Send bulk quarterly reminder to all drivers
   */
  static async sendBulkQuarterlyReminder(): Promise<BulkReminderResult> {
    try {
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
        console.error('Error creating bulk reminder record:', reminderError);
        throw new Error('Failed to create bulk reminder record');
      }

      // Get all active drivers
      const drivers = await this.getAllActiveDrivers();
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

    } catch (error) {
      console.error('Error in sendBulkQuarterlyReminder:', error);
      throw error;
    }
  }

  /**
   * Automatically deactivate drivers with expired documents
   */
  static async deactivateDriversWithExpiredDocuments(): Promise<number> {
    try {
      // Get drivers with expired documents
      const { data: expiredDrivers, error } = await supabase
        .from('document_expiration_tracking')
        .select(`
          user_id,
          document_type,
          expiration_date,
          profiles!inner(full_name, email, status)
        `)
        .eq('status', 'expired')
        .eq('profiles.user_type', 'driver')
        .eq('profiles.status', 'active');

      if (error) {
        console.error('Error fetching drivers with expired documents:', error);
        return 0;
      }

      let deactivatedCount = 0;

      for (const driver of expiredDrivers || []) {
        try {
          // Deactivate driver
          const { error: deactivateError } = await supabase
            .from('profiles')
            .update({ 
              status: 'suspended',
              updated_at: new Date().toISOString()
            })
            .eq('id', driver.user_id)
            .eq('user_type', 'driver');

          if (deactivateError) {
            console.error(`Error deactivating driver ${driver.user_id}:`, deactivateError);
            continue;
          }

          // Create notification for driver
          await supabase
            .from('driver_notifications')
            .insert({
              user_id: driver.user_id,
              type: 'account_suspended',
              title: 'Account Suspended - Expired Documents',
              message: `Your account has been suspended due to expired ${driver.document_type}. Please upload updated documentation to reactivate your account.`,
              severity: 'error',
              action_required: true,
              metadata: {
                suspension_reason: 'expired_documents',
                document_type: driver.document_type,
                expiration_date: driver.expiration_date
              }
            });

          // Update tracking status
          await supabase
            .from('document_expiration_tracking')
            .update({ 
              status: 'suspended',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', driver.user_id)
            .eq('document_type', driver.document_type);

          deactivatedCount++;
          console.log(`Driver ${driver.user_id} (${(driver.profiles as any).full_name}) deactivated due to expired ${driver.document_type}`);

        } catch (error) {
          console.error(`Error processing driver ${driver.user_id}:`, error);
        }
      }

      return deactivatedCount;
    } catch (error) {
      console.error('Error in deactivateDriversWithExpiredDocuments:', error);
      return 0;
    }
  }

  /**
   * Reactivate driver after document renewal
   */
  static async reactivateDriverAfterRenewal(userId: string): Promise<boolean> {
    try {
      // Check if all required documents are now valid
      const { data: documents, error } = await supabase
        .from('document_expiration_tracking')
        .select('document_type, status, days_until_expiry')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking driver documents for reactivation:', error);
        return false;
      }

      // Check if all required documents are valid (not expired or expiring soon)
      const requiredDocuments = ['driver_license', 'insurance_certificate'];
      const validDocuments = documents?.filter(doc => 
        doc.status === 'active' && 
        (doc.days_until_expiry === null || doc.days_until_expiry > 7)
      ) || [];

      const hasAllValidDocuments = requiredDocuments.every(requiredType => 
        validDocuments.some(doc => doc.document_type === requiredType)
      );

      if (hasAllValidDocuments) {
        // Reactivate driver
        const { error: reactivateError } = await supabase
          .from('profiles')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .eq('user_type', 'driver');

        if (reactivateError) {
          console.error('Error reactivating driver:', reactivateError);
          return false;
        }

        // Create reactivation notification
        await supabase
          .from('driver_notifications')
          .insert({
            user_id: userId,
            type: 'account_reactivated',
            title: 'Account Reactivated',
            message: 'Your account has been reactivated! All your documents are now up to date.',
            severity: 'info',
            action_required: false,
            metadata: {
              reactivation_reason: 'documents_renewed'
            }
          });

        console.log(`Driver ${userId} reactivated after document renewal`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in reactivateDriverAfterRenewal:', error);
      return false;
    }
  }

  /**
   * Check and send automatic reminders for expiring documents
   */
  static async checkAndSendReminders(): Promise<void> {
    try {
      // Check for documents expiring in 30 days
      const drivers30Days = await this.getDriversWithExpiringDocuments(30);
      for (const driver of drivers30Days) {
        if (driver.days_until_expiry === 30) {
          await this.sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 14 days
      const drivers14Days = await this.getDriversWithExpiringDocuments(14);
      for (const driver of drivers14Days) {
        if (driver.days_until_expiry === 14) {
          await this.sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 7 days
      const drivers7Days = await this.getDriversWithExpiringDocuments(7);
      for (const driver of drivers7Days) {
        if (driver.days_until_expiry === 7) {
          await this.sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for documents expiring in 1 day
      const drivers1Day = await this.getDriversWithExpiringDocuments(1);
      for (const driver of drivers1Day) {
        if (driver.days_until_expiry === 1) {
          await this.sendDriverReminder(driver.user_id, driver.document_type, driver.days_until_expiry);
        }
      }

      // Check for expired documents and deactivate drivers
      const deactivatedCount = await this.deactivateDriversWithExpiredDocuments();
      if (deactivatedCount > 0) {
        console.log(`Automatically deactivated ${deactivatedCount} drivers with expired documents`);
      }

    } catch (error) {
      console.error('Error in checkAndSendReminders:', error);
    }
  }

  /**
   * Get expiration statistics for admin dashboard
   */
  static async getExpirationStatistics(): Promise<{
    total_documents: number;
    expiring_30_days: number;
    expiring_14_days: number;
    expiring_7_days: number;
    expired: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('document_expiration_tracking')
        .select('status, days_until_expiry');

      if (error) {
        console.error('Error fetching expiration statistics:', error);
        return {
          total_documents: 0,
          expiring_30_days: 0,
          expiring_14_days: 0,
          expiring_7_days: 0,
          expired: 0
        };
      }

      const stats = {
        total_documents: data.length,
        expiring_30_days: data.filter(d => d.days_until_expiry <= 30 && d.days_until_expiry > 14).length,
        expiring_14_days: data.filter(d => d.days_until_expiry <= 14 && d.days_until_expiry > 7).length,
        expiring_7_days: data.filter(d => d.days_until_expiry <= 7 && d.days_until_expiry > 0).length,
        expired: data.filter(d => d.status === 'expired').length
      };

      return stats;
    } catch (error) {
      console.error('Error in getExpirationStatistics:', error);
      return {
        total_documents: 0,
        expiring_30_days: 0,
        expiring_14_days: 0,
        expiring_7_days: 0,
        expired: 0
      };
    }
  }
}

export default DocumentExpirationService;
