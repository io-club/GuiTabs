
type Modify<T, R> = Omit<T, keyof R> & R;

interface _Tab {
    name: string;
    url: string[];
    type: string;
    category?: "finger" | "strum";
}
export interface Tab extends _Tab {
    tag?: string | string[];
}

export interface TabMap {
    [key: string]: Tab;
}

export interface ListItemTab extends _Tab {
    key: string;
    tags: string[]
    selected: boolean;
};

export type TheftDataEntry = {
    name: string;
    href: string;
    pages: number;
    content: string[];
};
export type TheftData = TheftDataEntry[];
