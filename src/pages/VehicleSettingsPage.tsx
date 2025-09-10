import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Save, Upload } from 'lucide-react';

const VehicleSettingsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [vehicleData, setVehicleData] = useState({
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    color: 'Silver',
    license_plate: 'ABC123',
    insurance_number: 'INS-789456',
    vehicle_type: 'sedan'
  });

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

  const handleSave = () => {
    // TODO: Implement vehicle settings update
    console.log('Saving vehicle settings:', vehicleData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium">Vehicle Registration</p>
                  <p className="text-xs text-gray-500">Upload your vehicle registration document</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upload File
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium">Insurance Certificate</p>
                  <p className="text-xs text-gray-500">Upload your insurance certificate</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save Vehicle Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VehicleSettingsPage;