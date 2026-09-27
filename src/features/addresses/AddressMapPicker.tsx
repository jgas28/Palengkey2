import { useCallback, useRef, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Spinner } from "@/components/common/LoadingState";

export interface AddressMapPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }, formattedAddress?: string) => void;
}

// Metro Manila — used only as the map's initial view before a pin is set.
const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "220px", borderRadius: "16px" };

export default function AddressMapPicker({ lat, lng, onChange }: AddressMapPickerProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const hasPin = lat !== 0 || lng !== 0;
  const center = hasPin ? { lat, lng } : DEFAULT_CENTER;

  const reverseGeocode = useCallback((coords: { lat: number; lng: number }) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    setGeocoding(true);
    geocoderRef.current.geocode({ location: coords }, (results, status) => {
      setGeocoding(false);
      const formatted = status === "OK" ? results?.[0]?.formatted_address : undefined;
      onChange(coords, formatted);
    });
  }, [onChange]);

  function handleMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    reverseGeocode({ lat: event.latLng.lat(), lng: event.latLng.lng() });
  }

  function handleMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    reverseGeocode({ lat: event.latLng.lat(), lng: event.latLng.lng() });
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-[#DDE9EA] bg-[#F7FAFA] p-3 text-sm text-[#66777C]">
        Couldn't load the map. You can still set your location with the button below.
      </p>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-[#DDE9EA] bg-[#F7FAFA]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#DDE9EA]">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={hasPin ? 16 : 12}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {hasPin && (
          <Marker
            position={{ lat, lng }}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </GoogleMap>
      {geocoding && (
        <div className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#66777C] shadow-sm">
          Finding address…
        </div>
      )}
      {!hasPin && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 p-3 text-center text-sm font-medium text-[#203238]">
          Tap the map to drop a pin
        </div>
      )}
    </div>
  );
}
