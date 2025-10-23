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

interface VerificationStatus {
  background_check: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'not_started';
  driver_license: 'pending' | 'uploaded' | 'verified' | 'rejected';
  insurance: 'pending' | 'uploaded' | 'verified' | 'rejected';
  vehicle_registration: 'pending' | 'uploaded' | 'verified' | 'rejected';
  overall: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
}

const DriverVerificationPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [verificationData, setVerificationData] = useState({
    full_name: '',
    date_of_birth: '',
    ssn_last_four: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    years_driving: '',
    previous_employer: '',
    has_criminal_record: false,
    has_traffic_violations: false,
    has_dui: false,
    has_accidents: false,
    background_check_consent: false,
    terms_agreement: false
  });

  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    vin: '',
    insurance_company: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    vehicle_type: 'sedan'
  });

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    background_check: 'not_started',
    driver_license: 'pending',
    insurance: 'pending',
    vehicle_registration: 'pending',
    overall: 'incomplete'
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    driver_license: null as File | null,
    insurance_certificate: null as File | null,
    vehicle_registration: null as File | null,
    profile_photo: null as File | null
  });

  const [uploadStatus, setUploadStatus] = useState({
    driver_license: 'pending' as 'pending' | 'uploading' | 'success' | 'error',
    insurance_certificate: 'pending' as 'pending' | 'uploading' | 'success' | 'error',
    vehicle_registration: 'pending' as 'pending' | 'uploading' | 'success' | 'error',
    profile_photo: 'pending' as 'pending' | 'uploading' | 'success' | 'error'
  });

  const [saving, setSaving] = useState(false);
  const [checkrConnected, setCheckrConnected] = useState(false);
  const [verificationDeadline, setVerificationDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // File input refs
  const driverLicenseRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);
  const registrationRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  // Load existing data and deadline
  useEffect(() => {
    if (profile) {
      setVerificationData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      }));
    }
    
    // Load verification deadline
    loadVerificationDeadline();
  }, [profile]);

  const loadVerificationDeadline = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select('verification_deadline')
        .eq('user_id', user?.id)
        .single();
      
      if (data?.verification_deadline) {
        const deadline = new Date(data.verification_deadline);
        setVerificationDeadline(deadline);
      }
    } catch (error) {
      console.error('Error loading verification deadline:', error);
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
    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
      
      toast({
        title: "Document uploaded successfully!",
        description: `${type.replace('_', ' ')} has been uploaded and will be reviewed.`,
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (type: string) => {
    const refs = {
      driver_license: driverLicenseRef,
      insurance_certificate: insuranceRef,
      vehicle_registration: registrationRef,
      profile_photo: profilePhotoRef
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

  const initiateBackgroundCheck = async () => {
    try {
      // Simulate Checkr integration
      setVerificationStatus(prev => ({ ...prev, background_check: 'in_progress' }));
      
      toast({
        title: "Background check initiated",
        description: "Your background check has been started. You'll receive updates via email.",
      });

      // Simulate Checkr API call
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, background_check: 'approved' }));
        setCheckrConnected(true);
        toast({
          title: "Background check completed",
          description: "Your background check has been approved!",
        });
      }, 3000);
    } catch (error) {
      console.error('Error initiating background check:', error);
      toast({
        title: "Background check failed",
        description: "There was an error starting your background check. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const verificationInfo = {
        ...verificationData,
        ...vehicleData,
        verification_status: verificationStatus,
        documents_uploaded: {
          driver_license: uploadStatus.driver_license === 'success',
          insurance_certificate: uploadStatus.insurance_certificate === 'success',
          vehicle_registration: uploadStatus.vehicle_registration === 'success',
          profile_photo: uploadStatus.profile_photo === 'success'
        },
        updated_at: new Date().toISOString()
      };

      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_info: verificationInfo
        })
        .eq('id', user.id);
      
      if (error) throw error;

      // Save to localStorage as backup
      localStorage.setItem('driver_verification', JSON.stringify(verificationInfo));
      
      toast({
        title: "Verification information saved!",
        description: "Your driver verification information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving verification info:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'in_progress':
      case 'uploading':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'in_progress':
      case 'uploading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Driver Onboarding</h1>
          <p className="text-gray-600">Complete your driver onboarding to start accepting orders</p>
          
          {/* Deadline Alert */}
          {verificationDeadline && (
            <Alert className={`mt-4 ${
              timeRemaining === 'Deadline passed' 
                ? 'border-red-200 bg-red-50' 
                : timeRemaining.includes('days') && parseInt(timeRemaining) <= 1
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-blue-200 bg-blue-50'
            }`}>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Onboarding Deadline:</strong> {timeRemaining === 'Deadline passed' 
                  ? 'Your onboarding deadline has passed. Please complete onboarding immediately to continue driving.'
                  : `You have ${timeRemaining} to complete your driver onboarding.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Verification Status Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Onboarding Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${getStatusColor(verificationStatus.background_check)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Background Check</span>
                  {getStatusIcon(verificationStatus.background_check)}
                </div>
                <p className="text-sm mt-1 capitalize">{verificationStatus.background_check.replace('_', ' ')}</p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(verificationStatus.driver_license)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Driver License</span>
                  {getStatusIcon(verificationStatus.driver_license)}
                </div>
                <p className="text-sm mt-1 capitalize">{verificationStatus.driver_license.replace('_', ' ')}</p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(verificationStatus.insurance)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Insurance</span>
                  {getStatusIcon(verificationStatus.insurance)}
                </div>
                <p className="text-sm mt-1 capitalize">{verificationStatus.insurance.replace('_', ' ')}</p>
              </div>
              
              <div className={`p-4 rounded-lg border ${getStatusColor(verificationStatus.vehicle_registration)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Vehicle Registration</span>
                  {getStatusIcon(verificationStatus.vehicle_registration)}
                </div>
                <p className="text-sm mt-1 capitalize">{verificationStatus.vehicle_registration.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input 
                    id="full_name" 
                    value={verificationData.full_name}
                    onChange={(e) => setVerificationData({...verificationData, full_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input 
                    id="date_of_birth" 
                    type="date"
                    value={verificationData.date_of_birth}
                    onChange={(e) => setVerificationData({...verificationData, date_of_birth: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssn_last_four">SSN Last 4 Digits *</Label>
                  <Input 
                    id="ssn_last_four" 
                    value={verificationData.ssn_last_four}
                    onChange={(e) => setVerificationData({...verificationData, ssn_last_four: e.target.value})}
                    maxLength={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    value={verificationData.phone}
                    onChange={(e) => setVerificationData({...verificationData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input 
                    id="address" 
                    value={verificationData.address}
                    onChange={(e) => setVerificationData({...verificationData, address: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    value={verificationData.city}
                    onChange={(e) => setVerificationData({...verificationData, city: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={verificationData.state} onValueChange={(value) => setVerificationData({...verificationData, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KY">Kentucky</SelectItem>
                      <SelectItem value="IN">Indiana</SelectItem>
                      <SelectItem value="OH">Ohio</SelectItem>
                      <SelectItem value="TN">Tennessee</SelectItem>
                      <SelectItem value="IL">Illinois</SelectItem>
                      <SelectItem value="MO">Missouri</SelectItem>
                      <SelectItem value="WV">West Virginia</SelectItem>
                      <SelectItem value="VA">Virginia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code *</Label>
                  <Input 
                    id="zip_code" 
                    value={verificationData.zip_code}
                    onChange={(e) => setVerificationData({...verificationData, zip_code: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                  <Input 
                    id="emergency_contact_name" 
                    value={verificationData.emergency_contact_name}
                    onChange={(e) => setVerificationData({...verificationData, emergency_contact_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                  <Input 
                    id="emergency_contact_phone" 
                    value={verificationData.emergency_contact_phone}
                    onChange={(e) => setVerificationData({...verificationData, emergency_contact_phone: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Background Check (Checkr Integration)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  We use Checkr for professional background checks. This process typically takes 1-3 business days.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has_criminal_record"
                    checked={verificationData.has_criminal_record}
                    onCheckedChange={(checked) => setVerificationData({...verificationData, has_criminal_record: checked as boolean})}
                  />
                  <Label htmlFor="has_criminal_record">I have a criminal record</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has_traffic_violations"
                    checked={verificationData.has_traffic_violations}
                    onCheckedChange={(checked) => setVerificationData({...verificationData, has_traffic_violations: checked as boolean})}
                  />
                  <Label htmlFor="has_traffic_violations">I have traffic violations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has_dui"
                    checked={verificationData.has_dui}
                    onCheckedChange={(checked) => setVerificationData({...verificationData, has_dui: checked as boolean})}
                  />
                  <Label htmlFor="has_dui">I have a DUI/DWI conviction</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has_accidents"
                    checked={verificationData.has_accidents}
                    onCheckedChange={(checked) => setVerificationData({...verificationData, has_accidents: checked as boolean})}
                  />
                  <Label htmlFor="has_accidents">I have been in accidents</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="background_check_consent"
                  checked={verificationData.background_check_consent}
                  onCheckedChange={(checked) => setVerificationData({...verificationData, background_check_consent: checked as boolean})}
                />
                <Label htmlFor="background_check_consent">I consent to a background check through Checkr *</Label>
              </div>

              <Button 
                onClick={initiateBackgroundCheck}
                disabled={!verificationData.background_check_consent || verificationStatus.background_check === 'in_progress'}
                className="w-full md:w-auto"
              >
                {verificationStatus.background_check === 'in_progress' ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Background Check in Progress...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Background Check
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="mr-2 h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input 
                    id="make" 
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input 
                    id="model" 
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input 
                    id="year" 
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({...vehicleData, year: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input 
                    id="color" 
                    value={vehicleData.color}
                    onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate *</Label>
                  <Input 
                    id="license_plate" 
                    value={vehicleData.license_plate}
                    onChange={(e) => setVehicleData({...vehicleData, license_plate: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN Number *</Label>
                  <Input 
                    id="vin" 
                    value={vehicleData.vin}
                    onChange={(e) => setVehicleData({...vehicleData, vin: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                  <Select value={vehicleData.vehicle_type} onValueChange={(value) => setVehicleData({...vehicleData, vehicle_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="insurance_company">Insurance Company *</Label>
                  <Input 
                    id="insurance_company" 
                    value={vehicleData.insurance_company}
                    onChange={(e) => setVehicleData({...vehicleData, insurance_company: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_policy_number">Policy Number *</Label>
                  <Input 
                    id="insurance_policy_number" 
                    value={vehicleData.insurance_policy_number}
                    onChange={(e) => setVehicleData({...vehicleData, insurance_policy_number: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry">Insurance Expiry Date *</Label>
                  <Input 
                    id="insurance_expiry" 
                    type="date"
                    value={vehicleData.insurance_expiry}
                    onChange={(e) => setVehicleData({...vehicleData, insurance_expiry: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver License Upload */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.driver_license === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.driver_license === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.driver_license === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.driver_license === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.driver_license === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.driver_license === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Driver License</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {uploadStatus.driver_license === 'success' ? 'Uploaded successfully!' :
                     uploadStatus.driver_license === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.driver_license === 'uploading' ? 'Uploading...' :
                     'Upload front and back of your driver license'}
                  </p>
                  <input
                    ref={driverLicenseRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('driver_license', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileSelect('driver_license')}
                    disabled={uploadStatus.driver_license === 'uploading'}
                  >
                    {uploadStatus.driver_license === 'uploading' ? 'Uploading...' : 'Upload License'}
                  </Button>
                </div>

                {/* Insurance Certificate Upload */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.insurance_certificate === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.insurance_certificate === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.insurance_certificate === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.insurance_certificate === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.insurance_certificate === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.insurance_certificate === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Insurance Certificate</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {uploadStatus.insurance_certificate === 'success' ? 'Uploaded successfully!' :
                     uploadStatus.insurance_certificate === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.insurance_certificate === 'uploading' ? 'Uploading...' :
                     'Upload your insurance certificate'}
                  </p>
                  <input
                    ref={insuranceRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('insurance_certificate', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileSelect('insurance_certificate')}
                    disabled={uploadStatus.insurance_certificate === 'uploading'}
                  >
                    {uploadStatus.insurance_certificate === 'uploading' ? 'Uploading...' : 'Upload Insurance'}
                  </Button>
                </div>

                {/* Vehicle Registration Upload */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.vehicle_registration === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.vehicle_registration === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.vehicle_registration === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.vehicle_registration === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.vehicle_registration === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.vehicle_registration === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Vehicle Registration</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {uploadStatus.vehicle_registration === 'success' ? 'Uploaded successfully!' :
                     uploadStatus.vehicle_registration === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.vehicle_registration === 'uploading' ? 'Uploading...' :
                     'Upload your vehicle registration'}
                  </p>
                  <input
                    ref={registrationRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('vehicle_registration', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileSelect('vehicle_registration')}
                    disabled={uploadStatus.vehicle_registration === 'uploading'}
                  >
                    {uploadStatus.vehicle_registration === 'uploading' ? 'Uploading...' : 'Upload Registration'}
                  </Button>
                </div>

                {/* Profile Photo Upload */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.profile_photo === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.profile_photo === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.profile_photo === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.profile_photo === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.profile_photo === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.profile_photo === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {uploadStatus.profile_photo === 'success' ? 'Uploaded successfully!' :
                     uploadStatus.profile_photo === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.profile_photo === 'uploading' ? 'Uploading...' :
                     'Upload a professional photo of yourself'}
                  </p>
                  <input
                    ref={profilePhotoRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('profile_photo', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileSelect('profile_photo')}
                    disabled={uploadStatus.profile_photo === 'uploading'}
                  >
                    {uploadStatus.profile_photo === 'uploading' ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5" />
                Terms and Agreements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms_agreement"
                  checked={verificationData.terms_agreement}
                  onCheckedChange={(checked) => setVerificationData({...verificationData, terms_agreement: checked as boolean})}
                />
                <Label htmlFor="terms_agreement" className="text-sm">
                  I agree to the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a> *
                </Label>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  By submitting this verification, you certify that all information provided is accurate and complete. 
                  Providing false information may result in immediate termination of your driver account.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              className="w-full md:w-auto"
              disabled={saving || !verificationData.terms_agreement}
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Onboarding Information
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverVerificationPage;
