"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbContextType {
  customChildren: ReactNode | null;
  setCustomChildren: (children: ReactNode | null) => void;
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customChildren, setCustomChildren] = useState<ReactNode | null>(null);
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ customChildren, setCustomChildren, customTitle, setCustomTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
};
