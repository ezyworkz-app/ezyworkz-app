"use client";

import { buildLabelDocument, OrderLabelData, ShopLabelData } from "./orderLabel";

/**
 * Print one or more bag tags.
 *
 * Rendered into an off-screen iframe rather than the page itself: an
 * `@media print` block on the real document would inherit the dashboard's
 * Tailwind reset, dark-mode variables and layout, none of which belong on an
 * 80mm receipt. The iframe carries only the label stylesheet, so what the
 * printer receives is exactly what `buildLabelDocument` produced.
 *
 * The document is handed over via `srcdoc` rather than `document.write`.
 * Appending an iframe first loads `about:blank`, which fires `load` before any
 * written content exists — calling `print()` on that empty frame makes Chrome
 * fall back to printing the PARENT page, so the user got a blank dashboard
 * print dialog, and only the second `load` (from the write) produced the tag.
 * With `srcdoc` set before the frame is attached, `load` fires once, with the
 * real content already parsed.
 *
 * Resolves once the print dialog has been dismissed (or immediately in
 * browsers that do not report it), so callers can chain a redirect after
 * printing without cutting the job short.
 */
export function printOrderLabels(
    orders: OrderLabelData[],
    shop: ShopLabelData
): Promise<void> {
    if (typeof window === "undefined" || orders.length === 0) {
        return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
        const iframe = document.createElement("iframe");
        // Off-screen rather than display:none — Safari refuses to print a
        // frame that was never laid out.
        iframe.setAttribute("aria-hidden", "true");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "80mm";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";

        let settled = false;
        const cleanup = () => {
            if (settled) return;
            settled = true;
            // Give the print job time to spool before tearing the frame down;
            // removing it synchronously cancels the job in Chrome.
            window.setTimeout(() => {
                iframe.remove();
                resolve();
            }, 500);
        };

        iframe.onload = () => {
            const win = iframe.contentWindow;
            // Guard anyway: if the frame somehow has no tag in it, printing
            // would target the parent document instead of the label.
            if (!win || !iframe.contentDocument?.querySelector(".tag")) {
                return cleanup();
            }

            win.addEventListener("afterprint", () => cleanup(), { once: true });

            // One frame of breathing room so layout is settled before the
            // print snapshot is taken.
            window.requestAnimationFrame(() => {
                try {
                    win.focus();
                    win.print();
                } catch {
                    return cleanup();
                }
                // afterprint is unreliable in some browsers; fall back so the
                // promise can never hang and block a caller's redirect.
                window.setTimeout(cleanup, 60000);
            });
        };

        iframe.srcdoc = buildLabelDocument(orders, shop);
        document.body.appendChild(iframe);
    });
}

/** Convenience wrapper for the common single-order case. */
export function printOrderLabel(order: OrderLabelData, shop: ShopLabelData): Promise<void> {
    return printOrderLabels([order], shop);
}
