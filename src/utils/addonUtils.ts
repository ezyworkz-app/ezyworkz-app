
/**
 * Intelligently combines an addon name and variation name to avoid duplicates.
 * Uses " - " separator to match the Webapp style.
 * 
 * e.g. ("steam Ironing - Kurta", "Kurta") -> "steam Ironing - Kurta"
 * e.g. ("steam Ironing", "Shirt")          -> "steam Ironing - Shirt"
 * e.g. ("steam Ironing", "Kurta")          -> "steam Ironing - Kurta"
 */
export function getUnifiedAddonName(addonName: string, variationName?: string): string {
  if (!variationName || !variationName.trim()) return addonName;
  
  const base = addonName.trim();
  const variation = variationName.trim();
  
  // Normalize for comparison: remove special chars, spaces, and lowercase
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const normBase = normalize(base);
  const normVar = normalize(variation);
  
  // If base already contains variation at the end or inside, don't append
  if (normBase.endsWith(normVar) || normBase.includes(normVar)) {
    return base;
  }
  
  // Use " - " separator to match Webapp style
  return `${base} - ${variation}`;
}
