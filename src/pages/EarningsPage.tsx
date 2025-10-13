import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EarningsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    totalTrips: 0,
    totalHours: 0,
    avgPerHour: 0,
    dailyBreakdown: []
  });
  const [earningsLoading, setEarningsLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      fetchEarningsData();
    }
  }, [user, profile]);

  const fetchEarningsData = async () => {
    try {
      setEarningsLoading(true);
      
      // Fetch completed orders for this driver
      const { data: completedOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user?.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching earnings data:', error);
        return;
      }

      // Calculate earnings
      const totalEarnings = completedOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const totalTrips = completedOrders?.length || 0;
      
      // Estimate hours worked (assuming 30 minutes per delivery on average)
      const totalHours = totalTrips * 0.5;
      const avgPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

      // Create daily breakdown for last 7 days
      const dailyBreakdown = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayOrders = completedOrders?.filter(order => 
          order.created_at?.startsWith(dateStr)
        ) || [];
        
        const dayEarnings = dayOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
        const dayTrips = dayOrders.length;
        
        dailyBreakdown.push({
          date: dateStr,
          amount: dayEarnings,
          trips: dayTrips,
          hours: dayTrips * 0.5
        });
      }

      setEarningsData({
        totalEarnings,
        totalTrips,
        totalHours,
        avgPerHour,
        dailyBreakdown
      });
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setEarningsLoading(false);
    }
  };

  if (loading || earningsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user || profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

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
                <div className="text-2xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{earningsData.totalTrips}</div>
                <p className="text-xs text-muted-foreground">Completed deliveries</p>
              </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{earningsData.totalHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Active hours</p>
              </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Per Hour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${earningsData.avgPerHour.toFixed(2)}</div>
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
              {earningsData.dailyBreakdown.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{day.trips} trips • {day.hours.toFixed(1)}h</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${day.amount.toFixed(2)}</p>
                    {day.hours > 0 && (
                      <Badge variant="secondary">${(day.amount / day.hours).toFixed(2)}/hr</Badge>
                    )}
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