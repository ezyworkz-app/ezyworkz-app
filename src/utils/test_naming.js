
function getUnifiedAddonName(addonName, variationName) {
  if (!variationName || !variationName.trim()) return addonName;
  
  const base = addonName.trim();
  const variation = variationName.trim();
  
  const lowVar = variation.toLowerCase();
  // 🟢 Suppress common "default" variations to match Webapp aesthetic
  if (lowVar === 'shirt' || lowVar === 'shirt / t-shirt') {
      return base;
  }
  
  // Normalize for comparison: remove special chars, spaces, and lowercase
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const normBase = normalize(base);
  const normVar = normalize(variation);
  
  // If base already contains variation at the end or inside
  if (normBase.endsWith(normVar) || normBase.includes(normVar)) {
    return base;
  }
  
  // 🟢 Use " - " separator instead of brackets to match Webapp
  return `${base} - ${variation}`;
}

const tests = [
    { base: "steam Ironing", var: "Shirt", expected: "steam Ironing" },
    { base: "steam Ironing", var: "Shirt / T-shirt", expected: "steam Ironing" },
    { base: "steam Ironing", var: "Kurta", expected: "steam Ironing - Kurta" },
    { base: "steam Ironing - Kurta", var: "Kurta", expected: "steam Ironing - Kurta" },
    { base: "Kurta", var: "Kurta", expected: "Kurta" },
    { base: "Comfort", var: "", expected: "Comfort" },
];

console.log("--- Refined Naming Utility Tests ---");
tests.forEach(({ base, var: v, expected }) => {
    const result = getUnifiedAddonName(base, v);
    const pass = result === expected;
    console.log(`${pass ? '✅' : '❌'} [${base}] + [${v}] -> [${result}] ${!pass ? `(Expected: ${expected})` : ''}`);
});
