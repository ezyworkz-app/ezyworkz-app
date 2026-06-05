/* Central address shape used everywhere on the client */

export type SavedAddress = {
  /* ─ geo ─────────────────────────────── */
  lat: number;
  lng: number;

  /* ─ mandatory lines ­────────────────── */
  line1: string; // “Flat 12, 3rd Floor …”
  line2?: string; // optional continuation
  area: string; // locality / area
  city: string;
  state: string;
  pincode: string;
  country: string; // ISO‑2 (e.g. “IN”)

  /* ─ meta chosen by the user ─────────── */
  label: "home" | "work" | "others";
  buildingType?: string;
  houseNo?: string;
  block?: string;
};
