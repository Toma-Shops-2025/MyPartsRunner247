import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, DollarSign, Clock, Bell, Shield } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState({
    baseFare: 5.00,
    perMileFare: 2.50,
    minimumFare: 0.50,
    commissionRate: 20,
    maxDeliveryRadius: 50,
    enableNotifications: true,
    enableAutoDispatch: true,
    requireDriverApproval: true
  });

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access system settings.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and parameters</p>
        </div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="baseFare">Base Fare ($)</Label>
                    <Input
                      id="baseFare"
                      type="number"
                      step="0.01"
                      value={settings.baseFare}
                      onChange={(e) => setSettings({...settings, baseFare: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="perMileFare">Per Mile Rate ($)</Label>
                    <Input
                      id="perMileFare"
                      type="number"
                      step="0.01"
                      value={settings.perMileFare}
                      onChange={(e) => setSettings({...settings, perMileFare: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumFare">Minimum Fare ($)</Label>
                    <Input
                      id="minimumFare"
                      type="number"
                      step="0.01"
                      value={settings.minimumFare}
                      onChange={(e) => setSettings({...settings, minimumFare: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={settings.commissionRate}
                      onChange={(e) => setSettings({...settings, commissionRate: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Operational Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="maxRadius">Maximum Delivery Radius (miles)</Label>
                  <Input
                    id="maxRadius"
                    type="number"
                    value={settings.maxDeliveryRadius}
                    onChange={(e) => setSettings({...settings, maxDeliveryRadius: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Dispatch Orders</Label>
                    <p className="text-sm text-gray-600">Automatically assign orders to available drivers</p>
                  </div>
                  <Switch
                    checked={settings.enableAutoDispatch}
                    onCheckedChange={(checked) => setSettings({...settings, enableAutoDispatch: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Driver Approval</Label>
                    <p className="text-sm text-gray-600">New drivers need admin approval before going live</p>
                  </div>
                  <Switch
                    checked={settings.requireDriverApproval}
                    onCheckedChange={(checked) => setSettings({...settings, requireDriverApproval: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Notifications</Label>
                    <p className="text-sm text-gray-600">Enable push notifications for system events</p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Security settings will be available in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSaveSettings} size="lg">
            Save All Settings
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SystemSettingsPage;