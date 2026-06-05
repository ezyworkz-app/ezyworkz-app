// lib/geocode.ts
export async function reverseGeocode(coords: {
  lat: number;
  lng: number;
}): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${key}`;
  const data = await fetch(url).then((r) => r.json());

  const components = data.results?.[0]?.address_components ?? [];

  const sublocality = components.find((c: any) =>
    c.types.includes("sublocality_level_1")
  )?.long_name;

  const locality = components.find((c: any) =>
    c.types.includes("locality")
  )?.long_name;

  if (sublocality && locality) return `${sublocality}, ${locality}`;
  if (locality) return locality;
  return data.results?.[0]?.formatted_address ?? null;
}
