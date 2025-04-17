'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationSearchProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  predictions: Array<{ description: string; place_id: string }>;
  loading: boolean;
  locationTerm: string;
  onLocationTermChange: (value: string) => void;
  onPredictionSelect: (placeId: string, description: string) => void;
}

export default function LocationSearch({
  onLocationSelect,
  predictions,
  loading,
  locationTerm,
  onLocationTermChange,
  onPredictionSelect,
}: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(locationTerm);
  const [showPredictions, setShowPredictions] = useState(false);

  const handlePredictionSelect = (placeId: string, description: string) => {
    setInputValue(description);
    onLocationTermChange(description);
    setShowPredictions(false);
    onPredictionSelect(placeId, description);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onLocationTermChange(e.target.value);
          setShowPredictions(true);
        }}
        placeholder="Enter your location or entire postcode"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionSelect(prediction.place_id, prediction.description)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
} 