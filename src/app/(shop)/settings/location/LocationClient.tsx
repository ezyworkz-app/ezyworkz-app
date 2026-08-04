"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import { updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Save, CheckCircle2, MapPin, Clock, Search, Navigation, Building2, Crosshair } from "lucide-react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const mapContainerStyle = {
    width: "100%",
    height: "360px",
};

const defaultCenter = {
    lat: 12.9716, // Bangalore default
    lng: 77.5946,
};

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function LocationClient() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading, refreshShop } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const shopData = selectedShop || {};

    const [address, setAddress] = useState({
        building: shopData.address?.building || "",
        street: shopData.address?.street || "",
        area: shopData.address?.area || "",
        city: shopData.address?.city || "",
        state: shopData.address?.state || "",
        pincode: shopData.address?.pincode || "",
        lat: shopData.address?.lat || defaultCenter.lat,
        lng: shopData.address?.lng || defaultCenter.lng,
    });

    const defaultTiming = {
        monday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        tuesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        wednesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        thursday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        friday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        saturday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        sunday: { working: false, slots: [{ open: "09:00", close: "18:00" }] },
    };

    const [shopTiming, setShopTiming] = useState<any>({ ...defaultTiming, ...(shopData.shopTiming || {}) });

    // Google Maps Script Load
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCA4Jh996egBXiHl_LORqCw1fCtO5U6zs0",
        libraries: LIBRARIES,
    });

    // Search & Map Refs
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    useEffect(() => {
        if (isLoaded) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    useEffect(() => {
        if (selectedShop) {
            if (selectedShop.address) {
                setAddress({
                    building: selectedShop.address.building || "",
                    street: selectedShop.address.street || "",
                    area: selectedShop.address.area || "",
                    city: selectedShop.address.city || "",
                    state: selectedShop.address.state || "",
                    pincode: selectedShop.address.pincode || "",
                    lat: selectedShop.address.lat || defaultCenter.lat,
                    lng: selectedShop.address.lng || defaultCenter.lng,
                });
            }
            if (selectedShop.shopTiming) {
                setShopTiming((prev: any) => ({ ...defaultTiming, ...selectedShop.shopTiming }));
            }
        }
    }, [selectedShop]);

    // Debounced Search for Autocomplete Location Suggestions
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
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const activeShopId = selectedShopId;

    const handleSave = async () => {
        if (!activeShopId) return;
        setIsSaving(true);
        setSaveMessage(null);

        const payload = {
            address,
            shopTiming,
        };

        const result = await updateShopDetails(activeShopId, payload);
        setIsSaving(false);

        if (result.success) {
            setSaveMessage("Location & timings saved successfully!");
            await refreshShop();
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            alert(`Failed to save: ${result.error}`);
        }
    };

    const handleAddressChange = (field: string, value: any) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const handleTimingChange = (day: string, field: string, value: any) => {
        setShopTiming((prev: any) => {
            const daySchedule = { ...prev[day] };
            if (field === "working") {
                daySchedule.working = value;
            } else if (field === "open" || field === "close") {
                if (!daySchedule.slots || daySchedule.slots.length === 0) {
                    daySchedule.slots = [{ open: "09:00", close: "18:00" }];
                }
                daySchedule.slots[0][field] = value;
            }
            return { ...prev, [day]: daySchedule };
        });
    };

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        placesServiceRef.current = new google.maps.places.PlacesService(map);
    }, []);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setAddress(prev => ({ ...prev, lat, lng }));
        }
    }, []);

    const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setAddress(prev => ({ ...prev, lat, lng }));
        }
    }, []);

    const selectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
        setSearchTerm(suggestion.description);
        setShowSuggestions(false);
        
        if (placesServiceRef.current) {
            placesServiceRef.current.getDetails(
                { placeId: suggestion.place_id, fields: ["geometry", "address_components", "formatted_address"] },
                (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        
                        const components = place.address_components || [];
                        const getComp = (types: string[], useShort = false) => {
                            const comp = components.find(c => types.some(t => c.types.includes(t)));
                            return useShort ? comp?.short_name : comp?.long_name;
                        };

                        const streetNumber = getComp(["street_number"]);
                        const route = getComp(["route"]);
                        const street = [streetNumber, route].filter(Boolean).join(", ");
                        const sublocality2 = getComp(["sublocality_level_2"]);
                        const sublocality1 = getComp(["sublocality_level_1"]);
                        const neighborhood = getComp(["neighborhood"]);
                        const area = sublocality2 || sublocality1 || neighborhood || "";
                        const city = getComp(["locality"]) || getComp(["administrative_area_level_2"]) || "";
                        const state = getComp(["administrative_area_level_1"]) || "";
                        const pincode = getComp(["postal_code"]) || "";

                        setAddress((prev) => ({
                            ...prev,
                            lat,
                            lng,
                            street: street || prev.street,
                            area: area || prev.area,
                            city: city || prev.city,
                            state: state || prev.state,
                            pincode: pincode || prev.pincode,
                        }));

                        mapRef.current?.panTo({ lat, lng });
                    }
                }
            );
        }
    };

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
                    alert("Could not access your current GPS location. Please allow browser location access.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    if (isShopLoading) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 overflow-y-auto h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Location & Timings</h1>
                        <p className="text-gray-500 mt-1">Pin your exact shop location on the map and set operating hours.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {saveMessage && (
                            <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                            </span>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium disabled:opacity-70 transition-colors shadow-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="pb-12 max-w-3xl space-y-8">
                    {/* Interactive Map Location Selection */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-teal-600" />
                                <h3 className="text-lg font-bold text-gray-900">Interactive Map Location Selection</h3>
                            </div>
                            <button
                                type="button"
                                onClick={useCurrentLocation}
                                className="text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <Navigation className="w-3.5 h-3.5" /> Use My Location
                            </button>
                        </div>

                        {/* Location Autocomplete Search */}
                        <div className="relative mb-4">
                            <div className="relative flex items-center">
                                <Search className="absolute left-3.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search location or area (e.g. HSR Layout, MG Road)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 text-gray-400 animate-spin w-4 h-4" />
                                )}
                            </div>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.place_id}
                                            type="button"
                                            onClick={() => selectSuggestion(suggestion)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                            <Building2 className="text-gray-400 mt-0.5 shrink-0 w-4 h-4" />
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
                        </div>

                        {/* Google Map View */}
                        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6 relative">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                                    zoom={15}
                                    onLoad={onMapLoad}
                                    onClick={onMapClick}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                    }}
                                >
                                    <Marker
                                        position={{ lat: address.lat || defaultCenter.lat, lng: address.lng || defaultCenter.lng }}
                                        draggable={true}
                                        onDragEnd={onMarkerDragEnd}
                                    />
                                </GoogleMap>
                            ) : (
                                <div className="h-[360px] flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
                                    <Loader2 className="animate-spin mr-2 w-5 h-5 text-teal-600" />
                                    Loading Interactive Map...
                                </div>
                            )}
                            <div className="bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 text-xs rounded-lg absolute bottom-3 left-3 flex items-center gap-1.5 pointer-events-none">
                                <Crosshair className="w-3.5 h-3.5 text-teal-400" />
                                Click map or drag marker to set exact shop location
                            </div>
                        </div>
                        
                        {/* Address Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Building / Shop No.</label>
                                <input 
                                    type="text" 
                                    value={address.building}
                                    onChange={(e) => handleAddressChange("building", e.target.value)}
                                    placeholder="e.g. Shop #12, Sunshine Plaza"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Street / Road</label>
                                <input 
                                    type="text" 
                                    value={address.street}
                                    onChange={(e) => handleAddressChange("street", e.target.value)}
                                    placeholder="e.g. 10th Main Road"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Area / Locality</label>
                                <input 
                                    type="text" 
                                    value={address.area}
                                    onChange={(e) => handleAddressChange("area", e.target.value)}
                                    placeholder="e.g. HSR Layout"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <input 
                                    type="text" 
                                    value={address.city}
                                    onChange={(e) => handleAddressChange("city", e.target.value)}
                                    placeholder="e.g. Bengaluru"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">State</label>
                                <input 
                                    type="text" 
                                    value={address.state}
                                    onChange={(e) => handleAddressChange("state", e.target.value)}
                                    placeholder="e.g. Karnataka"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pincode</label>
                                <input 
                                    type="text" 
                                    value={address.pincode}
                                    onChange={(e) => handleAddressChange("pincode", e.target.value)}
                                    placeholder="e.g. 560102"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Latitude</label>
                                <input 
                                    type="number"
                                    step="0.000001"
                                    value={address.lat}
                                    onChange={(e) => handleAddressChange("lat", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm bg-gray-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Longitude</label>
                                <input 
                                    type="number"
                                    step="0.000001"
                                    value={address.lng}
                                    onChange={(e) => handleAddressChange("lng", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Timings */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-teal-600" />
                            <h3 className="text-lg font-bold text-gray-900">Operational Timings</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {DAYS.map(day => {
                                const dayData = shopTiming[day] || { working: false, slots: [{open: "09:00", close: "18:00"}] };
                                const openTime = dayData.slots?.[0]?.open || "09:00";
                                const closeTime = dayData.slots?.[0]?.close || "18:00";

                                return (
                                    <div key={day} className="flex flex-col gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={dayData.working}
                                                        onChange={(e) => handleTimingChange(day, "working", e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                                                </div>
                                                <span className={`text-sm font-semibold capitalize ${dayData.working ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {day}
                                                </span>
                                            </label>
                                        </div>
                                        
                                        {dayData.working && (
                                            <div className="flex items-center gap-2 mt-2 pl-12">
                                                <input 
                                                    type="time" 
                                                    value={openTime}
                                                    onChange={(e) => handleTimingChange(day, "open", e.target.value)}
                                                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-teal-600"
                                                />
                                                <span className="text-xs text-gray-500 font-medium">to</span>
                                                <input 
                                                    type="time" 
                                                    value={closeTime}
                                                    onChange={(e) => handleTimingChange(day, "close", e.target.value)}
                                                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-teal-600"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
