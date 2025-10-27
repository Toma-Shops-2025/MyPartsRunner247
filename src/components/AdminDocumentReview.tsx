// Admin Document Review Component
// Allows admins to review and approve/reject driver documents

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Clock,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface PendingDocument {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  document_type: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  admin_notes?: string;
}

interface DocumentReviewProps {
  onDocumentReviewed?: () => void;
}

const AdminDocumentReview: React.FC<DocumentReviewProps> = ({ onDocumentReviewed }) => {
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending documents
  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      
      // First try the view
      let { data, error } = await supabase
        .from('pending_document_reviews')
        .select('*')
        .order('uploaded_at', { ascending: true });

      if (error) {
        console.error('Error fetching from view:', error);
        
        // If view doesn't exist or fails, try direct query
        console.log('Trying direct query to driver_documents...');
        const { data: directData, error: directError } = await supabase
          .from('driver_documents')
          .select(`
            id,
            user_id,
            document_type,
            file_name,
            file_size,
            uploaded_at,
            admin_notes,
            profiles!inner(full_name, email)
          `)
          .in('status', ['pending_review', 'uploaded'])
          .eq('is_current', true)
          .order('uploaded_at', { ascending: true });

        if (directError) {
          console.error('Direct query also failed:', directError);
          
          // Check if it's a table/view doesn't exist error
          if (directError.message.includes('relation "driver_documents" does not exist')) {
            toast({
              title: "Database Setup Required",
              description: "Driver documents tables need to be created. Please run the database migration.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch pending documents",
              variant: "destructive",
            });
          }
          return;
        }

        // Transform direct data to match expected format
        data = directData?.map(doc => {
          const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : (doc.profiles as any);
          return {
            id: doc.id,
            user_id: doc.user_id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || 'Unknown',
            document_type: doc.document_type,
            file_name: doc.file_name,
            file_size: doc.file_size,
            uploaded_at: doc.uploaded_at,
            admin_notes: doc.admin_notes
          };
        }) || [];
      }

      setPendingDocuments(data || []);
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId: string) => {
    try {
      setActionLoading(documentId);
      
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
          admin_notes: reviewNotes || null
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error approving document:', error);
        toast({
          title: "Error",
          description: "Failed to approve document",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Document approved successfully",
      });

      // Refresh the list
      await fetchPendingDocuments();
      setSelectedDocument(null);
      setReviewNotes('');
      
      if (onDocumentReviewed) {
        onDocumentReviewed();
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (documentId: string) => {
    if (!reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(documentId);
      
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status: 'rejected',
          rejection_reason: reviewNotes,
          admin_notes: reviewNotes
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error rejecting document:', error);
        toast({
          title: "Error",
          description: "Failed to reject document",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Document rejected successfully",
      });

      // Refresh the list
      await fetchPendingDocuments();
      setSelectedDocument(null);
      setReviewNotes('');
      
      if (onDocumentReviewed) {
        onDocumentReviewed();
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDocument = async (document: PendingDocument) => {
    try {
      // Get the file path from the document
      const { data: docData, error } = await supabase
        .from('driver_documents')
        .select('file_path')
        .eq('id', document.id)
        .single();

      if (error || !docData) {
        toast({
          title: "Error",
          description: "Failed to get document path",
          variant: "destructive",
        });
        return;
      }

      // Create signed URL for viewing
      const { data: urlData, error: urlError } = await supabase.storage
        .from('driver-documents')
        .createSignedUrl(docData.file_path, 3600);

      if (urlError || !urlData) {
        toast({
          title: "Error",
          description: "Failed to generate document URL",
          variant: "destructive",
        });
        return;
      }

      // Open document in new tab
      window.open(urlData.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDocumentType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-teal-400">Document Review</h2>
        <Badge variant="outline" className="text-sm border-teal-600 text-teal-400">
          {pendingDocuments.length} pending review
        </Badge>
      </div>

      {pendingDocuments.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No documents pending review
            </h3>
            <p className="text-gray-300 mb-4">
              All driver documents have been reviewed.
            </p>
            <div className="text-sm text-gray-400 bg-gray-700 p-3 rounded-lg">
              <p className="font-medium mb-1">Note:</p>
              <p>If drivers are showing "documents pending review" but you don't see them here, the database tables may need to be set up. Run the database migration script to create the required tables.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingDocuments.map((document) => (
            <Card key={document.id} className="bg-gray-800 border-gray-700 text-white border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-teal-400" />
                    <div>
                      <CardTitle className="text-lg text-white">
                        {formatDocumentType(document.document_type)}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{document.full_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(document.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocument(document)}
                      className="border-teal-600 text-teal-400 hover:bg-teal-900"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-400">File Name</Label>
                    <p className="font-medium text-white">{document.file_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">File Size</Label>
                    <p className="font-medium text-white">{formatFileSize(document.file_size)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Driver Email</Label>
                    <p className="font-medium text-white">{document.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-teal-400">Review Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-400">Document Type</Label>
                <p className="font-medium text-white">
                  {formatDocumentType(selectedDocument.document_type)}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Driver</Label>
                <p className="font-medium text-white">{selectedDocument.full_name}</p>
              </div>
              <div>
                <Label htmlFor="review-notes" className="text-gray-400">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add notes about this document..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDocument(null);
                    setReviewNotes('');
                  }}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedDocument.id)}
                  disabled={actionLoading === selectedDocument.id}
                  className="flex-1"
                >
                  {actionLoading === selectedDocument.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedDocument.id)}
                  disabled={actionLoading === selectedDocument.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === selectedDocument.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentReview;
