// Storage Migration Utility
// This helps migrate files from localStorage to Supabase Storage

import { supabase } from '@/lib/supabase';

export class StorageMigration {
  /**
   * Check if a file exists in Supabase Storage
   */
  static async checkFileExists(bucketName: string, filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });
      
      return !error && data && data.length > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Get all documents that might have missing storage files
   */
  static async getDocumentsWithMissingFiles(): Promise<any[]> {
    try {
      const { data: documents, error } = await supabase
        .from('driver_documents')
        .select('*')
        .in('status', ['pending_review', 'uploaded'])
        .eq('is_current', true);

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      // Check which files actually exist in storage
      const documentsWithStatus = await Promise.all(
        documents.map(async (doc) => {
          const exists = await this.checkFileExists('driver-documents', doc.file_path);
          return {
            ...doc,
            file_exists_in_storage: exists
          };
        })
      );

      return documentsWithStatus.filter(doc => !doc.file_exists_in_storage);
    } catch (error) {
      console.error('Error getting documents with missing files:', error);
      return [];
    }
  }

  /**
   * Mark documents as needing re-upload
   */
  static async markDocumentsForReupload(documentIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({ 
          status: 'needs_reupload',
          admin_notes: 'File missing from storage - needs re-upload'
        })
        .in('id', documentIds);

      if (error) {
        console.error('Error marking documents for re-upload:', error);
      }
    } catch (error) {
      console.error('Error marking documents for re-upload:', error);
    }
  }

  /**
   * Check storage bucket exists
   */
  static async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        return false;
      }

      return buckets.some(bucket => bucket.id === bucketName);
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  static async createBucketIfNotExists(bucketName: string): Promise<boolean> {
    try {
      const exists = await this.checkBucketExists(bucketName);
      
      if (exists) {
        console.log(`Bucket ${bucketName} already exists`);
        return true;
      }

      // Note: This would need to be done via SQL as the JS client doesn't support bucket creation
      console.log(`Bucket ${bucketName} does not exist - needs to be created via SQL`);
      return false;
    } catch (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
  }
}
