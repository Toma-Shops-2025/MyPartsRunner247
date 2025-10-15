import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DriverApplicationPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [applicationData, setApplicationData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    license_number: '',
    license_state: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    license_plate: '',
    insurance_provider: '',
    insurance_policy: '',
    experience_years: '',
    availability: '',
    why_drive: '',
    transportation_type: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile?.user_type === 'driver') {
    return <Navigate to="/driver-dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Update user profile to driver and automatically approve
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'driver'
        })
        .eq('id', user?.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Create driver application record for tracking
      const { error: applicationError } = await supabase
        .from('driver_applications')
        .insert([{
          user_id: user?.id,
          status: 'approved',
          approved_at: new Date().toISOString()
        }]);

      if (applicationError) {
        console.error('Application insert error:', applicationError);
        // Don't throw - profile update succeeded
      }

      // Show success message and redirect to driver dashboard
      alert('Congratulations! You are now approved as a driver. You are automatically set to ONLINE and ready to accept deliveries!');
      
      // Force page reload to update auth state
      window.location.href = '/driver-dashboard';
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Driver Application</h1>
          <p className="text-gray-300">Apply to become a MyPartsRunner driver and start earning money delivering packages.</p>
        </div>

        {/* Attention Notice */}
        <Card className="bg-blue-900 border-blue-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-100 mb-2">ATTENTION:</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  All drivers are immediately approved with access to the Driver Dashboard and able to start accepting and delivering orders. 
                  Please submit/upload your Vehicle Registration and Insurance Verification or provide your mode of delivery in Vehicle Settings in the dropdown menu.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FileText className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={applicationData.full_name}
                    onChange={(e) => setApplicationData({...applicationData, full_name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver's License */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Driver's License Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-white">License Number</Label>
                  <Input 
                    id="license_number" 
                    value={applicationData.license_number}
                    onChange={(e) => setApplicationData({...applicationData, license_number: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_state" className="text-white">State</Label>
                  <Select value={applicationData.license_state} onValueChange={(value) => setApplicationData({...applicationData, license_state: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AL">Alabama</SelectItem>
                      <SelectItem value="AK">Alaska</SelectItem>
                      <SelectItem value="AZ">Arizona</SelectItem>
                      <SelectItem value="AR">Arkansas</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="CO">Colorado</SelectItem>
                      <SelectItem value="CT">Connecticut</SelectItem>
                      <SelectItem value="DE">Delaware</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="GA">Georgia</SelectItem>
                      <SelectItem value="HI">Hawaii</SelectItem>
                      <SelectItem value="ID">Idaho</SelectItem>
                      <SelectItem value="IL">Illinois</SelectItem>
                      <SelectItem value="IN">Indiana</SelectItem>
                      <SelectItem value="IA">Iowa</SelectItem>
                      <SelectItem value="KS">Kansas</SelectItem>
                      <SelectItem value="KY">Kentucky</SelectItem>
                      <SelectItem value="LA">Louisiana</SelectItem>
                      <SelectItem value="ME">Maine</SelectItem>
                      <SelectItem value="MD">Maryland</SelectItem>
                      <SelectItem value="MA">Massachusetts</SelectItem>
                      <SelectItem value="MI">Michigan</SelectItem>
                      <SelectItem value="MN">Minnesota</SelectItem>
                      <SelectItem value="MS">Mississippi</SelectItem>
                      <SelectItem value="MO">Missouri</SelectItem>
                      <SelectItem value="MT">Montana</SelectItem>
                      <SelectItem value="NE">Nebraska</SelectItem>
                      <SelectItem value="NV">Nevada</SelectItem>
                      <SelectItem value="NH">New Hampshire</SelectItem>
                      <SelectItem value="NJ">New Jersey</SelectItem>
                      <SelectItem value="NM">New Mexico</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="NC">North Carolina</SelectItem>
                      <SelectItem value="ND">North Dakota</SelectItem>
                      <SelectItem value="OH">Ohio</SelectItem>
                      <SelectItem value="OK">Oklahoma</SelectItem>
                      <SelectItem value="OR">Oregon</SelectItem>
                      <SelectItem value="PA">Pennsylvania</SelectItem>
                      <SelectItem value="RI">Rhode Island</SelectItem>
                      <SelectItem value="SC">South Carolina</SelectItem>
                      <SelectItem value="SD">South Dakota</SelectItem>
                      <SelectItem value="TN">Tennessee</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="UT">Utah</SelectItem>
                      <SelectItem value="VT">Vermont</SelectItem>
                      <SelectItem value="VA">Virginia</SelectItem>
                      <SelectItem value="WA">Washington</SelectItem>
                      <SelectItem value="WV">West Virginia</SelectItem>
                      <SelectItem value="WI">Wisconsin</SelectItem>
                      <SelectItem value="WY">Wyoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Car className="mr-2 h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_make" className="text-white">Vehicle Make</Label>
                  <Input 
                    id="vehicle_make" 
                    value={applicationData.vehicle_make}
                    onChange={(e) => setApplicationData({...applicationData, vehicle_make: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model" className="text-white">Vehicle Model</Label>
                  <Input 
                    id="vehicle_model" 
                    value={applicationData.vehicle_model}
                    onChange={(e) => setApplicationData({...applicationData, vehicle_model: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_year" className="text-white">Year</Label>
                  <Input 
                    id="vehicle_year" 
                    value={applicationData.vehicle_year}
                    onChange={(e) => setApplicationData({...applicationData, vehicle_year: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_color" className="text-white">Color</Label>
                  <Input 
                    id="vehicle_color" 
                    value={applicationData.vehicle_color}
                    onChange={(e) => setApplicationData({...applicationData, vehicle_color: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_plate" className="text-white">License Plate</Label>
                  <Input 
                    id="license_plate" 
                    value={applicationData.license_plate}
                    onChange={(e) => setApplicationData({...applicationData, license_plate: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_provider" className="text-white">Insurance Provider</Label>
                  <Input 
                    id="insurance_provider" 
                    value={applicationData.insurance_provider}
                    onChange={(e) => setApplicationData({...applicationData, insurance_provider: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_policy" className="text-white">Policy Number</Label>
                  <Input 
                    id="insurance_policy" 
                    value={applicationData.insurance_policy}
                    onChange={(e) => setApplicationData({...applicationData, insurance_policy: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Availability */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Experience & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience_years" className="text-white">Years of Driving Experience</Label>
                  <Select value={applicationData.experience_years} onValueChange={(value) => setApplicationData({...applicationData, experience_years: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-3">2-3 years</SelectItem>
                      <SelectItem value="4-5">4-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-white">Availability</Label>
                  <Select value={applicationData.availability} onValueChange={(value) => setApplicationData({...applicationData, availability: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="part-time">Part-time (evenings/weekends)</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="flexible">Flexible schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="why_drive" className="text-white">Why do you want to drive for MyPartsRunner?</Label>
                <Textarea 
                  id="why_drive" 
                  value={applicationData.why_drive}
                  onChange={(e) => setApplicationData({...applicationData, why_drive: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  placeholder="Tell us why you'd like to join our driver team..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportation_type" className="text-white">What type of transportation will you be using for deliveries?</Label>
                <Textarea 
                  id="transportation_type" 
                  value={applicationData.transportation_type}
                  onChange={(e) => setApplicationData({...applicationData, transportation_type: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  placeholder="Please describe your delivery method (e.g., Car - Honda Civic 2020, Motorcycle - Yamaha R3, Bicycle, Walking, etc.)"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={submitting}
            >
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default DriverApplicationPage;