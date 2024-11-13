export type TheftMeta = {
  url?: string;
  name?: string;
  mode?: number;
  skip?: number;
  addTime?: string;
  invert?: boolean;
  similarity?: number;
  tags?: string[];
  pdfHash?: string;
};

export type TheftDataEntry = {
  name: string;
  pages: number;
  content: string[];
  meta?: TheftMeta;
};

export type TheftData = { name: string; tags: string[]; href: string }[];
