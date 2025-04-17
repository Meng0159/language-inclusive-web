import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Prediction {
  description: string;
  place_id: string;
  postcode?: string; // We'll enrich this manually
}

export function useLocationSearch() {
  const [locationTerm, setLocationTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [selectedPostcode, setSelectedPostcode] = useState<string | null>(null);

  const { data: predictions = [], isLoading } = useQuery<Prediction[]>({
    queryKey: ["locationPredictions", locationTerm],
    queryFn: async () => {
      if (!locationTerm) return [];
      const response = await fetch(
        `/api/googlePlace/autocomplete?input=${encodeURIComponent(locationTerm)}`
      );
      if (!response.ok) throw new Error("Failed to fetch predictions");
      const data = await response.json();
      return data.predictions || [];
    },
    enabled: locationTerm.length > 2,
  });

  const handlePredictionSelect = useCallback(async (placeId: string, description: string) => {
    try {
      const response = await fetch(`/api/googlePlace/details?placeId=${placeId}`);
      if (!response.ok) throw new Error("Failed to fetch place details");
      const data = await response.json();

      const location = data?.location;
      const postcode = data?.postcode || null;

      if (location) {
        setSelectedLocation(location);
        setSelectedPostcode(postcode);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSelectedPostcode(null);
      },
      (error) => {
        console.error("Error getting current location:", error);
        alert("Unable to retrieve your location");
      }
    );
  }, []);

  const resetLocation = useCallback(() => {
    setLocationTerm("");
    setSelectedLocation(null);
  }, []);

  return {
    locationTerm,
    setLocationTerm,
    predictions,
    isLoading,
    selectedLocation,
    selectedPostcode,
    handlePredictionSelect,
    getCurrentLocation,
    resetLocation,
  };
}
