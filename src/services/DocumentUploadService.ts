// Document Upload Service for Driver Documents
// Handles secure upload to Supabase Storage with proper error handling

import { supabase } from '@/lib/supabase';

export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  filePath?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface DocumentMetadata {
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
}

export class DocumentUploadService {
  private static readonly BUCKET_NAME = 'driver-documents';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  /**
   * Upload a document to Supabase Storage
   */
  static async uploadDocument(
    file: File, 
    metadata: DocumentMetadata
  ): Promise<DocumentUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          fallbackUsed: false
        };
      }

      // Generate file path
      const filePath = this.generateFilePath(metadata);
      
      // Check if bucket exists first
      console.log('Checking if storage bucket exists:', this.BUCKET_NAME);
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return this.handleUploadFailure(file, metadata, `Failed to access storage: ${bucketsError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.id === this.BUCKET_NAME);
      console.log('Bucket exists:', bucketExists);
      
      if (!bucketExists) {
        console.error('Storage bucket does not exist:', this.BUCKET_NAME);
        return this.handleUploadFailure(file, metadata, `Storage bucket '${this.BUCKET_NAME}' does not exist. Please create it first.`);
      }

      // Upload to Supabase Storage
      console.log('Uploading file to storage:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
        return this.handleUploadFailure(file, metadata, uploadError.message);
      }

      console.log('File uploaded successfully:', uploadData.path);

      // Store metadata in database
      const { data: documentData, error: dbError } = await supabase
        .from('driver_documents')
        .insert({
          user_id: metadata.userId,
          document_type: metadata.documentType,
          file_path: uploadData.path,
          file_name: metadata.fileName,
          file_size: metadata.fileSize,
          mime_type: metadata.mimeType,
          status: 'pending_review'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert failed:', dbError);
        // Clean up uploaded file
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([uploadData.path]);
        
        return this.handleUploadFailure(file, metadata, dbError.message);
      }

      return {
        success: true,
        documentId: documentData.id,
        filePath: uploadData.path,
        fallbackUsed: false
      };

    } catch (error) {
      console.error('Document upload error:', error);
      return this.handleUploadFailure(file, metadata, error.message);
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument(
    documentId: string,
    file: File,
    metadata: DocumentMetadata
  ): Promise<DocumentUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          fallbackUsed: false
        };
      }

      // Get existing document
      const { data: existingDoc, error: fetchError } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !existingDoc) {
        return {
          success: false,
          error: 'Document not found',
          fallbackUsed: false
        };
      }

      // Generate new file path
      const filePath = this.generateFilePath(metadata);
      
      // Check if bucket exists first
      console.log('Checking if storage bucket exists:', this.BUCKET_NAME);
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return this.handleUploadFailure(file, metadata, `Failed to access storage: ${bucketsError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.id === this.BUCKET_NAME);
      console.log('Bucket exists:', bucketExists);
      
      if (!bucketExists) {
        console.error('Storage bucket does not exist:', this.BUCKET_NAME);
        return this.handleUploadFailure(file, metadata, `Storage bucket '${this.BUCKET_NAME}' does not exist. Please create it first.`);
      }

      // Upload new version
      console.log('Uploading file to storage:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error
        });
        return this.handleUploadFailure(file, metadata, uploadError.message);
      }

      console.log('File uploaded successfully:', uploadData.path);

      // Create new version record
      const { data: documentData, error: dbError } = await supabase
        .from('driver_documents')
        .insert({
          user_id: metadata.userId,
          document_type: metadata.documentType,
          file_path: uploadData.path,
          file_name: metadata.fileName,
          file_size: metadata.fileSize,
          mime_type: metadata.mimeType,
          status: 'pending_review',
          is_current: true
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert failed:', dbError);
        // Clean up uploaded file
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([uploadData.path]);
        
        return this.handleUploadFailure(file, metadata, dbError.message);
      }

      return {
        success: true,
        documentId: documentData.id,
        filePath: uploadData.path,
        fallbackUsed: false
      };

    } catch (error) {
      console.error('Document update error:', error);
      return this.handleUploadFailure(file, metadata, error.message);
    }
  }

  /**
   * Get document download URL
   */
  static async getDocumentUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }

  /**
   * Get driver's current documents
   */
  static async getDriverDocuments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('current_driver_documents')
        .select('*')
        .eq('user_id', userId)
        .order('document_type', { ascending: true });

      if (error) {
        console.error('Error fetching driver documents:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching driver documents:', error);
      return [];
    }
  }

  /**
   * Get document history for a specific document type
   */
  static async getDocumentHistory(userId: string, documentType: string) {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching document history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching document history:', error);
      return [];
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Generate file path for storage
   */
  private static generateFilePath(metadata: DocumentMetadata): string {
    const timestamp = Date.now();
    const sanitizedFileName = metadata.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${metadata.userId}/${metadata.documentType}/${timestamp}_${sanitizedFileName}`;
  }

  /**
   * Handle upload failure with localStorage fallback
   */
  private static handleUploadFailure(
    file: File, 
    metadata: DocumentMetadata, 
    error: string
  ): DocumentUploadResult {
    try {
      // Store in localStorage as fallback
      const fileData = {
        name: metadata.fileName,
        type: metadata.mimeType,
        size: metadata.fileSize,
        uploadedAt: new Date().toISOString(),
        status: 'pending_upload',
        error: `Storage upload failed: ${error}`
      };

      const existingFiles = JSON.parse(localStorage.getItem('driver_documents') || '{}');
      existingFiles[metadata.documentType] = fileData;
      localStorage.setItem('driver_documents', JSON.stringify(existingFiles));

      return {
        success: true,
        error: `Upload failed, stored locally: ${error}`,
        fallbackUsed: true
      };
    } catch (localStorageError) {
      return {
        success: false,
        error: `Upload failed and localStorage fallback failed: ${error}`,
        fallbackUsed: false
      };
    }
  }
}
