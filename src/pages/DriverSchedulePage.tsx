import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';

const DriverSchedulePage = () => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState({
    monday: { active: true, start: '09:00', end: '17:00' },
    tuesday: { active: true, start: '09:00', end: '17:00' },
    wednesday: { active: true, start: '09:00', end: '17:00' },
    thursday: { active: true, start: '09:00', end: '17:00' },
    friday: { active: true, start: '09:00', end: '17:00' },
    saturday: { active: false, start: '10:00', end: '16:00' },
    sunday: { active: false, start: '10:00', end: '16:00' }
  });

  const [preferredZones] = useState([
    { id: 1, name: 'Downtown', active: true },
    { id: 2, name: 'North Side', active: true },
    { id: 3, name: 'South Side', active: false },
    { id: 4, name: 'East Side', active: true },
    { id: 5, name: 'West Side', active: false }
  ]);

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const toggleDayAvailability = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], active: !prev[day as keyof typeof prev].active }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Schedule
            </h1>
            <p className="text-gray-600">
              Manage your availability and preferred delivery zones
            </p>
          </div>
          <Button onClick={() => navigate('/driver-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => {
                  const dayData = availability[day as keyof typeof availability];
                  return (
                    <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={dayData.active}
                          onCheckedChange={() => toggleDayAvailability(day)}
                        />
                        <div>
                          <p className="font-medium capitalize">{day}</p>
                          {dayData.active && (
                            <p className="text-sm text-gray-600">
                              {dayData.start} - {dayData.end}
                            </p>
                          )}
                        </div>
                      </div>
                      {dayData.active && (
                        <Badge variant="secondary">Available</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button className="w-full mt-4">
                Save Availability
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Preferred Delivery Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preferredZones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-gray-600">Delivery zone</p>
                    </div>
                    <Switch checked={zone.active} />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4">
                Update Zones
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Currently Available</p>
                    <p className="text-sm text-green-600">Ready to accept deliveries</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">3</p>
                    <p className="text-sm text-gray-600">Deliveries Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">$85.50</p>
                    <p className="text-sm text-gray-600">Earnings Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">4.2h</p>
                    <p className="text-sm text-gray-600">Hours Online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriverSchedulePage;