"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { reverseGeocode } from "../lib/geocode";
// import { reverseGeocode } from "../lib/geocode";

type Location = { coords: { lat: number; lng: number }; label: string } | null;

const Ctx = createContext<{
  location: Location;
  setLocation: (l: Location) => void;
}>({ location: null, setLocation: () => { } });

export const LocationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [location, _setLocation] = useState<Location>(null);

  /* wrapped setter that also persists */
  const setLocation = useCallback((loc: Location) => {
    _setLocation(loc);
    if (loc) localStorage.setItem("launezy_location", JSON.stringify(loc));
    else localStorage.removeItem("launezy_location");
  }, []);

  /* hydrate from storage or GPS */
  useEffect(() => {
    const stored = localStorage.getItem("launezy_location");
    if (stored) {
      try {
        const loc = JSON.parse(stored) as Location;
        if (loc?.coords && loc?.label) {
          _setLocation(loc);
          return; // skip GPS
        }
      } catch {
        /* ignore parse errors */
      }
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        // make sure the result is always a string
        const label =
          (await reverseGeocode(coords).catch(() => null)) ??
          "Current location";

        setLocation({ coords, label }); // ✅ label is now string
      });
    });
  }, [setLocation]);

  return (
    <Ctx.Provider value={{ location, setLocation }}>{children}</Ctx.Provider>
  );
};

export const useLocation = () => useContext(Ctx);
