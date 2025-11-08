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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user || profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <NewHeader />
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Earnings Dashboard</h1>
          <p className="text-slate-300">Track your delivery earnings and performance</p>
        </div>
 
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-slate-400">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Trips</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earningsData.totalTrips}</div>
              <p className="text-xs text-slate-400">Completed deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Hours Worked</CardTitle>
              <Clock className="h-4 w-4 text-amber-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earningsData.totalHours.toFixed(1)}</div>
              <p className="text-xs text-slate-400">Active hours</p>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Avg Per Hour</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${earningsData.avgPerHour.toFixed(2)}</div>
              <p className="text-xs text-slate-400">Hourly rate</p>
            </CardContent>
          </Card>
        </div>
 
        {/* Tip Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader>
              <CardTitle className="text-green-300">Base Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-300">${earningsData.totalBaseEarnings.toFixed(2)}</div>
              <p className="text-sm text-slate-400">From delivery fees</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader>
              <CardTitle className="text-pink-300">Tips Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-pink-300">${earningsData.totalTips.toFixed(2)}</div>
              <p className="text-sm text-slate-400">From customer tips</p>
            </CardContent>
          </Card>
        </div>
 
        {/* Daily Earnings */}
        <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-100">Daily Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earningsData.dailyBreakdown.map((day, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div>
                    <p className="font-medium text-slate-100">{new Date(day.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-400">{day.trips} trips • {day.hours.toFixed(1)}h</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-100">${day.amount.toFixed(2)}</p>
                    {day.hours > 0 && (
                      <Badge variant="secondary" className="bg-slate-800 text-slate-200">${(day.amount / day.hours).toFixed(2)}/hr</Badge>
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