"use client";

import React, { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { updateShopAddress } from "@/lib/actions/shops";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Shop, Address } from "@/types/Shop";
import { Loader2, Save, MapPin, Search, Edit2, X, Navigation, Building2 } from "lucide-react";

interface ShopAddressEditorProps {
  shop: Shop;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 12.9716, // Bangalore default
  lng: 77.5946,
};

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function ShopAddressEditor({ shop }: ShopAddressEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState<Address>(
    shop.address || {
      street: "",
      area: "",
      locality: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      lat: defaultCenter.lat,
      lng: defaultCenter.lng,
    }
  );

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for Google Services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const [isPending, startTransition] = useTransition();

  // Initialize services when isLoaded
  useEffect(() => {
    if (isLoaded) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Debounced Search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: searchTerm,
          componentRestrictions: { country: "in" },
        },
        (predictions, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    placesServiceRef.current = new google.maps.places.PlacesService(map);
  }, []);

  const selectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchTerm(suggestion.description);
    setShowSuggestions(false);
    
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId: suggestion.place_id, fields: ["geometry", "address_components", "formatted_address"] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            const components = place.address_components || [];
            
            const getComp = (types: string[], useShort = false) => {
              const comp = components.find(c => types.some(t => c.types.includes(t)));
              return useShort ? comp?.short_name : comp?.long_name;
            };

            const streetNumber = getComp(["street_number"]);
            const route = getComp(["route"]);
            const street = [streetNumber, route].filter(Boolean).join(", ") || getComp(["common_name", "establishment"]);
            
            const sublocality2 = getComp(["sublocality_level_2"]);
            const sublocality1 = getComp(["sublocality_level_1"]);
            const neighborhood = getComp(["neighborhood"]);
            
            const locality = sublocality1 || neighborhood || "";
            const area = sublocality2 || "";
            
            const city = getComp(["locality"]) || getComp(["administrative_area_level_2"]);
            const state = getComp(["administrative_area_level_1"]);
            const pincode = getComp(["postal_code"]);
            const country = getComp(["country"]) || "India";

            setAddress((prev) => ({
              ...prev,
              lat,
              lng,
              street: street || prev.street,
              locality: locality || prev.locality,
              area: area || prev.area,
              city: city || prev.city,
              state: state || prev.state,
              pincode: pincode || prev.pincode,
              country: country || prev.country,
            }));

            // Center map on selected place
            mapRef.current?.panTo({ lat, lng });
          }
        }
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: name === "lat" || name === "lng" ? parseFloat(value) || 0 : value,
    }));
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setAddress((prev) => ({
        ...prev,
        lat,
        lng,
      }));
    }
  }, []);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setAddress((prev) => ({
        ...prev,
        lat,
        lng,
      }));
    }
  }, []);

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setAddress((prev) => ({
            ...prev,
            lat,
            lng,
          }));
          mapRef.current?.panTo({ lat, lng });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your current location. Please check your browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSave = async () => {
    startTransition(async () => {
      const res = await updateShopAddress(shop.shopId, address);

      if (!res.success) {
        alert(res.error || "Failed to update shop address");
      } else {
        alert("Shop address updated successfully!");
        setIsEditing(false);
      }
    });
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 size={16} className="mr-2" />
            Edit Address
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-sm font-medium text-gray-500">Street</span>
              <span className="text-sm text-gray-900">{address.street || "—"}</span>

              <span className="text-sm font-medium text-gray-500">Locality</span>
              <span className="text-sm text-gray-900">{address.locality || "—"}</span>

              <span className="text-sm font-medium text-gray-500">Area</span>
              <span className="text-sm text-gray-900">{address.area || "—"}</span>

              <span className="text-sm font-medium text-gray-500">City</span>
              <span className="text-sm text-gray-900">{address.city || "—"}</span>

              <span className="text-sm font-medium text-gray-500">Pincode</span>
              <span className="text-sm text-gray-900">{address.pincode || "—"}</span>

              <span className="text-sm font-medium text-gray-500">State</span>
              <span className="text-sm text-gray-900">{address.state || "—"}</span>

              <span className="text-sm font-medium text-gray-500">Country</span>
              <span className="text-sm text-gray-900">{address.country || "India"}</span>

              <span className="text-sm font-medium text-gray-500">Latitude</span>
              <span className="text-sm text-gray-900">{address.lat || "—"}</span>

              <span className="text-sm font-medium text-gray-500">Longitude</span>
              <span className="text-sm text-gray-900">{address.lng || "—"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm h-[300px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                zoom={15}
                options={{
                  draggable: false,
                  clickableIcons: false,
                  disableDefaultUI: true,
                }}
              >
                <Marker
                  position={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                />
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400">
                <Loader2 className="animate-spin mr-2" />
                Loading Map...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center pb-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Edit Shop Address</h3>
        <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="text-gray-500">
          <X size={16} className="mr-2" />
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            id="street"
            label="Street / Building"
            name="street"
            value={address.street || ""}
            onChange={handleChange}
            placeholder="e.g. 123 Main St, Apartment 4B"
          />
          <Input
            id="locality"
            label="Locality"
            name="locality"
            value={address.locality || ""}
            onChange={handleChange}
            placeholder="e.g. HSR Layout"
            required
          />
          <Input
            id="area"
            label="Area"
            name="area"
            value={address.area || ""}
            onChange={handleChange}
            placeholder="e.g. Sector 2"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="city"
              label="City"
              name="city"
              value={address.city || ""}
              onChange={handleChange}
              placeholder="e.g. Bangalore"
              required
            />
            <Input
              id="pincode"
              label="Pincode"
              name="pincode"
              value={address.pincode || ""}
              onChange={handleChange}
              placeholder="e.g. 560102"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="state"
              label="State"
              name="state"
              value={address.state || ""}
              onChange={handleChange}
              placeholder="e.g. Karnataka"
              required
            />
            <Input
              id="country"
              label="Country"
              name="country"
              value={address.country || ""}
              onChange={handleChange}
              placeholder="e.g. India"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="lat"
              label="Latitude"
              name="lat"
              type="number"
              step="0.000001"
              value={address.lat || 0}
              onChange={handleChange}
              required
            />
            <Input
              id="lng"
              label="Longitude"
              name="lng"
              type="number"
              step="0.000001"
              value={address.lng || 0}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pin Location on Map
            </label>
            
            {isLoaded && (
              <div className="space-y-3 mb-4 relative">
                <div className="relative flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search for a location..."
                      className="pl-10 h-10"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-2.5 text-gray-400 animate-spin" size={18} />
                    )}
                  </div>
                  {(searchTerm || suggestions.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b last:border-b-0"
                      >
                        <Building2 className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useCurrentLocation}
                  className="w-full flex items-center justify-center gap-2 py-2"
                >
                  <Navigation size={14} />
                  Use My Current Location
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                  zoom={15}
                  onLoad={onMapLoad}
                  onClick={onMapClick}
                >
                  <Marker
                    position={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                  />
                </GoogleMap>
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 text-gray-400">
                  <Loader2 className="animate-spin mr-2" />
                  Loading Map...
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} />
              Search, click on map or drag the marker to update coordinates
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isPending} className="px-8 shadow-md hover:shadow-lg transition-all">
          {isPending ? (
            <Loader2 className="animate-spin mr-2" size={18} />
          ) : (
            <Save size={18} className="mr-2" />
          )}
          Save Address Details
        </Button>
      </div>
    </div>
  );
}
