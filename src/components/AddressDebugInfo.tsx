// ADDRESS DEBUG INFO - Debug Address Autocomplete Issues
// =====================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AddressDebugInfo: React.FC = () => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Address Autocomplete Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mapbox Token:</span>
          <Badge variant={mapboxToken ? "default" : "destructive"}>
            {mapboxToken ? "Configured" : "Missing"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Google Maps Key:</span>
          <Badge variant={googleMapsKey ? "default" : "destructive"}>
            {googleMapsKey ? "Configured" : "Missing"}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-500">
          {!mapboxToken && !googleMapsKey && (
            <p>⚠️ No geocoding API configured. Address autocomplete will not work.</p>
          )}
          {mapboxToken && (
            <p>✅ Mapbox configured - autocomplete should work</p>
          )}
          {googleMapsKey && !mapboxToken && (
            <p>✅ Google Maps configured - autocomplete should work</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressDebugInfo;
