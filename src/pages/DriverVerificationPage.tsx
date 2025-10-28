import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Save, 
  Upload, 
  CheckCircle, 
  X, 
  Shield, 
  FileText, 
  Car, 
  CreditCard,
  AlertTriangle,
  Clock,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { DocumentUploadService, DocumentMetadata } from '@/services/DocumentUploadService';
import { DriverAutoApprovalService } from '@/services/DriverAutoApprovalService';

interface VerificationStatus {
  background_check: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'not_started';
  driver_license: 'pending' | 'uploaded' | 'verified' | 'rejected';
  driver_license_back: 'pending' | 'uploaded' | 'verified' | 'rejected';
  insurance: 'pending' | 'uploaded' | 'verified' | 'rejected';
  vehicle_registration: 'pending' | 'uploaded' | 'verified' | 'rejected';
  overall: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
}

const DriverVerificationPage: React.FC = () => {
  const { user, profile, loading } = useAuth();

  // Helper function to check if we're in development mode
  const isDevelopment = () => {
    return typeof window !== 'undefined' && window.location.hostname === 'localhost';
  };

  // State management
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    background_check: 'not_started',
    driver_license: 'pending',
    driver_license_back: 'pending',
    insurance: 'pending',
    vehicle_registration: 'pending',
    overall: 'incomplete'
  });

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});
  const [verificationDeadline, setVerificationDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverDocuments, setDriverDocuments] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    ssnLastFour: '',
    driverLicense: '',
    driverLicenseExp: '',
    transportationType: '',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      vin: ''
    },
    insuranceInfo: {
      company: '',
      policyNumber: '',
      expirationDate: ''
    },
    bankingInfo: {
      accountType: '',
      routingNumber: '',
      accountNumber: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  // File input refs
  const driverLicenseRef = useRef<HTMLInputElement>(null);
  const driverLicenseBackRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);
  const registrationRef = useRef<HTMLInputElement>(null);

  // Load verification deadline
  const loadVerificationDeadline = async () => {
    if (!user?.id) {
      if (isDevelopment()) {
        console.log('No user ID available for verification deadline query');
      }
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      setVerificationDeadline(defaultDeadline);
      return;
    }
    
    try {
      const storedDeadline = localStorage.getItem('verification_deadline');
      if (storedDeadline) {
        const deadline = new Date(storedDeadline);
        if (deadline > new Date()) {
          setVerificationDeadline(deadline);
          return;
        }
      }
    } catch (error) {
      if (isDevelopment()) {
        console.warn('Error reading deadline from localStorage:', error);
      }
    }
    
    // Skip database query entirely and rely on localStorage fallback
    if (isDevelopment()) {
      console.log('Skipping database query, using localStorage fallback for verification deadline');
    }
    
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    setVerificationDeadline(defaultDeadline);
    
    try {
      localStorage.setItem('verification_deadline', defaultDeadline.toISOString());
    } catch (quotaError) {
      if (isDevelopment()) {
        console.warn('Could not store deadline in localStorage:', quotaError);
      }
    }
    return;
  };

  // Load existing driver documents
  const loadDriverDocuments = async () => {
    if (!user?.id) return;

    try {
      const documents = await DocumentUploadService.getDriverDocuments(user.id);
      setDriverDocuments(documents);
      
      // Update verification status based on existing documents
      const status: VerificationStatus = {
        background_check: 'not_started',
        driver_license: 'pending',
        driver_license_back: 'pending',
        insurance: 'pending',
        vehicle_registration: 'pending',
        overall: 'incomplete'
      };

      documents.forEach(doc => {
        console.log('Processing document:', doc.document_type, 'status:', doc.status);
        if (doc.document_type === 'driver_license') {
          if (doc.status === 'approved') {
            status.driver_license = 'verified';
          } else if (doc.status === 'uploaded' || doc.status === 'pending_review') {
            status.driver_license = 'uploaded';
          }
        } else if (doc.document_type === 'driver_license_back') {
          if (doc.status === 'approved') {
            status.driver_license_back = 'verified';
          } else if (doc.status === 'uploaded' || doc.status === 'pending_review') {
            status.driver_license_back = 'uploaded';
          }
        } else if (doc.document_type === 'insurance_certificate') {
          if (doc.status === 'approved') {
            status.insurance = 'verified';
          } else if (doc.status === 'uploaded' || doc.status === 'pending_review') {
            status.insurance = 'uploaded';
          }
        } else if (doc.document_type === 'vehicle_registration') {
          if (doc.status === 'approved') {
            status.vehicle_registration = 'verified';
          } else if (doc.status === 'uploaded' || doc.status === 'pending_review') {
            status.vehicle_registration = 'uploaded';
          }
        }
      });

      // Check if all required documents are verified
      const allVerified = status.driver_license === 'verified' && 
                         status.driver_license_back === 'verified' && 
                         status.insurance === 'verified';

      if (allVerified) {
        status.overall = 'approved';
      } else if (status.driver_license !== 'pending' || status.insurance !== 'pending') {
        status.overall = 'pending_review';
      }

      console.log('Updated verification status:', status);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Error loading driver documents:', error);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!verificationDeadline) return;

    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = verificationDeadline.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setTimeRemaining('Deadline passed');
        return;
      }
      
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`${days} days, ${hours} hours remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hours, ${minutes} minutes remaining`);
      } else {
        setTimeRemaining(`${minutes} minutes remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [verificationDeadline]);

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      loadVerificationDeadline();
      loadDriverDocuments();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user || profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

  const handleFileUpload = async (type: string, file: File) => {
    if (!user?.id) {
      console.error('No user ID available for file upload');
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Upload failed",
        description: "User not authenticated. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));

    // Get expiration date based on document type
    let expirationDate: string | undefined;
    if (type === 'driver_license' && formData.driverLicenseExp) {
      expirationDate = formData.driverLicenseExp;
    } else if (type === 'insurance_certificate' && formData.insuranceInfo.expirationDate) {
      expirationDate = formData.insuranceInfo.expirationDate;
    }

    const metadata: DocumentMetadata = {
      documentType: type,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      userId: user.id,
      expirationDate: expirationDate
    };

    try {
      const result = await DocumentUploadService.uploadDocument(file, metadata);
      
      if (result.success) {
        setUploadedFiles(prev => ({ ...prev, [type]: file }));
        setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
        
        toast({
          title: "Document uploaded successfully",
          description: `${type.replace('_', ' ')} has been uploaded and is pending review.`,
        });

        // Reload documents to update status
        await loadDriverDocuments();
      } else {
        setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload document. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (type: string) => {
    const refs = {
      driver_license: driverLicenseRef,
      driver_license_back: driverLicenseBackRef,
      insurance_certificate: insuranceRef,
      vehicle_registration: registrationRef
    };
    
    const input = refs[type as keyof typeof refs]?.current;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(type, file);
    }
  };


  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Update profile with verification info - only update basic columns that definitely exist
      // Start with the most basic columns that should exist in any profiles table
      const basicUpdateData: any = {
        full_name: formData.fullName,
        phone: formData.phone
      };

      try {
        // First, try to update only the most basic columns
        const { error: basicError } = await supabase
          .from('profiles')
          .update(basicUpdateData)
          .eq('id', user.id);

        if (basicError) {
          console.error('Error updating basic profile info:', basicError);
          throw basicError;
        }

        // Try to update additional columns one by one to avoid schema issues
        const additionalFields = [
          { field: 'date_of_birth', value: formData.dateOfBirth },
          { field: 'ssn_last_four', value: formData.ssnLastFour },
          { field: 'driver_license', value: formData.driverLicense },
          { field: 'driver_license_exp', value: formData.driverLicenseExp },
          { field: 'transportation_type', value: formData.transportationType }
        ];

        for (const { field, value } of additionalFields) {
          try {
            await supabase
              .from('profiles')
              .update({ [field]: value })
              .eq('id', user.id);
          } catch (fieldError) {
            console.warn(`Column ${field} may not exist, skipping:`, fieldError);
            // Continue with other fields
          }
        }

        // Try to update JSONB fields separately
        const jsonbFields = [
          { field: 'vehicle_info', value: formData.vehicleInfo },
          { field: 'insurance_info', value: formData.insuranceInfo },
          { field: 'banking_info', value: formData.bankingInfo },
          { field: 'address', value: formData.address },
          { field: 'emergency_contact', value: formData.emergencyContact }
        ];

        for (const { field, value } of jsonbFields) {
          try {
            await supabase
              .from('profiles')
              .update({ [field]: value })
              .eq('id', user.id);
          } catch (fieldError) {
            console.warn(`JSONB column ${field} may not exist, skipping:`, fieldError);
            // Continue with other fields
          }
        }

      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to save verification information. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Auto-approve onboarding completion
      await DriverAutoApprovalService.autoApproveOnboarding(user.id);

      toast({
        title: "Verification submitted",
        description: "Your verification information has been submitted and automatically approved! Redirecting to dashboard...",
      });

      setVerificationStatus(prev => ({ ...prev, overall: 'approved' }));

      // Redirect to dashboard after successful completion
      setTimeout(() => {
        window.location.href = '/driver-dashboard';
      }, 2000);
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'uploaded':
      case 'pending_review':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'uploaded':
        return 'Uploaded - Pending Review';
      case 'pending_review':
        return 'Pending Review';
      default:
        return 'Not Uploaded';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Driver Verification</h1>
          <p className="text-gray-300">
            Complete your verification to start accepting deliveries
          </p>
          {verificationDeadline && (
            <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-yellow-300 font-medium">
                  Verification Deadline: {timeRemaining}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <Card className="mb-8 bg-blue-900 border-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">!</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-100 mb-3">IMPORTANT NOTICE</h3>
                <div className="text-blue-200 text-base leading-relaxed space-y-2">
                  <p className="font-semibold">
                    ONCE THE DRIVER HAS SUBMITTED THEIR DRIVERS LICENSE AND INSURANCE THEY WILL BE GRANTED ACCESS TO THE DRIVER DASHBOARD AND CAN START TAKING DELIVERIES.
                  </p>
                  <p>
                    DRIVERS WILL HAVE 7 DAYS TO WATCH THE SHORT DRIVER TRAINING VIDEOS.
                  </p>
                  <p>
                    DRIVERS WILL BE CONTACTED IF ANY FURTHER OBLIGATIONS NEED TO BE MET.
                  </p>
                  <p className="text-blue-300 font-medium">
                    THANK YOU FOR CHOOSING TO DELIVER WITH MYPARTSRUNNER
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Status */}
        <Card className="mb-8 bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center text-teal-400">
              <Shield className="w-6 h-6 mr-2" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getStatusIcon(verificationStatus.driver_license)}
                </div>
                <p className="text-sm font-medium text-white">Driver License</p>
                <p className="text-xs text-gray-400">{getStatusText(verificationStatus.driver_license)}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {getStatusIcon(verificationStatus.insurance)}
                </div>
                <p className="text-sm font-medium text-white">Insurance</p>
                <p className="text-xs text-gray-400">{getStatusText(verificationStatus.insurance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <Card className="mb-8 bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center text-teal-400">
              <FileText className="w-6 h-6 mr-2" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Driver License Front */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">Driver's License (Front)</h3>
                  <p className="text-sm text-gray-300">Upload a clear photo of the front of your driver's license</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(verificationStatus.driver_license)}
                  <span className="text-sm text-gray-300">{getStatusText(verificationStatus.driver_license)}</span>
                </div>
              </div>
              <Button
                onClick={() => handleFileSelect('driver_license')}
                disabled={uploadStatus.driver_license === 'uploading'}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {uploadStatus.driver_license === 'uploading' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload License
                  </>
                )}
              </Button>
              <input
                ref={driverLicenseRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('driver_license', e)}
                className="hidden"
              />
              
              {/* Driver License Expiration Date */}
              <div className="mt-4">
                <Label htmlFor="driverLicenseExp" className="text-sm text-gray-300">
                  License Expiration Date
                </Label>
                <Input
                  id="driverLicenseExp"
                  type="date"
                  value={formData.driverLicenseExp}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverLicenseExp: e.target.value }))}
                  className="mt-1 bg-gray-600 border-gray-500 text-white"
                />
              </div>
            </div>

            {/* Driver License Back */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">Driver's License (Back)</h3>
                  <p className="text-sm text-gray-300">Upload a clear photo of the back of your driver's license</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(verificationStatus.driver_license_back)}
                  <span className="text-sm text-gray-300">{getStatusText(verificationStatus.driver_license_back)}</span>
                </div>
              </div>
              <Button
                onClick={() => handleFileSelect('driver_license_back')}
                disabled={uploadStatus.driver_license_back === 'uploading'}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {uploadStatus.driver_license_back === 'uploading' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload License Back
                  </>
                )}
              </Button>
              <input
                ref={driverLicenseBackRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('driver_license_back', e)}
                className="hidden"
              />
            </div>

            {/* Insurance Certificate */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">Insurance Certificate</h3>
                  <p className="text-sm text-gray-300">Upload your current auto insurance certificate</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(verificationStatus.insurance)}
                  <span className="text-sm text-gray-300">{getStatusText(verificationStatus.insurance)}</span>
                </div>
              </div>
              <Button
                onClick={() => handleFileSelect('insurance_certificate')}
                disabled={uploadStatus.insurance_certificate === 'uploading'}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {uploadStatus.insurance_certificate === 'uploading' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Insurance
                  </>
                )}
              </Button>
              <input
                ref={insuranceRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('insurance_certificate', e)}
                className="hidden"
              />
              
              {/* Insurance Expiration Date */}
              <div className="mt-4">
                <Label htmlFor="insuranceExpiration" className="text-sm text-gray-300">
                  Insurance Expiration Date
                </Label>
                <Input
                  id="insuranceExpiration"
                  type="date"
                  value={formData.insuranceInfo.expirationDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    insuranceInfo: { ...prev.insuranceInfo, expirationDate: e.target.value }
                  }))}
                  className="mt-1 bg-gray-600 border-gray-500 text-white"
                />
              </div>
            </div>

            {/* Vehicle Registration - Optional */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">Vehicle Registration <span className="text-yellow-400 text-sm">(OPTIONAL)</span></h3>
                  <p className="text-sm text-gray-300">Upload your vehicle registration document (optional)</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(verificationStatus.vehicle_registration)}
                  <span className="text-sm text-gray-300">{getStatusText(verificationStatus.vehicle_registration)}</span>
                </div>
              </div>
              <Button
                onClick={() => handleFileSelect('vehicle_registration')}
                disabled={uploadStatus.vehicle_registration === 'uploading'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              >
                {uploadStatus.vehicle_registration === 'uploading' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Registration (Optional)
                  </>
                )}
              </Button>
              <input
                ref={registrationRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('vehicle_registration', e)}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>


        {/* Personal Information Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-6 h-6 text-teal-600 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ssnLastFour">SSN Last 4 Digits</Label>
                <Input
                  id="ssnLastFour"
                  value={formData.ssnLastFour}
                  onChange={(e) => setFormData(prev => ({ ...prev, ssnLastFour: e.target.value }))}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverLicense">Driver License Number</Label>
                <Input
                  id="driverLicense"
                  value={formData.driverLicense}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverLicense: e.target.value }))}
                  placeholder="Enter driver license number"
                />
              </div>
              <div>
                <Label htmlFor="driverLicenseExp">License Expiration</Label>
                <Input
                  id="driverLicenseExp"
                  type="date"
                  value={formData.driverLicenseExp}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverLicenseExp: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transportation & Vehicle Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-6 h-6 text-teal-600 mr-2" />
              Transportation & Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transportation Type Selection */}
            <div>
              <Label htmlFor="transportationType">Transportation Method *</Label>
              <Select
                value={formData.transportationType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, transportationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your transportation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Vehicle Information - Only show for vehicle-based transportation */}
            {(formData.transportationType === 'car' || 
              formData.transportationType === 'truck' || 
              formData.transportationType === 'van' || 
              formData.transportationType === 'suv' || 
              formData.transportationType === 'motorcycle') && (
              <>
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Vehicle Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={formData.vehicleInfo.make}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, make: e.target.value }
                  }))}
                  placeholder="Toyota"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.vehicleInfo.model}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, model: e.target.value }
                  }))}
                  placeholder="Camry"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.vehicleInfo.year}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, year: e.target.value }
                  }))}
                  placeholder="2020"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.vehicleInfo.color}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, color: e.target.value }
                  }))}
                  placeholder="Silver"
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={formData.vehicleInfo.licensePlate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, licensePlate: e.target.value }
                  }))}
                  placeholder="ABC123"
                />
              </div>
              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={formData.vehicleInfo.vin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vehicleInfo: { ...prev.vehicleInfo, vin: e.target.value }
                  }))}
                  placeholder="1HGBH41JXMN109186"
                />
              </div>
            </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || verificationStatus.overall === 'approved'}
            size="lg"
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverVerificationPage;
