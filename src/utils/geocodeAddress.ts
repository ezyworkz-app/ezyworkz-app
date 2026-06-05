export async function geocodeAddress(placeId: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=YOUR_GOOGLE_API_KEY`
  );
  const data = await res.json();
  return data?.results?.[0];
}

export function extractAddressComponents(components: any[]) {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name || "";

  return {
    area: get("sublocality_level_1") || get("locality"),
    city: get("administrative_area_level_2") || get("locality"),
    state: get("administrative_area_level_1"),
    pincode: get("postal_code"),
    country: get("country"),
  };
}
