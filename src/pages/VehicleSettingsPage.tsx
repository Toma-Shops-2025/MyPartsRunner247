import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Save, Upload, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const VehicleSettingsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState({
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    color: 'Silver',
    license_plate: 'ABC123',
    insurance_number: 'INS-789456',
    vehicle_type: 'sedan',
    transportation_type: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    registration: null as File | null,
    insurance: null as File | null
  });
  const [uploadStatus, setUploadStatus] = useState({
    registration: 'pending' as 'pending' | 'uploading' | 'success' | 'error',
    insurance: 'pending' as 'pending' | 'uploading' | 'success' | 'error'
  });
  const [saving, setSaving] = useState(false);
  const registrationInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  // Load vehicle data from profile and localStorage
  useEffect(() => {
    if (profile) {
      // Try to load from profile first
      if ((profile as any).vehicle_info) {
        setVehicleData(prev => ({
          ...prev,
          ...(profile as any).vehicle_info,
          transportation_type: (profile as any).vehicle_info.transportation_type || ''
        }));
      }
      
      // Also check localStorage for any stored vehicle data
      const storedVehicleData = localStorage.getItem('vehicle_data');
      if (storedVehicleData) {
        try {
          const parsedData = JSON.parse(storedVehicleData);
          setVehicleData(prev => ({
            ...prev,
            ...parsedData
          }));
        } catch (error) {
          console.error('Error parsing stored vehicle data:', error);
        }
      }
    }
  }, [profile]);

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

  const handleFileUpload = async (type: 'registration' | 'insurance', file: File) => {
    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${type}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Update state
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
      
      console.log(`${type} uploaded successfully:`, data);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const handleFileSelect = (type: 'registration' | 'insurance') => {
    const input = type === 'registration' ? registrationInputRef.current : insuranceInputRef.current;
    if (input) {
      input.click();
    }
  };

  const handleFileChange = (type: 'registration' | 'insurance', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(type, file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Store vehicle data in localStorage first (always works)
      const vehicleInfo = {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        license_plate: vehicleData.license_plate,
        insurance_number: vehicleData.insurance_number,
        vehicle_type: vehicleData.vehicle_type,
        transportation_type: vehicleData.transportation_type,
        registration_uploaded: uploadStatus.registration === 'success',
        insurance_uploaded: uploadStatus.insurance === 'success'
      };
      
      // Save to localStorage
      localStorage.setItem('vehicle_data', JSON.stringify(vehicleInfo));
      
      // Update profile in localStorage
      const mockProfile = localStorage.getItem('mock_profile');
      if (mockProfile) {
        try {
          const parsedProfile = JSON.parse(mockProfile);
          parsedProfile.vehicle_info = vehicleInfo;
          localStorage.setItem('mock_profile', JSON.stringify(parsedProfile));
        } catch (error) {
          console.error('Error updating mock profile:', error);
        }
      }
      
      // Try to update database, but don't fail if it doesn't work
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            vehicle_info: vehicleInfo
          })
          .eq('id', user.id);
        
        if (error) {
          console.warn('Database update failed, but localStorage updated:', error);
        }
      } catch (dbError) {
        console.warn('Database update failed, but localStorage updated:', dbError);
      }
      
      alert('Vehicle settings saved successfully!');
    } catch (error) {
      console.error('Error saving vehicle settings:', error);
      alert('Error saving vehicle settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <NewHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Settings</h1>
          <p className="text-gray-600">Manage your delivery vehicle information</p>
        </div>

        <div className="space-y-6">
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
                  <Label htmlFor="make">Make</Label>
                  <Input 
                    id="make" 
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input 
                    id="model" 
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year" 
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({...vehicleData, year: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color" 
                    value={vehicleData.color}
                    onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input 
                    id="license_plate" 
                    value={vehicleData.license_plate}
                    onChange={(e) => setVehicleData({...vehicleData, license_plate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_number">Insurance Policy Number</Label>
                <Input 
                  id="insurance_number" 
                  value={vehicleData.insurance_number}
                  onChange={(e) => setVehicleData({...vehicleData, insurance_number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportation_type">Transportation Method (if not using a vehicle, please describe your delivery method)</Label>
                <Textarea 
                  id="transportation_type" 
                  value={vehicleData.transportation_type}
                  onChange={(e) => setVehicleData({...vehicleData, transportation_type: e.target.value})}
                  rows={3}
                  placeholder="Please describe your delivery method (e.g., Car - Honda Civic 2020, Motorcycle - Yamaha R3, Bicycle, Walking, etc.)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.registration === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.registration === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.registration === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.registration === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.registration === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.registration === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Vehicle Registration</p>
                  <p className="text-xs text-gray-500">
                    {uploadStatus.registration === 'success' ? 'File uploaded successfully!' :
                     uploadStatus.registration === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.registration === 'uploading' ? 'Uploading...' :
                     'Upload your vehicle registration document'}
                  </p>
                  <input
                    ref={registrationInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('registration', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleFileSelect('registration')}
                    disabled={uploadStatus.registration === 'uploading'}
                  >
                    {uploadStatus.registration === 'uploading' ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>

                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadStatus.insurance === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus.insurance === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus.insurance === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300'
                }`}>
                  {uploadStatus.insurance === 'success' ? (
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  ) : uploadStatus.insurance === 'error' ? (
                    <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  ) : uploadStatus.insurance === 'uploading' ? (
                    <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <p className="text-sm font-medium">Insurance Certificate</p>
                  <p className="text-xs text-gray-500">
                    {uploadStatus.insurance === 'success' ? 'File uploaded successfully!' :
                     uploadStatus.insurance === 'error' ? 'Upload failed. Please try again.' :
                     uploadStatus.insurance === 'uploading' ? 'Uploading...' :
                     'Upload your insurance certificate'}
                  </p>
                  <input
                    ref={insuranceInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('insurance', e)}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleFileSelect('insurance')}
                    disabled={uploadStatus.insurance === 'uploading'}
                  >
                    {uploadStatus.insurance === 'uploading' ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              className="w-full md:w-auto"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Vehicle Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VehicleSettingsPage;