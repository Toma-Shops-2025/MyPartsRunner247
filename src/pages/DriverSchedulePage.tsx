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
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-teal-400 mb-2">
              My Schedule
            </h1>
            <p className="text-gray-300">
              Manage your availability and preferred delivery zones
            </p>
          </div>
          <Button onClick={() => navigate('/driver-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Calendar className="w-5 h-5 mr-2 text-teal-400" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => {
                  const dayData = availability[day as keyof typeof availability];
                  return (
                    <div key={day} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-700">
                      <div className="flex items-center space-x-4">
                        <Switch
                          checked={dayData.active}
                          onCheckedChange={() => toggleDayAvailability(day)}
                        />
                        <div>
                          <p className="font-medium capitalize text-white">{day}</p>
                          {dayData.active && (
                            <p className="text-sm text-gray-300">
                              {dayData.start} - {dayData.end}
                            </p>
                          )}
                        </div>
                      </div>
                      {dayData.active && (
                        <Badge variant="secondary" className="bg-green-600 text-white">Available</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                Save Availability
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <MapPin className="w-5 h-5 mr-2 text-teal-400" />
                Preferred Delivery Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preferredZones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg bg-gray-700">
                    <div>
                      <p className="font-medium text-white">{zone.name}</p>
                      <p className="text-sm text-gray-300">Delivery zone</p>
                    </div>
                    <Switch checked={zone.active} />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                Update Zones
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Clock className="w-5 h-5 mr-2 text-teal-400" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-900 border border-green-700 rounded-lg">
                  <div>
                    <p className="font-medium text-green-300">Currently Available</p>
                    <p className="text-sm text-green-400">Ready to accept deliveries</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Online</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700">
                    <p className="text-2xl font-bold text-blue-400">3</p>
                    <p className="text-sm text-gray-300">Deliveries Today</p>
                  </div>
                  <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700">
                    <p className="text-2xl font-bold text-green-400">$85.50</p>
                    <p className="text-sm text-gray-300">Earnings Today</p>
                  </div>
                  <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700">
                    <p className="text-2xl font-bold text-purple-400">4.2h</p>
                    <p className="text-sm text-gray-300">Hours Online</p>
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