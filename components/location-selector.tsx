'use client';

import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
}

export function LocationSelector({ selectedLocation, onLocationSelect }: LocationSelectorProps) {
  const locations = ['Kajiado Central', 'Magadi', 'Loitokitok', 'Namanga', 'Isinya'];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Select Location</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {locations.map((location) => (
          <button
            key={location}
            onClick={() => onLocationSelect(location)}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedLocation === location
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {location}
          </button>
        ))}
      </div>
    </div>
  );
}
