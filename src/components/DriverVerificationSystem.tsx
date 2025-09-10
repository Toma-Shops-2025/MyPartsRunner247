import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, XCircle, FileText, Shield, CreditCard, Car, AlertCircle } from 'lucide-react';

interface DriverVerificationSystemProps {
  driverId: string;
  onComplete: () => void;
}

interface Document {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt?: string;
  rejectionReason?: string;
}

const DriverVerificationSystem: React.FC<DriverVerificationSystemProps> = ({ driverId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', type: 'driver_license', name: 'Driver License', status: 'pending' },
    { id: '2', type: 'insurance', name: 'Vehicle Insurance', status: 'pending' },
    { id: '3', type: 'registration', name: 'Vehicle Registration', status: 'pending' },
    { id: '4', type: 'background_check', name: 'Background Check', status: 'pending' },
    { id: '5', type: 'vehicle_inspection', name: 'Vehicle Inspection', status: 'pending' }
  ]);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    vin: ''
  });
  const [bankInfo, setBankInfo] = useState({
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking'
  });

  const steps = [
    { id: 1, title: 'Personal Information', icon: FileText },
    { id: 2, title: 'Vehicle Information', icon: Car },
    { id: 3, title: 'Document Upload', icon: Upload },
    { id: 4, title: 'Background Check', icon: Shield },
    { id: 5, title: 'Payment Setup', icon: CreditCard }
  ];

  const handleDocumentUpload = (documentId: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, status: 'pending', uploadedAt: new Date().toISOString() }
        : doc
    ));
    // In a real app, upload the file to your storage service
    console.log('Uploading document:', file);
  };

  const handleBackgroundCheck = async () => {
    // Simulate background check process
    setDocuments(prev => prev.map(doc => 
      doc.type === 'background_check' 
        ? { ...doc, status: 'approved' }
        : doc
    ));
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const completedSteps = documents.filter(doc => doc.status === 'approved').length;
  const totalSteps = documents.length;
  const progress = (completedSteps / totalSteps) * 100;

  const isStepComplete = (stepId: number) => {
    switch (stepId) {
      case 1:
        return Object.values(personalInfo).every(value => value.trim() !== '');
      case 2:
        return Object.values(vehicleInfo).every(value => value.trim() !== '');
      case 3:
        return documents.filter(doc => doc.type !== 'background_check').every(doc => doc.status === 'approved');
      case 4:
        return documents.find(doc => doc.type === 'background_check')?.status === 'approved';
      case 5:
        return Object.values(bankInfo).every(value => value.trim() !== '');
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Driver Verification</h2>
              <Badge className="bg-teal-100 text-teal-800">
                {completedSteps} of {totalSteps} Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600">
              Complete all steps to become a verified MyPartsRunner driver
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isComplete = isStepComplete(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <Card 
              key={step.id} 
              className={`cursor-pointer transition-all ${
                isCurrent ? 'ring-2 ring-teal-500' : 
                isComplete ? 'bg-green-50 border-green-200' : 
                'hover:shadow-md'
              }`}
              onClick={() => setCurrentStep(step.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  isComplete ? 'bg-green-500 text-white' : 
                  isCurrent ? 'bg-teal-500 text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium">{step.title}</h3>
                {isComplete && (
                  <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ssn">Social Security Number *</Label>
                  <Input
                    id="ssn"
                    value={personalInfo.ssn}
                    onChange={(e) => setPersonalInfo({...personalInfo, ssn: e.target.value})}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({...personalInfo, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={personalInfo.state} onValueChange={(value) => setPersonalInfo({...personalInfo, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AL">Alabama</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      {/* Add more states */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={personalInfo.zipCode}
                    onChange={(e) => setPersonalInfo({...personalInfo, zipCode: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={vehicleInfo.make}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={vehicleInfo.model}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={vehicleInfo.year}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    value={vehicleInfo.color}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, color: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={vehicleInfo.licensePlate}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, licensePlate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  value={vehicleInfo.vin}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, vin: e.target.value})}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Upload the required documents. All documents will be verified by our team.
              </p>
              {documents.filter(doc => doc.type !== 'background_check').map((document) => (
                <Card key={document.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDocumentStatusIcon(document.status)}
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-gray-600">Required for verification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getDocumentStatusColor(document.status)}>
                        {document.status.toUpperCase()}
                      </Badge>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload(document.id, file);
                        }}
                        className="hidden"
                        id={`upload-${document.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById(`upload-${document.id}`)?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Background Check</h3>
                <p className="text-gray-600 mb-4">
                  We'll run a comprehensive background check to ensure driver safety.
                </p>
                <Button onClick={handleBackgroundCheck} className="bg-teal-600 hover:bg-teal-700">
                  Start Background Check
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number *</Label>
                  <Input
                    id="routingNumber"
                    value={bankInfo.routingNumber}
                    onChange={(e) => setBankInfo({...bankInfo, routingNumber: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accountType">Account Type *</Label>
                <Select value={bankInfo.accountType} onValueChange={(value) => setBankInfo({...bankInfo, accountType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentStep < steps.length) {
              setCurrentStep(currentStep + 1);
            } else {
              onComplete();
            }
          }}
          disabled={!isStepComplete(currentStep)}
        >
          {currentStep === steps.length ? 'Complete Verification' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default DriverVerificationSystem;
