// Driver Auto-Approval Service
// Handles automatic approval of driver applications, background checks, and onboarding

import { supabase } from '@/lib/supabase';

export class DriverAutoApprovalService {
  /**
   * Auto-approve driver application
   */
  static async autoApproveDriverApplication(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('user_type', 'driver');

      if (error) {
        console.error('Error auto-approving driver application:', error);
        return false;
      }

      console.log('Driver application auto-approved:', userId);
      return true;
    } catch (error) {
      console.error('Error in autoApproveDriverApplication:', error);
      return false;
    }
  }

  /**
   * Auto-approve background check
   */
  static async autoApproveBackgroundCheck(userId: string) {
    try {
      // Update background check status in driver_documents
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
          admin_notes: 'Automatically approved - background check passed'
        })
        .eq('user_id', userId)
        .eq('document_type', 'background_check')
        .eq('is_current', true);

      if (error) {
        console.error('Error auto-approving background check:', error);
        return false;
      }

      console.log('Background check auto-approved:', userId);
      
      // Check if driver should be activated now
      await this.checkDriverActivation(userId);
      return true;
    } catch (error) {
      console.error('Error in autoApproveBackgroundCheck:', error);
      return false;
    }
  }

  /**
   * Auto-approve onboarding completion
   */
  static async autoApproveOnboarding(userId: string) {
    try {
      // Update onboarding status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .eq('user_type', 'driver');

      if (error) {
        console.error('Error auto-approving onboarding:', error);
        return false;
      }

      console.log('Onboarding auto-approved:', userId);
      
      // Check if driver should be activated now
      await this.checkDriverActivation(userId);
      return true;
    } catch (error) {
      console.error('Error in autoApproveOnboarding:', error);
      return false;
    }
  }

  /**
   * Check if driver meets all requirements and activate if so
   */
  static async checkDriverActivation(userId: string) {
    try {
      // Get driver profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, onboarding_completed')
        .eq('id', userId)
        .eq('user_type', 'driver')
        .single();

      if (profileError || !profile) {
        console.error('Error fetching driver profile:', profileError);
        return false;
      }

      // Skip if already active
      if (profile.status === 'active') {
        return true;
      }

      // Get all current documents
      const { data: documents, error: docsError } = await supabase
        .from('current_driver_documents')
        .select('document_type, status')
        .eq('user_id', userId);

      if (docsError) {
        console.error('Error checking driver documents:', docsError);
        return false;
      }

      // Check if all required documents are approved
      const requiredDocuments = ['driver_license', 'insurance_certificate', 'background_check'];
      const approvedDocuments = documents?.filter(doc => doc.status === 'approved') || [];
      
      const hasAllDocuments = requiredDocuments.every(requiredType => 
        approvedDocuments.some(doc => doc.document_type === requiredType)
      );

      // Check if onboarding is completed
      const onboardingComplete = profile.onboarding_completed === true;

      // Activate driver if all requirements are met
      if (hasAllDocuments && onboardingComplete) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .eq('user_type', 'driver');

        if (updateError) {
          console.error('Error activating driver:', updateError);
          return false;
        }

        console.log('Driver automatically activated:', userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in checkDriverActivation:', error);
      return false;
    }
  }

  /**
   * Get driver activation status
   */
  static async getDriverActivationStatus(userId: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, onboarding_completed')
        .eq('id', userId)
        .eq('user_type', 'driver')
        .single();

      if (profileError || !profile) {
        return { error: 'Driver not found' };
      }

      const { data: documents, error: docsError } = await supabase
        .from('current_driver_documents')
        .select('document_type, status')
        .eq('user_id', userId);

      if (docsError) {
        return { error: 'Error fetching documents' };
      }

      const requiredDocuments = ['driver_license', 'insurance_certificate', 'background_check'];
      const approvedDocuments = documents?.filter(doc => doc.status === 'approved') || [];
      
      const documentStatus = requiredDocuments.map(requiredType => ({
        type: requiredType,
        approved: approvedDocuments.some(doc => doc.document_type === requiredType)
      }));

      return {
        status: profile.status,
        onboardingCompleted: profile.onboarding_completed,
        documents: documentStatus,
        canActivate: documentStatus.every(doc => doc.approved) && profile.onboarding_completed
      };
    } catch (error) {
      console.error('Error in getDriverActivationStatus:', error);
      return { error: 'Unknown error' };
    }
  }
}
