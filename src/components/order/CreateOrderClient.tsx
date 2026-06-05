"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { Shop } from "@/types/Shop";
// import { ShopService } from "@/types/shop-menu";
// import { fetchShopServices } from "@/lib/actions/shops";
import UserSelector from "@/components/admin/UserSelector";
import ShopSelector from "@/components/admin/ShopSelector";
import ShopMenuClient from "@/components/shop/ShopMenuClient";
import CreateOrderCheckout from "./CreateOrderCheckout";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "./CheckoutState";
import { SavedAddress } from "@/types/address";
import { getUserAddresses } from "@/lib/actions/users";
import { ShopService } from "@/types/shop-menu";
import { fetchShopServices } from "@/lib/actions/shops";

interface Props {
    users: User[];
    shops: Shop[];
}

type Step = "user" | "address" | "shop" | "items" | "checkout";

export default function CreateOrderClient({ users, shops }: Props) {
    const [step, setStep] = useState<Step>("user");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userAddresses, setUserAddresses] = useState<SavedAddress[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [shopServices, setShopServices] = useState<ShopService[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);

    const { clear: clearCart, cartItems } = useCart();
    const { setSavedAddr, setUserId, setPaymentMethod, setNotes, setCouponCode, setDiscountAmount } = useCheckout();

    // Clear cart and checkout state on mount
    useEffect(() => {
        clearCart();
        setSavedAddr(null as any);
        setUserId(undefined);
        setPaymentMethod("cod");
        setNotes(undefined);
        setCouponCode(undefined);
        setDiscountAmount(0);
    }, []);

    const handleUserSelect = async (user: User) => {
        setSelectedUser(user);
        setUserId(user.userId);
        setLoadingAddresses(true);

        try {
            const addresses = await getUserAddresses(user.userId);
            // Map API address to SavedAddress if needed, assuming they match for now or are compatible
            // The API likely returns objects with _id, etc. We need to ensure they match SavedAddress
            // Let's assume the API returns a list of objects that have the required fields.
            // We might need to map them.
            const mappedAddresses: SavedAddress[] = addresses.map((addr: any) => ({
                label: addr.label || "Home",
                line1: addr.line1 || addr.street || "",
                line2: addr.line2,
                area: addr.area || "",
                city: addr.city || "",
                state: addr.state || "",
                pincode: addr.pincode || "",
                country: addr.country || "IN",
                lat: addr.lat || 0,
                lng: addr.lng || 0,
                houseNo: addr.houseNo,
                block: addr.block,
                buildingType: addr.buildingType
            }));

            setUserAddresses(mappedAddresses);
            setStep("address");
        } catch (err) {
            console.error("Failed to fetch addresses", err);
            // Fallback or error? Let's just go to address step with empty list and maybe allow manual entry later?
            // For now, let's just proceed to shop if no addresses, but better to show the address step even if empty so they know.
            setUserAddresses([]);
            setStep("address");
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleAddressSelect = (addr: SavedAddress) => {
        setSavedAddr(addr);
        setStep("shop");
    };

    const handleShopSelect = async (shop: Shop) => {
        setSelectedShop(shop);
        setLoadingServices(true);
        try {
            const services = await fetchShopServices(shop.shopId);
            setShopServices(services);
            setStep("items");
        } catch (err) {
            console.error("Failed to fetch services", err);
            alert("Failed to load shop services");
        } finally {
            setLoadingServices(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Stepper */}
            <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-40">
                <div className="mx-auto max-w-5xl">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                    <div className="mt-4 flex items-center gap-2 text-sm overflow-x-auto">
                        <span className={step === "user" ? "font-bold text-purple-600" : "text-gray-500"}>1. User</span>
                        <span className="text-gray-300">→</span>
                        <span className={step === "address" ? "font-bold text-purple-600" : "text-gray-500"}>2. Address</span>
                        <span className="text-gray-300">→</span>
                        <span className={step === "shop" ? "font-bold text-purple-600" : "text-gray-500"}>3. Shop</span>
                        <span className="text-gray-300">→</span>
                        <span className={step === "items" ? "font-bold text-purple-600" : "text-gray-500"}>4. Items</span>
                        <span className="text-gray-300">→</span>
                        <span className={step === "checkout" ? "font-bold text-purple-600" : "text-gray-500"}>5. Checkout</span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-8">
                {step === "user" && (
                    <UserSelector users={users} onSelect={handleUserSelect} />
                )}

                {step === "address" && (
                    <div>
                        <button onClick={() => setStep("user")} className="mb-4 text-sm text-gray-500 hover:text-gray-700">← Back to Users</button>
                        <h2 className="text-xl font-semibold mb-4">Select Delivery Address</h2>
                        {loadingAddresses ? (
                            <p>Loading addresses...</p>
                        ) : userAddresses.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-500 mb-4">No saved addresses found for this user.</p>
                                <button
                                    onClick={() => {
                                        // Create a dummy address or handle manual entry
                                        // For now, let's use user's lat/lng if available or just empty
                                        const addr: SavedAddress = {
                                            label: "others",
                                            line1: "",
                                            area: "",
                                            city: "",
                                            state: "",
                                            pincode: "",
                                            country: "IN",
                                            lat: selectedUser?.lat || 0,
                                            lng: selectedUser?.lng || 0,
                                        };
                                        handleAddressSelect(addr);
                                    }}
                                    className="text-purple-600 font-medium hover:underline"
                                >
                                    Skip / Use Temporary Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {userAddresses.map((addr, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAddressSelect(addr)}
                                        className="text-left p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition bg-white"
                                    >
                                        <div className="font-semibold text-gray-900 capitalize">{addr.label}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {addr.line1}<br />
                                            {addr.area}, {addr.city}<br />
                                            {addr.state} - {addr.pincode}
                                        </div>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        const addr: SavedAddress = {
                                            label: "others",
                                            line1: "",
                                            area: "",
                                            city: "",
                                            state: "",
                                            pincode: "",
                                            country: "IN",
                                            lat: selectedUser?.lat || 0,
                                            lng: selectedUser?.lng || 0,
                                        };
                                        handleAddressSelect(addr);
                                    }}
                                    className="text-center p-4 rounded-xl border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition flex items-center justify-center text-purple-600 font-medium"
                                >
                                    + Use Different Address
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {step === "shop" && (
                    <div>
                        <button onClick={() => setStep("address")} className="mb-4 text-sm text-gray-500 hover:text-gray-700">← Back to Address</button>
                        <ShopSelector shops={shops} onSelect={handleShopSelect} />
                    </div>
                )}

                {step === "items" && selectedShop && (
                    <div className="flex flex-col h-full">
                        <div className="mb-4 flex items-center justify-between">
                            <button onClick={() => setStep("shop")} className="text-sm text-gray-500 hover:text-gray-700">← Back to Shops</button>
                            <button
                                onClick={() => setStep("checkout")}
                                disabled={cartItems.length === 0}
                                className="rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white disabled:opacity-50 hover:bg-purple-700"
                            >
                                Proceed to Checkout ({cartItems.length} items)
                            </button>
                        </div>
                        {loadingServices ? (
                            <div>Loading services...</div>
                        ) : (
                            <ShopMenuClient shop={selectedShop} services={shopServices} />
                        )}
                    </div>
                )}

                {step === "checkout" && (
                    <div>
                        <button onClick={() => setStep("items")} className="mb-4 text-sm text-gray-500 hover:text-gray-700">← Back to Items</button>
                        <CreateOrderCheckout />
                    </div>
                )}
            </div>
        </div>
    );
}
