import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText,
  Car,
  CreditCard,
  User,
  AlertTriangle,
  Camera,
  IdCard
} from 'lucide-react';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  required: boolean;
  icon: React.ReactNode;
}

interface DocumentUpload {
  id: string;
  name: string;
  type: 'license' | 'insurance' | 'registration' | 'background_check';
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  file?: File;
  rejectionReason?: string;
}

const DriverVerification: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: '1', name: 'Driver License', type: 'license', status: 'pending' },
    { id: '2', name: 'Auto Insurance', type: 'insurance', status: 'pending' },
    { id: '3', name: 'Vehicle Registration', type: 'registration', status: 'pending' },
    { id: '4', name: 'Background Check', type: 'background_check', status: 'pending' }
  ]);

  const verificationSteps: VerificationStep[] = [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Verify your identity and contact information',
      status: 'completed',
      required: true,
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required documents for verification',
      status: 'in_progress',
      required: true,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'background_check',
      title: 'Background Check',
      description: 'Complete criminal background verification',
      status: 'pending',
      required: true,
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'vehicle_info',
      title: 'Vehicle Information',
      description: 'Provide vehicle details and insurance',
      status: 'pending',
      required: true,
      icon: <Car className="w-5 h-5" />
    },
    {
      id: 'payment_setup',
      title: 'Payment Setup',
      description: 'Connect your bank account for payments',
      status: 'pending',
      required: true,
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'training',
      title: 'Safety Training',
      description: 'Complete driver safety training course',
      status: 'pending',
      required: false,
      icon: <Camera className="w-5 h-5" />
    }
  ];

  const handleFileUpload = (documentId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, file, status: 'uploaded' as const }
        : doc
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/30 text-green-300 border-green-600/30';
      case 'in_progress': return 'bg-blue-900/30 text-blue-300 border-blue-600/30';
      case 'failed': return 'bg-red-900/30 text-red-300 border-red-600/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'uploaded': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Upload className="w-4 h-4 text-gray-500" />;
    }
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Driver Verification</h1>
        <p className="text-gray-300">Complete your driver verification to start earning with MyPartsRunner</p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            Verification Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Overall Progress</span>
              <span className="text-sm font-semibold text-white">{completedSteps}/{totalSteps} Steps</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-center">
              <span className="text-2xl font-bold text-teal-400">{Math.round(progressPercentage)}%</span>
              <span className="text-gray-300 ml-2">Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <div className="space-y-4">
        {verificationSteps.map((step, index) => (
          <Card key={step.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <div className="flex items-center gap-2">
                      {step.required && (
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          Required
                        </Badge>
                      )}
                      <Badge className={getStatusColor(step.status)}>
                        {step.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  
                  {/* Step-specific content */}
                  {step.id === 'documents' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-white">{doc.name}</h4>
                              {getDocumentStatusIcon(doc.status)}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(doc.id, file);
                                }}
                                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                              />
                              {doc.status === 'rejected' && doc.rejectionReason && (
                                <Alert className="bg-red-900/20 border-red-600/30">
                                  <AlertTriangle className="w-4 h-4" />
                                  <AlertDescription className="text-red-300">
                                    {doc.rejectionReason}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.id === 'background_check' && step.status === 'pending' && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h4 className="font-medium text-white">Background Check Required</h4>
                      </div>
                      <p className="text-gray-300 mb-4">
                        We'll run a comprehensive background check including criminal history, 
                        driving record, and identity verification. This process typically takes 1-3 business days.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Start Background Check
                      </Button>
                    </div>
                  )}

                  {step.id === 'vehicle_info' && step.status === 'pending' && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Car className="w-5 h-5 text-green-400" />
                        <h4 className="font-medium text-white">Vehicle Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Vehicle Make & Model
                          </label>
                          <Input 
                            placeholder="e.g., Toyota Camry 2020"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            License Plate
                          </label>
                          <Input 
                            placeholder="e.g., ABC-1234"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Vehicle Color
                          </label>
                          <Input 
                            placeholder="e.g., Silver"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Year
                          </label>
                          <Input 
                            placeholder="e.g., 2020"
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === 'payment_setup' && step.status === 'pending' && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                        <h4 className="font-medium text-white">Payment Setup</h4>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Connect your bank account to receive payments. We use Stripe for secure payment processing.
                      </p>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Connect Bank Account
                      </Button>
                    </div>
                  )}

                  {step.id === 'training' && step.status === 'pending' && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-5 h-5 text-yellow-400" />
                        <h4 className="font-medium text-white">Safety Training (Optional)</h4>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Complete our safety training course to learn best practices for delivery drivers. 
                        This is optional but recommended for better earnings.
                      </p>
                      <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                        Start Training Course
                      </Button>
                    </div>
                  )}

                  {/* Action buttons for each step */}
                  {step.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => setCurrentStep(index)}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Start This Step
                      </Button>
                      {!step.required && (
                        <Button variant="outline" className="border-gray-600 text-gray-300">
                          Skip (Optional)
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <IdCard className="w-5 h-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Document Verification</span>
              <Badge className="bg-yellow-900/30 text-yellow-300 border-yellow-600/30">
                In Progress
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Background Check</span>
              <Badge className="bg-gray-900/30 text-gray-300 border-gray-600/30">
                Pending
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Vehicle Verification</span>
              <Badge className="bg-gray-900/30 text-gray-300 border-gray-600/30">
                Pending
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Payment Setup</span>
              <Badge className="bg-gray-900/30 text-gray-300 border-gray-600/30">
                Pending
              </Badge>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-1">Verification Timeline</h4>
                <p className="text-sm text-blue-200">
                  Complete verification typically takes 2-5 business days. 
                  You'll receive email updates as each step is processed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverVerification;
