import { atomWithStorage } from "jotai/vanilla/utils";

export const defaultApiUrl = "https://c.rcex.live:37898";

// Create a persistent atom with initial value in localStorage
const apiUrlAtom = atomWithStorage("apiUrl", defaultApiUrl, localStorage, {
  getOnInit: true,
});

export default apiUrlAtom;
