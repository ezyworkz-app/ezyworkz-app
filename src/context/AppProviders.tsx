// context/AppProviders.tsx
"use client";
import { ReactNode } from "react";
// import { LocationProvider } from "./LocationContext";
import { CartProvider } from "./CartContext";
// import { LocationProvider } from "./LocationContext";
import { CheckoutProvider } from "../components/order/CheckoutState";
import { LocationProvider } from "./LocationContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <LocationProvider>
        <CheckoutProvider>{children}</CheckoutProvider>
      </LocationProvider>
    </CartProvider>
  );
}
