import { atomWithStorage } from "jotai/vanilla/utils";

// Create a persistent atom with initial value in localStorage
const apiUrlAtom = atomWithStorage(
  "apiUrl",
  "https://c.rcex.live:37898",
  localStorage,
  { getOnInit: true }
);

export default apiUrlAtom;
