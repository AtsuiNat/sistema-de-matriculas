import { createContext, useContext } from 'react';

export const Contexto = createContext(null);

export function useApp() {
  return useContext(Contexto);
}
