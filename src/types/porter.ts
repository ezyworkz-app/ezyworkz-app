export type PorterOrder = {
    order_id?: string;
    type?: "pickup" | "delivery";
    status?: "open" | "accepted" | "live" | "ended" | "cancelled";
    partner_info?: {
        name?: string;
        vehicle_number?: string;
        vehicle_type?: string;
        mobile?: { country_code?: string; mobile_number?: string };
        partner_secondary_mobile?: {
            country_code?: string;
            mobile_number?: string;
        };
        location?: { lat?: number; long?: number } | null;
    } | null;
    order_timings?: {
        pickup_time?: number | null;
        order_accepted_time?: number | null;
        order_started_time?: number | null;
        order_ended_time?: number | null;
    };
    fare_details?: {
        estimated_fare_details?: {
            currency?: string;
            minor_amount?: number;
        } | null;
        actual_fare_details?: { currency?: string; minor_amount?: number } | null;
    };
};
