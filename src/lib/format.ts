export const formatCompact = (value: number): string => {
    if (value === 0) return "0";

    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }

    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

export const formatCurrency = (value: number): string => {
    if (value === 0) return "₹0";

    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(2)}K`;
    }

    return `₹${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};
