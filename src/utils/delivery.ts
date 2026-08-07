/* utils/delivery.ts
 * ---------------------------------------------------------- */

/** Haversine great‑circle distance in **kilometres** (two decimals) */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius (km)
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return +(2 * R * Math.asin(Math.sqrt(a))).toFixed(2);
}

/* -----------------------------------------------------------------
 * Delivery fee rule:
 *   • Base fare            : ₹ 50 (up to 3km)
 *   • Variable per‑km fare : ₹ 15 for **every** km (rounded UP)
 *
 *   examples ──────────────────────────────────────────────
 *     0.6 km  →  50
 *     3.4 km  →  50 + 1×15  = ₹ 65
 *     7.0 km  →  50 + 4×15  = ₹ 110
 * ----------------------------------------------------------------*/
export function tieredFee(distanceKm: number): number {
  if (distanceKm <= 0 || Number.isNaN(distanceKm)) return 50;

  if (distanceKm <= 3) return 50;

  const extraKm = Math.max(0, distanceKm - 3);
  return 50 + Math.ceil(extraKm) * 15;
}
