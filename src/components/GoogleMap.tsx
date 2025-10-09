"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

// Simple map component without external dependencies
function MapComponent({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>();

  useEffect(() => {
    if (ref.current && !map && (window as any).google) {
      const newMap = new (window as any).google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add marker for mess location
      new (window as any).google.maps.Marker({
        position: center,
        map: newMap,
        title: "MessMate Location",
      });

      // Add info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; text-align: center;">
            <h3 style="color: #ea580c; margin: 0 0 4px 0; font-size: 16px;">MessMate Location</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">Your trusted mess management partner</p>
          </div>
        `,
      });

      const marker = new (window as any).google.maps.Marker({
        position: center,
        map: newMap,
        title: "MessMate Location",
      });

      marker.addListener("click", () => {
        infoWindow.open(newMap, marker);
      });

      setMap(newMap);
    }
  }, [ref, center, zoom, map]);

  return <div ref={ref} className="w-full h-full" />;
}

export default function GoogleMap({ className = "w-full h-96" }: GoogleMapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to a default location (Mumbai, India)
          setCenter({
            lat: 19.0760,
            lng: 72.8777,
          });
          setError("Unable to get your location. Showing default location.");
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      // Fallback to default location
      setCenter({
        lat: 19.0760,
        lng: 72.8777,
      });
      setError("Geolocation not supported. Showing default location.");
      setLoading(false);
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (apiKey && apiKey !== "your_google_maps_api_key_here" && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptsLoaded(true);
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    } else if ((window as any).google) {
      setScriptsLoaded(true);
    }
  }, [apiKey]);

  if (loading) {
    return (
      <div className={`${className} bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-orange-600">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Getting your location...</p>
        </div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center text-red-600">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load location</p>
        </div>
      </div>
    );
  }

  // If no API key is provided or scripts aren't loaded, show a fallback UI
  if (!apiKey || apiKey === "your_google_maps_api_key_here" || !scriptsLoaded) {
    return (
      <div className={className}>
        <div className="w-full h-full rounded-lg overflow-hidden border border-orange-200 shadow-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <div className="text-center p-8">
            <MapPin className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-orange-900 mb-2">MessMate Location</h3>
            <p className="text-orange-700 mb-4">
              Lat: {center.lat.toFixed(6)}, Lng: {center.lng.toFixed(6)}
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
              <p className="text-sm text-orange-600 mb-2">
                📍 Interactive map will be available with Google Maps API key
              </p>
              <p className="text-xs text-orange-500">
                Add your Google Maps API key to .env.local to enable full map functionality
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          {error}
        </div>
      )}
      <div className="w-full h-full rounded-lg overflow-hidden border border-orange-200 shadow-lg">
        <MapComponent center={center} zoom={15} />
      </div>
    </div>
  );
}