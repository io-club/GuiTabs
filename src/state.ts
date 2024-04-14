import { atomWithStorage } from 'jotai/vanilla/utils';

// Create a persistent atom with initial value
const apiUrlAtom = atomWithStorage('apiUrl', 'http://localhost:8000');

export default apiUrlAtom;
