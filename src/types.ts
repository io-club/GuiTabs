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
  tags: string[];
  selected: boolean;
}

export type TheftMeta = {
  url: string;
  name?: string;
  mode?: number;
  skip?: number;
  addTime?: string;
};

export type TheftDataEntry = {
  name: string;
  href: string;
  pages: number;
  content: string[];
  meta?: TheftMeta;
};
export type TheftData = TheftDataEntry[];

export type UnionTabs =
  | {
      type: "preset";
      data: Tab;
    }
  | {
      type: "theft";
      data: TheftDataEntry;
    };
