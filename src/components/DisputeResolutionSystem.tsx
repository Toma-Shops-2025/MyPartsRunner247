import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  FileText, 
  Camera,
  Send,
  User,
  Shield,
  DollarSign,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dispute {
  id: string;
  orderId: string;
  customerId: string;
  driverId?: string;
  type: 'delivery_issue' | 'payment_dispute' | 'damage_claim' | 'service_quality' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  evidence: string[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface DisputeResolution {
  id: string;
  disputeId: string;
  resolution: string;
  compensation?: number;
  action: 'refund' | 'replacement' | 'credit' | 'no_action';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const DisputeResolutionSystem: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [newDispute, setNewDispute] = useState({
    orderId: '',
    type: 'delivery_issue' as const,
    description: '',
    priority: 'medium' as const
  });
  const [resolution, setResolution] = useState({
    resolution: '',
    compensation: '',
    action: 'refund' as const
  });
  const [loading, setLoading] = useState(false);
  const [showNewDispute, setShowNewDispute] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching disputes:', error);
        return;
      }

      setDisputes(data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('disputes')
        .insert([{
          order_id: newDispute.orderId,
          type: newDispute.type,
          description: newDispute.description,
          priority: newDispute.priority,
          status: 'open',
          evidence: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating dispute:', error);
        return;
      }

      setDisputes(prev => [data, ...prev]);
      setNewDispute({
        orderId: '',
        type: 'delivery_issue',
        description: '',
        priority: 'medium'
      });
      setShowNewDispute(false);
    } catch (error) {
      console.error('Error creating dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolution.resolution) {
      alert('Please provide a resolution description');
      return;
    }

    setLoading(true);

    try {
      // Create resolution record
      const { data: resolutionData, error: resolutionError } = await supabase
        .from('dispute_resolutions')
        .insert([{
          dispute_id: disputeId,
          resolution: resolution.resolution,
          compensation: resolution.compensation ? parseFloat(resolution.compensation) : null,
          action: resolution.action,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (resolutionError) {
        console.error('Error creating resolution:', resolutionError);
        return;
      }

      // Update dispute status
      const { error: updateError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (updateError) {
        console.error('Error updating dispute:', updateError);
        return;
      }

      // Refresh disputes
      await fetchDisputes();
      setSelectedDispute(null);
      setResolution({
        resolution: '',
        compensation: '',
        action: 'refund'
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-900/30 text-red-300 border-red-600/30';
      case 'investigating': return 'bg-yellow-900/30 text-yellow-300 border-yellow-600/30';
      case 'resolved': return 'bg-green-900/30 text-green-300 border-green-600/30';
      case 'closed': return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-900/30 text-red-300 border-red-600/30';
      case 'high': return 'bg-orange-900/30 text-orange-300 border-orange-600/30';
      case 'medium': return 'bg-yellow-900/30 text-yellow-300 border-yellow-600/30';
      case 'low': return 'bg-green-900/30 text-green-300 border-green-600/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery_issue': return <Clock className="w-4 h-4" />;
      case 'payment_dispute': return <DollarSign className="w-4 h-4" />;
      case 'damage_claim': return <AlertTriangle className="w-4 h-4" />;
      case 'service_quality': return <Star className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Dispute Resolution System</h1>
        <p className="text-gray-300">Manage and resolve customer and driver disputes</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{disputes.filter(d => d.status === 'open').length}</div>
            <div className="text-sm text-gray-300">Open Disputes</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{disputes.filter(d => d.status === 'investigating').length}</div>
            <div className="text-sm text-gray-300">Investigating</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{disputes.filter(d => d.status === 'resolved').length}</div>
            <div className="text-sm text-gray-300">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{disputes.length}</div>
            <div className="text-sm text-gray-300">Total Disputes</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowNewDispute(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Create New Dispute
        </Button>
        <Button 
          onClick={fetchDisputes}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* New Dispute Modal */}
      {showNewDispute && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Order ID
                  </label>
                  <Input
                    value={newDispute.orderId}
                    onChange={(e) => setNewDispute({...newDispute, orderId: e.target.value})}
                    placeholder="Enter order ID"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dispute Type
                  </label>
                  <select
                    value={newDispute.type}
                    onChange={(e) => setNewDispute({...newDispute, type: e.target.value as any})}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="delivery_issue">Delivery Issue</option>
                    <option value="payment_dispute">Payment Dispute</option>
                    <option value="damage_claim">Damage Claim</option>
                    <option value="service_quality">Service Quality</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={newDispute.description}
                  onChange={(e) => setNewDispute({...newDispute, description: e.target.value})}
                  placeholder="Describe the issue in detail..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDispute(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? 'Creating...' : 'Create Dispute'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getTypeIcon(dispute.type)}
                    <h3 className="text-lg font-semibold text-white">
                      {dispute.type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(dispute.priority)}>
                      {dispute.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-300 mb-3">{dispute.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Order: {dispute.orderId}</span>
                    <span>Created: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    {dispute.assignedTo && <span>Assigned: {dispute.assignedTo}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedDispute(dispute)}
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    View Details
                  </Button>
                  {dispute.status === 'open' && (
                    <Button
                      onClick={() => setSelectedDispute(dispute)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Resolve Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Dispute Details</h4>
              <p className="text-gray-300 mb-2">{selectedDispute.description}</p>
              <div className="text-sm text-gray-400">
                Order: {selectedDispute.orderId} | Type: {selectedDispute.type} | Priority: {selectedDispute.priority}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution Description
              </label>
              <Textarea
                value={resolution.resolution}
                onChange={(e) => setResolution({...resolution, resolution: e.target.value})}
                placeholder="Describe the resolution..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compensation Amount (Optional)
                </label>
                <Input
                  type="number"
                  value={resolution.compensation}
                  onChange={(e) => setResolution({...resolution, compensation: e.target.value})}
                  placeholder="0.00"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Action
                </label>
                <select
                  value={resolution.action}
                  onChange={(e) => setResolution({...resolution, action: e.target.value as any})}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                >
                  <option value="refund">Refund</option>
                  <option value="replacement">Replacement</option>
                  <option value="credit">Credit</option>
                  <option value="no_action">No Action</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setSelectedDispute(null)}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleResolveDispute(selectedDispute.id)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Resolving...' : 'Resolve Dispute'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-900/20 border-blue-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-300">
            <Shield className="w-5 h-5" />
            Dispute Resolution Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 text-blue-400" />
              <span>Investigate all disputes within 24 hours</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 text-blue-400" />
              <span>Provide clear resolution within 5 business days</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 text-blue-400" />
              <span>Document all evidence and communications</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 text-blue-400" />
              <span>Follow fair compensation guidelines</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisputeResolutionSystem;
