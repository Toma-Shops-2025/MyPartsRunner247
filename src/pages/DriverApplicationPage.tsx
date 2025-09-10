import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, FileText, User } from 'lucide-react';

const DriverApplicationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    licenseNumber: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    insuranceProvider: '',
    experience: '',
    availability: '',
    agreeToTerms: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle application submission
    console.log('Application submitted:', formData);
    navigate('/driver-onboarding');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a MyPartsRunner Driver
          </h1>
          <p className="text-gray-600">
            Join our team and start earning money delivering auto parts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleYear">Vehicle Year *</Label>
                  <Input
                    id="vehicleYear"
                    required
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleMake">Vehicle Make *</Label>
                  <Input
                    id="vehicleMake"
                    required
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData({...formData, agreeToTerms: checked as boolean})
              }
            />
            <Label htmlFor="terms">
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={!formData.agreeToTerms}>
            Submit Application
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DriverApplicationPage;