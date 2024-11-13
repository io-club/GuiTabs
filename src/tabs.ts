import { TheftData } from "./types";

export async function getTheftData(apiURL: string) {
  const response = await fetch(apiURL + "/list");
  const data = (await response.json()) as TheftData;

  return data;
}

export function mapSheetString(str: string) {
  // Regular expression to match tags and item name
  const tagPattern = /\[([^\]]+)\]/g;
  const matches = [...str.matchAll(tagPattern)];

  // Extract tags
  const tags = matches.map((match) => match[1]);

  // Extract name by removing all tags
  const name = str.replace(tagPattern, "").trim();

  return {
    name,
    tags,
    href: str,
  };
}
