"use client";

import { MapPin } from 'lucide-react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

// Static map placeholder (Google Maps functionality disabled)
export default function GoogleMap({ className = "w-full h-96" }: GoogleMapProps) {
  // Default location (Mumbai, India)
  const defaultCenter = { lat: 19.0760, lng: 72.8777 };

  return (
    <div className={className}>
      <div className="w-full h-full rounded-lg overflow-hidden border-2 border-orange-300 shadow-lg bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center relative">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 right-4 w-40 h-40 bg-amber-400 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="text-center p-8 relative z-10">
          <div className="bg-white rounded-full p-6 inline-block shadow-lg mb-4 border-4 border-orange-200">
            <MapPin className="h-16 w-16 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-orange-900 mb-3">OM Sai Bhojnalay</h3>
          <p className="text-lg text-orange-700 mb-4 font-medium">
            📍 Chhatrapati Sambhajinagar, Maharashtra
          </p>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-orange-200 max-w-md mx-auto">
            <div className="flex items-start space-x-3 mb-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-orange-900">Our Location</p>
                <p className="text-xs text-orange-600">Authentic home-style meals served daily</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-orange-100">
              <p className="text-xs text-orange-500 italic">
                🗺️ Interactive map functionality coming soon
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-orange-200">
              <p className="text-xs text-orange-600 font-medium">⭐ Rated 4.5/5</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-orange-200">
              <p className="text-xs text-orange-600 font-medium">🍛 100+ Happy Members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}