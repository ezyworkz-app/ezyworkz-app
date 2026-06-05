"use client";

import { PorterOrder } from "@/types/porter";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { format } from "date-fns";
import { Car, Clock, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PorterTracking({
  order,
  orderId,
  type,
}: {
  order?: PorterOrder;
  orderId: string;
  type: string;
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!order) {
    return <div className="p-4 text-gray-500">No order data available</div>;
  }
  // console.log(order);
  // console.log(orderId);
  // console.log(type);
  const getStatusColor = (status?: PorterOrder["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "accepted":
        return "bg-yellow-500";
      case "live":
        return "bg-green-500";
      case "ended":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const formatTime = (epoch?: number | null) =>
    epoch ? format(new Date(epoch * 1000), "PPpp") : "—";

  const lat = order.partner_info?.location?.lat ?? null;
  const lng = order.partner_info?.location?.long ?? null;

  const handleCancel = async () => {
    if (!orderId || !type) return;
    if (!confirm(`Cancel ${type} order #${orderId}?`)) return;

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/porter/orders/cancel/${orderId}/${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${document.cookie
                .split("; ")
                .find((c: string) => c.startsWith("accessToken="))
                ?.split("=")[1]
              }`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to cancel");
      alert("Order cancelled successfully");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canCancel =
    order.status &&
    ["open", "accepted", "live"].includes(order.status.toLowerCase());

  return (
    <div className="w-full max-w-3xl mx-auto rounded-lg border border-gray-200 shadow p-6 bg-white space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {order.type?.toUpperCase() ?? "ORDER"} #{order.order_id ?? "—"}
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(
            order.status
          )}`}
        >
          {order.status?.toUpperCase() ?? "UNKNOWN"}
        </span>
      </div>

      {/* Cancel Button */}
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Cancel Order"}
        </button>
      )}

      {/* Partner Info */}
      <div>
        <h3 className="font-medium mb-2">Partner Info</h3>
        {order.partner_info ? (
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Car size={16} /> {order.partner_info.name ?? "—"} (
              {order.partner_info.vehicle_type ?? "—"})
            </div>
            <div className="flex items-center gap-2">
              🚗 Vehicle: {order.partner_info.vehicle_number ?? "—"}
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} /> +
              {order.partner_info.mobile?.country_code ?? "--"}{" "}
              {order.partner_info.mobile?.mobile_number ?? "—"}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No partner assigned yet</p>
        )}
      </div>

      {/* Google Map */}
      {isLoaded && lat && lng && (
        <div className="h-64 w-full rounded-lg overflow-hidden">
          <GoogleMap
            center={{ lat, lng }}
            zoom={15}
            mapContainerStyle={{ width: "100%", height: "100%" }}
          >
            <Marker position={{ lat, lng }} />
          </GoogleMap>
        </div>
      )}

      {/* Timings */}
      <div>
        <h3 className="font-medium mb-2">Order Timings</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Clock size={16} /> Pickup:{" "}
            {formatTime(order.order_timings?.pickup_time)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Accepted:{" "}
            {formatTime(order.order_timings?.order_accepted_time)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Started:{" "}
            {formatTime(order.order_timings?.order_started_time)}
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} /> Ended:{" "}
            {formatTime(order.order_timings?.order_ended_time)}
          </div>
        </div>
      </div>

      {/* Fare Details */}
      <div>
        <h3 className="font-medium mb-2">Fare Details</h3>
        <div className="space-y-1 text-sm text-gray-700">
          {order.fare_details?.estimated_fare_details && (
            <p>
              Estimated:{" "}
              {order.fare_details.estimated_fare_details.currency ?? ""}{" "}
              {(order.fare_details.estimated_fare_details.minor_amount ?? 0) /
                100}
            </p>
          )}
          {order.fare_details?.actual_fare_details && (
            <p>
              Actual: {order.fare_details.actual_fare_details.currency ?? ""}{" "}
              {(order.fare_details.actual_fare_details.minor_amount ?? 0) / 100}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
