import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DocumentExpirationService from '@/services/DocumentExpirationService';
import { useNavigate } from 'react-router-dom';

interface DocumentStatus {
  document_type: string;
  document_status: string;
  expiration_date: string | null;
  expiration_status: string;
  days_until_expiry: number | null;
  document_uploaded_at: string;
  verified_at: string | null;
}

const DocumentExpirationWarning: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDocumentStatus();
    }
  }, [user]);

  const fetchDocumentStatus = async () => {
    try {
      const statuses = await DocumentExpirationService.getDriverDocumentStatus(user?.id || '');
      setDocumentStatuses(statuses);
    } catch (error) {
      console.error('Error fetching document status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationBadgeColor = (status: string, daysUntilExpiry: number | null) => {
    if (status === 'expired') return 'bg-red-600 text-white';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 7) return 'bg-red-500 text-white';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 14) return 'bg-yellow-500 text-white';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 30) return 'bg-orange-500 text-white';
    return 'bg-green-600 text-white';
  };

  const getExpirationIcon = (status: string, daysUntilExpiry: number | null) => {
    if (status === 'expired') return <X className="w-4 h-4" />;
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 7) return <AlertTriangle className="w-4 h-4" />;
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 14) return <Clock className="w-4 h-4" />;
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 30) return <Calendar className="w-4 h-4" />;
    return null;
  };

  const getExpirationMessage = (status: string, daysUntilExpiry: number | null, documentType: string) => {
    if (status === 'expired') {
      return `Your ${documentType} has expired. Please upload updated documentation immediately.`;
    }
    if (status === 'expiring_soon' && daysUntilExpiry) {
      return `Your ${documentType} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Please upload updated documentation soon.`;
    }
    return null;
  };

  const getSeverity = (status: string, daysUntilExpiry: number | null) => {
    if (status === 'expired') return 'error';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 7) return 'error';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 14) return 'warning';
    if (status === 'expiring_soon' && daysUntilExpiry && daysUntilExpiry <= 30) return 'info';
    return 'info';
  };

  const hasExpiringDocuments = documentStatuses.some(doc => 
    doc.expiration_status === 'expired' || doc.expiration_status === 'expiring_soon'
  );

  const hasExpiredDocuments = documentStatuses.some(doc => doc.expiration_status === 'expired');

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasExpiringDocuments || dismissed) {
    return null;
  }

  return (
    <Card className={`mb-6 ${hasExpiredDocuments ? 'bg-red-900 border-red-700' : 'bg-yellow-900 border-yellow-700'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${hasExpiredDocuments ? 'text-red-300' : 'text-yellow-300'}`}>
            <AlertTriangle className="w-5 h-5" />
            Document Expiration Notice
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className={`${hasExpiredDocuments ? 'bg-red-800 border-red-600' : 'bg-yellow-800 border-yellow-600'}`}>
          <AlertTriangle className={`w-4 h-4 ${hasExpiredDocuments ? 'text-red-400' : 'text-yellow-400'}`} />
          <AlertDescription className={`${hasExpiredDocuments ? 'text-red-200' : 'text-yellow-200'}`}>
            {hasExpiredDocuments 
              ? 'You have expired documents that need immediate attention. Please upload updated documentation to continue driving.'
              : 'You have documents that will expire soon. Please upload updated documentation to avoid service interruption.'
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {documentStatuses
            .filter(doc => doc.expiration_status === 'expired' || doc.expiration_status === 'expiring_soon')
            .map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3">
                  {getExpirationIcon(doc.expiration_status, doc.days_until_expiry)}
                  <div>
                    <p className="font-medium text-white capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-300">
                      {getExpirationMessage(doc.expiration_status, doc.days_until_expiry, doc.document_type.replace('_', ' '))}
                    </p>
                    {doc.expiration_date && (
                      <p className="text-xs text-gray-400">
                        Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getExpirationBadgeColor(doc.expiration_status, doc.days_until_expiry)}>
                    {doc.expiration_status === 'expired' 
                      ? 'Expired' 
                      : `${doc.days_until_expiry} day${doc.days_until_expiry === 1 ? '' : 's'} left`
                    }
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => navigate('/driver-verification')}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Update
                  </Button>
                </div>
              </div>
            ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => navigate('/driver-verification')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Updated Documents
          </Button>
          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Dismiss for Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentExpirationWarning;
