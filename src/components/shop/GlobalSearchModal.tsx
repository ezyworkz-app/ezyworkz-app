"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronLeft, X } from 'lucide-react';
import ItemCard from './ItemCard';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  shopLat: number;
  shopLng: number;
  servicesList: any[];
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  shopId,
  shopName,
  shopLat,
  shopLng,
  servicesList,
}: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const groupedResults = useMemo(() => {
    if (!searchQuery.trim() || !servicesList) return [];
    const query = searchQuery.toLowerCase();
    
    const groups: { title: string; items: any[] }[] = [];
    
    servicesList.forEach((svc: any) => {
      svc.categories?.forEach((cat: any) => {
        if (!cat.items || cat.items.length === 0) return;
        
        const matchingItems = cat.items.filter((itm: any) => 
          itm.isActive !== false && (itm.name || '').toLowerCase().includes(query)
        );

        if (matchingItems.length > 0) {
          const itemsWithMeta = matchingItems.map((itm: any) => ({
            ...itm,
            _parentService: svc,
            _parentCategory: cat
          }));

          // Sort alphabetically
          itemsWithMeta.sort((a: any, b: any) => {
            return (a.name || "").localeCompare(b.name || "");
          });

          groups.push({
            title: `${svc.name} - ${cat.name}`,
            items: itemsWithMeta
          });
        }
      });
    });

    return groups;
  }, [searchQuery, servicesList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-[2px] animate-fade-in">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#F4F6F9] rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-white border-b border-[#E8EDF2] flex items-center px-4 py-3 gap-3 shadow-sm z-10">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search items across all services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-100 rounded-full py-2.5 pl-9 pr-10 text-[15px] outline-none placeholder-neutral-400 focus:bg-white focus:ring-2 focus:ring-[#0D9488]/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50 relative">
          {!searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-3 min-h-[40vh]">
              <Search className="w-12 h-12 text-neutral-200" />
              <p>Start typing to search for items</p>
            </div>
          ) : groupedResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2 min-h-[40vh]">
              <p className="text-lg font-medium text-neutral-600">No results found</p>
              <p className="text-sm">Try searching for something else</p>
            </div>
          ) : (
            <div className="p-4 space-y-5 pb-8">
              {groupedResults.map((group, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-[#E8EDF2] overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="bg-[#F8FAFC] px-4 py-2.5 border-b border-[#E8EDF2]">
                    <span className="text-[12px] font-black text-[#0D9488] uppercase tracking-wider">{group.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 p-4">
                    {group.items.map((itm: any) => (
                      <ItemCard
                        key={`${itm._parentService.shopServiceId}-${itm._parentCategory.shopServiceCategoryId}-${itm.shopServiceCategoryItemId}`}
                        shopLat={shopLat}
                        shopLng={shopLng}
                        shopId={shopId}
                        shopName={shopName}
                        serviceId={itm._parentService.shopServiceId}
                        serviceName={itm._parentService.name}
                        deliveryTypes={itm._parentService.deliveryTypes}
                        categoryId={itm._parentCategory.shopServiceCategoryId}
                        categoryName={itm._parentCategory.name}
                        item={itm}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
