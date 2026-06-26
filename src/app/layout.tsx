import type { Metadata } from "next";
import { Outfit } from 'next/font/google';
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ShopProvider } from '@/context/ShopContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ezyworkz Shops Web",
  description: "Ezyworkz Shops Web App",
  icons: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <AuthProvider>
              <ShopProvider>
                {children}

              </ShopProvider>
            </AuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
