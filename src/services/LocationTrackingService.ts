// Real-time location tracking service for drivers and customers
export interface LocationUpdate {
  driverId: string;
  orderId: string;
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export interface OrderTracking {
  orderId: string;
  driverId: string;
  status: 'preparing' | 'picked_up' | 'in_transit' | 'delivered';
  pickupLocation: string;
  deliveryLocation: string;
  driverLocation?: { lat: number; lng: number };
  estimatedArrival?: string;
  lastUpdate: number;
}

class LocationTrackingService {
  private locationUpdates: Map<string, LocationUpdate[]> = new Map();
  private orderTracking: Map<string, OrderTracking> = new Map();
  private watchId: number | null = null;
  private updateInterval: any = null;

  // Start tracking driver location
  startLocationTracking(driverId: string, orderId: string, onLocationUpdate: (location: LocationUpdate) => void) {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationUpdate = {
          driverId,
          orderId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };
        
        this.addLocationUpdate(location);
        onLocationUpdate(location);
      },
      (error) => {
        console.error('Error getting initial location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Start watching location
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationUpdate = {
          driverId,
          orderId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };
        
        this.addLocationUpdate(location);
        onLocationUpdate(location);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000 // 30 seconds
      }
    );

    // Start periodic updates to server
    this.startPeriodicUpdates();
  }

  // Stop tracking location
  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Add location update to local storage
  private addLocationUpdate(location: LocationUpdate) {
    const key = `${location.driverId}-${location.orderId}`;
    const updates = this.locationUpdates.get(key) || [];
    
    // Keep only last 50 updates to prevent memory issues
    updates.push(location);
    if (updates.length > 50) {
      updates.shift();
    }
    
    this.locationUpdates.set(key, updates);
    
    // Store in localStorage for persistence
    localStorage.setItem(`location_updates_${key}`, JSON.stringify(updates));
  }

  // Start periodic updates to server
  private startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      this.sendLocationUpdatesToServer();
    }, 30000); // Update every 30 seconds
  }

  // Send location updates to server
  private async sendLocationUpdatesToServer() {
    try {
      const updates: LocationUpdate[] = [];
      
      // Collect all recent updates
      for (const [key, locationUpdates] of this.locationUpdates) {
        const recentUpdates = locationUpdates.filter(
          update => Date.now() - update.timestamp < 300000 // Last 5 minutes
        );
        updates.push(...recentUpdates);
      }

      if (updates.length > 0) {
        // Send to Netlify function
        const response = await fetch('/.netlify/functions/update-driver-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates })
        });

        if (!response.ok) {
          console.error('Failed to send location updates to server');
        }
      }
    } catch (error) {
      console.error('Error sending location updates:', error);
    }
  }

  // Get location history for an order
  getLocationHistory(driverId: string, orderId: string): LocationUpdate[] {
    const key = `${driverId}-${orderId}`;
    return this.locationUpdates.get(key) || [];
  }

  // Get current driver location
  getCurrentDriverLocation(driverId: string, orderId: string): LocationUpdate | null {
    const history = this.getLocationHistory(driverId, orderId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  // Update order tracking status
  updateOrderStatus(orderId: string, status: OrderTracking['status'], driverLocation?: { lat: number; lng: number }) {
    const tracking = this.orderTracking.get(orderId);
    if (tracking) {
      tracking.status = status;
      tracking.lastUpdate = Date.now();
      if (driverLocation) {
        tracking.driverLocation = driverLocation;
      }
      
      // Calculate estimated arrival
      if (status === 'in_transit' && driverLocation) {
        tracking.estimatedArrival = this.calculateETA(driverLocation, tracking.deliveryLocation);
      }
      
      this.orderTracking.set(orderId, tracking);
      
      // Store in localStorage
      localStorage.setItem(`order_tracking_${orderId}`, JSON.stringify(tracking));
    }
  }

  // Calculate estimated time of arrival
  private calculateETA(driverLocation: { lat: number; lng: number }, deliveryLocation: string): string {
    // This is a simplified ETA calculation
    // In a real implementation, you'd use a routing service
    const now = new Date();
    const eta = new Date(now.getTime() + 15 * 60000); // Add 15 minutes as default
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Get order tracking info
  getOrderTracking(orderId: string): OrderTracking | null {
    return this.orderTracking.get(orderId) || null;
  }

  // Initialize order tracking
  initializeOrderTracking(orderId: string, driverId: string, pickupLocation: string, deliveryLocation: string) {
    const tracking: OrderTracking = {
      orderId,
      driverId,
      status: 'preparing',
      pickupLocation,
      deliveryLocation,
      lastUpdate: Date.now()
    };
    
    this.orderTracking.set(orderId, tracking);
    localStorage.setItem(`order_tracking_${orderId}`, JSON.stringify(tracking));
  }

  // Load tracking data from localStorage
  loadTrackingData() {
    // Load location updates
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('location_updates_')) {
        try {
          const updates = JSON.parse(localStorage.getItem(key) || '[]');
          const [driverId, orderId] = key.replace('location_updates_', '').split('-');
          this.locationUpdates.set(`${driverId}-${orderId}`, updates);
        } catch (error) {
          console.error('Error loading location updates:', error);
        }
      }
    }

    // Load order tracking
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('order_tracking_')) {
        try {
          const tracking = JSON.parse(localStorage.getItem(key) || '{}');
          this.orderTracking.set(tracking.orderId, tracking);
        } catch (error) {
          console.error('Error loading order tracking:', error);
        }
      }
    }
  }

  // Clear old data
  clearOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clear old location updates
    for (const [key, updates] of this.locationUpdates) {
      const recentUpdates = updates.filter(update => now - update.timestamp < maxAge);
      if (recentUpdates.length === 0) {
        this.locationUpdates.delete(key);
        localStorage.removeItem(`location_updates_${key}`);
      } else {
        this.locationUpdates.set(key, recentUpdates);
        localStorage.setItem(`location_updates_${key}`, JSON.stringify(recentUpdates));
      }
    }

    // Clear old order tracking
    for (const [orderId, tracking] of this.orderTracking) {
      if (now - tracking.lastUpdate > maxAge) {
        this.orderTracking.delete(orderId);
        localStorage.removeItem(`order_tracking_${orderId}`);
      }
    }
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();

// Initialize on load
locationTrackingService.loadTrackingData();
locationTrackingService.clearOldData();
