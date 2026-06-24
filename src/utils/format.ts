export const formatAssetUrl = (url: string | undefined | null): string => {
    if (!url) return "";

    // S3 URLs are already absolute — return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    // Legacy: relative /uploads/ paths served from the API
    let relativePath = url;
    if (url.includes("/uploads/")) {
        relativePath = "/uploads/" + url.split("/uploads/")[1];
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
    return `${apiBase}${relativePath}`;
};

export const getRelativeUrl = (url: string | undefined | null): string => {
    if (!url) return "";

    // S3 URLs are absolute — return as-is (no need to relativize)
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.includes("/uploads/")) {
        return "/uploads/" + url.split("/uploads/")[1];
    }
    return url;
};
