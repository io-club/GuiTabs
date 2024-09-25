import { atom } from "solid-jotai";
import { TheftData } from "./types";
import { atomWithStorage } from "jotai/vanilla/utils";

export const defaultApiUrl = "https://c.rcex.live:37898";

// Create a persistent atom with initial value in localStorage
export const apiUrlAtom = atomWithStorage(
  "apiUrl",
  defaultApiUrl,
  localStorage,
  {
    getOnInit: true,
  },
);

export const apiStorageAtom = atomWithStorage(
  "apiStorage",
  `["${defaultApiUrl}"]`,
  localStorage,
  {
    getOnInit: true,
  },
);
export const tabsStoreAtom = atom<TheftData>([]);

export const currentTabNamesAtom = atom<string[]>([]);

/**
 * Enables an API by adding its URL to the storage array and calling the API function.
 * @param url - The URL of the API to enable.
 * @param storage - A tuple containing the storage array and a function to update the storage.
 * @param api - A tuple containing the API string and a function to update the API.
 */
export function enableAPI(
  url: string,
  storage: [string, (url: string) => void],
  api: [string, (api: string) => void],
) {
  const storageArray = JSON.parse(storage[0]) as string[];
  if (!storageArray.includes(url)) {
    storageArray.push(url);
  }
  storage[1](JSON.stringify(storageArray));
  api[1](url);
}
