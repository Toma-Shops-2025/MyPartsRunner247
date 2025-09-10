import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Car, FileText, Shield, CheckCircle } from 'lucide-react';

interface DriverRegistrationProps {
  onComplete: () => void;
}

const DriverRegistration: React.FC<DriverRegistrationProps> = ({ onComplete }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    ssn: '',
    driversLicense: '',
    driversLicenseExp: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: '',
    insuranceCompany: '',
    insurancePolicy: '',
    bankAccount: '',
    routingNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
    hasCommercialInsurance: false,
    hasCleanRecord: false,
    agreeToTerms: false
  });

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <h3 className="text-xl font-semibold mb-4">Sign In Required</h3>
          <p className="text-gray-600 mb-6">
            Please sign in to your account to submit a driver application.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Go to Homepage to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked!', { 
      user: !!user, 
      hasCommercialInsurance: formData.hasCommercialInsurance,
      hasCleanRecord: formData.hasCleanRecord,
      agreeToTerms: formData.agreeToTerms
    });
    
    if (!user) {
      alert('Please sign in to submit your driver application.');
      navigate('/');
      return;
    }
    
    setLoading(true);
    try {
      // Update user profile to driver and automatically approve
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Create driver application record for tracking
      const { error: applicationError } = await supabase
        .from('driver_applications')
        .insert([{
          user_id: user.id
        }]);

      if (applicationError) {
        console.error('Application insert error:', applicationError);
        throw applicationError;
      }

      // Show success message and navigate to driver dashboard
      alert('Congratulations! You are now approved as a driver. You are automatically set to ONLINE and ready to accept deliveries!');
      onComplete();
      navigate('/driver-dashboard');
    } catch (error) {
      console.error('Error submitting driver application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-6 h-6" />
          Become a Driver
        </CardTitle>
        <div className="flex items-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= num ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {num}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="ssn">Last 4 digits of SSN *</Label>
                <Input
                  id="ssn"
                  maxLength={4}
                  value={formData.ssn}
                  onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Information</h3>
            <div>
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select onValueChange={(value) => setFormData({...formData, vehicleType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleMake">Make *</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Model *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="vehicleYear">Year *</Label>
                <Input
                  id="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleColor">Vehicle Color *</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents & Banking
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driversLicense">Driver's License Number *</Label>
                <Input
                  id="driversLicense"
                  value={formData.driversLicense}
                  onChange={(e) => setFormData({...formData, driversLicense: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="driversLicenseExp">License Expiration Date *</Label>
                <Input
                  id="driversLicenseExp"
                  type="date"
                  value={formData.driversLicenseExp}
                  onChange={(e) => setFormData({...formData, driversLicenseExp: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceCompany">Insurance Company Name *</Label>
                <Input
                  id="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={(e) => setFormData({...formData, insuranceCompany: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="insurancePolicy">Insurance Policy # *</Label>
                <Input
                  id="insurancePolicy"
                  value={formData.insurancePolicy}
                  onChange={(e) => setFormData({...formData, insurancePolicy: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  type="password"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({...formData, routingNumber: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Final Steps
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasCommercialInsurance"
                  checked={formData.hasCommercialInsurance}
                  onCheckedChange={(checked) => setFormData({...formData, hasCommercialInsurance: checked as boolean})}
                />
                <Label htmlFor="hasCommercialInsurance">I have vehicle insurance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasCleanRecord"
                  checked={formData.hasCleanRecord}
                  onCheckedChange={(checked) => setFormData({...formData, hasCleanRecord: checked as boolean})}
                />
                <Label htmlFor="hasCleanRecord">I have a clean driving record</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                />
                <Label htmlFor="agreeToTerms">I agree to the Terms of Service and Privacy Policy</Label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={handleNext} className="ml-auto">
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.hasCommercialInsurance || !formData.hasCleanRecord || !formData.agreeToTerms}
              className="ml-auto bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
            >
              {loading ? 'Approving...' : 'Go Online & Start Driving!'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverRegistration;