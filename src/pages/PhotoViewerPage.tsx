import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, Calendar } from 'lucide-react';

interface DeliveryPhoto {
  id: string;
  order_id: string;
  driver_id: string;
  photo_data: string;
  created_at: string;
}

const PhotoViewerPage: React.FC = () => {
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = (photoData: string, orderId: string) => {
    const link = document.createElement('a');
    link.href = photoData;
    link.download = `delivery_photo_${orderId}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Delivery Photos</h1>
          <p className="text-gray-300">View and manage delivery photos from drivers</p>
        </div>

        {photos.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No delivery photos found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Order: {photo.order_id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Photo Preview */}
                    <div className="relative">
                      <img
                        src={photo.photo_data}
                        alt={`Delivery photo for order ${photo.order_id}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedPhoto(photo.photo_data)}
                      />
                    </div>

                    {/* Photo Info */}
                    <div className="text-sm text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(photo.created_at).toLocaleString()}</span>
                      </div>
                      <div>Driver ID: {photo.driver_id}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50"
                        onClick={() => setSelectedPhoto(photo.photo_data)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                        onClick={() => downloadPhoto(photo.photo_data, photo.order_id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Full Screen Photo Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-full p-4">
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white z-10"
              >
                ✕ Close
              </Button>
              <img
                src={selectedPhoto}
                alt="Full size delivery photo"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoViewerPage;
