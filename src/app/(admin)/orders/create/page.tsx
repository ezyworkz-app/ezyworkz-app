"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Loader2, AlertCircle, ArrowLeft, Search, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateOrderPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [customers, setCustomers] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    
    const [selectedCustomer, setSelectedCustomer] = useState<string>("");
    const [searchCustomer, setSearchCustomer] = useState("");
    
    // Cart state
    const [cart, setCart] = useState<any>({});
    const [deliveryCharges, setDeliveryCharges] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [customerAsks, setCustomerAsks] = useState("");
    
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            fetchData();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            const [custRes, servRes, globalSvcRes] = await Promise.all([
                apiClient.get(`/customers/${selectedShopId}`),
                apiClient.get(`/public/shop/json/${selectedShopId}`),
                apiClient.get(`/global/services`)
            ]);
            setCustomers(custRes.data.data || custRes.data || []);
            const shopData = servRes.data.data || servRes.data || {};
            const globalSvcs = globalSvcRes.data.data || globalSvcRes.data || [];
            
            const mappedServices = (shopData.services || []).map((s: any) => ({
                ...s,
                name: s.name || globalSvcs.find((g: any) => g.globalServiceId === s.globalServiceId)?.name || "Unnamed Service"
            }));
            
            setServices(mappedServices);
        } catch (err: any) {
            setError(err.message || "Failed to load shop data");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQty = (service: any, category: any, item: any, delta: number) => {
        setCart((prev: any) => {
            const newCart = JSON.parse(JSON.stringify(prev));
            
            if (!newCart[service.shopServiceId]) {
                newCart[service.shopServiceId] = {
                    shopServiceId: service.shopServiceId,
                    selectedDeliveryType: Object.keys(service.deliveryTypes)[0] || 'standard',
                    categories: {}
                };
            }
            
            if (!newCart[service.shopServiceId].categories[category.shopServiceCategoryId]) {
                newCart[service.shopServiceId].categories[category.shopServiceCategoryId] = {
                    shopServiceCategoryId: category.shopServiceCategoryId,
                    items: {}
                };
            }
            
            const currentQty = newCart[service.shopServiceId].categories[category.shopServiceCategoryId].items[item.shopServiceCategoryItemId]?.quantity || 0;
            const newQty = Math.max(0, currentQty + delta);
            
            if (newQty === 0) {
                delete newCart[service.shopServiceId].categories[category.shopServiceCategoryId].items[item.shopServiceCategoryItemId];
                
                if (Object.keys(newCart[service.shopServiceId].categories[category.shopServiceCategoryId].items).length === 0) {
                    delete newCart[service.shopServiceId].categories[category.shopServiceCategoryId];
                }
                
                if (Object.keys(newCart[service.shopServiceId].categories).length === 0) {
                    delete newCart[service.shopServiceId];
                }
            } else {
                newCart[service.shopServiceId].categories[category.shopServiceCategoryId].items[item.shopServiceCategoryItemId] = {
                    shopServiceCategoryItemId: item.shopServiceCategoryItemId,
                    quantity: newQty,
                    unitPrice: item.price
                };
            }
            
            return newCart;
        });
    };

    const handleUpdateDeliveryType = (shopServiceId: string, deliveryType: string) => {
        setCart((prev: any) => ({
            ...prev,
            [shopServiceId]: {
                ...prev[shopServiceId],
                selectedDeliveryType: deliveryType
            }
        }));
    };

    const calculateTotals = () => {
        let itemsTotal = 0;
        
        Object.values(cart).forEach((svc: any) => {
            const originalService = services.find(s => s.shopServiceId === svc.shopServiceId);
            const multiplier = originalService?.deliveryTypes?.[svc.selectedDeliveryType]?.priceMultiplier || 1;
            let serviceSubtotal = 0;

            Object.values(svc.categories).forEach((cat: any) => {
                Object.values(cat.items).forEach((item: any) => {
                    serviceSubtotal += (item.unitPrice * item.quantity);
                });
            });

            itemsTotal += (serviceSubtotal * multiplier);
        });

        const tax = (itemsTotal + deliveryCharges) * (taxRate / 100);
        const total = itemsTotal + deliveryCharges + tax;
        
        return { itemsTotal, tax, total };
    };

    const handlePlaceOrder = async () => {
        if (!selectedCustomer) return alert("Please select a customer");
        if (Object.keys(cart).length === 0) return alert("Cart is empty");
        
        const totals = calculateTotals();
        
        const payload = {
            customerId: selectedCustomer,
            services: Object.values(cart).map((svc: any) => ({
                shopServiceId: svc.shopServiceId,
                selectedDeliveryType: svc.selectedDeliveryType,
                categories: Object.values(svc.categories).map((cat: any) => ({
                    shopServiceCategoryId: cat.shopServiceCategoryId,
                    items: Object.values(cat.items).map((item: any) => ({
                        shopServiceCategoryItemId: item.shopServiceCategoryItemId,
                        quantity: item.quantity
                    }))
                }))
            })),
            deliveryCharges,
            taxRate,
            customerAsks,
            selectedAddons: [],
            addonsTotal: 0
        };

        setSubmitting(true);
        try {
            await apiClient.post(`/shops/${selectedShopId}/orders`, payload);
            alert("Order placed successfully!");
            router.push('/orders');
        } catch (err: any) {
            alert(err.message || "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchCustomer.toLowerCase()) || c.phone.includes(searchCustomer));
    const totals = calculateTotals();

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 h-screen overflow-hidden flex flex-col">
                <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                    <Link 
                        href="/orders" 
                        className="p-2 bg-[#151b2b] text-teal-500 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            Create New Order
                        </h1>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                {loading || shopLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-[#0e1424] rounded-3xl border border-card-border">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <div className="flex-1 flex gap-6 overflow-hidden">
                        
                        {/* Left Side: Services & Items */}
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                            {/* Customer Selector */}
                            <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm flex-shrink-0">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">1. Select Customer</h2>
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input 
                                            type="text" 
                                            placeholder="Search by name or phone..." 
                                            value={searchCustomer}
                                            onChange={(e) => setSearchCustomer(e.target.value)}
                                            className="w-full bg-[#151b2b] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                                        />
                                    </div>
                                </div>
                                
                                {searchCustomer && (
                                    <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-[#151b2b]">
                                        {filteredCustomers.length === 0 ? (
                                            <div className="p-3 text-sm text-slate-500 text-center">No customers found</div>
                                        ) : (
                                            filteredCustomers.map(c => (
                                                <button
                                                    key={c.customerId}
                                                    onClick={() => {
                                                        setSelectedCustomer(c.customerId);
                                                        setSearchCustomer("");
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 text-left transition-colors"
                                                >
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{c.name}</p>
                                                        <p className="text-slate-500 text-xs">{c.phone}</p>
                                                    </div>
                                                    {selectedCustomer === c.customerId && <Check className="w-4 h-4 text-teal-500" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {selectedCustomer && !searchCustomer && (
                                    <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-teal-400">Selected Customer</p>
                                            <p className="text-white font-semibold">{customers.find(c => c.customerId === selectedCustomer)?.name}</p>
                                        </div>
                                        <button onClick={() => setSelectedCustomer("")} className="text-xs text-teal-400 hover:text-teal-300">Change</button>
                                    </div>
                                )}
                            </div>

                            {/* Service & Items Catalog */}
                            <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex-shrink-0">2. Add Items</h2>
                                <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                                    {services.map(svc => (
                                        <div key={svc.shopServiceId} className="bg-[#151b2b] rounded-2xl border border-white/5 p-4">
                                            <h3 className="font-bold text-white text-lg mb-4">{svc.name}</h3>
                                            
                                            <div className="space-y-4">
                                                {svc.categories?.map((cat: any) => (
                                                    <div key={cat.shopServiceCategoryId}>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat.name}</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {cat.items?.map((item: any) => {
                                                                const cartQty = cart[svc.shopServiceId]?.categories[cat.shopServiceCategoryId]?.items[item.shopServiceCategoryItemId]?.quantity || 0;
                                                                
                                                                return (
                                                                    <div key={item.shopServiceCategoryItemId} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                                        <div>
                                                                            <p className="text-white text-sm font-medium">{item.name}</p>
                                                                            <p className="text-slate-400 text-xs">₹{item.price}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 bg-[#0B0F19] p-1 rounded-lg border border-white/10">
                                                                            <button 
                                                                                onClick={() => handleUpdateQty(svc, cat, item, -1)}
                                                                                className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                                                                            >
                                                                                <Minus className="w-3 h-3" />
                                                                            </button>
                                                                            <span className="text-white text-sm font-semibold w-4 text-center">{cartQty}</span>
                                                                            <button 
                                                                                onClick={() => handleUpdateQty(svc, cat, item, 1)}
                                                                                className="w-6 h-6 rounded-md bg-teal-500/20 flex items-center justify-center text-teal-400 hover:bg-teal-500/30 transition-colors"
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Cart Summary & Checkout */}
                        <div className="w-[400px] flex-shrink-0 flex flex-col gap-6">
                            <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm flex-1 flex flex-col">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-teal-500" />
                                    Cart Summary
                                </h2>

                                <div className="flex-1 overflow-y-auto mb-6">
                                    {Object.keys(cart).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Your cart is empty</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.values(cart).map((svc: any) => (
                                                <div key={svc.shopServiceId} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">{services.find(s => s.shopServiceId === svc.shopServiceId)?.name}</p>
                                                        <select
                                                            value={svc.selectedDeliveryType}
                                                            onChange={(e) => handleUpdateDeliveryType(svc.shopServiceId, e.target.value)}
                                                            className="bg-[#151b2b] text-xs text-slate-300 border border-white/10 rounded px-2 py-1 outline-none"
                                                        >
                                                            {Object.keys(services.find(s => s.shopServiceId === svc.shopServiceId)?.deliveryTypes || {}).map(type => (
                                                                <option key={type} value={type}>
                                                                    {type.replace(/([A-Z])/g, " $1").trim()}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {Object.values(svc.categories).map((cat: any) => (
                                                        <div key={cat.shopServiceCategoryId} className="space-y-2">
                                                            {Object.values(cat.items).map((item: any) => {
                                                                const originalItem = services.find(s => s.shopServiceId === svc.shopServiceId)
                                                                    ?.categories.find((c: any) => c.shopServiceCategoryId === cat.shopServiceCategoryId)
                                                                    ?.items.find((i: any) => i.shopServiceCategoryItemId === item.shopServiceCategoryItemId);
                                                                    
                                                                return (
                                                                    <div key={item.shopServiceCategoryItemId} className="flex justify-between text-sm">
                                                                        <span className="text-slate-300">{originalItem?.name} <span className="text-slate-500 text-xs">x{item.quantity}</span></span>
                                                                        <span className="text-white font-medium">₹{item.unitPrice * item.quantity}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/10 flex-shrink-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Delivery Charges</span>
                                        <input 
                                            type="number"
                                            value={deliveryCharges}
                                            onChange={e => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-[#151b2b] border border-white/10 rounded-lg px-2 py-1 text-white text-right text-sm focus:outline-none focus:border-teal-500/50"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">GST (%)</span>
                                        <input 
                                            type="number"
                                            value={taxRate}
                                            onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-[#151b2b] border border-white/10 rounded-lg px-2 py-1 text-white text-right text-sm focus:outline-none focus:border-teal-500/50"
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 pt-2">
                                        <span className="text-sm text-slate-400">Customer Asks / Notes (Optional)</span>
                                        <textarea 
                                            value={customerAsks}
                                            onChange={e => setCustomerAsks(e.target.value)}
                                            placeholder="Special instructions or notes..."
                                            rows={2}
                                            className="w-full bg-[#151b2b] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500/50 resize-none"
                                        />
                                    </div>
                                    
                                    <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-white font-bold">Total Bill</span>
                                        <span className="text-xl font-bold text-teal-400">₹{totals.total.toFixed(2)}</span>
                                    </div>

                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={submitting || Object.keys(cart).length === 0 || !selectedCustomer}
                                        className="w-full mt-4 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order"}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </ProtectedRoute>
    );
}
