import { atomWithStorage } from "jotai/vanilla/utils";

// Create a persistent atom with initial value in localStorage
const apiUrlAtom = atomWithStorage(
  "apiUrl",
  "http://localhost:8000",
  localStorage,
  { getOnInit: true }
);

export default apiUrlAtom;
