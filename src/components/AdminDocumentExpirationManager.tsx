import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, Calendar, Users, Send, RefreshCw, CheckCircle } from 'lucide-react';
import DocumentExpirationService from '@/services/DocumentExpirationService';
import { useToast } from '@/hooks/use-toast';

interface ExpirationStats {
  total_documents: number;
  expiring_30_days: number;
  expiring_14_days: number;
  expiring_7_days: number;
  expired: number;
}

interface DriverWithExpiringDocs {
  user_id: string;
  full_name: string;
  email: string;
  document_type: string;
  expiration_date: string;
  days_until_expiry: number;
  phone: string;
}

const AdminDocumentExpirationManager: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<ExpirationStats>({
    total_documents: 0,
    expiring_30_days: 0,
    expiring_14_days: 0,
    expiring_7_days: 0,
    expired: 0
  });
  const [expiringDrivers, setExpiringDrivers] = useState<DriverWithExpiringDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, driversData] = await Promise.all([
        DocumentExpirationService.getExpirationStatistics(),
        DocumentExpirationService.getDriversWithExpiringDocuments(30)
      ]);
      
      setStats(statsData);
      setExpiringDrivers(driversData);
    } catch (error) {
      console.error('Error fetching expiration data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document expiration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await DocumentExpirationService.checkAndSendReminders();
      toast({
        title: "Success",
        description: "Reminders sent successfully",
      });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendBulkReminder = async () => {
    setSendingBulkReminder(true);
    try {
      const result = await DocumentExpirationService.sendBulkQuarterlyReminder();
      toast({
        title: "Bulk Reminder Sent",
        description: `Notified ${result.drivers_notified} drivers (${result.drivers_with_expiring_docs} with expiring docs)`,
      });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error sending bulk reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk reminder",
        variant: "destructive",
      });
    } finally {
      setSendingBulkReminder(false);
    }
  };

  const getSeverityColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 0) return 'bg-red-600 text-white';
    if (daysUntilExpiry <= 7) return 'bg-red-500 text-white';
    if (daysUntilExpiry <= 14) return 'bg-yellow-500 text-white';
    if (daysUntilExpiry <= 30) return 'bg-orange-500 text-white';
    return 'bg-green-600 text-white';
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 bg-gray-600 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Documents</p>
                <p className="text-2xl font-bold text-white">{stats.total_documents}</p>
              </div>
              <Calendar className="w-8 h-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Expiring (30 days)</p>
                <p className="text-2xl font-bold text-orange-400">{stats.expiring_30_days}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Expiring (14 days)</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.expiring_14_days}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Expiring (7 days)</p>
                <p className="text-2xl font-bold text-red-400">{stats.expiring_7_days}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Document Expiration Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {sendingReminders ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Automatic Reminders
            </Button>

            <Button
              onClick={handleSendBulkReminder}
              disabled={sendingBulkReminder}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {sendingBulkReminder ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Send Quarterly Bulk Reminder
            </Button>

            <Button
              onClick={fetchData}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          <Alert className="bg-blue-900 border-blue-700">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Automatic reminders are sent at 30, 14, 7, and 1 days before expiration. 
              Quarterly bulk reminders are sent to all active drivers to ensure document compliance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Expiring Drivers List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Drivers with Expiring Documents (Next 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {expiringDrivers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Expiring Documents</h3>
              <p className="text-gray-300">All driver documents are up to date!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expiringDrivers.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{driver.full_name}</h3>
                      <p className="text-sm text-gray-300">{driver.email}</p>
                      <p className="text-sm text-gray-400">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-300 capitalize">
                        {driver.document_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        Expires: {new Date(driver.expiration_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getSeverityColor(driver.days_until_expiry)}>
                      {driver.days_until_expiry <= 0 
                        ? 'Expired' 
                        : `${driver.days_until_expiry} day${driver.days_until_expiry === 1 ? '' : 's'} left`
                      }
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocumentExpirationManager;
