import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const DriverDocumentsPage = () => {
  const navigate = useNavigate();
  const [documents] = useState([
    {
      id: 1,
      name: 'Driver\'s License',
      status: 'approved',
      uploadDate: '2024-01-15',
      expiryDate: '2027-03-20',
      required: true
    },
    {
      id: 2,
      name: 'Vehicle Insurance',
      status: 'pending',
      uploadDate: '2024-01-16',
      expiryDate: '2024-12-31',
      required: true
    },
    {
      id: 3,
      name: 'Vehicle Registration',
      status: 'approved',
      uploadDate: '2024-01-15',
      expiryDate: '2025-06-15',
      required: true
    },
    {
      id: 4,
      name: 'Background Check',
      status: 'approved',
      uploadDate: '2024-01-10',
      expiryDate: '2025-01-10',
      required: true
    },
    {
      id: 5,
      name: 'Vehicle Inspection',
      status: 'expired',
      uploadDate: '2023-12-01',
      expiryDate: '2024-01-01',
      required: false
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Documents
            </h1>
            <p className="text-gray-600">
              Manage your driver documents and certifications
            </p>
          </div>
          <Button onClick={() => navigate('/driver-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{doc.name}</h3>
                      {doc.required && (
                        <span className="text-sm text-red-600">Required</span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>
                    <div className="flex items-center">
                      {getStatusIcon(doc.status)}
                      <span className="ml-1 capitalize">{doc.status}</span>
                    </div>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Upload Date</p>
                    <p className="font-medium">{doc.uploadDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      <p className="font-medium">{doc.expiryDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Re-upload
                    </Button>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>

                {doc.status === 'expired' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">
                        This document has expired. Please upload a new version to continue driving.
                      </p>
                    </div>
                  </div>
                )}

                {doc.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        This document is under review. We'll notify you once it's approved.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload a Document
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button>Choose File</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDocumentsPage;