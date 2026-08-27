/**
 * 80mm thermal bag-tag renderer.
 *
 * Thermal printers are fed a continuous roll, so the page is defined as 80mm
 * wide with `auto` height and near-zero margins — a fixed page size would make
 * the driver pad every tag out to a full sheet. Everything is black on white
 * with heavy weights: thermal heads have no greyscale, so thin type and light
 * greys simply do not appear on the paper.
 *
 * Type scale is deliberately lopsided. The token is what staff read at arm's
 * length while hunting for a bag on a rack, so it gets 38pt; the order id is a
 * lookup key nobody reads across a room, so it sits at body size in the details
 * grid. Contents are listed so a bag can be verified against the tag without
 * opening the system — names and quantities only, never prices.
 *
 * Grey values are constrained by the hardware, and screen preview will not warn
 * you — only a physical sample will. Measured on a Retsol RTP82:
 *   #999 — invisible. The head dithers it to too few dots to mark the paper.
 *   #777 — current setting.
 *   #555 — confirmed clearly legible.
 * If rules stop showing up, step darker before assuming anything else is wrong.
 */

export interface OrderLabelItem {
    itemName?: string;
    qty?: number;
    unit?: string;
}

export interface OrderLabelCategory {
    categoryName?: string;
    items?: OrderLabelItem[];
}

export interface OrderLabelService {
    serviceName?: string;
    categories?: OrderLabelCategory[];
}

export interface OrderLabelData {
    orderId: string;
    tokenNumbers?: string[];
    tokenNumber?: string;
    customerName?: string;
    customerPhoneNumber?: string;
    shopItemCount?: number;
    userItemCount?: number;
    createdAt?: string;
    deliveryTime?: string;
    pickupScheduledAt?: string;
    customerAsks?: string;
    services?: OrderLabelService[];
}

export interface ShopLabelData {
    name?: string;
    /**
     * Accepted but deliberately not printed. The tag lives on a bag inside the
     * shop: staff know their own number and the customer is standing at the
     * counter, so it earned a line that served nobody. Kept on the type so
     * callers need not change if it is ever wanted back.
     */
    phone?: string;
}

/** Short, human-scannable order reference — matches what WhatsApp messages use. */
export function shortOrderId(orderId: string): string {
    return String(orderId || "").slice(-6).toUpperCase();
}

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDateTime(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** The tokens actually written on the physical bags. */
function resolveTokens(order: OrderLabelData): string[] {
    if (order.tokenNumbers?.length) return order.tokenNumbers;
    if (order.tokenNumber) return [order.tokenNumber];
    return [];
}

type QtyKind = "pieces" | "kg" | "other";

/**
 * Work out what a quantity actually measures.
 *
 * `unit` cannot be trusted: every item ever written by this system carries
 * `unit: "piece"`, including by-weight lines — a 7.2kg wash-and-fold is stored
 * as qty 7.2, unit "piece". Trusting it printed "8.2 pcs" for an order that was
 * really 1 blanket plus 7.2kg of washing.
 *
 * A fractional quantity is the dependable signal, because you cannot have 7.2
 * shirts. Where the item is also named in kilos we label it kg; otherwise the
 * number is shown bare rather than guessing at a unit.
 */
function classifyQty(item: OrderLabelItem): QtyKind {
    const qty = item.qty ?? 0;
    const unit = (item.unit || "").trim().toLowerCase();

    if (/^(kg|kgs|kilo|kilos|kilogram|kilograms)$/.test(unit)) return "kg";
    if (Number.isInteger(qty)) return "pieces";
    // No leading \b — real names read "Clothes upto 1kg", where the digit and
    // the k are both word characters so \bkg would never match.
    return /kgs?\b|kilo/i.test(item.itemName || "") ? "kg" : "other";
}

/** "× 3" for countable items, "× 7.2 kg" for by-weight ones. */
function formatQty(item: OrderLabelItem): string {
    const qty = item.qty ?? 0;
    return classifyQty(item) === "kg" ? `× ${qty} kg` : `× ${qty}`;
}

/**
 * Totals for the cart, kept per unit.
 *
 * Summing every `qty` into one number silently added kilograms to garments —
 * a 4-shirt order with 1.62kg of wash-and-fold printed as "5.62 pcs". Weight
 * and piece counts are different quantities and are tallied separately.
 */
function summariseQuantities(order: OrderLabelData): string {
    let pieces = 0;
    let kg = 0;
    let other = 0;

    for (const service of order.services ?? []) {
        for (const category of service.categories ?? []) {
            for (const item of category.items ?? []) {
                const qty = item.qty ?? 0;
                const kind = classifyQty(item);
                if (kind === "pieces") pieces += qty;
                else if (kind === "kg") kg += qty;
                else other += qty;
            }
        }
    }

    const parts: string[] = [];
    if (pieces > 0) parts.push(`${pieces} ${pieces === 1 ? "pc" : "pcs"}`);
    if (kg > 0) parts.push(`${+kg.toFixed(2)} kg`);
    // Fractional but not identifiably weight — count it without inventing a unit.
    if (other > 0) parts.push(`${+other.toFixed(2)}`);
    return parts.join(" · ");
}

/** Service → category → item rows. Categories are only labelled when there is more than one. */
function renderContents(order: OrderLabelData): string {
    const services = order.services ?? [];
    if (!services.length) return "";

    const blocks: string[] = [];

    for (const service of services) {
        const categories = (service.categories ?? []).filter((c) => (c.items ?? []).length > 0);
        if (!categories.length) continue;

        blocks.push(`<div class="svc">${escapeHtml(service.serviceName || "Service")}</div>`);

        for (const category of categories) {
            if (categories.length > 1 && category.categoryName) {
                blocks.push(`<div class="cat">${escapeHtml(category.categoryName)}</div>`);
            }
            const rows = (category.items ?? [])
                .map(
                    (item) =>
                        `<tr><td>${escapeHtml(item.itemName || "Item")}</td>` +
                        `<td>${escapeHtml(formatQty(item))}</td></tr>`
                )
                .join("");
            blocks.push(`<table class="items">${rows}</table>`);
        }
    }

    if (!blocks.length) return "";

    const total = summariseQuantities(order);
    return `
  <div class="sectionHead">Contents${total ? ` &middot; ${total}` : ""}</div>
  ${blocks.join("")}`;
}

/**
 * Markup for ONE tag. Kept free of <html>/<head> so several can be
 * concatenated into a single print job for bulk printing.
 */
export function renderOrderLabel(order: OrderLabelData, shop: ShopLabelData): string {
    const tokens = resolveTokens(order);
    // Item count is the number staff verify against the bag contents. The shop's
    // own count wins when set, because it is the one counted at the counter;
    // otherwise fall back to a per-unit tally of the cart.
    const itemCount =
        order.shopItemCount != null
            ? `${order.shopItemCount} pcs`
            : order.userItemCount != null
            ? `${order.userItemCount} pcs`
            : summariseQuantities(order) || undefined;
    const ready = order.deliveryTime || order.pickupScheduledAt;

    const rows: string[] = [];
    // Only repeat the order id when the box above is showing a TOKEN. Without
    // a token the box already shows the order id, and printing it twice wasted
    // a line on a tag where vertical space is the scarce resource.
    if (tokens.length) {
        rows.push(`<tr><td>Order</td><td>#${escapeHtml(shortOrderId(order.orderId))}</td></tr>`);
    }
    if (itemCount != null) {
        rows.push(`<tr><td>Items</td><td>${escapeHtml(itemCount)}</td></tr>`);
    }
    if (order.createdAt) {
        rows.push(`<tr><td>Placed</td><td>${escapeHtml(formatDateTime(order.createdAt))}</td></tr>`);
    }
    if (ready) {
        rows.push(`<tr><td>Ready</td><td><b>${escapeHtml(formatDate(ready))}</b></td></tr>`);
    }

    return `
<div class="tag">
  <div class="shopName">${escapeHtml(shop.name || "")}</div>

  ${
      tokens.length
          ? `<div class="tokenLabel">Token</div>
             <div class="tokenBox">${tokens.map((t) => escapeHtml(t)).join("<span class=\"sep\">/</span>")}</div>`
          : `<div class="tokenLabel">Order</div>
             <div class="tokenBox noToken">#${escapeHtml(shortOrderId(order.orderId))}</div>`
  }

  <div class="customer">${escapeHtml(order.customerName || "Walk-in")}${
      order.customerPhoneNumber
          ? `<span class="dot">&middot;</span><span class="phone">${escapeHtml(order.customerPhoneNumber)}</span>`
          : ""
  }</div>

  <table class="meta">${rows.join("")}</table>

  ${renderContents(order)}

  ${
      order.customerAsks
          ? `<div class="note"><span class="noteHead">Note</span>${escapeHtml(order.customerAsks)}</div>`
          : ""
  }

  <div class="footer">Powered by EzyWorkz</div>
</div>`;
}

/** Print-ready stylesheet for 80mm roll stock. */
export const LABEL_STYLES = `
  /* 80mm roll stock. Margin 0 so the page box begins at the first printable
     dot — a 4mm margin here stacked on top of the printer's own leading feed
     and left an obvious white band above the frame. The driver already keeps
     content inside the head's printable strip, so the margin was buying
     nothing but blank paper. */
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #fff; color: #000;
    font-family: "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .tag {
    /* @page margin is 0 so the tag starts at the first printable dot and the
       left edge sits hard against the paper — but the head's printable strip
       is narrower than the 80mm stock, so width:100% ran the right-hand rule
       off the end of it. 76mm is inside the strip while staying close to the
       edge. Widen only against a physical sample; the right border is the
       first thing to disappear. */
    width: 76mm;
    /* Dashed frame, matching the internal dividers — it also reads as a cut
       line, which is what it is on continuous roll stock. Padding keeps type
       off the rule; box-sizing is border-box. */
    border: 1px dashed #777;
    padding: 2.5mm;
    /* One left edge for every block. The previous mix of centred header and
       left/right body gave the tag no consistent alignment to read down. */
    text-align: left;
    /* Each tag starts a new physical tag on the roll. */
    page-break-after: always;
    break-after: page;
  }
  .tag:last-child { page-break-after: auto; break-after: auto; }
  /* Rules only at the three real section boundaries — identity, contents, and
     the footer. Within a section, separation is carried by type alone: size,
     weight, letter-spacing and caps, on a consistent 2.2mm rhythm. Ruling
     every block made each line compete with the token; ruling none left the
     major transitions unmarked.

     Dashed and grey so they sit behind the type rather than beside it — but
     grey has a hard floor here. At #999 nothing printed at all on a Retsol
     RTP82: a 1-bit head dithers that to too few dots to mark the paper. #555
     is the tested minimum. Screen preview will not warn you about this; only a
     physical sample will.

     Small letter-spaced caps act as field labels throughout: TOKEN, the meta
     keys and CONTENTS all share one caption style, so the eye learns it once. */
  .shopName {
    font-size: 12pt; font-weight: 800;
    text-transform: uppercase; letter-spacing: 2px;
    line-height: 1.15;
  }
  /* Divider: shop identity | this order. */
  .tokenLabel { border-top: 1px dashed #777; padding-top: 1.8mm; }

  .tokenLabel {
    font-size: 6.5pt; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    margin-top: 2.2mm;
  }
  /* Unboxed: at this weight and size the token already dominates the tag, and
     the border was just another line. */
  .tokenBox {
    font-size: 38pt; font-weight: 900; line-height: 1;
    margin-top: 0.3mm; word-break: break-word;
  }
  /* Falling back to the order id: 8 characters at 38pt would wrap and swamp
     the tag, so it drops to a size that still reads but stays on one line. */
  .tokenBox.noToken { font-size: 24pt; letter-spacing: 0.5px; }
  .tokenBox .sep { padding: 0 2mm; font-weight: 400; }

  /* Name and phone share a line; on a long name the phone wraps beneath
     rather than being clipped. */
  .customer { font-size: 10.5pt; font-weight: 800; margin-top: 2.2mm; line-height: 1.25; }
  .customer .dot { padding: 0 1.2mm; font-weight: 400; }
  .phone { font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }

  .meta {
    width: 100%; margin-top: 2.2mm;
    font-size: 9pt; border-collapse: collapse;
  }
  .meta td { padding: 0.3mm 0; vertical-align: baseline; line-height: 1.3; }
  /* Labels are short words; a wide fixed column just opened a gulf between
     label and value. Shrink-to-fit keeps the pair visually associated. */
  .meta td:first-child {
    width: 1%; white-space: nowrap;
    text-transform: uppercase; font-size: 6.5pt;
    letter-spacing: 1.5px; padding-right: 3mm;
  }
  .meta td:last-child { text-align: right; font-weight: 700; }

  /* Divider: order details | what is in the bag. */
  .sectionHead {
    margin-top: 2.2mm;
    border-top: 1px dashed #777; padding-top: 1.8mm;
    font-size: 6.5pt; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
  }
  .svc {
    margin-top: 1.2mm;
    font-size: 9pt; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.3px;
    line-height: 1.2;
  }
  .cat {
    margin-top: 0.5mm;
    font-size: 7pt; font-weight: 600;
    text-transform: uppercase; letter-spacing: 1px; line-height: 1.2;
  }
  /* Items sit flush to the same left edge as everything else — the old 2mm
     indent broke the one alignment the tag has. */
  .items { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  .items td { padding: 0.2mm 0; vertical-align: baseline; line-height: 1.35; }
  .items td:last-child {
    text-align: right; font-weight: 700; white-space: nowrap;
    width: 1%; padding-left: 3mm;
  }

  .note {
    margin-top: 2.2mm;
    font-size: 8.5pt; word-break: break-word; line-height: 1.3;
  }
  .noteHead {
    display: block;
    font-size: 6.5pt; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
  }

  /* Divider: end of the tag — also the tear line on a continuous roll. */
  .footer {
    margin-top: 2.8mm;
    border-top: 1px dashed #777; padding-top: 1.5mm;
    font-size: 6.5pt; letter-spacing: 0.5px;
  }
`;

/** Complete standalone document for one or more tags. */
export function buildLabelDocument(
    orders: OrderLabelData[],
    shop: ShopLabelData
): string {
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Order Tags</title>
<style>${LABEL_STYLES}</style></head>
<body>${orders.map((o) => renderOrderLabel(o, shop)).join("")}</body></html>`;
}
