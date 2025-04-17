'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import EventList from './EventList';
import LocationSearch from './LocationSearch';
import { useLocationSearch } from '../hooks/useLocationSearch';

export default function DataEventSearch() {
  const {
    locationTerm,
    setLocationTerm,
    predictions,
    isLoading: isLocationLoading,
    selectedLocation,
    handlePredictionSelect,
    getCurrentLocation,
    resetLocation,
  } = useLocationSearch();

  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['events', selectedLocation],
    queryFn: async () => {
      if (!selectedLocation) return [];
      const response = await fetch(
        `/api/eventBrite?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
    enabled: !!selectedLocation,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <LocationSearch
              onLocationSelect={() => {}}
              predictions={predictions}
              loading={isLocationLoading}
              locationTerm={locationTerm}
              onLocationTermChange={setLocationTerm}
              onPredictionSelect={handlePredictionSelect}
            />
          </div>
          <button
            onClick={getCurrentLocation}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Current Location
          </button>
          <button
            onClick={resetLocation}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            New Search
          </button>
        </div>
        {selectedLocation && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Showing events within 20km of selected location</span>
          </div>
        )}
      </div>
      <EventList 
        coordinates={selectedLocation}
        events={events}
        isLoading={isEventsLoading}
      />
    </div>
  );
}
