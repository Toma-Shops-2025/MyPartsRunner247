import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

const EarningsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();

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

  const mockEarnings = [
    { id: 1, date: '2024-01-15', amount: 45.50, trips: 3, hours: 4.5 },
    { id: 2, date: '2024-01-14', amount: 62.25, trips: 4, hours: 6.0 },
    { id: 3, date: '2024-01-13', amount: 38.75, trips: 2, hours: 3.5 },
    { id: 4, date: '2024-01-12', amount: 71.00, trips: 5, hours: 7.0 },
    { id: 5, date: '2024-01-11', amount: 52.30, trips: 3, hours: 5.0 },
  ];

  const totalEarnings = mockEarnings.reduce((sum, day) => sum + day.amount, 0);
  const totalTrips = mockEarnings.reduce((sum, day) => sum + day.trips, 0);
  const totalHours = mockEarnings.reduce((sum, day) => sum + day.hours, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-600">Track your delivery earnings and performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Last 5 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrips}</div>
              <p className="text-xs text-muted-foreground">Completed deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Active hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Per Hour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalEarnings / totalHours).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Hourly rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEarnings.map((day) => (
                <div key={day.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{day.trips} trips • {day.hours}h</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${day.amount.toFixed(2)}</p>
                    <Badge variant="secondary">${(day.amount / day.hours).toFixed(2)}/hr</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EarningsPage;