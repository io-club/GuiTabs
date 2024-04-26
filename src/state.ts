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
  }
);

export const tabsStoreAtom = atom<TheftData>([]);

export const currentTabNamesAtom = atom<string[]>([]);
