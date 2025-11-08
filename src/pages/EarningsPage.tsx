import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EarningsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    totalTips: 0,
    totalBaseEarnings: 0,
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

      // Calculate earnings with tip breakdown
      const totalTips = completedOrders?.reduce((sum, order) => sum + parseFloat(order.tip_amount || 0), 0) || 0;
      const totalBaseEarnings = completedOrders?.reduce((sum, order) => {
        const baseAmount = parseFloat(order.total || 0) - parseFloat(order.tip_amount || 0);
        return sum + baseAmount;
      }, 0) || 0;
      const totalEarnings = totalBaseEarnings + totalTips;
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
        totalTips,
        totalBaseEarnings,
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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-30 hidden md:block bg-center bg-cover" style={{ backgroundImage: "url('/earnings-dashboard-background-image.png')" }} />
      <div className="absolute inset-0 -z-30 md:hidden bg-center bg-cover" style={{ backgroundImage: "url('/earnings-dashboard-background-image.png')" }} />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/65 via-black/45 to-black/30 md:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.35)_65%,rgba(0,0,0,0.1)_100%)]" />

      <div className="relative z-10 min-h-screen">
        <div className="bg-gradient-to-b from-black/80 to-transparent">
          <NewHeader />
        </div>
        <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20 hover:border-white/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white drop-shadow-2xl">Earnings Dashboard</h1>
            <p className="text-white/85 drop-shadow">Track your delivery earnings and performance</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-2xl border border-white/40 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/95">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white drop-shadow-lg">${earningsData.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-white/80">All time earnings</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-white/40 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/95">Total Trips</CardTitle>
                <TrendingUp className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white drop-shadow-lg">{earningsData.totalTrips}</div>
                <p className="text-xs text-white/80">Completed deliveries</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-white/40 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/95">Hours Worked</CardTitle>
                <Clock className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white drop-shadow-lg">{earningsData.totalHours.toFixed(1)}</div>
                <p className="text-xs text-white/80">Active hours</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-white/40 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/95">Avg Per Hour</CardTitle>
                <Calendar className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white drop-shadow-lg">${earningsData.avgPerHour.toFixed(2)}</div>
                <p className="text-xs text-white/80">Hourly rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Tip Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="rounded-2xl border border-white/45 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-green-300 drop-shadow">Base Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-300 drop-shadow-xl">${earningsData.totalBaseEarnings.toFixed(2)}</div>
                <p className="text-sm text-white/80">From delivery fees</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-2xl border border-white/45 bg-white/15 p-6 text-white shadow-[0_20px_40px_-25px_rgba(0,0,0,0.7)] backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-pink-300 drop-shadow">Tips Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-pink-300 drop-shadow-xl">${earningsData.totalTips.toFixed(2)}</div>
                <p className="text-sm text-white/80">From customer tips</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Earnings */}
          <Card className="rounded-2xl border border-white/40 bg-white/12 p-6 text-white shadow-[0_20px_45px_-25px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white drop-shadow">Daily Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earningsData.dailyBreakdown.map((day, index) => (
                  <div key={index} className="flex items-center justify-between rounded-xl border border-white/35 bg-black/35 p-4 backdrop-blur">
                    <div>
                      <p className="font-medium text-white drop-shadow-sm">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-white/75">{day.trips} trips • {day.hours.toFixed(1)}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white drop-shadow-sm">${day.amount.toFixed(2)}</p>
                      {day.hours > 0 && (
                        <Badge variant="secondary" className="bg-white/25 text-white" >${(day.amount / day.hours).toFixed(2)}/hr</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EarningsPage;