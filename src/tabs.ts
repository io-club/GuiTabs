import { TheftData } from "./types";

export async function getTheftData(apiURL: string) {
  const response = await fetch(apiURL + "/list");
  const data = (await response.json()) as TheftData;

  return data;
}
