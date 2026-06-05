import { Address } from "@/types/Shop";

export default function ShopAddressSection({ address }: { address?: Address }) {
  if (!address) {
    return <p>No address available.</p>;
  }

  return (
    <div className="space-y-2">
      <p>
        <strong>Street:</strong> {address.street}
      </p>
      <p>
        <strong>Area:</strong> {address.area}
      </p>
      <p>
        <strong>Locality:</strong> {address.locality}
      </p>
      <p>
        <strong>City:</strong> {address.city}
      </p>
      <p>
        <strong>State:</strong> {address.state}
      </p>
      <p>
        <strong>Country:</strong> {address.country}
      </p>
      <p>
        <strong>Pincode:</strong> {address.pincode}
      </p>
      <p>
        <strong>Latitude:</strong> {address.lat}
      </p>
      <p>
        <strong>Longitude:</strong> {address.lng}
      </p>
    </div>
  );
}
