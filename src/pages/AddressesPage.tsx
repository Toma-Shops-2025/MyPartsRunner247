import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([
    { id: 1, label: 'Home', address: '123 Main St, City, State 12345', isDefault: true },
    { id: 2, label: 'Work', address: '456 Business Ave, City, State 12345', isDefault: false }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.address) {
      setAddresses([...addresses, {
        id: Date.now(),
        label: newAddress.label,
        address: newAddress.address,
        isDefault: false
      }]);
      setNewAddress({ label: '', address: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <NewHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h1>
          <p className="text-gray-600">Manage your saved delivery addresses</p>
        </div>

        <div className="grid gap-6">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-5 h-5 text-teal-600 mt-1" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{address.label}</h3>
                        {address.isDefault && (
                          <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{address.address}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={address.isDefault}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {showAddForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Add New Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="label">Address Label</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Home, Work, Friend's House"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State 12345"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddAddress}>Add Address</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-teal-500 bg-white hover:bg-teal-50 text-gray-600 hover:text-teal-600"
            >
              <Plus className="w-6 h-6 mr-2" />
              Add New Address
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddressesPage;