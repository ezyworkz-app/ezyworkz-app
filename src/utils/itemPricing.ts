/**
 * Frontend port of the backend applyTieredMarkup utility.
 * Keeps price display in the admin consistent with what the backend charges.
 */

export interface MarkupTier {
    upto?: number;   // price threshold — first tier where base <= upto wins
    percent: number; // markup %
}

/** Legacy fallback tiers (mirrored from backend itemPricing.ts) */
const LEGACY_TIERS: MarkupTier[] = [
    { upto: 50,  percent: 28 },
    { upto: 100, percent: 25 },
    { upto: 250, percent: 20 },
    { upto: 300, percent: 15 },
    { upto: 350, percent: 12 },
    { percent: 10 },           // catch-all (no upto = above all thresholds)
];

/**
 * Apply tiered markup to a base price.
 * @param base        Raw (shop) price
 * @param tiers       Markup tiers from config; falls back to legacy if empty
 * @returns           Marked-up price rounded to 2 dp
 */
export function applyTieredMarkup(base: number, tiers: MarkupTier[]): number {
    const activeTiers = tiers.length > 0 ? [...tiers].sort((a, b) => (a.upto ?? Infinity) - (b.upto ?? Infinity)) : LEGACY_TIERS;

    // Find first tier where base <= upto
    const tier = activeTiers.find(t => t.upto == null || base <= t.upto)
        ?? activeTiers[activeTiers.length - 1]; // fallback to last (catch-all)

    const percent = tier?.percent ?? 0;
    return Math.round((base + base * percent / 100) * 100) / 100;
}

/**
 * Apply GST to the shop (base) price first, then apply markup on top.
 *
 * Stacking order:
 *   1. base          — raw shop price
 *   2. withGst       — base + shop's GST  (what the shop actually charges)
 *   3. customerPrice — withGst + Launezy markup  (what the customer pays in the app)
 *
 * Returns:
 *   withGst       — shop price inclusive of GST  (or base when GST is off)
 *   customerPrice — final customer-facing price after markup on top of withGst
 */
export function applyMarkupAndGst(
    base: number,
    tiers: MarkupTier[],
    gstEnabled: boolean,
    gstRate: number
): { withGst: number; customerPrice: number } {
    // Step 1: GST on base
    const withGst = gstEnabled
        ? Math.round(base * (1 + gstRate / 100) * 100) / 100
        : base;
    // Step 2: markup on the GST-inclusive amount
    const customerPrice = applyTieredMarkup(withGst, tiers);
    return { withGst, customerPrice };
}
