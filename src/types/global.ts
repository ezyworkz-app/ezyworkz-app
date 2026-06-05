export interface GlobalCategory {
    globalCategoryId: string;
    name: string;
    imageUrl?: string;
}

export interface GlobalVariantOption {
    id: string;
    label: string;
    name: string;
    values: string[];
}
